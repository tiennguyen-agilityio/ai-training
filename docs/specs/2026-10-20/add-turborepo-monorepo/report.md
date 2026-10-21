# Report: add-turborepo-monorepo — phase 2 (`refactor/turborepo-web`)

- Design: [design.md](design.md) · Plan: [plan.md](plan.md) (Phase 2, Tasks 2.1–2.6) · Test report: [test-report.md](test-report.md)
- Base: `ee8ad41c` (GitHub `develop`, phase 1 merged as PR #1). Commits: `283331a6` (move, approved at the Task 2.2 checkpoint), then the rest at the gate.
- Execution: Tasks 2.1–2.6 inline by the controller (small, fully specified, and Task 2.4 handles `.env`), then one independent whole-change review (opus).

## Verify

Last run: 2026-10-21 00:17 (GMT+7), on the final working tree. Details in [test-report.md](test-report.md).

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint | PASS | api 0 errors / 95 warnings; web 0 errors / 9 warnings (both unchanged, no `--fix`) |
| Build | PASS | api `nest build`; web `pnpm build:web` |
| Unit tests | PASS | api 24 files / 257; web 74 suites / 364 |
| E2E tests | PASS | `coffee_shop_test`; 5 files / 101 |
| Coverage | PASS | api and web totals equal to their baselines |
| format:check | PASS | api + web |
| actionlint | PASS | no output |

**Verdict: PASS**

## Phase 2 checks

| Check | Result |
| --- | --- |
| Move (Task 2.2) | 291 files: 290 R100, `README.md` R070 (the pre-commit hook ran Prettier on it, which Task 2.3 Step 3 does anyway) |
| Drift (Task 2.3) | Web direct dependencies: **NO DRIFT**. API direct dependencies: **NO DRIFT** (api importer differs only in peer suffixes, e.g. `jiti` 2.6.1 → 2.7.0). Web transitive: the `lint-staged@16` tree is gone, and `content-type`, `fast-uri`, `negotiator`, `proxy-addr`, `qs`, `@jridgewell/sourcemap-codec` now share the API's patch versions |
| Env for `next build` (Task 2.4) | Only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (build exit 0 with `.env` moved aside) |
| Affected (Task 2.4) | A web change affects `web` only, an API change affects `api` only (probed in a temporary worktree, because turbo adds uncommitted changes to `base...HEAD`) |
| `pnpm dev` (Task 2.6) | Dry run schedules `api#dev` and `web#dev` (both persistent). Ports 3000/3001 were taken by the user's running stack, so `PORT=3100 pnpm dev:api` was started instead: `POST /webhooks/clerk` → 400 |
| Pre-commit (Task 2.6) | lint-staged on staged files: web `.ts` got no semicolons, API `.ts` got semicolons |
| Web tests without `.env` | 74 suites / 364 tests pass |

## Plan review

The plan's phase 2 Git table was still unfilled; it now records `develop` @ `ee8ad41c`.

## Code review

The whole-change review (opus) found no Critical items and two Important ones:

1. A stray untracked `web/.next/` (written by a `next dev` still running from `web/` during the move) was not ignored at the root. **Fixed:** `.next` added to the root `.gitignore`. The leftover folder itself still needs deleting locally.
2. If the GitHub variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, `next build` fails in `quality` and the API deploy jobs are skipped. **Open (user action):** create the variable before pushing. No fail-fast step was added, because it would also block API-only changes.

Minor items:
- web tests without `.env`: run, pass (fixed);
- the plan Git table: filled in (fixed);
- `pre-push` defaulted to an outdated GitLab branch (from before phase 1), so it ran every package. **Fixed** by user request (design Discussion 22): it now defaults to `origin/develop`. When pushing to GitHub, use `TURBO_SCM_BASE=github/develop git push`. A missing ref still runs every package.

## Tests added

None. No `src/` or test file changed.

## Decisions

**User decisions:**
- Approved the move commit `283331a6`.

**Controller rulings:**
1. Base is GitHub `develop` (`ee8ad41c`), and the PR targets `develop`, because phase 1 landed there and GitLab was unreachable.
2. **Lockfile:** a plain `pnpm install` re-resolved 20 web direct dependencies upward (e.g. react 19.2.8 → 19.3.1). Instead, the old web lockfile's importer, packages and snapshots were grafted into the root lockfile, then `pnpm install --fix-lockfile` was run. A reviewer confirmed it with a frozen-lockfile check, and `turbo prune api --docker` stays frozen-clean.
3. **`turbo.json`:** `dev` and `start` get `"passThroughEnv": ["*"]`. Strict env mode dropped shell variables: `PORT=3100 pnpm dev:api` still bound 3000 and hit EADDRINUSE. Both tasks are uncached, so this has no cache cost. This resolves the phase 1 deferred item "turbo strict env mode".
4. **README:** `apps/web/README.md` was updated (paths, hooks line, removed `lint:fix` / `test:coverage`). The root README got an upgrade note for the web move.
5. **`pre-push` default base:** changed to `origin/develop` at the user's request, together with every doc that named the old training branch (design Discussion 22).
6. **Flaky test:** one e2e `afterAll` timeout in `product.e2e-spec.ts` was recorded as flaky (it passed alone and in two later full runs).
7. **Coverage:** one web coverage run showed a 1-branch drop in `useDebouncedUrlSearch.ts`. The final run matches the baseline, so no cause was assigned.

## Known limitations and follow-ups

- Create the GitHub Actions variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` before the PR's CI runs.
- **Local cleanup:**
  - delete `web/` (only `.next` remains);
  - restart `next dev` from `apps/web`. The running one returned 500 after `pnpm build:web` rewrote `apps/web/.next` under it.
- Swagger title `api` (from phase 1) is still open.

---

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
