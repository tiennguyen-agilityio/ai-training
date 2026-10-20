# Test Report: restore-deleted-category

- Time: 2026-10-19 17:38:54 (GMT+7)
- Branch: feat/restore-deleted-category · Commit: e7a1f02 + uncommitted changes
- Result: PASS (0 bugs)

## Overview

| Suite | Passed | Failed | Skipped | Duration | Scope |
| --- | --- | --- | --- | --- | --- |
| Unit test | 257 | 0 | 0 | 2.98s | 24 files |
| E2E test | 101 | 0 | 0 | 18.04s | 5 files |

## Bugs (0)

None.

## Coverage

Compared with the baseline from 2026-10-19, commit e7a1f02.

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| **Total** | 96.91% → 96.96% (+0.05) | 92.07% → 92.13% (+0.06) | 97.31% → 97.36% (+0.05) | 96.82% → 96.88% (+0.06) |
| `src/common/constants/error-code.constant.ts` | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) |
| `src/common/constants/message.constant.ts` | 95.45% → 95.45% (0) | 100% → 100% (0) | 94.73% → 94.73% (0) | 95.45% → 95.45% (0) |
| `src/common/exceptions/base.exception.ts` | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) |
| `src/modules/category/controllers/category.controller.ts` | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) |
| `src/modules/category/services/category.service.ts` | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) | 100% → 100% (0) |

Coverage drops (warning only, not a failure):

- none

Changed files outside the coverage `include` (not measured):

- `src/common/repositories/base.repository.ts` — `BaseRepository.restore` is exercised by the restore e2e tests.

## Scope

- Changed files:
  - `src/common/constants/error-code.constant.ts`
  - `src/common/constants/message.constant.ts`
  - `src/common/exceptions/base.exception.ts`
  - `src/common/exceptions/base.exception.spec.ts`
  - `src/common/repositories/base.repository.ts`
  - `src/modules/category/services/category.service.ts`
  - `src/modules/category/services/category.service.spec.ts`
  - `src/modules/category/controllers/category.controller.ts`
  - `src/modules/category/controllers/category.controller.spec.ts`
  - `test/e2e/category.e2e-spec.ts`
  - `README.md` (endpoint table row, from the code review)
- Unit tests run: all (24 files), via `pnpm run test:cov --coverage.reporter=json-summary --coverage.reporter=text-summary`
- E2E tests run: all (5 files), via `pnpm run test:e2e` against `localhost:5433/coffee_shop_test`
- Scope notes:
  - Lint: 0 errors, 95 warnings. The 11 new warnings are `no-unsafe-argument` on the new `request(app.getHttpServer())` calls in the e2e spec, the same pattern as the existing lines; the other 84 are unchanged.
  - Build: `nest build` exit 0.
  - Diff review: no `.skip`/`.only`/`.todo`, no removed `expect(`, no vitest config change, no suppressions, no hardcoded `/api/v1`, relative imports end in `.js`, no entity change (no migration needed).
