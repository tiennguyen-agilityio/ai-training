# Add a Turborepo monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the repo into a pnpm workspace driven by Turborepo: `apps/api`, `apps/web` and shared `@repo/*` config packages, one set of root git hooks, and the API's Docker/CI/Render pipeline still working.

**Architecture:** The plan has three phases, each with its own branch and MR/PR into `develop`, and each leaves the repo green:

1. the root workspace plus the API, with hooks, Docker and CI;
2. web joins the workspace;
3. the shared config packages and a pnpm catalog.

Directory moves are `git mv` commits with no content edits, so history follows the files.

**Tech Stack:** pnpm 10.34.5 workspaces + catalog, Turborepo 2.11, husky 9, lint-staged 17, commitlint 21, Docker (`turbo prune --docker`), GitHub Actions, NestJS 12 / Vitest (API), Next.js 15 / Jest (web).

**Spec:** `docs/specs/2026-10-20/add-turborepo-monorepo/design.md` (in `coffee-shop-api/` until Task 1.2 moves `docs/` to the root)

## Git

| | Phase 1 | Phase 2 | Phase 3 |
| --- | --- | --- | --- |
| Base branch | `feat/claude-example` (history) | `develop` | `develop` |
| Base commit | `5cb2eae5` — Merge branch 'feat/add-web-nextjs-frontend' into 'feat/claude-example' (2026-10-20) | `ee8ad41c` — Merge pull request #1 from tiennguyen-agilityio/refactor/turborepo-api (2026-10-20) | `develop` after phase 2 is merged (fill in at phase start) |
| Feature branch | `refactor/turborepo-api` | `refactor/turborepo-web` | `refactor/turborepo-shared-config` |
| MR target | `develop` (GitHub PR #1) | `develop` | `develop` |

- From phase 2 on, every phase branches from and targets `develop` (design Discussion 22). Phase 1 was merged into `develop` as GitHub PR #1; its base column is kept as history.
- Fetch `develop` from the remote that hosts the PR before creating a branch (currently `github`; GitLab `origin` was unreachable during phase 2).
- `git branch -a --list '*turborepo*'` returned nothing, so all three names are free.

## Global Constraints

- pnpm `10.34.5` in the root `packageManager`, with no pnpm major upgrade. Node `>=24`. turbo `^2.11.9`. (spec §1)
- Package names: `api`, `web`, `@repo/eslint-config`, `@repo/typescript-config`, `@repo/prettier-config`. The root package is `coffee-shop`. (spec §1, Discussion 17)
- Script vocabulary in every app: `dev`, `build`, `start`, `lint` (runs `eslint --fix`), `format`, `format:check`, `test`, `test:watch`, `test:cov`. There is no `lint:fix`. (spec §1, Discussion 18)
- `test:e2e` is never a turbo task. It runs only against a database whose name ends in `_test` (`.claude/rules/testing.md`; verify skill guard).
- CI has no lint step; `next build` keeps linting web. (Discussion 18, 19)
- Shared devDependencies use the API's version through the pnpm catalog, starting in phase 3. Production dependencies (e.g. `zod`) stay out of the catalog. (Discussion 14)
- Prettier: one base in `@repo/prettier-config`. The API and the root use it as is; web adds `semi: false`. There is no separate root Prettier config file. (Discussion 16)
- No rule, style or app behaviour changes beyond what the spec lists. Moving config must not change the API's lint/type-check result or any format result. (spec §2)
- No source code changes in `src/` except the two TypeScript 6 fixes in web (phase 3). ESM relative imports keep their `.js` extension (`.claude/rules/coding.md`).
- Tests are not weakened: no `.skip`/`.only`, no removed `expect(`, no edited expected values, no vitest/jest config narrowing (verify skill checklist; `.claude/rules/testing.md`).
- Never `--no-verify`. Fix the hook failure instead (`docs/conventions/git.md`).
- Tasks end at "run the checks, expect PASS". Commits happen only with user approval (workflow rule 6). The `git mv` checkpoints below are user-approved commits made on purpose, because the spec requires each move to be committed alone.

## Review Focus

These failure modes are implied by the spec, but no app test covers them. Each one is pinned by a check in the owning task.

1. **A merged PR into `main` must still build and deploy the API image.** CI must resolve the base as `merge_commit_sha^1`, so `api_affected` is true (Task 1.6, step "Simulate the merged-PR base").
2. **A push from a clone without the base ref must not be blocked.** `pre-push` falls back to running every package with a warning (Task 1.4, step "Missing base ref").
3. **The production image must boot and hold no devDependencies:** no `typescript`, `eslint`, `turbo` or config packages in `node_modules` (Task 1.5, steps "Image contents" and "Boot").
4. **Joining the workspace must not silently change installed versions.** For the API in phase 1, `pnpm ls --depth 0` must be identical. For web in phase 2, drift is recorded (Tasks 1.3 and 2.3).
5. **Turbo's strict env mode must not hide variables tasks need.** The unit-test and build results through `turbo run` must match the direct `pnpm` runs (Task 1.3, step "Turbo vs direct"; Task 2.4, web build).

---

## File structure

```text
ai-training/
├── package.json             # Task 1.3 (root scripts, tooling devDeps, "prettier" field)
├── pnpm-workspace.yaml      # Task 1.3 (packages); Task 3.1 (catalog)
├── pnpm-lock.yaml           # Task 1.3 (from the API lockfile)
├── turbo.json               # Task 1.3
├── .gitignore               # Task 1.3
├── .prettierignore          # Task 1.4
├── .lintstagedrc.json       # Task 1.4
├── commitlint.config.cjs    # Task 1.2 (moved), unchanged
├── .husky/                  # Task 1.2 (moved), Task 1.4 (rewritten)
├── .dockerignore            # Task 1.5
├── .github/workflows/ci.yml # Task 1.6; Task 2.4 (web env)
├── CLAUDE.md                # Task 1.7 (new); Task 2.5
├── README.md                # Task 1.7; Task 2.5
├── .claude/                 # Task 1.2 (moved), Task 1.7 (paths)
├── docs/                    # Task 1.2 (moved), Task 1.7 (git.md)
├── apps/
│   ├── api/                 # Task 1.2 (moved); 1.3 scripts; 1.5 Dockerfile + compose; 1.7 CLAUDE.md, .claude/, README
│   └── web/                 # Task 2.2 (moved); 2.3 scripts; 2.5 CLAUDE.md; 3.1 TS 6 fixes
└── packages/
    ├── typescript-config/   # Task 3.2
    ├── prettier-config/     # Task 3.3
    └── eslint-config/       # Task 3.4
```

---

# Phase 1: workspace + API (`refactor/turborepo-api`)

### Task 1.1: Branch, coverage baseline, pre-move snapshots

**Files:**
- Create: `coffee-shop-api/docs/specs/2026-10-20/add-turborepo-monorepo/coverage-baseline.json`
- Create (scratch, not committed): `$SCRATCH/api-ls-before.json`, `$SCRATCH/api-lint-before.txt`

**Interfaces:**
- Produces: the baseline file (Task 1.8 diffs against it), `api-ls-before.json` (Task 1.3 compares against it), and the API lint count (Task 1.8).

- [ ] **Step 1: Create the branch**

```bash
cd /Users/tiennd0502gmail.com/training/AI/ai-training
git status --short          # expect only the untracked docs/specs/2026-10-20/ folder
git fetch origin feat/claude-example   # may fail without SSH agent access; then use the local origin ref
git checkout -b refactor/turborepo-api 5cb2eae5
```

- [ ] **Step 2: Coverage baseline (workflow rule 7)**

```bash
cd coffee-shop-api
pnpm run test:cov --coverage.reporter=json-summary --coverage.reporter=text-summary
node .claude/skills/verify/coverage-diff.mjs snapshot docs/specs/2026-10-20/add-turborepo-monorepo/coverage-baseline.json
```

Expected: 24 files, 257 tests passed, and the snapshot file is written.

- [ ] **Step 3: Snapshot the installed API versions and lint count**

`$SCRATCH` is the session scratchpad directory.

```bash
pnpm ls --depth 0 --json > "$SCRATCH/api-ls-before.json"
pnpm exec eslint "{src,apps,libs,test}/**/*.ts" 2>&1 | tail -1 | tee "$SCRATCH/api-lint-before.txt"
```

Expected: `✖ 95 problems (0 errors, 95 warnings)`.

### Task 1.2: Move the API and the shared files (git mv only)

**Files:**
- Move: `coffee-shop-api/` → `apps/api/`
- Move: `apps/api/docs/` → `docs/`
- Move: `apps/api/.husky/` → `.husky/`
- Move: `apps/api/commitlint.config.cjs` → `commitlint.config.cjs`
- Move: `apps/api/.claude/rules/workflow.md` → `.claude/rules/workflow.md`
- Move: `apps/api/.claude/skills/work-ticket/` → `.claude/skills/work-ticket/`
- Move: `apps/api/.claude/agents/` → `.claude/agents/`
- Move: `apps/api/.claude/templates/` → `.claude/templates/`
- Stays: `apps/api/.claude/rules/{coding,testing}.md`, `apps/api/.claude/skills/verify/`, `apps/api/CLAUDE.md`, `apps/api/README.md`

**Interfaces:**
- Produces: the target layout. Every later task uses these paths.

- [ ] **Step 1: Move**

```bash
cd /Users/tiennd0502gmail.com/training/AI/ai-training
mkdir -p apps .claude/rules .claude/skills
git mv coffee-shop-api apps/api
git mv apps/api/docs docs
git mv apps/api/.husky .husky
git mv apps/api/commitlint.config.cjs commitlint.config.cjs
git mv apps/api/.claude/rules/workflow.md .claude/rules/workflow.md
git mv apps/api/.claude/skills/work-ticket .claude/skills/work-ticket
git mv apps/api/.claude/agents .claude/agents
git mv apps/api/.claude/templates .claude/templates
```

`git mv` of a directory renames it on disk, so untracked and ignored files move with it (`.env*`, `node_modules`, `dist`, and this untracked spec folder).

- [ ] **Step 2: Check the move**

```bash
git status --short | grep -v '^R ' | head      # expect: only "?? docs/specs/2026-10-20/"
ls docs/specs/2026-10-20/add-turborepo-monorepo  # expect: design.md plan.md coverage-baseline.json
ls apps/api/.env apps/api/.env.test             # expect: both exist
git diff --cached -M --stat | tail -1           # expect: only renames, "0 insertions(+), 0 deletions(-)"
```

`core.hooksPath` still points at `coffee-shop-api/.husky/_`, which no longer exists, so git runs no hooks until Task 1.4. That is expected for this commit.

- [ ] **Step 3: 🛑 Checkpoint (user approval): commit the move alone**

Show `git diff --cached -M --stat` and ask the user to approve this commit:

```bash
git commit -m "refactor: move coffee-shop-api to apps/api and shared files to the root"
```

From here on, run Claude Code and every command from the repo root, unless a step says `cd apps/api`. The old `coffee-shop-api/` working directory is gone.

### Task 1.3: Root workspace, turbo and the API script vocabulary

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`
- Move + edit: `apps/api/pnpm-lock.yaml` → `pnpm-lock.yaml`
- Modify: `apps/api/package.json` (name, scripts, devDependencies, `packageManager`)
- Modify: `apps/api/.gitignore` (drop `/docs/reading/`)

**Interfaces:**
- Consumes: the Task 1.1 `api-ls-before.json`.
- Produces: root scripts `dev build start lint format format:check test test:cov`, `dev:api build:api lint:api test:api start:api`, `api`; turbo tasks of the same names; package name `api`.

- [ ] **Step 1: Root `package.json`**

```json
{
  "name": "coffee-shop",
  "private": true,
  "packageManager": "pnpm@10.34.5",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "prepare": "husky",
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "format": "turbo run format",
    "format:check": "turbo run format:check",
    "test": "turbo run test",
    "test:cov": "turbo run test:cov",
    "dev:api": "turbo run dev --filter=api",
    "build:api": "turbo run build --filter=api",
    "lint:api": "turbo run lint --filter=api",
    "test:api": "turbo run test --filter=api",
    "start:api": "turbo run start --filter=api",
    "api": "pnpm --filter api"
  },
  "devDependencies": {
    "@commitlint/cli": "^21.2.2",
    "@commitlint/config-conventional": "^21.2.2",
    "husky": "^9.1.7",
    "lint-staged": "^17.3.0",
    "prettier": "^3.4.2",
    "turbo": "^2.11.9"
  },
  "prettier": {
    "singleQuote": true,
    "trailingComma": "all"
  }
}
```

- [ ] **Step 2: `pnpm-workspace.yaml`**

```yaml
packages:
  - apps/*
  - packages/*
```

`web/` is not under `apps/` yet, so it is not a member until phase 2.

- [ ] **Step 3: `turbo.json`**

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "stream",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["NEXT_PUBLIC_*"]
    },
    "lint": { "dependsOn": ["^build"], "cache": false },
    "test": { "dependsOn": ["^build"] },
    "test:cov": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "format": { "cache": false },
    "format:check": {},
    "dev": { "cache": false, "persistent": true },
    "start": { "cache": false, "persistent": true }
  }
}
```

- [ ] **Step 4: Root `.gitignore`**

```gitignore
node_modules
.turbo
coverage
.DS_Store
*.log
.env
.env.*
!.env.example
/docs/reading/
**/.claude/settings.local.json
```

In `apps/api/.gitignore`, delete the line `/docs/reading/`, because that folder now lives at the root.

- [ ] **Step 5: `apps/api/package.json`**

Make these exact changes:

- `"name": "coffee-shop-api"` → `"name": "api"`.
- Delete `"packageManager": "pnpm@10.28.2"`.
- In `scripts`:
  - add `"dev": "nest start --watch"`;
  - change `"start": "nest start"` → `"start": "node dist/main"`;
  - add `"format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\""`;
  - delete `"prepare": "cd .. && husky coffee-shop-api/.husky"`.
  - Keep `start:dev`, `start:debug`, `start:prod`, `lint` (already `--fix`), `test*`, `migration:*`, `seeder:*`, `docker:*` unchanged.
- In `devDependencies`: delete `@commitlint/cli`, `@commitlint/config-conventional`, `husky`, `lint-staged` (they are now at the root).
- Keep the `"lint-staged"` field unchanged. The root lint-staged binary reads it.

- [ ] **Step 6: Root lockfile from the API lockfile (keeps the API's pinned versions)**

```bash
git mv apps/api/pnpm-lock.yaml pnpm-lock.yaml
# the API was the lockfile's root importer "."; it is now the importer "apps/api"
sed -i '' 's/^  \.:$/  apps\/api:/' pnpm-lock.yaml
grep -n -A1 '^importers:' pnpm-lock.yaml   # expect "importers:" then "  apps/api:"
rm -rf apps/api/node_modules
pnpm install
```

Expected: the install succeeds. `git config --get core.hooksPath` prints `.husky/_` (set by the root `prepare`).

- [ ] **Step 7: Check the API's installed versions did not move**

```bash
pnpm --filter api ls --depth 0 --json > "$SCRATCH/api-ls-after.json"
node -e '
const n=f=>{const j=require(f)[0];const o={};for(const k of ["dependencies","devDependencies"])for(const [d,v] of Object.entries(j[k]||{}))o[d]=v.version;return o};
const a=n(process.argv[1]),b=n(process.argv[2]);
const removed=new Set(["@commitlint/cli","@commitlint/config-conventional","husky","lint-staged"]);
const diff=Object.keys({...a,...b}).filter(k=>!removed.has(k)&&a[k]!==b[k]);
console.log(diff.length?diff.map(k=>`${k}: ${a[k]} -> ${b[k]}`).join("\n"):"NO DRIFT")' "$SCRATCH/api-ls-before.json" "$SCRATCH/api-ls-after.json"
```

Expected: `NO DRIFT`. Any other output is a failure: stop and report it.

- [ ] **Step 8: Turbo vs direct, plus caching (Review Focus 5)**

```bash
pnpm build && pnpm test          # turbo
pnpm build                        # second run
(cd apps/api && pnpm test)        # direct
```

Expected:
- the turbo test run reports 24 files and 257 tests passed, the same as the direct run;
- the second `pnpm build` prints `cached` and `FULL TURBO`;
- the root scripts `pnpm build:api`, `pnpm api migration:list` and `pnpm lint:api` run.

### Task 1.4: Root git hooks

**Files:**
- Rewrite: `.husky/commit-msg`, `.husky/pre-commit`, `.husky/pre-push`
- Create: `.lintstagedrc.json`, `.prettierignore`

**Interfaces:**
- Consumes: the root devDependencies and `"prettier"` field (Task 1.3).
- Produces: the hooks that all later commits and pushes run.

- [ ] **Step 1: Hook files** (husky 9 runs them with `sh`; no shebang is needed)

`.husky/commit-msg`:

```sh
pnpm exec commitlint --edit "$1"
```

`.husky/pre-commit`:

```sh
pnpm exec lint-staged
```

`.husky/pre-push`:

```sh
BASE="${TURBO_SCM_BASE:-origin/feat/claude-example}"
if git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null; then
  TURBO_SCM_BASE="$BASE" pnpm exec turbo run build test --affected
