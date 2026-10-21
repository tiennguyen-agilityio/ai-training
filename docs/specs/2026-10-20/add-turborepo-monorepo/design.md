# Add a Turborepo monorepo

**Date:** 2026-10-20
**Status:** Approved by the user on 2026-10-20 (builder check: 2 rounds, nothing left for the user)
**Branches:** `refactor/turborepo-api`, `refactor/turborepo-web`, `refactor/turborepo-shared-config` (one per phase, each merged into `develop`)

## Goal

Turn the repo into a pnpm workspace driven by Turborepo, so that:

- one `pnpm install` at the root sets up both apps and the git hooks;
- one set of git hooks lives at the root and works for every package;
- `turbo run <task>` builds, lints and tests both apps together, or one app, with caching;
- shared lint/format/TypeScript config lives in `packages/` instead of being copied per app;
- the API's Docker image, CI pipeline and Render deploy keep working.

## Current state (from the code)

| | `coffee-shop-api/` | `web/` (merged in MR !5, `5cb2eae5`) |
| --- | --- | --- |
| pnpm | 10.28.2, own `pnpm-lock.yaml` | 10.34.5, own `pnpm-lock.yaml` |
| Git hooks | husky via `prepare: cd .. && husky coffee-shop-api/.husky`; commit-msg (commitlint), pre-commit (lint-staged `*.ts`), pre-push (`build && test`) | none (removed in !5 because two `prepare` scripts fight over `core.hooksPath`) |
| Prettier | `singleQuote`, `trailingComma: all`, semicolons | `singleQuote`, `semi: false` |
| ESLint | flat config, `recommendedTypeChecked`, `eslint-plugin-prettier` | flat config, `next/core-web-vitals` via FlatCompat, `recommendedTypeChecked` + `stylisticTypeChecked`, `eslint-config-prettier` |
| tsconfig | `nodenext`, decorators, emits to `dist` | `bundler`, `jsx: preserve`, `noEmit`, `strict` |
| Scripts | `start:dev`, `lint` (**runs `--fix`**), `format`, `test:cov`, `test:e2e`, `migration:*`, `seeder:*`, `docker:*` | `dev`, `lint` (check only), `lint:fix`, `format`, `format:check`, `test:coverage`, `test:watch` |
| Docker | `Dockerfile` copies `package.json` + `pnpm-lock.yaml` from its own directory; compose files use `context: .` | none |
| CI | `.github/workflows/ci.yml`: lint, test, build, Docker build + Trivy, GHCR push, Render deploy; triggers on `coffee-shop-api/**` only | not in CI |
| Deploy | Render pulls the GHCR image | Vercel, not from this repo (out of scope) |

There is no root `package.json` and no root `.gitignore`. The only git remote is GitLab; `ci.yml` is GitHub Actions and triggers only on `feat/coffee-shop-api` and `main`, so MRs into `feat/claude-example` never run it. Claude Code config (`.claude/`, `CLAUDE.md`) and training docs (`docs/`) live inside `coffee-shop-api/`.

## Target layout

```text
ai-training/
├── apps/
│   ├── api/                 # was coffee-shop-api/ (git mv)
│   └── web/                 # was web/ (git mv)
├── packages/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── prettier-config/
├── docs/                    # was coffee-shop-api/docs/
├── .claude/                 # shared Claude Code config (workflow, agents, work-ticket)
├── .husky/
├── package.json             # name "coffee-shop", private, tooling devDependencies only
├── pnpm-workspace.yaml      # apps/*, packages/*
├── pnpm-lock.yaml           # the only lockfile
├── turbo.json
├── commitlint.config.cjs
├── .lintstagedrc.json       # prettier for packages/ and root files
├── .gitignore               # node_modules, .turbo, coverage, docs/reading/, .claude/settings.local.json
├── .dockerignore
├── CLAUDE.md
└── README.md
```

## Section 1: Workspace, tasks and scripts

**Package names:** `api`, `web`, `@repo/eslint-config`, `@repo/typescript-config`, `@repo/prettier-config`. Turbo filters, CI and the Dockerfile refer to these names.

**Versions:** pnpm `10.34.5` in the root `packageManager` (no pnpm 12 upgrade); Node 24 in root `engines` (matches CI and the Dockerfile); turbo `^2.11`. DevDependencies present in both apps share one version, **taken from the API** (user decision). The versions live in a pnpm catalog in `pnpm-workspace.yaml`, and both apps reference them as `"<name>": "catalog:"`. This lands in phase 3; until then each app keeps its own versions.

