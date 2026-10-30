import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify } from './changed-apps.mjs';

const API = 'apps/api/src/modules/category/services/category.service.ts';
const WEB = 'apps/web/src/sections/EditCategory/index.tsx';
const BOTH = ['api', 'web'];

const CASES = [
  [1, [API], ['api'], []],
  [2, [WEB], ['web'], []],
  [3, [API, WEB], BOTH, []],
  [4, ['packages/schemas/src/category.ts'], BOTH, ['@repo/schemas']],
  [
    5,
    ['packages/constants/src/index.ts', 'packages/schemas/src/index.ts'],
    BOTH,
    ['@repo/constants', '@repo/schemas'],
  ],
  [6, ['packages/eslint-config/next.mjs'], [], []],
  [
    7,
    [
      'apps/web/.claude/rules/coding.md',
      'apps/api/.claude/skills/verify/SKILL.md',
    ],
    [],
    [],
  ],
  [
    8,
    ['apps/api/CLAUDE.md', 'apps/web/README.md', 'packages/schemas/README.md'],
    [],
    [],
  ],
  [9, ['apps/web/package.json'], ['web'], []],
  [10, ['apps/web/jest.config.ts', 'apps/api/vitest.config.ts'], BOTH, []],
  [
    11,
    [
      '.claude/rules/workflow.md',
      'docs/conventions/git.md',
      '.github/workflows/ci.yml',
      'CLAUDE.md',
    ],
    [],
    [],
  ],
  [
    12,
    ['apps/web/.claude/rules/coding.md', 'apps/web/src/app/page.tsx'],
    ['web'],
    [],
  ],
  [13, ['apps/api/test/e2e/category.e2e-spec.ts'], ['api'], []],
  [14, ['apps/web/public/logo.png'], ['web'], []],
  [15, [], [], []],
  [16, ['.claude/scripts/coverage-diff.mjs'], [], []],
];

for (const [n, input, apps, rebuild] of CASES) {
  test(`classify case ${n}`, () => {
    assert.deepStrictEqual(classify(input), {
      apps,
      rebuild,
      noApp: apps.length === 0,
    });
  });
}

test('noApp is true exactly in cases 6, 7, 8, 11, 15 and 16', () => {
  const noApp = CASES.filter(([, input]) => classify(input).noApp).map(
    ([n]) => n,
  );
  assert.deepStrictEqual(noApp, [6, 7, 8, 11, 15, 16]);
});