else
  echo "pre-push: base ref '$BASE' not found locally; running build and test for every package" >&2
  pnpm exec turbo run build test
fi
```

- [ ] **Step 2: Root lint-staged and Prettier ignore**

`.lintstagedrc.json`:

```json
{
  "*.{js,mjs,cjs,json,yml,yaml}": "prettier --write"
}
```

`.prettierignore`:

```text
pnpm-lock.yaml
**/node_modules
**/dist
**/.next
**/coverage
.turbo
```

- [ ] **Step 3: commit-msg rejects a bad message**

```bash
echo "bad message" | pnpm exec commitlint; echo "exit=$?"
echo "refactor: move api" | pnpm exec commitlint; echo "exit=$?"
```

Expected: the first prints `subject-empty` / `type-empty` and `exit=1`; the second prints `exit=0`.

- [ ] **Step 4: pre-commit picks the closest config**

Stage one API file and one root JSON file, both badly formatted. Then run lint-staged without committing:

```bash
printf '{"a":1,\n"b":2}\n' > tmp-root.json
printf "export const x = \"y\"\n" > apps/api/src/tmp-lint-check.ts
git add tmp-root.json apps/api/src/tmp-lint-check.ts
pnpm exec lint-staged
cat tmp-root.json apps/api/src/tmp-lint-check.ts
git reset -q tmp-root.json apps/api/src/tmp-lint-check.ts && rm tmp-root.json apps/api/src/tmp-lint-check.ts
```

Expected:
- `tmp-root.json` is reformatted by the root config;
- the `.ts` file gets single quotes from the API config (`eslint --fix` + `prettier --write` run in `apps/api`);
- the output names both config files.

- [ ] **Step 5: pre-push, affected only**

```bash
git fetch origin feat/claude-example
TURBO_SCM_BASE=origin/feat/claude-example pnpm exec turbo ls --affected
sh .husky/pre-push
```

Expected: `turbo ls` lists `api`, and the hook runs `api#build` and `api#test` and exits 0.

