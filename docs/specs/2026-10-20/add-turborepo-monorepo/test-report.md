# Test Report: add-turborepo-monorepo (phase 1)

- Time: 2026-10-20 20:45:28 (GMT+7)
- Branch: refactor/turborepo-api · Commit: f10a011d + uncommitted changes
- Result: PASS (0 bugs)

## Overview

| Suite | Passed | Failed | Skipped | Duration | Scope |
| --- | --- | --- | --- | --- | --- |
| Unit test | 257 | 0 | 0 | 1.63s | 24 files |
| E2E test | 101 | 0 | 0 | 19.56s | 5 files (DB localhost:5432/coffee_shop_test) |

## Bugs (0)

None.

## Coverage

Compared with the baseline from 2026-10-20, commit 5cb2eae5 (no `src/` file changed in phase 1, so only the total row is shown).

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| **Total** | 96.96% → 96.96% (0) | 92.13% → 92.13% (0) | 97.36% → 97.36% (0) | 96.88% → 96.88% (0) |

Coverage drops (warning only, not a failure):
- none

## Scope

- Changed files:
  - Phase 1 is a restructure: `coffee-shop-api/` moved to `apps/api/` (pure renames, 0 content changes in `src/` and `test/`), shared files to the repo root, plus config/docs edits (Dockerfile, compose, package.json, CI, husky, `.dockerignore`, CLAUDE.md, README, verify skill).
- Unit tests run: all (24 files)
- E2E tests run: all (5 files)
- Scope notes:
  - Re-run after the final fix wave (`ci.yml`, `.dockerignore`, docs).
  - `.dockerignore` has no Prettier parser, so it is excluded from the Prettier check.

## Verification
| Gate | Result | Evidence |
| --- | --- | --- |
| Lint | PASS | `eslint "{src,apps,libs,test}/**/*.ts"` (no --fix): `✖ 95 problems (0 errors, 95 warnings)`, unchanged |
| Build | PASS | `nest build` exit 0 |
| Unit tests | PASS | `test:cov`: 24 files, 257 tests passed, 1.63s |
| E2E tests | PASS | guard printed `localhost:5432/coffee_shop_test`; 5 files, 101 tests, 19.56s |
| Coverage | PASS | totals unchanged (96.96 / 92.13 / 97.36 / 96.88); drops: none |
| format:check | PASS | root `pnpm format:check`: `api:format:check` "All matched files use Prettier code style!" |
| actionlint | PASS | `actionlint .github/workflows/ci.yml` exit 0, no output |
| Prettier (root files) | PASS | `ci.yml .lintstagedrc.json package.json turbo.json` pass; `.dockerignore` skipped (no parser) |
| Diff review | PASS | `git diff 5cb2eae5 --stat`: 163 files; renames + config/docs edits; 0 changes under `apps/api/src` and `apps/api/test` |
| Test integrity | PASS | numstat 0 changed lines in src/test/vitest files; no added `.skip/.only/.todo`, `eslint-disable`, `@ts-ignore`, `console.log`, `debugger` (tracked diff and untracked files); no removed `expect(` |

**Verdict: PASS** - all gates green on the final code, coverage unchanged, no src/test content changes.