| Package | Catalog version (API) | Web today (installed) | Effect on web |
| --- | --- | --- | --- |
| `eslint` | `^9.18.0` | `^9` (9.39.5) | none, same install |
| `prettier` | `^3.4.2` | `^3.8.2` (3.9.6) | none, same install |
| `eslint-config-prettier` | `^10.0.1` | `^10.1.8` (10.1.8) | none, same install |
| `@eslint/eslintrc` | `^3.2.0` | `^3` (3.3.6) | none, same install |
| `typescript-eslint` | `^8.70.1` | `^8.58.1` (8.66.0) | minor bump |
| `@types/node` | `^24.0.0` | `^20` (20.19.43) | major bump, matches Node 24 in CI and Docker |
| `typescript` | `~6.0.3` | `^5` (5.9.3) | **major bump.** Next 15.5 declares no TypeScript peer range. Two known fixes, found in a scratch run: (1) TS 6 checks side-effect imports, so `import './globals.css'` in `src/app/layout.tsx` and `src/app/global-error.tsx` fails (TS2882); add `src/types/css.d.ts` with `declare module '*.css'` rather than turning the check off; (2) TS 6's DOM types add `scrollMargin` to `IntersectionObserver`, so the mock in `RoastDetailPageContent.test.tsx` needs it (TS2322). With both, `tsc`, `next build` and Jest (74 suites / 364 tests) pass |

`lint-staged` moves to the root at the API's `^17.3.0` (Section 3). `zod` is shared too but is a production dependency, so it stays out of the catalog.

**One script vocabulary in every app:** `dev`, `build`, `start`, `lint` (runs `eslint --fix`, as the API does today), `format`, `format:check`, `test`, `test:watch`, `test:cov`. For the API this means:

- `dev` runs `nest start --watch`; `start:dev` stays as an alias so compose files and docs keep working;
- `format:check` is added with the same globs as `format`: `prettier --check "src/**/*.ts" "test/**/*.ts"`.

For web, `lint` gains `--fix` (`eslint . --fix`), `lint:fix` is removed, and `test:coverage` becomes `test:cov`. Web's existing `format:check` (`prettier --check .`) already fails today on `pnpm-lock.yaml` and `README.md`; the plan adds `pnpm-lock.yaml` to `apps/web/.prettierignore` and formats `README.md` so the task starts green.

**`turbo.json` tasks:**

| Task | `dependsOn` | `outputs` | Cached |
| --- | --- | --- | --- |
| `build` | `^build` | `dist/**`, `.next/**`, `!.next/cache/**` | yes |
| `lint` | `^build` | — | no (it rewrites files with `--fix`) |
| `test` | `^build` | — | yes |
| `test:cov` | `^build` | `coverage/**` | yes |
| `format:check` | — | — | yes |
| `format` | — | — | no (it rewrites files) |
| `dev`, `start` | — | — | no, `persistent` |

Every root script that calls `turbo run <task>` needs that task defined here: turbo 2 fails on an undefined task ("Could not find task"). `test:e2e` is not a turbo task: it needs a database and truncates it first. Build-time env vars for web (`NEXT_PUBLIC_*`) are listed in the `build` task's `env`, and `build` sets `inputs: ["$TURBO_DEFAULT$", ".env*"]`, because `.env` files are gitignored and so left out of the default hash; without this a cached `.next` could carry stale values. Files that affect no package (root `docs/**`, `.claude/**`, root `README.md`) are kept out of `globalDependencies`.

**Root scripts:**

| Need | Command |
| --- | --- |
| All apps | `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm test:cov`, `pnpm format`, `pnpm format:check` (each is `turbo run <task>`) |
| One app, common task | `pnpm dev:api`, `pnpm dev:web`, `pnpm build:api`, `pnpm build:web`, `pnpm lint:api`, `pnpm lint:web`, `pnpm test:api`, `pnpm test:web`, `pnpm start:api`, `pnpm start:web` (each is `turbo run <task> --filter=<package>`) |
| One app, any script | `pnpm api <script>` / `pnpm web <script>` (= `pnpm --filter <package> <script>`), e.g. `pnpm api migration:up`, `pnpm api test:e2e`, `pnpm api docker:dev`, `pnpm web test:watch` |
| Only what changed | add `--affected`, e.g. `pnpm build --affected` |

