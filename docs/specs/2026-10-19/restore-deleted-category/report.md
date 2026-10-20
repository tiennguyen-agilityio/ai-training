# Report: restore-deleted-category

- **Card:** [#1 [Feature] Let admins restore a deleted category from the Categories list](https://trello.com/c/OxXGjbGm/1-feature-let-admins-restore-a-deleted-category-from-the-categories-list)
- **Branch:** `feat/restore-deleted-category`, from `e7a1f02` on `feat/claude-example`
- **Design:** [design.md](design.md) · **Plan:** [plan.md](plan.md) · **Test report:** [test-report.md](test-report.md)

## Verification

Last run 2026-10-19 17:38:54 (GMT+7), after the last edit.

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint | PASS | 0 errors, 95 warnings (84 unchanged + 11 `no-unsafe-argument` on the new e2e `request(app.getHttpServer())` calls, same pattern as existing lines) |
| Build | PASS | `nest build` exit 0 |
| Unit tests | PASS | 24 files, 257 tests passed (`test:cov`) |
| E2E tests | PASS | 5 files, 101 tests passed against `localhost:5433/coffee_shop_test` |
| Diff review | PASS | 11 files, all in scope (10 code/test + README row from the code review) |
| Test integrity | PASS | no skip/only/todo, no `expect(` removed, no vitest config change, no suppressions |

Coverage total: statements 96.91% → 96.96%, branches 92.07% → 92.13%, no drops. Details in [test-report.md](test-report.md).

**Verdict: PASS**

## Plan review

`plan-reviewer`: no gaps. Every task and Global Constraint is in the diff; the items it could not verify by reading (tests, e2e guard, lint, build, 400 vs 404 for a malformed id) are covered by the verify run above.

## Code review

Whole-change review (`superpowers:requesting-code-review`, uncommitted diff against `e7a1f02`, checked against `.claude/rules/`). Verdict: ready with fixes.

| Severity | Finding | Outcome |
| --- | --- | --- |
| Critical | — | none |
| Important | README endpoint table had no row for `PATCH /categories/:id/restore` | Fixed (`README.md`); scoped re-review: addressed; verify rerun: PASS |
| Minor | `.claude/rules/coding.md` lists the `DomainException` subclasses without `InvalidStateException` | Left; worth a follow-up so the rules match the code |
| Minor | No 400 Swagger doc on the restore route | Left; matches `DELETE /categories/:id`, which also omits the param-only 400 |
| Minor | The malformed-id restore e2e test asserts only the status, not `errCode: 'isUuid'` | Left |

Minor findings from the per-task reviews, triaged by the whole-change reviewer as not blocking:

- Service "not deleted" unit test asserts only `errCode`; the exception spec and e2e cover the rest.
- `BaseRepository.restore` has no direct unit test; repositories are excluded from coverage and four e2e tests exercise it.
- The create + soft-delete e2e fixture block repeats in 4 tests; a `createDeletedCategory` helper can come with the next restore endpoint.
- Exception spec test title repeats the class name; controller spec spreads `deletedAt: null` onto a fixture that already has it — cosmetic.

## Tests added

- Unit, `base.exception.spec.ts`: `InvalidStateException` responds 409 with the CONFLICT message and the given error.
- Unit, `category.service.spec.ts` (`restore`): restores a soft-deleted category and returns it; throws `InvalidStateException` when not deleted; throws `ItemNotFoundException` for a missing id.
- Unit, `category.controller.spec.ts` (`restore`): delegates and maps to `ResponseCategoryDto`; propagates `InvalidStateException`.
- E2E, `category.e2e-spec.ts`: 401 without a session; 403 for a non-admin, category stays deleted; 200 for an admin, then visible to anonymous `GET /categories/:id`; 404 for a missing id; 409 for an active category; 409 on a second restore; a restored category can be deleted again (204); 400 for a malformed id.

## Decisions

| When | Decision |
| --- | --- |
| Discussion #1 | API only, in `coffee-shop-api`; no UI. |
| Discussion #2 | Restoring a category that is not deleted returns 409 `categoryNotDeleted`, not 400 or 200. |
| Discussion #3 | Restore touches only the category. |
| Gate 0 | Card moved TODO → IN PROGRESS (2026-10-19 17:09 GMT+7). |
| Gate 1 | Plan approved; subagent-driven execution; `e7a1f02` pushed to `origin/feat/claude-example` and used as the base commit. |
| Claude's calls | `PATCH /:id/restore` returning 200 + category; new `InvalidStateException` class; restore keeps `name` and `slug` (see design, "Calls made by Claude"). |
| Execution rulings | No commits during execution: each task's diff was reviewed from the working tree and staged as a checkpoint. The subagent-driven final review was replaced by this repo's whole-change code review above. |