- [ ] **Step 6: Missing base ref (Review Focus 2)**

```bash
TURBO_SCM_BASE=origin/does-not-exist sh .husky/pre-push; echo "exit=$?"
```

Expected: the line `pre-push: base ref 'origin/does-not-exist' not found locally; running build and test for every package`, then a full run, then `exit=0`.

- [ ] **Step 7: `.turbo` does not make packages look affected**

```bash
pnpm build
git status --short --ignored apps/api | grep turbo   # expect: "!! apps/api/.turbo/" (ignored)
```

### Task 1.5: Prune-based Dockerfile and compose

**Files:**
- Rewrite: `apps/api/Dockerfile`
- Modify: `apps/api/docker-compose.yml`, `apps/api/docker-compose.dev.yml`
- Create: `.dockerignore` (root)
- Delete: `apps/api/.dockerignore` (Docker reads `.dockerignore` only at the build context root)

**Interfaces:**
- Consumes: package name `api` and the root lockfile (Task 1.3).
- Produces: build targets `development` and `production` with context `.` and file `apps/api/Dockerfile` (CI in Task 1.6 uses these).

- [ ] **Step 1: `apps/api/Dockerfile`**

```dockerfile
ARG NODE_VERSION=24-alpine
ARG PORT=3000
ARG TURBO_VERSION=2.11.9

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV TURBO_TELEMETRY_DISABLED=1
RUN apk upgrade --no-cache libssl3 libcrypto3 \
  && corepack enable

FROM base AS pruner
ARG TURBO_VERSION
COPY . .
RUN pnpm dlx turbo@${TURBO_VERSION} prune api --docker

FROM base AS deps
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS development
ARG PORT
COPY --from=pruner /app/out/full/ .
WORKDIR /app/apps/api
EXPOSE ${PORT}
CMD ["pnpm", "run", "start:dev"]

FROM deps AS build
COPY --from=pruner /app/out/full/ .
RUN pnpm exec turbo run build --filter=api

FROM base AS production
ARG PORT
ENV NODE_ENV=production
COPY --from=pruner /app/out/json/ .
RUN pnpm --filter api install --frozen-lockfile --prod --ignore-scripts \
  && rm -rf /root/.cache /pnpm/store /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=build /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE ${PORT}
CMD ["node", "dist/main"]
```

- [ ] **Step 2: Root `.dockerignore`** (keeps what `apps/api/.dockerignore` excluded, made recursive)

```text
**/node_modules
**/dist
**/.next
**/coverage
**/build
**/.turbo
.git
apps/api/test
**/.env
**/.env.*
**/.DS_Store
**/.idea
**/.vscode
**/*.log
**/.nyc_output
**/.temp
**/.tmp
```

Then run `git rm apps/api/.dockerignore`.

- [ ] **Step 3: Compose files**

In `apps/api/docker-compose.yml`, add a top-level `name: coffee-shop-api` as the first line. Without it, Compose derives the project name from the directory (`api`) and creates a new, empty `api_postgres_data` volume instead of reusing `coffee-shop-api_postgres_data`. Then, under `app.build`:

```yaml
    build:
      context: ../..
      dockerfile: apps/api/Dockerfile
      target: production
```

In `apps/api/docker-compose.dev.yml`, replace `app.volumes` with:

```yaml
    volumes:
      - ./src:/app/apps/api/src
```

`command: pnpm run start:dev` stays; the `development` stage's `WORKDIR` is `/app/apps/api`.

- [ ] **Step 4: Build the production image**

Docker Desktop must be running.

```bash
docker build -f apps/api/Dockerfile --target production -t coffee-shop-api:local .
```

Expected: the build succeeds, and the `pruner` log shows `api` as the only package in scope.

- [ ] **Step 5: Image contents (Review Focus 3)**

```bash
docker run --rm --entrypoint sh coffee-shop-api:local -c '
  cd /app/apps/api && ls dist/main.js &&
  for p in typescript eslint turbo vitest @nestjs/cli; do test ! -e node_modules/$p || echo "DEV DEP PRESENT: $p"; done;
  test -e node_modules/@nestjs/core && echo "prod deps OK"'
```

Expected: `dist/main.js` and `prod deps OK`, with no `DEV DEP PRESENT` line.

- [ ] **Step 6: Boot (Review Focus 3)**

The production compose file does not publish Postgres, and Postgres.app owns 5432 on this machine. So start Postgres through the dev override on 5433, migrate from the host (the MikroORM CLI is a devDependency and is not in the image), then start the production app:

```bash
cd apps/api
DB_PORT=5433 docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
(set -a && . ./.env.docker && set +a && DB_HOST=localhost DB_PORT=5433 pnpm run migration:up)
docker compose --env-file .env.docker -f docker-compose.yml up -d --build app
sleep 15 && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/v1/categories
docker compose --env-file .env.docker -f docker-compose.yml logs app | tail -20
pnpm run docker:prod:down
```

Expected: `200`, and the app log shows Nest started without errors.

- [ ] **Step 7: Dev hot reload**

