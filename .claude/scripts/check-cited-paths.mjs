#!/usr/bin/env node
// Check that every path, glob and module a Claude config file cites resolves.
//
//   node .claude/scripts/check-cited-paths.mjs <app dir> <md file ...>
//     Print `Span | Kind | Resolved to | Result` for every backtick span outside
//     fenced code blocks and every frontmatter `paths:` entry, then the counts per
//     kind. Exits 1 if any row is MISSING.
//
// Run from the repo root.
import { execFileSync } from 'node:child_process';
import { existsSync, globSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const EXTENSIONS = /\.(ts|tsx|js|mjs|cjs|json|md|css|png|svg|yml|yaml)$/;
const SPEC_FILES =
  /^((design|plan|report|test-report|pr-description)\.md|coverage-baseline(-[a-z]+)?\.json)$/;
const EXCLUDED = ['node_modules', '.next', 'coverage'];

function commaOutsideBraces(span) {
  let depth = 0;
  for (const ch of span) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === ',' && depth <= 0) return true;
  }
  return false;
}

function isLiteral(span) {
  return (
    span.startsWith('/') ||
    span.includes('://') ||
    /^[A-Z][A-Z0-9_]*\*$/.test(span) ||
    /^[a-z][a-z0-9-]*-\*$/.test(span) ||
    SPEC_FILES.test(span)
  );
}