Running scripts from inside an app directory (`cd apps/api && pnpm test`) keeps working.

## Section 2: Shared config packages (phase 3)

Only settings that are identical in both apps go into a shared base. Anything that differs becomes a per-app preset in the same package. Moving config must not change any format result, nor the API's lint or type-check result. Web's lint and type-check results are a known change, because web moves to the shared tool versions (Discussion rows 12 and 14).

- **`@repo/typescript-config`** (JSON, no build step):
  - `base.json`: options both apps set the same way today (`esModuleInterop`, `isolatedModules`, `resolveJsonModule`, `skipLibCheck`, `incremental`).
  - `nestjs.json`: extends base with the API-only options (`nodenext`, decorators, `declaration`, `target: ES2023`, `strictNullChecks`, `noImplicitAny: false`, and the rest).
  - `nextjs.json`: extends base with the web-only options (`bundler`, `jsx: preserve`, `noEmit`, `strict`, the `next` plugin, `lib: dom`).
  - Each app keeps its path-bound options: `outDir`, `rootDir`, `paths`, `include`, `typeRoots`.
- **`@repo/eslint-config`** (flat config, `.mjs`):
  - `base.mjs`: `@eslint/js` recommended and shared ignores.
  - `nest.mjs`: today's API config, unchanged.
  - `next.mjs`: today's web config, unchanged.
  - The plugins and `typescript` are `dependencies` of this package, so **both apps lint with one version** (user decision). The plugins are `typescript-eslint`, `@eslint/js`, `@eslint/eslintrc` (for `FlatCompat`), `eslint-config-next`, `eslint-plugin-prettier`, `eslint-config-prettier` and `globals`. Versions come from the catalog (Section 1): `typescript-eslint ^8.70.1` and `typescript ~6.0.3`, which the API lints cleanly with today.
  - `eslint` and `prettier` are `peerDependencies` of this package, with `devDependencies: "catalog:"`, so the plugins' peers always resolve to the catalog version rather than to whatever pnpm happens to deduplicate. `eslint` stays an app devDependency, also from the catalog.
  - Because the catalog moves web to TypeScript 6 as well, both apps build, type-check and lint with the same TypeScript.
  - `nest.mjs` and `next.mjs` export functions that take the app's `tsconfigRootDir`. `FlatCompat`'s `baseDirectory` is the package's own directory, where `eslint-config-next` is installed. Each app's `eslint.config.mjs` imports its preset and passes `tsconfigRootDir`. The apps then drop the lint packages they no longer import directly (`typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `@eslint/eslintrc`, `@eslint/js`, `globals`, `eslint-config-next`).
  - Checked in a scratch workspace by the reviewer: API 0 errors / 95 warnings and web 0 errors / 9 warnings, the same as today; `next/core-web-vitals` and `next/typescript` load from the package; no duplicate `@typescript-eslint` plugin; `next build` picks up the preset.
- **`@repo/prettier-config`**: one base, used as is or overridden, as in [Prettier's sharing guide](https://prettier.io/docs/sharing-configurations):

  | Where | Config | Style |
  | --- | --- | --- |
  | `packages/prettier-config/index.mjs` | base `{ singleQuote: true, trailingComma: 'all' }` (`'all'` is already Prettier 3's default, so web formats this way today) | — |
  | `apps/api/package.json` | `"prettier": "@repo/prettier-config"` | base as is (semicolons) |
  | `apps/web/prettier.config.mjs` | `{ ...base, semi: false }` | override |
  | root `package.json` | `"prettier": "@repo/prettier-config"` | base, for `packages/**` and root files |

  - Prettier resolves the nearest config upward from each file. Files outside the apps would otherwise fall back to Prettier's defaults, which is why the root points at the base. There is no separate root config file.
  - The root and both apps list the package as a `workspace:*` devDependency, so turbo sees the dependency and a base change invalidates the apps' tasks; no `globalDependencies` entry is needed.
  - These replace the apps' `.prettierrc` files. Each app keeps its own `.prettierignore`, because Prettier reads it only from the working directory.
  - Unifying the two styles is a later task.

**Proof.** Capture these before the move and compare after:

- `tsc --showConfig` per app: identical (this checks the config itself, not the type-check result);
- `eslint --print-config` on representative files (API: a controller, an entity, a spec; web: a page, a component, a test): the rule set is identical. Only plugin versions may differ; for web, `typescript-eslint` moves from 8.66 to 8.70 or later;
- API lint and type check: unchanged (0 errors, 95 warnings at the time of writing);
- web lint and type check: known change. Web was 0 errors and 9 warnings. The two known TypeScript 6 errors (Section 1) are fixed in phase 3; any other new finding is listed in the phase report, errors are fixed in that phase, and warnings are recorded;
- the `prettier --list-different` file list per app is the same before and after (both apps already have files that fail `--check` today, so "passes" is not the bar).

## Section 3: Git hooks at the root

One `.husky/` at the root. `husky`, `lint-staged` and `@commitlint/cli` + `@commitlint/config-conventional` are root devDependencies, and the root `prepare` script runs `husky`. No app has husky or a `prepare` script.

| Hook | Runs | Scope |
| --- | --- | --- |
| `commit-msg` | `commitlint --edit` (root `commitlint.config.cjs`) | every commit |
| `pre-commit` | `lint-staged` from the root | staged files only. Each file uses the closest lint-staged config, and the tasks run in that config's directory (see below) |
| `pre-push` | `turbo run build test --affected` | affected packages only |

**lint-staged configs.** lint-staged skips a staged file that has no config above it, so every area gets one:

| Area | Config | Runs on staged files |
| --- | --- | --- |
| `apps/api/**` | `apps/api/package.json` (today's) | `*.ts`: `eslint --fix`, `prettier --write` |
| `apps/web/**` | `apps/web/package.json` (today's) | `*.{js,jsx,ts,tsx}`: `eslint --fix`, `prettier --write`; `*.{css,md,json}`: `prettier --write` |
| `packages/**` and root files | root `.lintstagedrc.json` | `*.{js,mjs,cjs,json,yml,yaml}`: `prettier --write` |

- The root config runs Prettier only. The config packages and root files have no ESLint config of their own, so ESLint would fail there with "no config found".
- It leaves `*.md` alone: root `docs/` and `.claude/` are not Prettier-formatted today, so formatting them would rewrite whole files on any small edit.
- These files are formatted with the shared base through the root `package.json` `"prettier"` field (Section 2). In phase 1, before the package exists, the field holds the base inline: `{ "singleQuote": true, "trailingComma": "all" }`. `prettier` becomes a root devDependency (from the catalog in phase 3).

**What counts as affected:** turbo compares the files changed between the base ref and `HEAD`.

| Change | pre-push builds and tests |
| --- | --- |
| only `apps/api/**` | API |
| only `apps/web/**` | web |
| `packages/**` | both apps (both depend on the shared packages) |
| root `turbo.json` or `package.json` | both apps |
| `pnpm-lock.yaml` | packages whose resolved dependencies changed (to be confirmed by a test in the plan) |
| only `docs/**`, `.claude/**`, root `README.md` | nothing |

- **Base ref:** the hook sets `TURBO_SCM_BASE=origin/develop` unless it is already set, so `TURBO_SCM_BASE=origin/main git push` compares against another branch. Turbo looks at everything changed on the branch, not just the commits being pushed; work that already ran comes from the cache.
- **Missing base ref:** turbo does not fall back on its own. With an unknown base it exits 1 ("Unable to query SCM"), which would block the push. The hook therefore checks `git rev-parse --verify --quiet "$TURBO_SCM_BASE^{commit}"` first; if that fails, it prints a warning and runs `turbo run build test` without `--affected`. The hook does not fetch.
- **`.turbo/` must be ignored:** turbo writes `<package>/.turbo/turbo-<task>.log`, and an untracked file inside a package marks it affected. The root `.gitignore` lists `.turbo`; otherwise every push would count the API as affected.
- **No lint or e2e in pre-push:** lint already ran on staged files in pre-commit, and e2e needs a database.
- **Where lint runs:** CI has no lint step (user decision, Discussion row 18). Lint runs only in pre-commit (staged files, `eslint --fix`; an unfixable error blocks the commit) and by hand (`pnpm lint`, the `verify` skill). Two cases are therefore not caught: a commit made with `--no-verify` (forbidden by `docs/conventions/git.md`), and a rule change in `@repo/eslint-config`, which does not re-lint untouched files. Any change to `@repo/eslint-config` must run `pnpm lint` for both apps as part of its verify.

## Section 4: Docker and CI

**API Dockerfile** (`apps/api/Dockerfile`, build context = repo root):

| Stage | Does |
| --- | --- |
| `base` | `node:24-alpine`, `corepack enable` (pnpm version from the root `packageManager`), the existing `apk upgrade` line |
| `pruner` | `pnpm dlx turbo@<root turbo version> prune api --docker` (turbo pinned to the root version). Produces `out/json/` (package manifests, `pnpm-workspace.yaml`, pruned `pnpm-lock.yaml`), `out/pnpm-lock.yaml` and `out/full/` (sources) |
| `deps` | copies `out/json/`, runs `pnpm install --frozen-lockfile --ignore-scripts` (`--ignore-scripts` keeps the root husky `prepare` out of the image). This layer is rebuilt only when the API's dependencies change |
| `development` | copies `out/full/`, `WORKDIR /app/apps/api`, runs `start:dev`; used by `docker:dev` |
| `build` | `turbo run build --filter=api` |
| `production` | copies `out/json/`, runs `pnpm --filter api install --frozen-lockfile --prod --ignore-scripts`, copies `apps/api/dist`, `USER node`, `WORKDIR /app/apps/api`, `CMD ["node", "dist/main"]` |

The `--filter` in the production stage matters: a plain `pnpm install --prod` on the pruned workspace also installs the `dependencies` of every workspace package in it, including the dev-only config packages (verified in a scratch workspace). With the filter, the production image holds only the API's production dependencies and `dist`. The Trivy scan stays. A root `.dockerignore` excludes `**/node_modules`, `**/dist`, `**/.next`, `**/.env*`, `**/coverage` and `.git`.

**docker-compose:**

- The compose files stay in `apps/api` with `context: ../..` and `dockerfile: apps/api/Dockerfile`.
- The dev compose file mounts `./src` to `/app/apps/api/src` for hot reload, instead of mounting the whole directory. A dependency change needs a container rebuild; the API README says so.

**CI** (`.github/workflows/ci.yml`):

- **Triggers:** add `apps/**`, `packages/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json` and the workflow file. The develop branch is `develop` (it replaced `feat/coffee-shop-api` in every trigger and condition; Discussion rows 20–21); `main` stays the production branch.
- **`quality` job** (replaces `test`, keeps its `if:` guard that skips PRs closed without merging):
  - `fetch-depth: 0`, pnpm from `packageManager`, Node 24, pnpm cache keyed on the root lockfile;
  - `pnpm install --frozen-lockfile`, then `turbo run test build --affected`. There is no lint step: today's `Lint` step is removed (user decision; see Section 3, "Where lint runs");
  - outputs `api_affected`, computed from `turbo ls --affected`.
- **Base ref, set explicitly per event** (turbo's own guess from `GITHUB_BASE_REF` is wrong here):

  | Event | `TURBO_SCM_BASE` |
  | --- | --- |
  | PR opened / synchronized | `github.event.pull_request.base.sha` |
  | PR closed + merged | `<merge_commit_sha>^1` |
  | push | `github.event.before` |

  On a merged PR, turbo's default base is `main`, which already contains the merge, so nothing counts as affected. `push-production` and `deploy-production` would then be skipped and **production deploys would silently stop** (reproduced by the reviewer). If the chosen base is all zeros (new branch) or not reachable (force-push), the job falls back to running every package, like the pre-push hook.
- **Docker jobs** (`build-and-scan`, `push-develop`, `push-production`): run only when `api_affected` is true, with `context: .` and `file: apps/api/Dockerfile`. `api_affected` is also forced to true when `.github/workflows/**` or the root `.dockerignore` changed, because turbo does not count those files for any package (user decision).
- **Render deploy jobs:** unchanged (Render pulls the GHCR image).
- **No turbo remote cache.**
- **Web build in CI (phase 2):** Clerk checks the publishable key at build time, so CI needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as a GitHub Actions variable or secret. Other `NEXT_PUBLIC_*` values can be placeholders. The plan confirms the exact required set by building web with only the real Clerk key.

**Vercel (out of scope, notes only):** Root Directory `apps/web`, Build Command `turbo run build --filter=web`, install from the root.

## Section 5: Claude Code config and docs

| Now (`coffee-shop-api/…`) | After | Notes |
| --- | --- | --- |
| `CLAUDE.md` | split into root `CLAUDE.md` (monorepo overview, root commands, git workflow, hooks, CI) and `apps/api/CLAUDE.md` (API architecture, API commands, e2e) | "Repository layout" rewritten for `apps/` + `packages/` |
| `.claude/rules/workflow.md` | root `.claude/rules/workflow.md` | save paths point to the root `docs/specs/…`; the coverage steps call `apps/api/.claude/skills/verify/coverage-diff.mjs` from `apps/api` with a `../../docs/specs/…` path, because the script resolves paths against the working directory |
| `.claude/rules/coding.md`, `testing.md` | `apps/api/.claude/rules/` | keep `paths: src/**`, relative to `apps/api` |
| `.claude/skills/verify/` | `apps/api/.claude/skills/verify/` | "Run from" becomes `apps/api/`; its lint gate keeps calling `eslint` directly without `--fix`, so it observes instead of rewriting |
| `.claude/skills/work-ticket/`, `.claude/agents/*`, `.claude/templates/` | root `.claude/` | update "code lives in `coffee-shop-api/`", "run commands from", and `plan-reviewer.md`'s "PLAN.md in `coffee-shop-api/`, then one level up" lines |
| `docs/` | root `docs/` | `git mv`; existing specs keep their paths under `docs/specs/` |
| `.husky/`, `commitlint.config.cjs` | root | see Section 3 |
| `README.md` | stays as `apps/api/README.md`; new root `README.md` gives the monorepo overview | fix `cd ai-training/coffee-shop-api` lines |

Phase 2 adds a short `apps/web/CLAUDE.md` (commands, structure, env vars).

**Unverified: nested rules.** It is not confirmed that Claude Code, started at the root, loads `apps/api/.claude/rules/*` when working on files in `apps/api/src`. Nested skills are supported (skills are listed with a directory prefix). The plan checks this: start Claude at the root, open a file in `apps/api/src`, and confirm the `coding` rule is in context. If it is not loaded, move `coding.md` and `testing.md` to the root `.claude/rules/` with `paths: apps/api/src/**`, and keep the API-specific guidance in `apps/api/CLAUDE.md`.

**Claude Code memory** is keyed on the directory a session starts in. Sessions started in `apps/api` get a new memory directory and do not see the old `coffee-shop-api` one. The plan notes this, with an optional step to copy the memory files across.

## Phases

Each phase is its own branch and MR/PR into `develop`, and leaves the repo green.

| # | Branch | Scope | Can start when |
| --- | --- | --- | --- |
| 1 | `refactor/turborepo-api` | root workspace + `turbo.json` + root `.gitignore`; `git mv coffee-shop-api apps/api`; root hooks; API script vocabulary; prune-based Dockerfile, compose and CI for the API; Section 5 moves | now (MRs !4 and !5 are merged) |
| 2 | `refactor/turborepo-web` | `git mv web apps/web`; join the workspace (drop its lockfile); web script vocabulary; web in CI; `apps/web/CLAUDE.md` | phase 1 is merged |
| 3 | `refactor/turborepo-shared-config` | Section 2 packages and their proof; the pnpm catalog for shared devDependencies (web moves to TypeScript 6 and `@types/node` 24) | phase 2 is merged |

**Between phases 1 and 2,** `web/` stays outside the workspace with its own lockfile and no CI, as it is today. Once a root `pnpm-workspace.yaml` exists, a plain `pnpm install` inside `web/` installs the root workspace instead and creates no `web/node_modules`, so web needs `cd web && pnpm install --ignore-workspace`. With that, the root pre-commit lints staged web files through web's own lint-staged config. Pre-push does not build or test web in this window, because turbo only sees workspace packages.

**Rules that apply to every phase:**

- Directory moves are `git mv` in a commit of their own with no content edits, so `git log --follow` and `git blame` keep the history.
- Before changing code, take the coverage baseline required by the workflow. Phase 3 also saves the `--showConfig` / `--print-config` output.
- Each phase ends with `verify`, code review, `report.md` and its own MR.
  - Phase 1 also checks: a local Docker build of the `production` target, `docker:dev` hot reload, and the CI workflow. The workflow is linted with `actionlint`, and the `quality` job's commands are run locally; the real CI run happens when the change reaches the GitHub repo (`feat/coffee-shop-api` or `main`).
  - Phase 2 also checks: the web build in CI, and **dependency drift**. pnpm cannot merge web's lockfile into the workspace, so every web dependency not already in the root lockfile resolves fresh, to the newest version its range allows. Save `pnpm ls --depth 0 --json` for web before dropping its lockfile, compare after joining, and record changed direct dependencies in the phase report. Pin a direct dependency only if build, test or lint breaks.
- The README re-baseline SQL from MR !4 must run on the production database before the first merge into `feat/coffee-shop-api` or `main`. Merging into `feat/claude-example` deploys nothing (CI does not trigger there), so it is not a phase 1 step.

## Out of scope

- Vercel setup for web.
- Unifying Prettier/ESLint style.
- Aligning production dependency versions (e.g. `zod`), or devDependencies that only one app uses.
- Turborepo remote cache.
- pnpm major upgrade.
- An `/orders` API endpoint or the mocked checkout in web.

## Discussion

| # | Question | Answer (user) | Decision / impact |
| --- | --- | --- | --- |
| 1 | Scope of this task? | Full | Includes `apps/` rename, shared config packages and web in CI |
| 2 | Where does Vercel deploy web from? | Not from this repo yet, later | Vercel is out of scope; the design only records the monorepo settings |
| 3 | Where do `.claude/`, `CLAUDE.md`, `docs/` go? | Shared parts at the root, API keeps its own | Section 5 table |
| 4 | What does pre-push run? | Affected packages only | `turbo run build test --affected` with a configurable base ref |
| 5 | How does the shared Prettier config handle the style difference? | Shared base, each app keeps its style | No reformat; web overrides `semi: false` |
| 6 | Docker build with a root lockfile? | `turbo prune --docker` | Section 4 Dockerfile stages |
| 7 | Do the scripts cover running everything and running one app? | Yes, and the user wants `pnpm dev:web` / `pnpm build:web` style shortcuts | One script vocabulary per app; root `:api` / `:web` shortcuts plus `pnpm api|web <script>` |
| 8 | Does pre-push test only the app that changed, and both when `packages/` changes? | Confirmed as the intended behaviour | "What counts as affected" table |
| 9 | Why not add the apps one at a time (API first, web later)? | Agreed: three phases | Phases table; three branches and MRs |
| 10 | Web is already merged; merge phases 1 and 2 into one branch? | Keep three phases | Phase 2 needs `pnpm install --ignore-workspace` in `web/` until it joins the workspace |
| 11 | How is CI checked in phase 1, with only a GitLab remote? | `actionlint` plus the job commands run locally | Real CI run happens when the change reaches GitHub |
| 12 | One `typescript-eslint` / `typescript` version for linting both apps? | Yes, unify | Plugins and lint-time `typescript` live in `@repo/eslint-config` (`^8.70.1` / `~6.0.3`); web lint findings may change and are reported |
| 13 | Build and scan the API image when only `.github/**` or `.dockerignore` changes? | Yes | `api_affected` is forced to true for those paths |
| 14 | (User request) Which version wins for shared devDependencies? | The API's | pnpm catalog in phase 3; web moves to TypeScript 6 and `@types/node` 24 and must pass build, type check and tests; `zod` (production) excluded |
| 15 | Do the hooks have a config for web, API and the shared packages? | Raised by the user; design had a gap (staged files in `packages/` and at the root matched no lint-staged config) | Root `.lintstagedrc.json` (Prettier only, no `*.md`); apps keep their own lint-staged configs |
| 16 | Is a root `prettier.config.mjs` right? Why not a base in `packages/` that `api/` and `web/` override? | Base in `packages/`, apps override | No root config file: root and API point at `@repo/prettier-config` via the `"prettier"` field, web spreads it with `semi: false`. Turborepo's official examples keep Prettier at the root with no prettier-config package; a shared package is Prettier's documented sharing pattern and keeps package boundaries |
| 17 | Package names: is the `@coffee-shop` scope right? | Use the Turborepo convention | Shared packages are `@repo/eslint-config`, `@repo/typescript-config`, `@repo/prettier-config`; apps are unscoped `api` and `web` (e.g. `--filter=api`). The root package stays `coffee-shop` |
| 18 | API `lint` runs `--fix`, web does not: which way to unify? | Both apps: one `lint` script with `--fix`, no `lint:fix`; remove the lint step from CI | Web `lint` gains `--fix` and drops `lint:fix`; turbo `lint` is not cached; CI `quality` runs `test build` only; lint runs in pre-commit and by hand. Not caught: `--no-verify` commits and `@repo/eslint-config` rule changes on untouched files |
| 19 | `next build` lints web by default; keep it, or set `eslint.ignoreDuringBuilds`? | Keep it | CI still lints web through `next build` (no `--fix`, errors fail the build); the API is not linted in CI |
| 20 | (User request, after phase 1) CI does not run for PRs into `feat/claude-example`; replace `feat/coffee-shop-api` with `feat/claude-example`? | Replace everywhere in `ci.yml` | Push/PR triggers, `push-develop` and `deploy-develop` all key on `feat/claude-example`: a PR into it runs quality, build-and-scan and push-develop (GHCR `:develop`); a push or merge into it also deploys Render develop (needs `RENDER_SERVICE_ID` / `RENDER_API_KEY` on the GitHub repo) |
| 21 | (User request) Use `develop` instead of `feat/claude-example` as the CI develop branch, and open PRs into `develop` | Yes | `ci.yml` keys push/PR triggers, `push-develop` and `deploy-develop` on `develop` (on GitHub, at the same commit as `feat/claude-example`, 5cb2eae5); PR #1 retargeted to `develop` |
| 22 | (User request, during phase 2) Drop `feat/claude-example` from the docs: MRs and PRs go into `develop` from now on | Yes | `develop` is the base and target for phases 2–3, `workflow.md`, `/work-ticket`, `git.md`, `CLAUDE.md`; `pre-push` defaults to `origin/develop`. Phase 1 facts (its base commit and executed steps) are kept as history |

Answered by the code (not asked):

- Two husky `prepare` scripts set one `core.hooksPath`, so the last install wins — `coffee-shop-api/package.json`, `web/package.json` at `8271e3cc`
- API `lint` runs `--fix`; web `lint` does not — `coffee-shop-api/package.json`, `web/package.json`
- Prettier and ESLint setups differ between the apps — `coffee-shop-api/.prettierrc`, `web/.prettierrc`, both `eslint.config.mjs`
- The Dockerfile and compose files read `package.json` and `pnpm-lock.yaml` from `coffee-shop-api/` — `coffee-shop-api/Dockerfile`, `coffee-shop-api/docker-compose.yml`
- CI triggers only on `coffee-shop-api/**` and builds Docker with `context: ./coffee-shop-api` — `.github/workflows/ci.yml`
- Render deploys by pulling the GHCR image — `.github/workflows/ci.yml` deploy jobs
- lint-staged picks the closest config per staged file and runs tasks in that config's directory — `node_modules/lint-staged/README.md` ("How to use lint-staged in a multi-package monorepo?")
- Latest versions at the time of writing: turbo 2.11.9, husky 9.1.7, lint-staged 17.6.0, @commitlint/cli 21.2.4, pnpm 12.14.0 — `npm view`
- MRs !4 and !5 are merged into `feat/claude-example` (`aa068a88`, `5cb2eae5`) — `git log origin/feat/claude-example`
- The only remote is GitLab; `ci.yml` runs on GitHub for `feat/coffee-shop-api` / `main` only — `git remote -v`, `.github/workflows/ci.yml`
- turbo 2.11.9 + pnpm 10.34.5, checked in a scratch workspace by the spec reviewer:
  - an unknown `TURBO_SCM_BASE` makes `--affected` exit 1;
  - an undefined task fails `turbo run`;
  - on a merged PR the default base `main` yields zero affected packages;
  - an untracked file in a package marks it affected;
  - `pnpm install --prod` on a pruned workspace installs every workspace package's `dependencies`, while `--filter <app>` does not;
  - `turbo prune --docker` writes `pnpm-workspace.yaml` and the pruned lockfile into `out/json/`;
  - `pnpm install` inside a non-member directory installs the root workspace.
- With the shared eslint-config, the catalog and web on TypeScript 6 (scratch run, round 2):
  - lint counts are unchanged in both apps;
  - web needs the two TypeScript 6 fixes, after which `tsc`, `next build` and Jest pass;
  - web's tsconfig uses nothing TypeScript 6 removed;
  - `turbo prune --docker` keeps the `catalog:` block, and both frozen installs (full and `--filter --prod`) exit 0.
- `prettier --check` already fails today in both apps (API: lockfile, docs, snapshot, `eslint.config.mjs`; web: lockfile, `README.md`) — reviewer run
- `coverage-diff.mjs` resolves paths against the working directory — `coffee-shop-api/.claude/skills/verify/coverage-diff.mjs`
- Several Claude config files and docs hardcode `coffee-shop-api/` — `.claude/agents/*.md`, `.claude/skills/verify/SKILL.md`, `.claude/skills/work-ticket/SKILL.md`, `docs/conventions/git.md`, `CLAUDE.md`, `README.md`