```bash
DB_PORT=5433 pnpm run docker:dev    # in a second terminal: touch src/main.ts
```

Expected: the container log shows Nest recompiling after the `touch`. Then run `pnpm run docker:dev:down` and `cd ../..`.

### Task 1.6: CI for the workspace

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the Dockerfile targets (Task 1.5) and the turbo tasks (Task 1.3).
- Produces: the job output `quality.outputs.api_affected`, which every Docker job reads.

- [ ] **Step 1: Triggers.** Replace both `paths: ["coffee-shop-api/**"]` with:

```yaml
    paths:
      - "apps/**"
      - "packages/**"
      - "package.json"
      - "pnpm-lock.yaml"
      - "pnpm-workspace.yaml"
      - "turbo.json"
      - ".dockerignore"
      - ".github/workflows/**"
```

- [ ] **Step 2: Replace the `test` job with `quality`**

```yaml
  quality:
    if: github.event_name != 'pull_request' || github.event.action != 'closed' || github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    outputs:
      api_affected: ${{ steps.api.outputs.affected }}
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.pull_request.merged == true && github.event.pull_request.merge_commit_sha || '' }}
          fetch-depth: 0

      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Resolve turbo base
        id: base
        run: |
          case "${{ github.event_name }}" in
            pull_request)
              if [ "${{ github.event.pull_request.merged }}" = "true" ]; then
                BASE="${{ github.event.pull_request.merge_commit_sha }}^1"
              else
                BASE="${{ github.event.pull_request.base.sha }}"
              fi ;;
            push) BASE="${{ github.event.before }}" ;;
          esac
          if [ -n "$BASE" ] && git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null; then
            echo "TURBO_SCM_BASE=$BASE" >> "$GITHUB_ENV"
            echo "usable=true" >> "$GITHUB_OUTPUT"
          else
            echo "Base '$BASE' is missing or all zeros; running every package"
            echo "usable=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Test and build
        run: |
          if [ "${{ steps.base.outputs.usable }}" = "true" ]; then
            pnpm exec turbo run test build --affected
          else
            pnpm exec turbo run test build
          fi

      - name: Is the API affected?
        id: api
        run: |
          if [ "${{ steps.base.outputs.usable }}" != "true" ]; then
            echo "affected=true" >> "$GITHUB_OUTPUT"; exit 0
          fi
          if git diff --name-only "$TURBO_SCM_BASE" HEAD -- .github/workflows .dockerignore | grep -q .; then
            echo "affected=true" >> "$GITHUB_OUTPUT"; exit 0
          fi
          if pnpm exec turbo ls --affected --output=json | jq -e '.packages.items[] | select(.name == "api")' >/dev/null; then
            echo "affected=true" >> "$GITHUB_OUTPUT"
          else
            echo "affected=false" >> "$GITHUB_OUTPUT"
          fi
```

- [ ] **Step 3: Docker jobs.** In `build-and-scan`, `push-develop` and `push-production`:
  - set `needs: quality` on `build-and-scan`, and keep `needs: build-and-scan` on the push jobs;
  - prepend `needs.quality.outputs.api_affected == 'true' && (...)` to each job's existing `if:`, keeping the existing condition inside the parentheses;
  - in every `docker/build-push-action` step, replace `context: ./coffee-shop-api` with:

```yaml
          context: .
          file: apps/api/Dockerfile
```

  The push jobs need `quality` in their `needs` to read its output: `needs: [quality, build-and-scan]`. The deploy jobs are unchanged.

- [ ] **Step 4: Lint the workflow**

```bash
brew list actionlint >/dev/null 2>&1 || brew install actionlint
actionlint .github/workflows/ci.yml
```

Expected: no output, exit 0.

- [ ] **Step 5: Run the `quality` commands locally**

```bash
pnpm install --frozen-lockfile
TURBO_SCM_BASE=origin/feat/claude-example pnpm exec turbo run test build --affected
TURBO_SCM_BASE=origin/feat/claude-example pnpm exec turbo ls --affected --output=json | jq '.packages.items'
```

Expected: tests and build pass. The `jq` output is an array that contains `{"name": "api", "path": "apps/api"}`, which confirms the JSON shape the workflow's `jq` filter relies on. If the shape differs, fix the filter in Step 2 to match.

- [ ] **Step 6: Merged-PR base (Review Focus 1)**

The changes are still uncommitted at this point, so a real merge cannot be simulated. Check the two facts the deploy depends on instead:

```bash
grep -n 'merge_commit_sha }}^1' .github/workflows/ci.yml   # expect one match in "Resolve turbo base"
TURBO_SCM_BASE=origin/feat/claude-example pnpm exec turbo ls --affected
```

