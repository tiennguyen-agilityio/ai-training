#!/usr/bin/env node
// PreToolUse hook (Bash, Edit, Write, MultiEdit): asks before commands that
// break the repo's git, database or secret-file rules, and before edits to
// secret files. A backstop against mistakes, not a sandbox: it splits commands
// with a regex, not a shell parser, and fails open (any error prints nothing,
// exit 0). The GitHub ruleset on develop and main is what actually blocks
// pushes there.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const PROTECTED = new Set(['develop', 'main']);

// Commands that run package scripts or the MikroORM CLI.
const DB_RUNNERS = ['pnpm', 'npm', 'npx', 'yarn', 'bun', 'bunx', 'mikro-orm'];
const DB_DESTRUCTIVE = /(migration:(down|fresh)|schema:(drop|fresh))$/;
const SHELLS = ['sh', 'bash', 'zsh', 'dash'];
const FILE_TOOLS = ['Edit', 'Write', 'MultiEdit'];

// Words that run the rest of the line as another command.
const WRAPPERS = new Set([
  'sudo',
  'env',
  'command',
  'exec',
  'nohup',
  'time',
  'nice',
  'timeout',
  'xargs',
]);

// A separator, a redirection with its target, or a word (quotes kept).
const TOKEN =
  /(\|\||&&|[;&|\n()`]|\$\()|(\d*(?:&>>?|>>?|>\||<<<|<)&?)\s*("[^"]*"|'[^']*'|[^\s;&|()]*)|((?:"(?:[^"\\]|\\.)*"|'[^']*'|[^\s;&|()"'`<>])+)/g;

const unquote = (word) =>
  word.replace(/"((?:[^"\\]|\\.)*)"|'([^']*)'/g, (_, d, s) => d ?? s);

/**
 * Splits `command` into simple commands (arrays of unquoted words) and the
 * files its output redirections write to. Heredoc bodies are dropped.
 */
function parse(command) {
  const text = command
    .replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\t*\2(?=\n|$)/g, '$3')
    .replace(/\\\n/g, ' ');
  const segments = [[]];
  const writes = [];
  for (const [, separator, redirect, target, word] of text.matchAll(TOKEN)) {
    if (separator) segments.push([]);
    else if (redirect?.includes('>') && !/^&?\d*$/.test(target))
      writes.push(unquote(target));
    else if (word) segments.at(-1).push(unquote(word));
  }
  return { segments: segments.filter((s) => s.length > 0), writes };
}

/** The command without VAR=value prefixes and wrappers, and those prefixes. */
function strip(words) {
  let i = 0;
  while (i < words.length) {
    const name = words[i].split('/').pop();
    if (/^\w+=/.test(words[i])) i++;
    else if (WRAPPERS.has(name)) {
      i++;
      // Wrapper options and timeout's duration.
      while (/^-|^\d+[smhd]?$/.test(words[i] ?? '')) i++;
    } else break;
  }
  if (i < words.length) words = words.with(i, words[i].split('/').pop());
  return { prefix: words.slice(0, i), words: words.slice(i) };
}

/** git subcommand, its arguments, the -C folder and the -c settings, or null. */
function parseGit(words) {
  if (words[0] !== 'git') return null;
  let i = 1;
  let dir = null;
  const config = [];
  while (words[i]?.startsWith('-')) {
    const option = words[i++];
    if (option === '-C') dir = words[i++];
    else if (option === '-c') config.push(words[i++]);
    else if (/^--(git-dir|work-tree|namespace)$/.test(option)) i++;
  }
  if (i >= words.length) return null;
  return { sub: words[i], args: words.slice(i + 1), dir, config };
}

