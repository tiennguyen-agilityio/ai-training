# Verify reference

Read only when SKILL.md is not enough: a gate fails, a checklist item is unclear, or a number looks wrong.

## Gates

| Gate       | Command                                          | Also enforced by                                               |
| ---------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Lint       | `pnpm exec eslint .` (no `--fix`)                | pre-commit (lint-staged `eslint --fix`), `next build`          |
| Format     | `pnpm run format:check` (no `--write`)           | pre-commit (lint-staged `prettier --write`)                    |
| Type check | `pnpm exec tsc --noEmit`                         | `next build`                                                   |
| Build      | `pnpm run build` (`next build`)                  | pre-push (`turbo run build test --affected`), CI `quality` job |
| Unit tests | `pnpm run test` (Jest, `src/**/*.test.{ts,tsx}`) | pre-push, CI `quality` job                                     |
| E2E tests  | none, report n/a                                 | nothing                                                        |

- **Lint warnings don't fail the gate.** Baseline before any web change (Oct 2026): 0 errors, 9 warnings: 5 `@next/next/no-img-element`, 3 `@typescript-eslint/no-explicit-any` in `src/hooks/useUrlState.ts`, 1 `react-hooks/exhaustive-deps`. If the count rose, check whether your change added them. Add none.
- **Fixing lint or format:** `pnpm run lint` and `pnpm run format` rewrite files. That changes the diff, so rerun the gates.
- **While fixing:** loop on `pnpm exec jest <file>` or `-t '<name>'`, then finish with a full run of every gate.
- **Build needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** from `.env`. Without it, report Build `FAIL` with that reason.

## Known noise (pre-existing, not your change)

- The lint warnings above.
- **Coverage branch total flakes by one:** `src/hooks/useDebouncedUrlSearch.ts` is counted with 15 or 16 branches from run to run, with no source change. A ±1 branch change in the total alone is not a drop caused by your change.

## Checklist details

What each SKILL.md step 3 hit usually means, and when it is acceptable. Justify every accepted hit in the report.

| Hit                                            | Usually means                                      | Legitimate when                                                                                                                                |
| ---------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused/skipped/todo test added                | A test was silenced to get green                   | Never in a finished change                                                                                                                     |
| `expect(` removed                              | Tests were loosened or deleted                     | Assertions were consolidated or moved with the same coverage. Say where                                                                        |
| Test file deleted                              | Coverage was removed                               | The code under test was deleted too                                                                                                            |
| `jest.config.ts` or `jest.setup.ts` changed    | Paths, mappers or globals changed to hide failures | The task was about test config                                                                                                                 |
| Type/lint suppression added                    | An error was hidden, not fixed                     | Rare. Justify each line                                                                                                                        |
| `console.log`/`debugger` in `src/`             | Leftover debugging                                 | Never                                                                                                                                          |
| Literal API URL or `/api/v1`                   | Bypasses `API_ROUTES` and `API_BASE_URL`           | Never in `src/`; new tests assert against `API_ROUTES` (`src/app/dashboard/categories/add/page.test.tsx` still matches `'/api/v1/categories'`) |
| Literal error, success or dialog message       | Text drifts from `src/constants/messages.ts`       | Never in new code; headings and labels stay inline                                                                                             |
| Redeclared shared enum or payload type         | Drifts from `@repo/constants` or `@repo/schemas`   | Never                                                                                                                                          |
| `'use client'` on a `page.tsx` or `layout.tsx` | Moves the page to the client                       | Never; put the client part in `PageContent.tsx` (`src/layouts/Header/*` are client by design)                                                  |
| Public read without `skipAuth`                 | Sends the session token on a public request        | Never (`src/services/__tests__/public-reads.test.ts`)                                                                                          |
| New `dangerouslySetInnerHTML`                  | Injects unescaped HTML                             | The HTML is a constant from the code, never user or API data                                                                                   |
| Control without an accessible name             | Screen readers and role queries cannot find it     | Never                                                                                                                                          |

## Weakened tests

- **Loosened matcher:** `toEqual(x)` became `toBeDefined()`/`toBeTruthy()`, `toHaveBeenCalledWith(...)` became `toHaveBeenCalled()`, or a role query lost its `name`.
- **Expected value edited to match new output** without the requirement changing.
- **Circular mock:** a mocked hook or `fetch` returns exactly what the code under test should compute.
- **Swapped case:** a failing case was rewritten into a different passing one.
- **Narrowed run:** a Jest path or `testPathIgnorePatterns` excludes the failing test; `--passWithNoTests` turns a path matching nothing into a green run.

## Repo checks

- **`.next` and `next dev`:** both write `.next`. Stop `next dev` before `pnpm run build`; a build run beside it can fail or pass against stale output.
- **Stale coverage summary:** `coverage/coverage-summary.json` survives from older runs. Always rerun Jest with the json-summary reporter before `coverage-diff.mjs`.
- **Run with pnpm inside `apps/web/`:** root `turbo` can replay a cached `coverage/` output instead of running Jest.