Expected: the grep matches. `api` is listed when the base is the target branch tip, which is what `<merge_commit_sha>^1` (the merge's first parent) resolves to on a merged PR. So `api_affected` is true and production deploys.

### Task 1.7: Claude config, docs and READMEs

**Files:**
- Create: `CLAUDE.md` (root)
- Modify: `apps/api/CLAUDE.md`, `README.md` (root), `apps/api/README.md:243`
- Modify: `.claude/rules/workflow.md`, `.claude/skills/work-ticket/SKILL.md`, `.claude/agents/trello-manager.md`, `.claude/agents/plan-reviewer.md`
- Modify: `apps/api/.claude/skills/verify/SKILL.md`, `apps/api/.claude/skills/verify/coverage-diff.mjs` (comment only)
- Modify: `docs/conventions/git.md`

**Interfaces:**
- Consumes: the root scripts (Task 1.3) and hooks (Task 1.4).
- Produces: the documented commands and paths Claude and people follow.

- [ ] **Step 1: Root `CLAUDE.md`**

````markdown
# CLAUDE.md

Guidance for Claude Code in this repo. App-specific guidance lives next to each app: `apps/api/CLAUDE.md`.

## Layout

- pnpm workspace driven by Turborepo. Git root and workspace root are the same directory; run commands from here unless noted.
- `apps/api/`: NestJS 12 / TypeScript 6 / ESM backend (package `api`).
- `web/`: Next.js frontend, not yet in the workspace (phase 2 of `docs/specs/2026-10-20/add-turborepo-monorepo/`). Install it with `cd web && pnpm install --ignore-workspace`.
- `docs/`: training material (exercises, conventions, specs), not product docs. `docs/conventions/git.md` is the authoritative git workflow.
- `.claude/`: shared workflow, agents and the `work-ticket` skill. API rules and the `verify` skill are in `apps/api/.claude/`.

## Commands

```bash
pnpm install          # whole workspace + git hooks (root "prepare")
pnpm dev | build | lint | test | test:cov | format | format:check   # all packages, via turbo
pnpm dev:api | build:api | lint:api | test:api | start:api            # one app
pnpm api <script>     # any API script, e.g. pnpm api migration:up, pnpm api test:e2e
pnpm build --affected # only packages changed against TURBO_SCM_BASE
```

`lint` runs `eslint --fix`; use the `verify` skill (plain `eslint`) to check without rewriting.

## Git

- Conventional Commits (commitlint in `commit-msg`). Branches `<type>/<short-kebab-description>`; training work branches from and targets `feat/claude-example`. MRs are on GitLab and merge with a merge commit.
- Hooks (root `.husky/`):
  - `pre-commit` runs lint-staged with the closest config per staged file: the app's `package.json`, or the root `.lintstagedrc.json` (Prettier) for `packages/` and root files.
  - `pre-push` runs `turbo run build test --affected` against `origin/feat/claude-example`. Override with `TURBO_SCM_BASE=<ref> git push`. A missing ref runs every package.
- Fix the cause rather than passing `--no-verify`.

## CI

`.github/workflows/ci.yml` is GitHub Actions (development happens on GitLab). It runs only for `feat/coffee-shop-api` and `main`:

1. `quality`: `turbo run test build --affected`; there is no lint step.
2. Docker build of `apps/api/Dockerfile` (context `.`) + Trivy, only when the API is affected.
3. GHCR push.
4. Render deploy.
````

- [ ] **Step 2: `apps/api/CLAUDE.md`**
  - Replace section "1. Repository layout" (its three bullets and the blockquote) with:

```markdown
## 1. Repository layout

- **This directory, `apps/api/`**, is the NestJS 12 / TypeScript 6 / ESM backend, package `api` in the root pnpm workspace. Monorepo-wide guidance (layout, root commands, git, hooks, CI) is in the root `CLAUDE.md`.
- Commands below run from here. From the root, use `pnpm api <script>` or the `:api` shortcuts.
```

  - In the key-directories table, change the `docs/...` paths to `../../docs/exercises/day-NN.md` and `../../docs/conventions/git.md`.
  - Replace section "4. Git workflow" and its "Hooks" and "CI" subsections with one line: `See the root CLAUDE.md (Git, Hooks, CI).`
  - In section 3.1, change the `workflow.md` row's path to `../../.claude/rules/workflow.md`.

- [ ] **Step 3: `.claude/rules/workflow.md`**
  - In §1, add one line under "Save paths": `Paths are relative to the repo root.`
  - In §5 and §8, change `.claude/rules/coding.md` / `.claude/rules/testing.md` to `apps/api/.claude/rules/coding.md` / `apps/api/.claude/rules/testing.md`.
  - In §7, change the coverage baseline sentence to: "From `apps/api/`, run `pnpm run test:cov --coverage.reporter=json-summary --coverage.reporter=text-summary`, then `node .claude/skills/verify/coverage-diff.mjs snapshot ../../<spec dir>/coverage-baseline.json`."
  - Change the Coverage table bullet to: "`node .claude/skills/verify/coverage-diff.mjs diff ../../<spec dir>/coverage-baseline.json <changed src files>`, run from `apps/api/`."

- [ ] **Step 4: Skills and agents**
  - `.claude/skills/work-ticket/SKILL.md` line 12: `Run commands from coffee-shop-api/.` → `Run commands from the repo root; API-only commands (verify, coverage) from apps/api/.`
  - `apps/api/.claude/skills/verify/SKILL.md`:
    - `description`: `code change in coffee-shop-api` → `code change in apps/api (the API)`;
    - heading: `# Verify coffee-shop-api changes` → `# Verify API changes`;
    - `Run from \`coffee-shop-api/\`.` → `Run from \`apps/api/\`.`
  - `apps/api/.claude/skills/verify/coverage-diff.mjs` line 11 comment: `Run from coffee-shop-api/` → `Run from apps/api/`.
  - `.claude/agents/trello-manager.md`:
    - line 8: `for coffee-shop-api` → `for this repo (apps/api and web)`;
    - line 14: `Code lives in \`coffee-shop-api/\`; git root is one level up.` → `The git root is the workspace root; the API is in \`apps/api/\`.`
  - `.claude/agents/plan-reviewer.md`:
    - line 8: `in coffee-shop-api` → `in this repo`;
    - line 12: `` `PLAN.md` in `coffee-shop-api/`, then the repo root (one level up) `` → `` `PLAN.md` at the repo root ``;
    - line 13: `From \`coffee-shop-api/\`:` → `From the repo root:`.

- [ ] **Step 5: `docs/conventions/git.md`**
  - Clone block: replace `cd ai-training/coffee-shop-api` and the `pnpm install` comment with `cd ai-training` and `pnpm install          # whole workspace + git hooks (husky, via the root \`prepare\`)`.
  - Replace the sentence "The git root is `ai-training/`, but the app and its tooling live in `coffee-shop-api/`. The hooks `cd` into it before they run." with "The git root is the pnpm workspace root; the hooks run from there."
  - Replace the Hooks table with:

```markdown
| Hook | Runs | Effect |
|---|---|---|
| `pre-commit` | `lint-staged` | Closest config per staged file: API `*.ts` → `eslint --fix` + `prettier --write`; `packages/` and root files → `prettier --write` |
| `commit-msg` | `commitlint` | Rejects messages that are not Conventional Commits |
| `pre-push` | `turbo run build test --affected` | Builds and tests only the packages changed against `origin/feat/claude-example` (override with `TURBO_SCM_BASE`); blocks the push on failure |
```

- [ ] **Step 6: READMEs**
  - `apps/api/README.md:243`: `cd ai-training/coffee-shop-api` → `cd ai-training/apps/api`.
  - In the "Docker" section of `apps/api/README.md`, add: "The image builds from the repo root (`docker build -f apps/api/Dockerfile .`); compose sets `context: ../..`. The dev container mounts only `src/`, so rebuild it after a dependency change."
  - Root `README.md`:

````markdown
# Claude Training

pnpm + Turborepo monorepo.

| Path | What |
| --- | --- |
| `apps/api` | NestJS API — see [apps/api/README.md](apps/api/README.md) |
| `web` | Next.js frontend — see [web/README.md](web/README.md) (joins the workspace in phase 2) |
| `docs` | Training exercises, conventions, specs |

```bash
pnpm install        # workspace + git hooks
pnpm dev            # all apps
pnpm build:api      # one app; also dev:api, test:api, lint:api, start:api
pnpm api <script>   # any API script, e.g. pnpm api migration:up
```
````

- [ ] **Step 7: Leftover paths**

```bash
git grep -n "coffee-shop-api" -- . ':!docs/specs' ':!docs/exercises' ':!pnpm-lock.yaml'
```

Expected: only `apps/api/src/common/constants/env.constant.ts` (`OBSERVE_SERVICE_ID`, a telemetry service name; keep it) and the branch name `feat/coffee-shop-api` (in `docs/conventions/git.md`, `.claude/rules/workflow.md`, root `CLAUDE.md`, `.github/workflows/ci.yml`). Fix any path reference.

- [ ] **Step 8: Nested rules check (spec §5, unverified item)**

Start a new Claude Code session at the repo root: either the user opens one, or run non-interactively from the root with `claude -p "Read apps/api/src/modules/category/services/category.service.ts, then list every rule or memory file in your context by path."`. If neither is possible, record the check as pending for the user in `report.md`.

- Expected: `apps/api/.claude/rules/coding.md` is loaded.
- If it is not, apply the fallback:
  - `git mv apps/api/.claude/rules/coding.md .claude/rules/coding.md` and `git mv apps/api/.claude/rules/testing.md .claude/rules/testing.md`;
  - change their `paths:` to `apps/api/src/**/*.ts` and `apps/api/src/**/*.spec.ts` + `apps/api/test/**`;
  - update the references from Steps 2–3.

Record the result in `report.md`.

- [ ] **Step 9: Claude Code memory note**

Add one line to the phase report: sessions started in `apps/api` use a new memory directory. To keep the old `coffee-shop-api` memories, copy `~/.claude/projects/-Users-tiennd0502gmail-com-training-AI-ai-training-coffee-shop-api/memory/` to the new project's memory directory. This is optional; ask the user before copying.

### Task 1.8: Verify phase 1

- [ ] **Step 1:** Run the `verify` skill from `apps/api/`, with the unit gate on `test:cov` (workflow rule 7). Expected:
  - lint shows the same count as `api-lint-before.txt` (0 errors, 95 warnings);
  - build passes;
  - unit tests: 24 files, 257 tests;
  - e2e: run after the guard prints `…/coffee_shop_test`, 5 files, 101 tests;
  - the coverage diff against `docs/specs/2026-10-20/add-turborepo-monorepo/coverage-baseline.json` shows no drop.
- [ ] **Step 2:** `pnpm format:check`. Expected: PASS for `api`, which checks the same globs as `format`.
- [ ] **Step 3:** Write `test-report.md` from `.claude/templates/test-report.md`. Then run the review (workflow rule 8) and write `report.md` (rule 9). Include:
  - the Task 1.3 drift result;
  - the Task 1.4 hook checks;
  - the Task 1.5 Docker checks;
  - the Task 1.6 actionlint and merge simulation;
  - the Task 1.7 nested-rules result.
- [ ] **Step 4:** 🛑 Gate: commit (`refactor: …` for code and config; `docs: add design and plan for add-turborepo-monorepo` for the spec folder), push, and open the MR into `feat/claude-example` (workflow rule 10). The MR description notes that the MR !4 re-baseline SQL must run on production before this reaches `feat/coffee-shop-api` or `main`, and that the GitHub CI run happens only then.

---

# Phase 2: web joins the workspace (`refactor/turborepo-web`)

### Task 2.1: Branch, baseline, pre-move snapshots

**Files:**
- Create: `docs/specs/2026-10-20/add-turborepo-monorepo/coverage-baseline-web.json`
- Create (scratch): `$SCRATCH/web-ls-before.json`, `$SCRATCH/web-lint-before.txt`

- [ ] **Step 1:**

```bash
git fetch github develop
git log -1 --format='%h — %s (%ad)' --date=short github/develop   # put into the Git table
git checkout -b refactor/turborepo-web github/develop
cd web && pnpm install --ignore-workspace
```

- [ ] **Step 2: Web coverage baseline** (Jest writes the same istanbul `coverage-summary.json`)

```bash
pnpm exec jest --coverage --coverageReporters=json-summary --coverageReporters=text-summary
node ../apps/api/.claude/skills/verify/coverage-diff.mjs snapshot ../docs/specs/2026-10-20/add-turborepo-monorepo/coverage-baseline-web.json
```

- [ ] **Step 3: Snapshots**

```bash
pnpm ls --depth 0 --json > "$SCRATCH/web-ls-before.json"
pnpm exec eslint . 2>&1 | tail -1 | tee "$SCRATCH/web-lint-before.txt"   # expect 0 errors, 9 warnings
cd ..
```

### Task 2.2: Move web (git mv only)

- [ ] **Step 1:** `git mv web apps/web`, then `git diff --cached -M --stat | tail -1`. Expected: renames only.
- [ ] **Step 2:** 🛑 Checkpoint (user approval): `git commit -m "refactor: move web to apps/web"`.

### Task 2.3: Join the workspace

**Files:**
- Delete: `apps/web/pnpm-lock.yaml`
- Modify: `apps/web/package.json`, `apps/web/.prettierignore`, `apps/web/README.md` (format only), root `package.json`

**Interfaces:**
- Produces: package `web` with scripts `lint` (with `--fix`) and `test:cov`; root `dev:web build:web lint:web test:web start:web web`.

- [ ] **Step 1: `apps/web/package.json`**
  - Delete `"packageManager"`.
  - `"lint": "eslint ."` → `"lint": "eslint . --fix"`.
  - Delete `"lint:fix"`.
  - Rename `"test:coverage"` → `"test:cov"` (same command).
  - Delete the devDependency `lint-staged` (it is at the root). Keep the `"lint-staged"` field.
- [ ] **Step 2: Root `package.json` scripts.** Add:

```json
    "dev:web": "turbo run dev --filter=web",
    "build:web": "turbo run build --filter=web",
    "lint:web": "turbo run lint --filter=web",
    "test:web": "turbo run test --filter=web",
    "start:web": "turbo run start --filter=web",
    "web": "pnpm --filter web"
```

- [ ] **Step 3: Make `format:check` start green.** Add `pnpm-lock.yaml` to `apps/web/.prettierignore`, then run:

```bash
cd apps/web && pnpm exec prettier --write README.md && pnpm exec prettier --check . && cd ../..
```

Expected: `All matched files use Prettier code style!`

- [ ] **Step 4: Install**

```bash
git rm apps/web/pnpm-lock.yaml
rm -rf apps/web/node_modules
pnpm install
```

- [ ] **Step 5: Record drift (Review Focus 4)**

```bash
pnpm --filter web ls --depth 0 --json > "$SCRATCH/web-ls-after.json"
node -e '
const n=f=>{const j=require(f)[0];const o={};for(const k of ["dependencies","devDependencies"])for(const [d,v] of Object.entries(j[k]||{}))o[d]=v.version;return o};
const a=n(process.argv[1]),b=n(process.argv[2]);
const diff=Object.keys({...a,...b}).filter(k=>k!=="lint-staged"&&a[k]!==b[k]);
console.log(diff.length?diff.map(k=>`${k}: ${a[k]} -> ${b[k]}`).join("\n"):"NO DRIFT")' "$SCRATCH/web-ls-before.json" "$SCRATCH/web-ls-after.json"
```

Paste the output into `report.md`. Pin a direct dependency to its old version only if a check in Task 2.6 fails because of it.

### Task 2.4: Web in turbo and CI

**Files:**
- Modify: `.github/workflows/ci.yml` (`quality` job env)

- [ ] **Step 1: Find the env vars `next build` requires**

```bash
mv apps/web/.env "$SCRATCH/web.env.bak"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$(grep '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' "$SCRATCH/web.env.bak" | cut -d= -f2-)" pnpm build:web; echo "exit=$?"
mv "$SCRATCH/web.env.bak" apps/web/.env
```

Expected: exit 0. If it fails, add each variable named in the error the same way until it passes. Record the final list.

- [ ] **Step 2: CI env.** On the `quality` job, add the variables from Step 1. For the Clerk key:

```yaml
    env:
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ vars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
```

Tell the user to create the GitHub Actions variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` before the change reaches GitHub. `turbo.json` already passes `NEXT_PUBLIC_*` to `build`.

- [ ] **Step 3:** `actionlint .github/workflows/ci.yml`. Expected: no output.
- [ ] **Step 4: Affected scope**

```bash
git status --short                                         # expect clean before the probe
echo "// probe" >> apps/web/src/app/layout.tsx
TURBO_SCM_BASE=HEAD pnpm exec turbo ls --affected        # expect: web only
git checkout -q apps/web/src/app/layout.tsx
```

### Task 2.5: Docs for web

**Files:**
- Create: `apps/web/CLAUDE.md`
- Modify: root `CLAUDE.md`, root `README.md`, `docs/conventions/git.md`

- [ ] **Step 1: `apps/web/CLAUDE.md`**

````markdown
# CLAUDE.md — web

Next.js 15 (App Router), React 19, Tailwind v4, shadcn/ui, Clerk. Package `web` in the root pnpm workspace; monorepo guidance is in the root `CLAUDE.md`.

## Commands (from here, or `pnpm web <script>` from the root)

```bash
pnpm dev          # http://localhost:3001
pnpm build        # also runs ESLint and the type check
pnpm lint         # eslint --fix
pnpm test         # Jest + React Testing Library
pnpm test:cov
```

## Structure

`src/app` (routes: `(shop)`, `dashboard`, `sign-in`, `sign-up`), `src/sections` (page sections), `src/components`, `src/services` (API client), `src/hooks`, `src/store`, `src/schemas`, `src/constants`.

## Environment

Copy `.env.example` to `.env`. `NEXT_PUBLIC_API_URL` points at the API (`pnpm dev:api` serves `http://localhost:3000`). Clerk keys are required for `pnpm build`.
````

- [ ] **Step 2:** In the root `CLAUDE.md` Layout, replace the `web/` bullet with `` `apps/web/`: Next.js frontend (package `web`); see `apps/web/CLAUDE.md`. `` In Commands, add `pnpm dev:web | build:web | lint:web | test:web | start:web` and `pnpm web <script>`. In the root `README.md` table, change `web` to `apps/web` with link `apps/web/README.md`, and drop "(joins the workspace in phase 2)".
- [ ] **Step 3:** In `docs/conventions/git.md`, in the `pre-commit` row, insert `web js/ts → eslint --fix + prettier --write, css/md/json → prettier --write;` after the API part.

### Task 2.6: Verify phase 2

- [ ] **Step 1:** `pnpm lint:web && pnpm test:web && pnpm build:web`. Expected:
  - lint: 0 errors, 9 warnings (as in `web-lint-before.txt`);
  - tests: 74 suites, 364 tests;
  - build passes.
- [ ] **Step 2:** `pnpm dev`. Expected: the API on 3000 and web on 3001 both start (stop with Ctrl-C).
- [ ] **Step 3:** Coverage diff for web against `coverage-baseline-web.json`. Run the API `verify` skill too, because root files changed. Run `pnpm format:check`. Expected: PASS for both apps.
- [ ] **Step 4:** Pre-commit on a staged web file: repeat Task 1.4 Step 4 with a badly formatted `apps/web/src/tmp.ts`. Expected: no semicolons added (web style).
- [ ] **Step 5:** Test report, review, `report.md` (with the drift output and the env list), then 🛑 Gate: commit, push, MR.

---

# Phase 3: shared config + catalog (`refactor/turborepo-shared-config`)

### Task 3.1: Branch, proofs "before", catalog and TypeScript 6 for web

**Files:**
- Create (scratch): `$SCRATCH/proof-before/*`
- Modify: `pnpm-workspace.yaml`, `apps/api/package.json`, `apps/web/package.json`, root `package.json`
- Create: `apps/web/src/types/css.d.ts`
- Modify: `apps/web/src/sections/RoastDetailPageContent/RoastDetailPageContent.test.tsx:40`

**Interfaces:**
- Produces: catalog entries `@eslint/eslintrc`, `@types/node`, `eslint`, `eslint-config-prettier`, `prettier`, `typescript`, `typescript-eslint` (Tasks 3.2–3.4 use `catalog:`).

- [ ] **Step 1: Branch + coverage baselines.** Create the branch from the newest `develop` as in Task 2.1 Step 1. Take both coverage baselines (`coverage-baseline.json` for the API from `apps/api`, `coverage-baseline-web.json` for web) into `docs/specs/2026-10-20/add-turborepo-monorepo/`.

- [ ] **Step 2: Capture the proofs "before"**

```bash
P="$SCRATCH/proof-before"; mkdir -p "$P"
(cd apps/api && pnpm exec tsc --showConfig -p tsconfig.json) > "$P/api-tsconfig.json"
(cd apps/web && pnpm exec tsc --showConfig -p tsconfig.json) > "$P/web-tsconfig.json"
for f in src/modules/category/controllers/category.controller.ts src/modules/category/entities/category.entity.ts src/modules/category/services/category.service.spec.ts; do
  (cd apps/api && pnpm exec eslint --print-config "$f") | node -e 'const c=JSON.parse(require("fs").readFileSync(0));console.log(JSON.stringify(c.rules,Object.keys(c.rules).sort(),1))' > "$P/api-$(basename $f).rules.json"; done
for f in src/app/layout.tsx src/sections/RoastDetailPageContent/index.tsx src/sections/RoastDetailPageContent/RoastDetailPageContent.test.tsx; do
  (cd apps/web && pnpm exec eslint --print-config "$f") | node -e 'const c=JSON.parse(require("fs").readFileSync(0));console.log(JSON.stringify(c.rules,Object.keys(c.rules).sort(),1))' > "$P/web-$(basename $f).rules.json"; done
(cd apps/api && pnpm exec prettier --list-different "src/**/*.ts" "test/**/*.ts" | sort) > "$P/api-prettier.txt"
(cd apps/web && pnpm exec prettier --list-different . | sort) > "$P/web-prettier.txt"
(cd apps/api && pnpm exec eslint "{src,apps,libs,test}/**/*.ts" | tail -1) > "$P/api-lint.txt"
(cd apps/web && pnpm exec eslint . | tail -1) > "$P/web-lint.txt"
```

The rules JSON keeps rule names and settings and drops plugin object identities, so a plugin version change alone does not count as a rule change.

- [ ] **Step 3: Catalog.** Append to `pnpm-workspace.yaml`:

```yaml
catalog:
  '@eslint/eslintrc': ^3.2.0
  '@types/node': ^24.0.0
  eslint: ^9.18.0
  eslint-config-prettier: ^10.0.1
  prettier: ^3.4.2
  typescript: ~6.0.3
  typescript-eslint: ^8.70.1
```

In `apps/api/package.json` and `apps/web/package.json`, set each of these seven devDependencies that the app lists to `"catalog:"`. The API has no `@eslint/eslintrc` import, but it lists the package, so it also becomes `catalog:` until Task 3.4 removes it. In the root `package.json`, set `"prettier": "catalog:"`. Then run `pnpm install`.

- [ ] **Step 4: Watch web fail on TypeScript 6**

```bash
cd apps/web && pnpm exec tsc --noEmit -p tsconfig.json; echo "exit=$?"
```

Expected: FAIL (`exit=2`), with TS2882 at `src/app/layout.tsx:12` and `src/app/global-error.tsx:9`, and TS2322 at `src/sections/RoastDetailPageContent/RoastDetailPageContent.test.tsx:40`.

- [ ] **Step 5: The two fixes**

`apps/web/src/types/css.d.ts`:

```ts
// TypeScript 6 type-checks side-effect imports; Next's next-env.d.ts does not declare plain CSS files.
declare module '*.css'
```

In `RoastDetailPageContent.test.tsx`, add one line to the IntersectionObserver mock class, next to its other readonly fields:

```ts
  readonly scrollMargin = ''
```

- [ ] **Step 6: Watch it pass**

```bash
pnpm exec tsc --noEmit -p tsconfig.json; echo "exit=$?"   # expect exit=0
pnpm test                                                  # expect 74 suites / 364 tests
pnpm build                                                 # expect success
cd ../..
pnpm test:api && pnpm build:api                            # API unchanged: 257 tests, build OK
```

### Task 3.2: `@repo/typescript-config`

**Files:**
- Create: `packages/typescript-config/package.json`, `base.json`, `nestjs.json`, `nextjs.json`
- Modify: `apps/api/tsconfig.json`, `apps/web/tsconfig.json`, both apps' `package.json` (devDependency)

**Interfaces:**
- Produces: `@repo/typescript-config/nestjs.json` and `@repo/typescript-config/nextjs.json` for `extends`.

- [ ] **Step 1: Package files**

`packages/typescript-config/package.json`:

```json
{
  "name": "@repo/typescript-config",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nestjs.json", "nextjs.json"]
}
```

`base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "incremental": true
  }
}
```

`nestjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

`nextjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve"
  }
}
```

- [ ] **Step 2: App tsconfigs** (path-bound options stay in the app, because relative paths resolve from the file that declares them)

`apps/api/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "typeRoots": ["./node_modules", "./node_modules/@types", "./src/types"],
    "types": ["vitest/globals", "node"]
  }
}
```

`apps/web/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Add `"@repo/typescript-config": "workspace:*"` to both apps' devDependencies, then run `pnpm install`.

