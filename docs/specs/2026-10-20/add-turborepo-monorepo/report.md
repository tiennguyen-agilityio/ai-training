# Report: add-turborepo-monorepo — phase 1 (`refactor/turborepo-api`)

- Design: [design.md](design.md) · Plan: [plan.md](plan.md) (Phase 1, Tasks 1.1–1.8) · Test report: [test-report.md](test-report.md)
- Base: `5cb2eae5` (`feat/claude-example`). Commits: `f10a011d` (move only, 158 renames, approved at the checkpoint), then the rest at Gate 2.
- Execution: subagent-driven. Each task had a fresh implementer and a task review; an opus whole-branch review ran at the end, then one fix wave and a scoped re-review.

## Verify

Last run: 2026-10-20 20:45 (GMT+7), on the final working tree (after the review fix wave). Details in [test-report.md](test-report.md).

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint | PASS | 0 errors, 95 warnings (unchanged from the baseline) |
| Build | PASS | `nest build` exit 0 |
| Unit tests | PASS | 24 files, 257 tests (`test:cov`) |
| E2E tests | PASS | the guard printed `localhost:5432/coffee_shop_test`; 5 files, 101 tests |
| Coverage | PASS | 96.96 / 92.13 / 97.36 / 96.88, the same as the baseline |
| format:check | PASS | `pnpm format:check` (api) |
| actionlint | PASS | `.github/workflows/ci.yml`, no output |
| Diff review | PASS | 163 files vs 5cb2eae5; 0 changes under `apps/api/src` and `apps/api/test`; no added skips or suppressions, no removed `expect(` |

**Verdict: PASS**

## Phase 1 checks (from the task reports)

| Check | Result |
| --- | --- |
| Lockfile move (Task 1.3) | `pnpm ls` for the API's direct dependencies: **NO DRIFT**. Transitive: `es-toolkit` 1.51.0 → 1.52.0 (accepted, see rulings) |
| Turbo vs direct (Task 1.3) | `pnpm test` through turbo: 24 files / 257 tests, same as a direct run. Second `pnpm build`: `FULL TURBO` |
| commit-msg (Task 1.4) | `bad message` → exit 1 (`subject-empty`, `type-empty`). `refactor: move api` → exit 0 |
| pre-commit (Task 1.4) | Root JSON used the root `.lintstagedrc.json`; API `.ts` used the `apps/api` config. Other uncommitted changes and the stash count were unchanged |
| pre-push (Task 1.4) | `--affected` runs `api` only. With a missing base ref it prints a warning, runs everything and exits 0. `apps/api/.turbo/` is ignored |
| Docker image (Task 1.5) | Builds from the repo root. Prune scope is `api` only. 414 MB. `dist/main.js` is present; no `typescript`, `eslint`, `turbo`, `vitest` or `@nestjs/cli` in the image |
| Docker boot (Task 1.5) | Postgres on 5433 via the dev override, migrated from the host. `POST /webhooks/clerk` → **400**, and Nest started with no errors. `GET /api/v1/categories` → 500, from Clerk "Publishable key not valid" in the local `apps/api/.env.docker` (pre-existing, see below) |
| Docker dev (Task 1.5) | Hot reload works after a content edit. `touch` alone does not trigger it on the Docker Desktop bind mount |
| CI (Task 1.6) | `actionlint` clean. Locally, `turbo run test build --affected` passes, and the `turbo ls --affected --output=json` shape matches the workflow's `jq` filter. The merged-PR base is `merge_commit_sha^1`, and `api` is affected against the target tip |
| Nested Claude rules (Task 1.7) | A `claude -p` session at the root loaded `apps/api/.claude/rules/coding.md` when reading an `apps/api/src` file. The fallback was not needed |

## Plan review

`plan-reviewer`, Phase 1 only: the one gap was this `report.md` (now written). Every other requirement is implemented. The deviations are covered by the rulings below, plus one more: the CI `jq` check uses `any(...)` with an exit-code check. That is stricter than the plan's filter, and it was accepted.

## Code review

