# Test Report: add-turborepo-monorepo (phase 2)

- Time: 2026-10-21 00:17:41 (GMT+7)
- Branch: refactor/turborepo-web · Commit: 283331a6 + uncommitted changes
- Result: PASS (0 bugs)

## Overview

| Suite | Passed | Failed | Skipped | Duration | Scope |
| --- | --- | --- | --- | --- | --- |
| Unit test (api, Vitest) | 257 | 0 | 0 | 1.58s | 24 files |
| E2E test (api) | 101 | 0 | 0 | 17.41s | 5 files (DB localhost:5432/coffee_shop_test) |
| Unit test (web, Jest) | 364 | 0 | 0 | 10.3s | 74 suites |

## Bugs (0)

None in this run. An earlier run in this session failed once on `test/e2e/product.e2e-spec.ts` (`afterAll` hook timed out after 10000ms; all 101 tests passed). The file passed alone (40/40) and in two later full runs, so it is recorded as flaky, not a bug.

## Coverage

API, compared with the baseline from 2026-10-20, commit 5cb2eae5 (no `src/` file changed):

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| **Total** | 96.96% → 96.96% (0) | 92.13% → 92.13% (0) | 97.36% → 97.36% (0) | 96.88% → 96.88% (0) |

Web, compared with `coverage-baseline-web.json` (2026-10-20, commit ee8ad41c, taken in `web/` before the move):

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| **Total** | 84.14% → 84.14% (0) | 74.35% → 74.35% (0) | 65.79% → 65.79% (0) | 84.14% → 84.14% (0) |

Coverage drops (warning only, not a failure):
- none

> One earlier web run in this session showed branches 74.35% → 74.33% (`src/hooks/useDebouncedUrlSearch.ts` counted 15 branches instead of 16). The final run matches the baseline.

## Scope

- Changed files: web moved to `apps/web` (290 pure renames + README.md formatted by the pre-commit hook), plus config/docs: root and web `package.json`, `pnpm-lock.yaml` (web lockfile removed), `turbo.json`, `.gitignore`, `ci.yml`, `CLAUDE.md`, READMEs, `docs/conventions/git.md`, `apps/web/CLAUDE.md`. No `src/` or test file changed.
- Unit tests run: all (api 24 files, web 74 suites)
- E2E tests run: all (5 files)
- Scope notes:
  - Web tests also passed with `apps/web/.env` moved aside (74/364), as CI runs them.

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint (api) | PASS | `eslint` without `--fix`: 0 errors, 95 warnings (unchanged) |
| Lint (web) | PASS | `eslint .` without `--fix`: 0 errors, 9 warnings (unchanged) |
| Build (api) | PASS | `nest build` exit 0 |
| Build (web) | PASS | `pnpm build:web` exit 0; also exit 0 without `.env` given only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Unit tests | PASS | api 24 files / 257; web 74 suites / 364 |
| E2E tests | PASS | guard printed `localhost:5432/coffee_shop_test`; 5 files / 101 |
| format:check | PASS | `pnpm format:check` (api + web) |
| actionlint | PASS | no output |
| Diff review | PASS | no `src/` or test changes; no skips, suppressions or removed assertions |

**Verdict: PASS**