- [ ] **Step 3: Proof**

```bash
P="$SCRATCH/proof-before"
(cd apps/api && pnpm exec tsc --showConfig -p tsconfig.json) | diff - "$P/api-tsconfig.json" && echo "API tsconfig identical"
(cd apps/web && pnpm exec tsc --showConfig -p tsconfig.json) | diff - "$P/web-tsconfig.json" && echo "web tsconfig identical"
```

Expected: both `identical`. The only allowed difference is path-normalized absolute paths, if `--showConfig` prints them; any option-level difference is a failure. Also expect `git diff apps/web/tsconfig.json` to show no rewrite by Next after `pnpm build:web`.

### Task 3.3: `@repo/prettier-config`

**Files:**
- Create: `packages/prettier-config/package.json`, `packages/prettier-config/index.mjs`
- Create: `apps/web/prettier.config.mjs`
- Delete: `apps/api/.prettierrc`, `apps/web/.prettierrc`
- Modify: `apps/api/package.json`, `apps/web/package.json`, root `package.json`

- [ ] **Step 1: Package**

`packages/prettier-config/package.json`:

```json
{
  "name": "@repo/prettier-config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./index.mjs",
  "peerDependencies": { "prettier": ">=3.0.0" },
  "devDependencies": { "prettier": "catalog:" }
}
```

