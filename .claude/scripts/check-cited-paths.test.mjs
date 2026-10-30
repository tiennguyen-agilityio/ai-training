import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  classifySpan,
  extractSpans,
  resolveSpan,
} from './check-cited-paths.mjs';

const repoRoot = resolve(import.meta.dirname, '../..');
const web = { appDir: join(repoRoot, 'apps/web'), repoRoot };

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'check-cited-paths-'));
  for (const file of files) {
    mkdirSync(join(dir, file, '..'), { recursive: true });
    writeFileSync(join(dir, file), '');
  }
  return { appDir: dir, repoRoot };
}

const KINDS = {
  file: [
    'src/services/api.ts',
    '../../packages/eslint-config/next.mjs',
    'tsconfig.json',
    'components.json',
    'src/app/(shop)/page.tsx',
    'src/app/sign-in/[[...sign-in]]',
    'constants/messages.ts',
    'components/ui/',
    'app/',
    '__tests__/',
    'coding.md',
    'SKILL.md',
    'workflow.md',
  ],
  glob: [
    'src/**/*.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    '*.test.ts',
    '*.test.tsx',
    'coverage/**',
  ],
  alias: ['@/utils/styles', '@/'],
  package: [
    '@repo/constants',
    '@repo/*',
    '@repo/eslint-config/next',
    '@clerk/*',
    'next/navigation',
    '@typescript-eslint/no-explicit-any',
    'react-hooks/exhaustive-deps',
  ],
  literal: [
    '/api/v1',
    'http://localhost:3000',
    'NEXT_PUBLIC_*',
    'bg-surface-*',
    'report.md',
    'test-report.md',
    'coverage-baseline-web.json',
    'coverage-baseline.json',
  ],
  placeholder: ['<Name>.test.tsx', 'use<Name>.ts'],
  text: [
    'pnpm exec eslint .',
    "'use client'",
    'jest.mocked(hook)',
    '*.test.ts(x)',
    'jest.fn',
    'ROUTES',
    'ROUTES.*',
    'ERROR_MESSAGES.*',
    '@ts-ignore',
    '@ts-expect-error',
    'apps/web:verify',
  ],
};

for (const [kind, spans] of Object.entries(KINDS)) {
  for (const span of spans) {
    test(`classifySpan: ${span} → ${kind}`, () => {
      assert.equal(classifySpan(span, web), kind);
    });
  }
}

test('extractSpans: skips a fence indented inside a list item', () => {
  const md = [
    '- Run it:',
    '',
    '   ```bash',
    '   echo `src/inside/fence.ts`',
    '   ```',
    '',
    'Then read `src/services/api.ts`.',
  ].join('\n');
  assert.deepEqual(extractSpans(md), ['src/services/api.ts']);
});

test('extractSpans: block-list paths frontmatter is unquoted', () => {
  const md = '---\npaths:\n  - "src/**/*.{ts,tsx}"\n---\n# Rules\n';
  const spans = extractSpans(md);
  assert.deepEqual(spans, ['src/**/*.{ts,tsx}']);
  assert.equal(resolveSpan(spans[0], 'glob', web).ok, true);
});

test('extractSpans: inline-array paths frontmatter is unquoted', () => {
  const md =
    '---\npaths: ["src/**/*.test.{ts,tsx}", "jest.config.ts"]\n---\n# Rules\n';
  const spans = extractSpans(md);
  assert.deepEqual(spans, ['src/**/*.test.{ts,tsx}', 'jest.config.ts']);
  for (const span of spans) {
    assert.equal(resolveSpan(span, classifySpan(span, web), web).ok, true);
  }
});

const dotDirs = fixture([
  '.claude/rules/coding.md',
  '.claude/skills/verify/SKILL.md',
]);
const coverage = fixture(['coverage/coverage-summary.json']);

const FOUND = [
  ...KINDS.file
    .filter((span) => span !== 'coding.md' && span !== 'SKILL.md')
    .map((span) => [span, web]),
  ['page.tsx', web],
  ['coding.md', dotDirs],
  ['SKILL.md', dotDirs],
  ...KINDS.glob
    .filter((span) => span !== 'coverage/**')
    .map((span) => [span, web]),
  ['coverage/**', coverage],
  ...KINDS.alias.map((span) => [span, web]),
  ['@repo/schemas', web],
  ['@repo/*', web],
  ['@repo/eslint-config/next', web],
  ['@clerk/*', web],
  ['next/navigation', web],
  ['@typescript-eslint/no-explicit-any', web],
  ['react-hooks/exhaustive-deps', web],
];

for (const [span, ctx] of FOUND) {
  test(`resolveSpan: ${span} resolves`, () => {
    const result = resolveSpan(span, classifySpan(span, ctx), ctx);
    assert.equal(result.ok, true, `resolved to ${result.resolved}`);
  });
}

const MISSING = [
  'src/services/missing.ts',
  'src/**/*.vue',
  '@/utils/nope',
  '@repo/nope',
  'left-pad/x',
  'nope-plugin/nope-rule',
  'useX.ts',
  'nope.md',
];

for (const span of MISSING) {
  test(`resolveSpan: ${span} is missing`, () => {
    assert.equal(resolveSpan(span, classifySpan(span, web), web).ok, false);
  });
}