/** Current branch of the repo at `dir`, or null. */
function currentBranch(dir) {
  try {
    return execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000,
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const shortFlag = (args, letter) =>
  args.some((a) => /^-[a-zA-Z]+$/.test(a) && a.includes(letter));
const isDryRun = (args) => args.includes('--dry-run') || shortFlag(args, 'n');

/** True when a push targets develop or main; `branch` is the current one. */
function pushesToProtected(args, branch) {
  if (isDryRun(args)) return false;
  if (args.some((a) => /^--(all|branches|mirror)$/.test(a))) return true;
  const refspecs = args
    .filter(
      (a, k) =>
        !a.startsWith('-') &&
        !/^(-o|--repo|--push-option|--receive-pack|--exec)$/.test(args[k - 1]),
    )
    .slice(1);
  if (refspecs.length === 0) return !args.includes('--tags') && branch();
  return refspecs.some((spec) => {
    if (spec.includes('$(')) return branch();
    const [src, dst = ''] = spec.replace(/^\+/, '').split(':');
    if (!dst && (src === 'HEAD' || src === '@')) return branch();
    return PROTECTED.has((dst || src).replace(/^refs\/heads\//, ''));
  });
}

// git commit short options whose value may follow them (-m msg, -mmsg).
const COMMIT_VALUE = 'mFCct';

/** True when a commit's short options include -n (--no-verify). */
function commitSkipsHooks(args) {
  for (let i = 0; i < args.length; i++) {
    if (!/^-[a-zA-Z]+$/.test(args[i])) continue;
    for (const [k, letter] of [...args[i].slice(1)].entries()) {
      if (letter === 'n') return true;
      if ('uS'.includes(letter)) break;
      if (COMMIT_VALUE.includes(letter)) {
        if (k === args[i].length - 2) i++;
        break;
      }
    }
  }
  return false;
}

/**
 * True when deleting `arg` removes /, the home folder, the project or the
 * current folder, or a folder above one; also when it uses an unset variable.
 */
function wipesKeptFolder(arg, ctx) {
  let unset = false;
  let path = arg
    .replace(/^~(?=\/|$)/, homedir())
    .replace(/\$\{?(\w+)\}?/g, (_, name) => {
      const value = name === 'PWD' ? ctx.cwd : process.env[name];
      if (!value) unset = true;
      return value ?? '';
    });
  if (unset || arg.includes('$(')) return true;
  while (path.length > 1 && /\/(\.?\*|\.)?$/.test(path))
    path = path.replace(/\/(\.?\*|\.)?$/, '');
  if (path === '*' || path === '.*') path = '.';
  const target = resolve(ctx.cwd ?? '.', path || '/');
  const prefix = target === '/' ? '/' : `${target}/`;
  return [homedir(), ctx.projectDir, ctx.cwd].some(
    (dir) => dir && (dir === target || dir.startsWith(prefix)),
  );
}

/**
 * Index of `names` as the command, or inside docker exec and the like;
 * -1 when it is only an argument (grep dropdb).
 */
function commandAt(words, names) {
  if (names.includes(words[0])) return 0;
  if (!/^(docker|docker-compose|podman|kubectl)$/.test(words[0])) return -1;
  return words.findIndex((w) => names.includes(w.split('/').pop()));
}

/** .env files (not .env.example and its copies), keys and credentials. */
const isSecretFile = (path) =>
  /(^|\/)(\.env[^/]*|[^/]*\.(pem|key|p12|pfx)|id_(rsa|ed25519|ecdsa)|credentials[^/]*\.json)$/.test(
    path,
  ) && !/(^|\/)\.env\.example[^/]*$/.test(path);

const RULES = [
  {
    id: 'no-verify',
    test({ git, prefix, words }) {
      if (prefix.includes('HUSKY=0')) return true;
      if (words[0] === 'export' && words.includes('HUSKY=0')) return true;
      if (!git) return false;
      if (git.config.some((c) => /^core\.hookspath=/i.test(c))) return true;
      if (git.sub === 'config') {
        // Setting or unsetting it; reading it is fine.
        const key = git.args.findIndex((a) => /^core\.hookspath$/i.test(a));
        return (
          key !== -1 &&
          (/^(set|unset)$/.test(git.args[0]) ||
            git.args.some((a) => a.startsWith('--unset')) ||
            git.args.slice(key + 1).some((a) => !a.startsWith('-')))
        );
      }
      if (!['commit', 'push', 'merge', 'rebase', 'am'].includes(git.sub))
        return false;
      if (git.args.includes('--no-verify')) return true;
      return git.sub === 'commit' && commitSkipsHooks(git.args);
    },
    reason:
      '[no-verify] Skipping git hooks (--no-verify, commit -n, HUSKY=0, core.hooksPath) is not allowed. Fix the cause of the hook failure instead and rerun the command.',
  },
  {
    id: 'force-push',
    test({ git }) {
      if (git?.sub !== 'push' || isDryRun(git.args)) return false;
      return git.args.some(
        (a) =>
          /^--force/.test(a) ||
          (/^-[a-zA-Z]+$/.test(a) && a.includes('f')) ||
          (a.startsWith('+') && a.length > 1),
      );
    },
    reason:
      '[force-push] Force pushing (--force, --force-with-lease, -f, +refspec) can overwrite remote history. Use a normal push, or add a new commit instead of rewriting a shared branch.',
  },
  {
    id: 'protected-push',
    test({ git }, ctx) {
      if (git?.sub !== 'push') return false;
      const dir = git.dir ? resolve(ctx.cwd ?? '.', git.dir) : ctx.cwd;
      const branch = () =>
        PROTECTED.has((git.dir ? null : ctx.branch) ?? currentBranch(dir));
      return pushesToProtected(git.args, branch);
    },
    reason:
      '[protected-push] Pushing to develop or main directly is not allowed. Push a feature branch and open a pull request into develop instead.',
  },
  {
    id: 'rm-rf-root',
    test({ words }, ctx) {
      if (words[0] !== 'rm') return false;
      const args = words.slice(1);
      const recursive =
        args.includes('--recursive') ||
        shortFlag(args, 'r') ||
        shortFlag(args, 'R');
      const force = args.includes('--force') || shortFlag(args, 'f');
      return (
        recursive &&
        force &&
        args.some((a) => !a.startsWith('-') && wipesKeptFolder(a, ctx))
      );
    },
    reason:
      '[rm-rf-root] Recursive forced deletion of /, the home folder, the project, the current folder or a folder above them wipes the machine or the working tree. Delete specific paths instead (for example rm -rf dist).',
  },
  {
    id: 'secret-file',
    test({ words }, ctx) {
      if (ctx.writes.some(isSecretFile)) return true;
      const args = words.slice(1).filter((a) => !a.startsWith('-'));
      if (['rm', 'unlink', 'shred', 'truncate', 'mv', 'tee'].includes(words[0]))
        return args.some(isSecretFile);
      if (words[0] === 'cp')
        return args.length > 1 && isSecretFile(args.at(-1));
      // In-place edit: -i, -i.bak, -Ei, BSD -I, --in-place.
      if (words[0] === 'sed')
        return (
          words.some((w) => /^-[a-zA-Z]*[iI]|^--in-place/.test(w)) &&
          args.some(isSecretFile)
        );
      return false;
    },
    reason:
      '[secret-file] This deletes, moves or overwrites a secret file (.env*, *.pem, *.key, id_rsa, credentials*.json). Ask the user to change it by hand, or edit .env.example instead.',
  },
  {
    id: 'discard-work',
    test({ git }) {
      if (!git) return false;
      const { sub, args } = git;
      const force = args.includes('--force') || shortFlag(args, 'f');
      const all = args.some((a) => ['.', './', ':/', '*'].includes(a));
      // --patch asks before discarding each hunk.
      const patch = args.includes('--patch') || shortFlag(args, 'p');
      switch (sub) {
        case 'reset':
          return args.includes('--hard');
        case 'clean':
          return force && !isDryRun(args);
        case 'checkout':
          return !patch && (all || force);
        case 'switch':
          return force || args.includes('--discard-changes');
        case 'restore': {
          const staged = args.includes('--staged') || shortFlag(args, 'S');
          const worktree = args.includes('--worktree') || shortFlag(args, 'W');
          return all && !patch && (!staged || worktree);
        }
        case 'stash':
          return /^(drop|clear)$/.test(args.find((a) => !a.startsWith('-')));
        default:
          return false;
      }
    },
    reason:
      '[discard-work] This throws away uncommitted work or stashes for good (git reset --hard, clean -f, checkout . / -f, switch -f, restore ., stash drop / clear). Stash first, or restore specific files by path.',
  },
  {
    id: 'db-destructive',
    test({ words }) {
      if (commandAt(words, ['dropdb']) !== -1) return true;
      const psql = commandAt(words, ['psql']);
      if (
        psql !== -1 &&
        words.slice(psql).some((w) => /\b(drop|truncate)\s/i.test(w))
      )
        return true;
      const runner = commandAt(words, DB_RUNNERS);
      if (runner === -1) return false;
      const args = words.slice(runner + 1);
      if (args.some((a) => DB_DESTRUCTIVE.test(a))) return true;
      const update = args.findIndex((a) => a.endsWith('schema:update'));
      return (
        update !== -1 &&
        args
          .slice(update + 1)
          .some((a) => /^--run(=(?!false$).*)?$|^-[a-zA-Z]*r/.test(a))
      );
    },
    reason:
      '[db-destructive] This drops or rewrites database data (migration:down / fresh, schema:drop / fresh, schema:update --run, dropdb, DROP / TRUNCATE in psql). Add a forward migration (migration:create, migration:up) or preview with schema:update --dump instead.',
  },
  {
    id: 'docker-data',
    test({ words }) {
      if (!/^docker(-compose)?$/.test(words[0])) return false;
      const plain = words.filter((w) => !w.startsWith('-'));
      if (plain.includes('down'))
        return words.some((w) => w === '--volumes' || /^-[a-zA-Z]*v/.test(w));
      return (
        (plain.includes('volume') &&
          ['rm', 'remove', 'prune'].some((w) => plain.includes(w))) ||
        (plain.includes('system') && plain.includes('prune'))
      );
    },
    reason:
      '[docker-data] docker compose down -v, docker volume rm / prune and docker system prune delete Docker volumes, including the local Postgres data. Stop the stack with docker compose down (no -v) instead.',
  },
  {
    id: 'pipe-to-shell',
    test({ words }) {
      // A shell with no -c and no script file reads its script from stdin.
      if (!SHELLS.includes(words[0])) return false;
      const args = words.slice(1);
      if (shortFlag(args, 'c')) return false;
      const script = args.find((a) => !a.startsWith('-'));
      return shortFlag(args, 's') || script === undefined;
    },
    reason:
      '[pipe-to-shell] Feeding a script into a shell (… | sh, base64 -d | bash, bash <<EOF) runs code this check cannot see. Run the commands directly, or save the script to a file and review it first.',
  },
];

/** Rules that `command` breaks, each with the simple command that matched. */
function findViolations(command, ctx = {}) {
  const { segments, writes } = parse(command);
  const found = new Map();
  let branch = null;
  for (const segment of segments) {
    const { prefix, words } = strip(segment);
    const git = parseGit(words);
    const context = { ...ctx, branch, writes };
    for (const rule of RULES) {
      if (!found.has(rule.id) && rule.test({ prefix, words, git }, context))
        found.set(rule.id, { ...rule, matched: segment.join(' ') });
    }
    // `git switch develop && git push` pushes develop.
    if (git && /^(switch|checkout)$/.test(git.sub)) {
      const target = git.args.find((a) => !a.startsWith('-'));
      if (PROTECTED.has(target)) branch = target;
    }
  }
  return [...found.values()];
}

/** Rules that a tool call breaks: a Bash command, or an edit to a secret file. */
function checkToolCall({ tool_name: tool, tool_input: input, cwd }) {
  if (FILE_TOOLS.includes(tool)) {
    const path = input?.file_path;
    if (typeof path !== 'string' || !isSecretFile(path)) return [];
    const rule = RULES.find((r) => r.id === 'secret-file');
    return [{ ...rule, matched: `${tool} ${path}` }];
  }
  if (tool !== 'Bash' || typeof input?.command !== 'string') return [];
  return findViolations(input.command, {
    cwd,
    projectDir: process.env.CLAUDE_PROJECT_DIR,
  });
}

function main() {
  const violations = checkToolCall(JSON.parse(readFileSync(0, 'utf8')));
  if (violations.length === 0) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: violations
          .map((r) => `${r.reason} Matched: \`${r.matched}\`.`)
          .join(' '),
      },
    }),
  );
}

// No process.exit: it can cut off stdout still being written to the pipe.
try {
  main();
} catch {
  // fail open
}