`packages/prettier-config/index.mjs`:

```js
/** @type {import('prettier').Config} */
export default {
  singleQuote: true,
  trailingComma: 'all',
};
```

- [ ] **Step 2: Consumers**
  - `apps/api/package.json`: add `"prettier": "@repo/prettier-config"`, and `"@repo/prettier-config": "workspace:*"` to devDependencies. Run `git rm apps/api/.prettierrc`.
  - `apps/web/prettier.config.mjs`:

```js
import base from '@repo/prettier-config'

/** @type {import('prettier').Config} */
export default { ...base, semi: false }
```

  - `apps/web/package.json`: add `"@repo/prettier-config": "workspace:*"` to devDependencies. Run `git rm apps/web/.prettierrc`.
  - Root `package.json`: change the `"prettier"` field to `"@repo/prettier-config"`, add `"@repo/prettier-config": "workspace:*"` to devDependencies, then run `pnpm install`.

- [ ] **Step 3: Proof**

```bash
P="$SCRATCH/proof-before"
(cd apps/api && pnpm exec prettier --list-different "src/**/*.ts" "test/**/*.ts" | sort) | diff - "$P/api-prettier.txt" && echo "API prettier same"
(cd apps/web && pnpm exec prettier --list-different . | sort) | diff - "$P/web-prettier.txt" && echo "web prettier same"
pnpm exec prettier --check packages/prettier-config/index.mjs turbo.json
```