- **Per-task reviews:** all tasks passed review. Task 1.6 needed one fix round (Important): the `api_affected` step failed open, so a `turbo`/`jq` error gave `false` and silently skipped the deploy. It now fails closed: a turbo error fails the step, and only jq exit 1 gives `false`.
- **Whole-branch review (opus):** no Critical. Three Important items, fixed in one wave and confirmed by a scoped re-review:
  1. Root-scoped Claude tooling still had API-relative paths (`trello-manager` `git -C ..`, the `plan-reviewer` rules path, the `work-ticket` rules path, `verify` → `../../.claude/rules/workflow.md`).
  2. The guidance "`README.md` is detailed and current — read it before asking" was restored in `apps/api/CLAUDE.md`.
  3. An "Upgrading an existing clone" note was added to the root README (and goes in the MR description).
- **Minor items fixed in the same wave:**
  - `ci.yml`: Prettier-formatted (the parsed YAML is identical apart from the new `env`), and `TURBO_TELEMETRY_DISABLED` added;
  - `.dockerignore`: `**/.clerk` added;
  - stale lines in `apps/api/CLAUDE.md` and both READMEs updated.
- **Minor items left deferred:**
  - the pnpm 10 "ignored build scripts" warning (pre-existing);
  - `tsconfig.build.tsbuildinfo` is not in turbo outputs;
  - turbo strict env mode (revisit in phase 2);
  - the hardcoded `ARG TURBO_VERSION` (matches the lockfile);
  - the root lint-staged skips md/ts in `packages/` (by design);
  - the `web/README.md` hooks line (phase 2).

## Tests added

None. Phase 1 changes no `src/` or `test/` file. Coverage is identical to the baseline.

## Decisions

**User decisions (gates):**
- Execution method: subagent-driven.
- Gate 2: one commit for phase 1, with code, config and the spec folder together.
- Approved the move commit `f10a011d` at the Task 1.2 checkpoint.
- The design decisions are in design.md (Discussion rows 1–19).

**Controller rulings:**
1. Worked in the main checkout, with no separate worktree, because the untracked `.env*` files and the spec folder were needed.
2. Implementers did not commit (workflow rule 6). Reviews used working-tree diffs.
3. Added `name: coffee-shop-api` to `apps/api/docker-compose.yml`, so Compose keeps the existing project and volume.
4. The boot check starts Postgres via the dev override on 5433 and migrates from the host, because the prod compose file does not publish Postgres.
5. The merged-PR check is a grep for `merge_commit_sha }}^1` plus `turbo ls --affected` with the target tip, because a merge cannot be simulated on uncommitted work.
6. The nested-rules check ran through `claude -p`.
7. The plan's `pnpm api migration:list` does not exist. The check used `pnpm api exec mikro-orm migration:list` instead.
8. Accepted the transitive `es-toolkit` patch bump.
9. Accepted the Docker boot check on the Clerk-excluded route. The 200 on Clerk-protected routes is pending a valid local key.
10. Fixed the cheap Minor items in the final fix wave.
11. **Left `swagger.config.ts` unchanged**, because the Global Constraints allow no `src/` changes. As a result **the Swagger title is now `api`** (it is read from the package name). At Gate 2 the user chose to keep `api` for now; a follow-up is listed below.
12. Left `web/README.md` for phase 2.

## Known limitations and follow-ups

- **Swagger title is `api`:** `swagger.config.ts` reads the package name. Follow-up: set an explicit title (a `src/` change, so it is out of scope for phase 1).

- **Rebase merges into `main`:** with a rebase merge, `merge_commit_sha^1` covers only the last rebased commit. Keep rebase-merge disabled on the GitHub `main` (merge commits and squash merges are fine).
- **GitHub CI:** after this report, `ci.yml` was switched from `feat/coffee-shop-api` to `develop` (design Discussion rows 20–21), so PRs into `develop` run CI and merges into it deploy Render develop. First GitHub run on PR #1: quality, build-and-scan (Trivy) and push-develop all succeeded. GitHub Actions must be enabled on the repo, and `RENDER_SERVICE_ID` / `RENDER_API_KEY` must be set for the deploy job. Before that, the MR !4 re-baseline SQL must run on production.
- **Local env (untracked `apps/api/.env.docker`):**
  - a value contains a literal `$`, which Compose interpolates (the warning about an unset `tTszB`); escape it as `$$`;
  - `CLERK_PUBLISHABLE_KEY` is rejected as invalid.

  Both are pre-existing.
- **Claude Code memory:** sessions started in `apps/api` use a new memory directory. Root sessions keep the existing one. To carry the old `coffee-shop-api` memory over, copy `~/.claude/projects/-Users-tiennd0502gmail-com-training-AI-ai-training-coffee-shop-api/memory/` to the new project directory. This is optional; ask the user first.
