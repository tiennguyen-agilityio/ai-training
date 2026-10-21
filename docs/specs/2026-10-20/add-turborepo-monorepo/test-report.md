# Test Report: add-turborepo-monorepo (phase 3)

- Time: 2026-10-21 10:14:12 (GMT+7)
- Branch: refactor/turborepo-shared-config · Commit: 1edcdbff + uncommitted changes
- Result: PASS (0 bugs)

## Overview

| Suite | Passed | Failed | Skipped | Duration | Scope |
| --- | --- | --- | --- | --- | --- |
| Unit test (api, Vitest) | 257 | 0 | 0 | 1.57s | 24 files |
| E2E test (api) | 101 | 0 | 0 | 17.00s | 5 files (DB localhost:5432/coffee_shop_test) |
| Unit test (web, Jest) | 364 | 0 | 0 | 8.5s | 74 suites |

## Bugs (0)

None.

## Coverage

API, compared with the baseline from 2026-10-21, commit 1edcdbff:

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| **Total** | 96.96% → 96.96% (0) | 92.13% → 92.13% (0) | 97.36% → 97.36% (0) | 96.88% → 96.88% (0) |

Web, compared with the baseline from 2026-10-21, commit 1edcdbff:

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| **Total** | 84.14% → 84.14% (0) | 74.33% → 74.33% (0) | 65.79% → 65.79% (0) | 84.14% → 84.14% (0) |

Coverage drops (warning only, not a failure):
- none

> The web branch total changes between 1122 and 1123 from run to run: `src/hooks/useDebouncedUrlSearch.ts` is counted with 15 or 16 branches, with no source change. One run in this phase showed +0.02. This happened in phase 2 too, so it is not caused by this change.

## Scope

- Changed files:
  - pnpm catalog (`pnpm-workspace.yaml`, devDependencies set to `catalog:`);
  - new `packages/typescript-config`, `packages/prettier-config` and `packages/eslint-config`;
  - both apps' `tsconfig.json` and `eslint.config.mjs`, plus `apps/web/prettier.config.mjs` (the two `.prettierrc` files were removed);
  - web TypeScript 6 fixes: `src/types/css.d.ts`, and one `scrollMargin` field in the `RoastDetailPageContent.test.tsx` mock;
  - `turbo.json` (`format:check` dependsOn) and docs.
- Unit tests run: all (api 24 files, web 74 suites)
- E2E tests run: all (5 files)
- Scope notes:
  - Web type check: `tsc --noEmit` exit 0 on TypeScript 6.0.3.

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint (api) | PASS | 0 errors, 95 warnings (unchanged); `--print-config` rules identical for 3 files |
| Lint (web) | PASS | 0 errors, 9 warnings (unchanged); `--print-config` rules identical for 3 files |
| Build (api) | PASS | `nest build` exit 0 |
| Build (web) | PASS | `pnpm build:web` exit 0. `next build` still lints; no "plugin was not detected" |
| tsconfig | PASS | `tsc --showConfig` is semantically identical to the old configs for both apps |
| Prettier | PASS | `--list-different` is empty for both apps, before and after; `pnpm format:check` passes |
| Unit tests | PASS | api 24 files / 257; web 74 suites / 364 |
| E2E tests | PASS | guard printed `localhost:5432/coffee_shop_test`; 5 files / 101 |
| Docker | PASS | production image (built before the final `@repo/eslint-config` dependency revert, which does not reach the prod install): `dist/main.js`, prod deps OK; `apps/api/node_modules` has no `typescript` / `eslint` / `turbo` / `vitest` / `@nestjs/cli` / `@repo/*`. The virtual store still holds `typescript@6.0.3` as `@nestjs/swagger`'s peer, as it did before this phase |
| actionlint | PASS | no output |
| Diff review | PASS | only planned `src` changes (the two TS 6 fixes); no skips, suppressions or removed assertions |

**Verdict: PASS**
