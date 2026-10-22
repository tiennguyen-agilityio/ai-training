# Verify reference

Read only when SKILL.md is not enough: a gate fails, a checklist item is unclear, or e2e is in question.

## Gates

| Gate | Command | Also enforced by |
| --- | --- | --- |
| Lint | `pnpm exec eslint "{src,apps,libs,test}/**/*.ts"` (no `--fix`) | pre-commit (lint-staged), CI |
| Format | `pnpm run format:check` (no `--write`) | pre-commit (lint-staged) |
| Build | `pnpm run build` (`nest build`, `tsconfig.build.json`) | pre-push, CI |
| Unit tests | `pnpm run test` (`src/**/*.spec.ts`) | pre-push, CI |
| E2E tests | `pnpm run test:e2e` (`test/**/*.e2e-spec.ts`) | nothing: only this skill runs it |

- **Lint warnings don't fail the gate** (`no-floating-promises`, `no-unsafe-argument` are `warn`). Baseline: 84 in Oct 2026, mostly `no-unsafe-argument` in `test/e2e/**`. If the count rose, check whether your change added them. Add none.
- **Fixing lint:** `pnpm run lint` autofixes prettier-style issues. It changes the diff, so rerun the gates.
- **Fixing format:** `pnpm run format` rewrites the files. It changes the diff, so rerun the gates. Without the Format gate, pre-commit lint-staged would rewrite the files after verify.
- **While fixing:** loop on `pnpm vitest run <file>` or `-t '<name>'` (CLAUDE.md §2), then finish with a full run of every gate.
- **`.only`:** vitest allows it locally and silently skips every other test, while CI (`CI=true`) fails on it. A local green run with `.only` proves nothing.

## Known noise (pre-existing, not your change)

**No gate type-checks test files:** `tsconfig.build.json` excludes specs, and vitest's SWC strips types. If you edit tests, you may run `pnpm exec tsc --noEmit -p tsconfig.json --rootDir .` and delete the `tsconfig.tsbuildinfo` it creates. It already reports:

- `Cannot find module 'supertest/types'` in `test/**`
- an `AuthProvider` mock shape error in `src/modules/webhook/services/clerk-webhook.service.spec.ts`

**Any other error is yours.**

## E2E

**When to run:** the change affects HTTP behaviour or the database. See SKILL.md step 2 for the file list.

**Database guard:** `pretest:e2e` truncates every table in the database it *resolves*, which can differ from `.env.test`:

- `test/setup-env.ts` loads `.env.test` without `override`, so `DB_*` exported in the shell win.
- `mikro-orm.config.ts` then runs `dotenv/config`, which fills keys missing from `.env.test` with values from `.env`.

So trust only the `host:port/dbName` printed by the SKILL.md step 2 command. Run e2e only if the name ends in `_test`. Otherwise report `SKIPPED` with the printed value and tell the user. The `injected env (N) from .env.test` line in its output is normal.

**Expected noise:**

- Clerk errors in the logs come from placeholder keys. They are not failures.
- If Postgres is unreachable, the run fails with a connection error. Report `SKIPPED — Postgres not reachable` only after the output confirms that is the cause. `pnpm run docker:dev` starts a database.

## Checklist details

What each SKILL.md step 3 hit usually means, and when it is acceptable. Justify every accepted hit in the report.

| Hit | Usually means | Legitimate when |
| --- | --- | --- |
| Focused/skipped/todo test added | A test was silenced to get green | Never in a finished change |
| `expect(` removed | Tests were loosened or deleted | Assertions were consolidated or moved with the same coverage. Say where |
| Spec file deleted | Coverage was removed | The code under test was deleted too |
| Vitest config changed | `include`/`exclude`/coverage narrowed to hide failures | The task was about test config |
| Type/lint suppression added | An error was hidden, not fixed | Rare. Justify each line |
| `console.log`/`debugger` in `src/` | Leftover debugging | Never. Use Nest's `Logger` |
| Raw Nest HTTP exception | Bypasses the `DomainException` + `ErrorDetailDto` contract | Never in services or controllers. `common/filters` and `common/exceptions` are exempt |
| `EntityManager` outside base repository | Breaks the layering in `.claude/rules/coding.md` | Never in services. In repositories, prefer the `BaseRepository` helpers |
| Relative import without `.js` | Breaks at runtime under ESM (`nodenext`) | Never |
| Hardcoded `/api/v1` in tests | Tests drift from the real prefix and versioning | Never. Use `API_BASE_PATH` |
| Entity changed, no migration | Schema and database diverge | The change has no schema effect (e.g. a comment or a getter) |

## Weakened tests

These are easy to miss when skimming a spec diff, so look for them deliberately:

- **Loosened matcher:** `toEqual(x)` became `toBeDefined()`/`toBeTruthy()`, `toThrow(SomeException)` became `toThrow()`, or `toHaveBeenCalledWith(...)` became `toHaveBeenCalled()`.
- **Expected value edited to match new output** without the requirement changing.
- **Circular mock:** a mock returns exactly what the code under test should compute.
- **Swapped case:** a failing case was rewritten into a different passing one, e.g. with inputs that no longer hit the bug path.
- **Renamed or moved `it`:** the old name is gone and nothing replaced its assertions.

## Repo checks a diff review should cover

From `.claude/rules/coding.md`:

- **New error code:** has entries in `message.constant.ts` (`ERROR_MESSAGES`, `ERROR_DESCRIPTIONS`) and `error-code.constant.ts`, and is used in the controller's `@ApiErrorResponse` docs.
- **Responses** go through `Response*Dto.fromEntity`. Entities are never returned.
- **Admin-only routes** use `@AdminOnly()`. Deleted-row visibility goes through `isActiveAdmin(user)` and `includeDeleted`.
- **Request validation** is a Zod schema in `dto/*.schema.ts`, not class-validator.