function isText(span) {
  return (
    /[\s'"=;:]/.test(span) ||
    commaOutsideBraces(span) ||
    /\w\(/.test(span) ||
    span.startsWith('@ts-') ||
    /^[A-Za-z_]\w*\.\*$/.test(span)
  );
}

function isFile(span, { appDir, repoRoot }) {
  if (EXTENSIONS.test(span) || span.endsWith('/')) return true;
  if (!span.includes('/')) return false;
  if (span.startsWith('./') || span.startsWith('../')) return true;
  const first = span.split('/')[0];
  return [appDir, join(appDir, 'src'), repoRoot].some((dir) =>
    existsSync(join(dir, first)),
  );
}

export function classifySpan(span, ctx) {
  if (isLiteral(span)) return 'literal';
  if (isText(span)) return 'text';
  if (/<[^>]+>/.test(span)) return 'placeholder';
  if (span.startsWith('@') && !span.startsWith('@/')) return 'package';
  if (span.startsWith('@/')) return 'alias';
  if (span.includes('*') || span.includes('{')) return 'glob';
  if (isFile(span, ctx)) return 'file';
  if (span.includes('/')) return 'package';
  return 'text';
}

const basenameIndex = new Map();

// Every file and folder name under `root`, dot directories included.
function basenames(root) {
  if (basenameIndex.has(root)) return basenameIndex.get(root);
  const names = new Map();
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (EXCLUDED.includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (!names.has(entry.name)) names.set(entry.name, path);
      if (entry.isDirectory()) walk(path);
    }
  };
  walk(root);
  basenameIndex.set(root, names);
  return names;
}

function resolveFile(span, { appDir, repoRoot }) {
  for (const dir of [appDir, join(appDir, 'src'), repoRoot]) {
    const path = join(dir, span);
    if (existsSync(path)) return path;
  }
  const name = span.replace(/\/$/, '');
  if (name.includes('/')) return null;
  for (const root of [appDir, join(repoRoot, '.claude')]) {
    const path = basenames(root).get(name);
    if (path) return path;
  }
  return null;
}

function resolveGlob(span, { appDir }) {
  const pattern = span.includes('/') ? span : `**/${span}`;
  const named = new Set(pattern.split('/'));
  const excluded = EXCLUDED.filter((name) => !named.has(name));
  const matches = globSync(pattern, {
    cwd: appDir,
    withFileTypes: true,
    exclude: (entry) => excluded.includes(entry.name),
  }).filter((entry) => entry.isFile());
  return matches.map((entry) => join(entry.parentPath, entry.name));
}

function resolveAlias(span, { appDir }) {
  const src = join(appDir, 'src');
  const rest = span.slice(2);
  if (!rest) return existsSync(src) ? src : null;
  const base = join(src, rest);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function repoPackages(repoRoot) {
  const dir = join(repoRoot, 'packages');
  const names = new Map();
  for (const entry of existsSync(dir) ? readdirSync(dir) : []) {
    const path = join(dir, entry, 'package.json');
    const name = readJson(path)?.name;
    if (name) names.set(name, path);
  }
  return names;
}

const eslintRules = new Map();

// Rule ids active for the app, from `eslint --print-config`, run once per app.
function activeRules(appDir) {
  if (eslintRules.has(appDir)) return eslintRules.get(appDir);
  let rules = new Set();
  try {
    const out = execFileSync(
      'pnpm',
      ['exec', 'eslint', '--print-config', 'src/app/page.tsx'],
      { cwd: appDir, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 },
    );
    rules = new Set(Object.keys(JSON.parse(out).rules ?? {}));
  } catch {
    // No ESLint config here: no rule ids to match.
  }
  eslintRules.set(appDir, rules);
  return rules;
}

function resolvePackage(span, { appDir, repoRoot }) {
  const segments = span.split('/');
  const name = span.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : segments[0];
  if (name.startsWith('@repo/')) {
    const packages = repoPackages(repoRoot);
    if (name === '@repo/*') {
      return packages.size ? join(repoRoot, 'packages/*/package.json') : null;
    }
    return packages.get(name) ?? null;
  }
  const manifest = join(appDir, 'package.json');
  const pkg = readJson(manifest) ?? {};
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const found = name.endsWith('/*')
    ? deps.some((dep) => dep.startsWith(name.slice(0, -1)))
    : deps.includes(name);
  if (found) return `${manifest} (${name})`;
  if (activeRules(appDir).has(span)) return `ESLint rule ${span}`;
  return null;
}

export function resolveSpan(span, kind, ctx) {
  let resolved = null;
  if (kind === 'file') resolved = resolveFile(span, ctx);
  else if (kind === 'glob') {
    const matches = resolveGlob(span, ctx);
    if (matches.length) {
      resolved = `${matches[0]} (${matches.length} match${matches.length > 1 ? 'es' : ''})`;
    }
  } else if (kind === 'alias') resolved = resolveAlias(span, ctx);
  else if (kind === 'package') resolved = resolvePackage(span, ctx);
  else return { ok: true, resolved: '—' };
  return { ok: resolved !== null, resolved: resolved ?? '—' };
}

function unquote(value) {
  return value.trim().replace(/^(["'])(.*)\1$/, '$2');
}

function splitInline(list) {
  const items = [];
  let depth = 0;
  let current = '';
  for (const ch of list) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      items.push(current);
      current = '';
    } else current += ch;
  }
  items.push(current);
  return items.map(unquote).filter(Boolean);
}

function frontmatterPaths(lines) {
  if (lines[0] !== '---') return [];
  const end = lines.indexOf('---', 1);
  if (end === -1) return [];
  const paths = [];
  for (let i = 1; i < end; i++) {
    const match = lines[i].match(/^paths:\s*(.*)$/);
    if (!match) continue;
    const value = match[1].trim();
    if (value.startsWith('[')) paths.push(...splitInline(value.slice(1, -1)));
    else if (value) paths.push(unquote(value));
    else {
      while (i + 1 < end && /^\s*-\s+/.test(lines[i + 1])) {
        paths.push(unquote(lines[++i].replace(/^\s*-\s+/, '')));
      }
    }
  }
  return paths;
}

export function extractSpans(markdown) {
  const lines = markdown.split('\n');
  const spans = frontmatterPaths(lines);
  let fence = null;
  for (const line of lines) {
    const marker = line.match(/^\s*(```|~~~)/)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker === fence) fence = null;
      continue;
    }
    if (fence) continue;
    for (const match of line.matchAll(/`([^`]+)`/g)) spans.push(match[1]);
  }
  return spans;
}

if (import.meta.main) {
  const [appArg, ...files] = process.argv.slice(2);
  if (!appArg || !files.length) {
    console.error('Usage: check-cited-paths.mjs <app dir> <md file ...>');
    process.exit(2);
  }
  const repoRoot = resolve(import.meta.dirname, '../..');
  const ctx = { appDir: resolve(appArg), repoRoot };
  const spans = new Set(
    files.flatMap((file) => extractSpans(readFileSync(file, 'utf8'))),
  );
  const counts = {};
  let missing = 0;
  const cell = (value) => value.replaceAll('|', '\\|');
  console.log('| Span | Kind | Resolved to | Result |');
  console.log('| --- | --- | --- | --- |');
  for (const span of spans) {
    const kind = classifySpan(span, ctx);
    const { ok, resolved } = resolveSpan(span, kind, ctx);
    const skipped = ['literal', 'placeholder', 'text'].includes(kind);
    const result = skipped ? 'skipped' : ok ? 'ok' : 'MISSING';
    if (result === 'MISSING') missing++;
    counts[kind] = (counts[kind] ?? 0) + 1;
    const shown = resolved.replaceAll(`${repoRoot}${sep}`, '');
    console.log(`| \`${cell(span)}\` | ${kind} | ${cell(shown)} | ${result} |`);
  }
  console.log('');
  console.log(
    Object.entries(counts)
      .map(([kind, n]) => `${kind}: ${n}`)
      .join(', '),
  );
  if (missing) {
    console.error(`${missing} MISSING`);
    process.exit(1);
  }
}
