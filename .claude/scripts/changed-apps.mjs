#!/usr/bin/env node
// Which apps a change touches, for the workflow's per-app rules, verify and coverage.
//
//   node .claude/scripts/changed-apps.mjs <base commit>
//     Classify `git diff --name-only --no-renames <base>` plus the untracked files.
//
//   node .claude/scripts/changed-apps.mjs --files <path ...>
//     Classify the given repo-relative paths.
//
// Prints one JSON line: {"apps":[...],"rebuild":[...],"noApp":true|false}.
// An app counts when a code or app-config file under it changed: anything except
// apps/<app>/.claude/** and *.md. packages/constants and packages/schemas count as
// both apps and need their dist rebuilt first. Anything else counts as no app.
import { execFileSync } from 'node:child_process';

const APPS = ['api', 'web'];
const SHARED = { constants: '@repo/constants', schemas: '@repo/schemas' };

export function classify(paths) {
  const apps = new Set();
  const rebuild = new Set();
  for (const path of paths) {
    if (path.endsWith('.md')) continue;
    const [top, name, next] = path.split('/');
    if (top === 'apps' && APPS.includes(name) && next && next !== '.claude') {
      apps.add(name);
    } else if (top === 'packages' && SHARED[name] && next) {
      APPS.forEach((app) => apps.add(app));
      rebuild.add(SHARED[name]);
    }
  }
  return {
    apps: [...apps].sort(),
    rebuild: [...rebuild].sort(),
    noApp: apps.size === 0,
  };
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  let paths;
  if (args[0] === '--files') {
    paths = args.slice(1);
  } else if (args.length === 1) {
    const root = git(['rev-parse', '--show-toplevel'])[0];
    paths = [
      ...git(['diff', '--name-only', '--no-renames', args[0]], root),
      ...git(
        ['ls-files', '--others', '--exclude-standard', '--full-name'],
        root,
      ),
    ];
  } else {
    console.error('Usage: changed-apps.mjs <base commit> | --files <path ...>');
    process.exit(2);
  }
  console.log(JSON.stringify(classify(paths)));
}