Expected: both `same`, and the root files are checked with the base (single quotes, semicolons).

### Task 3.4: `@repo/eslint-config`

**Files:**
- Create: `packages/eslint-config/package.json`, `base.mjs`, `nest.mjs`, `next.mjs`
- Rewrite: `apps/api/eslint.config.mjs`, `apps/web/eslint.config.mjs`
- Modify: both apps' `package.json` (drop direct lint packages, add `@repo/eslint-config`)

**Interfaces:**
- Produces: `@repo/eslint-config/nest` and `@repo/eslint-config/next`, each a default export `({ tsconfigRootDir: string }) => FlatConfig[]`; `@repo/eslint-config/base`, a `FlatConfig[]` of shared ignores.

- [ ] **Step 1: `packages/eslint-config/package.json`**

```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./base": "./base.mjs",
    "./nest": "./nest.mjs",
    "./next": "./next.mjs"
  },
  "dependencies": {
    "@eslint/eslintrc": "catalog:",
    "@eslint/js": "^9.18.0",
    "eslint-config-next": "15.5.15",
    "eslint-config-prettier": "catalog:",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^17.0.0",
    "typescript": "catalog:",
    "typescript-eslint": "catalog:"
  },
  "peerDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  },
  "devDependencies": {
    "eslint": "catalog:",
    "prettier": "catalog:"
  }
}
```

`eslint-config-next` stays pinned to the same version as `next` in `apps/web`.

- [ ] **Step 2: `base.mjs`.** This holds shared ignores only. The spec listed `@eslint/js` recommended for the base, but web does not use it today, so putting it there would change web's rule set and break the proof. It stays in `nest.mjs`.

```js
/** Ignores shared by every app. */
export default [{ ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] }];
```

- [ ] **Step 3: `nest.mjs`** (today's `apps/api/eslint.config.mjs`, unchanged rules)

```js
// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import base from './base.mjs';

/** @param {{ tsconfigRootDir: string }} options */
export default function nest({ tsconfigRootDir }) {
  return tseslint.config(
    ...base,
    { ignores: ['eslint.config.mjs'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
      languageOptions: {
        globals: { ...globals.node, ...globals.vitest },
        sourceType: 'module',
        parserOptions: { projectService: true, tsconfigRootDir },
      },
    },
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  );
}
```

- [ ] **Step 4: `next.mjs`** (today's `apps/web/eslint.config.mjs`, unchanged rules; `FlatCompat` resolves `eslint-config-next` from this package)

```js
import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import base from './base.mjs';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @param {{ tsconfigRootDir: string }} options */
export default function next({ tsconfigRootDir }) {
  return tseslint.config(
    ...base,
    {
      ignores: ['node_modules/**', '.next/**', 'out/**', 'coverage/**', 'public/**', 'next-env.d.ts'],
    },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    eslintConfigPrettier,
    {
      name: 'typescript/type-aware (src)',
      files: ['src/**/*.{ts,tsx}'],
      extends: [tseslint.configs.recommendedTypeChecked, tseslint.configs.stylisticTypeChecked],
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir } },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/only-throw-error': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-unnecessary-type-parameters': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
      },
    },
  );
}
```

- [ ] **Step 5: App configs**

`apps/api/eslint.config.mjs`:

```js
// @ts-check
import nest from '@repo/eslint-config/nest';

export default nest({ tsconfigRootDir: import.meta.dirname });
```

`apps/web/eslint.config.mjs`:

```js
import next from '@repo/eslint-config/next'

export default next({ tsconfigRootDir: import.meta.dirname })
```

- [ ] **Step 6: Dependencies**
  - `apps/api/package.json` devDependencies: delete `@eslint/eslintrc`, `@eslint/js`, `eslint-config-prettier`, `eslint-plugin-prettier`, `globals`, `typescript-eslint`; add `"@repo/eslint-config": "workspace:*"`. Keep `eslint`, `prettier`, `typescript` (`catalog:`).
  - `apps/web/package.json` devDependencies: delete `@eslint/eslintrc`, `eslint-config-next`, `eslint-config-prettier`, `typescript-eslint`; add `"@repo/eslint-config": "workspace:*"`. Keep `eslint`, `prettier`, `typescript` (`catalog:`).
  - Then run `pnpm install`.

- [ ] **Step 7: Proof**

```bash
P="$SCRATCH/proof-before"
for f in src/modules/category/controllers/category.controller.ts src/modules/category/entities/category.entity.ts src/modules/category/services/category.service.spec.ts; do
  (cd apps/api && pnpm exec eslint --print-config "$f") | node -e 'const c=JSON.parse(require("fs").readFileSync(0));console.log(JSON.stringify(c.rules,Object.keys(c.rules).sort(),1))' | diff - "$P/api-$(basename $f).rules.json" >/dev/null && echo "same: api $f" || echo "DIFF: api $f"; done
for f in src/app/layout.tsx src/sections/RoastDetailPageContent/index.tsx src/sections/RoastDetailPageContent/RoastDetailPageContent.test.tsx; do
  (cd apps/web && pnpm exec eslint --print-config "$f") | node -e 'const c=JSON.parse(require("fs").readFileSync(0));console.log(JSON.stringify(c.rules,Object.keys(c.rules).sort(),1))' | diff - "$P/web-$(basename $f).rules.json" >/dev/null && echo "same: web $f" || echo "DIFF: web $f"; done
(cd apps/api && pnpm exec eslint "{src,apps,libs,test}/**/*.ts" | tail -1); cat "$P/api-lint.txt"
(cd apps/web && pnpm exec eslint . | tail -1); cat "$P/web-lint.txt"
```

Expected:
- `same` for all six files;
- API lint is identical to `api-lint.txt` (0 errors, 95 warnings);
- web lint is 0 errors. Record web's warning count and any new finding in `report.md` (spec §2: known change).

A `DIFF` for a web file is acceptable only if it comes from the `typescript-eslint` version moving to 8.70 or later. Show the diff in the report. A `DIFF` for an API file is a failure.

- [ ] **Step 8: `next build` still lints with the preset**

```bash
pnpm build:web 2>&1 | grep -i -E 'eslint|plugin was not detected'
```

Expected: no "Next.js plugin was not detected" warning, and the build succeeds.

### Task 3.5: Verify phase 3

- [ ] **Step 1:** Run the API `verify` skill from `apps/api/`, with the unit gate on `test:cov` and e2e behind the `_test` guard. Expected: lint 0 errors / 95 warnings, build OK, 257 unit tests, 101 e2e tests, no coverage drop.
- [ ] **Step 2:** Web: `pnpm lint:web && pnpm test:web && pnpm build:web`, then the coverage diff against `coverage-baseline-web.json`. Expected: lint 0 errors, 364 tests, build OK.
- [ ] **Step 3:** `pnpm format:check` and `pnpm lint` for both apps (Discussion 18: a change to `@repo/eslint-config` must lint both apps).
- [ ] **Step 4:** `pre-push` scope: `TURBO_SCM_BASE=github/develop pnpm exec turbo ls --affected`. Expected: `api` and `web`, because both depend on the changed packages.
- [ ] **Step 5:** `docker build -f apps/api/Dockerfile --target production -t coffee-shop-api:local .`, then repeat the Task 1.5 Step 5 contents check. Expected: no `@repo/*`, `typescript`, `eslint` or `typescript-eslint` in the image (the `--filter` prod install).
- [ ] **Step 6:** Test report, review, `report.md` (with the web lint delta and the print-config results), then 🛑 Gate: commit, push, MR.
