# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. Repository layout

- **This directory, `apps/api/`**, is the NestJS 12 / TypeScript 6 / ESM backend, package `api` in the root pnpm workspace. Monorepo-wide guidance (layout, root commands, git, hooks, CI) is in the root `CLAUDE.md`.
- `README.md` is detailed and current — **read it before asking the user about behaviour**.
- Commands below run from here. From the root, use `pnpm api <script>` or the `:api` shortcuts.

### Key directories and files

| Path                             | What it holds                                                              |
| -------------------------------- | -------------------------------------------------------------------------- |
| `../../docs/exercises/day-NN.md` | Exercise write-ups                                                         |
| `../../docs/conventions/git.md`  | The authoritative git workflow                                             |
| `README.md`                      | Full ERD, endpoint table with auth levels, every env var, Docker/e2e setup |

---

## 2. Commands

```bash
pnpm install                 # git hooks are installed by the root `pnpm install`
pnpm run start:dev           # watch mode
pnpm run build
pnpm run lint                # eslint --fix over src, test
pnpm run test                # unit tests: src/**/*.spec.ts
pnpm run test:cov
pnpm run test:e2e            # e2e: test/**/*.e2e-spec.ts (needs a reachable Postgres)
pnpm run migration:create    # generate migration from entity changes
pnpm run migration:up
pnpm run docker:dev          # app + Postgres with hot reload
```

`@repo/constants` (`packages/constants`): unit and e2e tests read its `src`. At runtime the API imports its `dist`, which root `pnpm dev`/`pnpm dev:api` and `docker:dev` rebuild with `tsc --watch` (`start:dev` alone does not). `nest --watch` restarts only when the package's `.d.ts` changes (a value), not when only its `.js` does (a message's text): restart `dev:api`/`docker:dev` after that kind of edit.

Never run `migration:down`/`fresh` or `schema:drop`/`fresh`/`update --run` without approval: they drop data. Add a forward migration instead.

### Running a single test

```bash
# One unit test file
pnpm vitest run src/modules/category/services/category.service.spec.ts

# One test by name
pnpm vitest run -t 'throws when the name already exists'

# One e2e file
pnpm vitest run --config ./vitest.config.e2e.ts test/e2e/category.e2e-spec.ts
```

### E2E specifics

- `pretest:e2e` runs `test/reset-test-db.ts`, which **truncates every table** (except migrations) in the database named by `.env.test`.
  - → `.env.test` must point at a **separate** database from the one `start:dev` uses.
- `test/setup-env.ts` loads `.env.test` **before any app module is imported** — which is why `src/` has no notion of a test environment.

---

## 3. Architecture

### Request path

```
ClerkAuthMiddleware      → verifies the Clerk session token
UserResolutionMiddleware → loads the matching `User` row onto `req.user`
                           (a missing user is NOT an error)
route guards
controller
service
repository
```

Both middlewares are applied globally in `app.module.ts` and **excluded for `POST /webhooks/clerk`**, which is authenticated by Svix signature instead.

### Global wiring

| Where           | What                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.module.ts` | `ThrottlerGuard`, `TransformResponseInterceptor`, `GlobalExceptionFilter`, `StandardSchemaValidationPipe` (via `createStandardSchemaValidationPipe`) |
| `main.ts`       | Helmet, CORS, `/api` prefix, URI versioning (`/api/v1`), Swagger (skipped when `NODE_ENV=production`)                                                |

---

### 3.1 Code, module and test rules

The coding and testing rules live in `apps/api/.claude/rules/` and the workflow rule in the root `.claude/rules/`, loaded when Claude works with matching files:

| File                              | Loaded for          | Covers                                                                                                                                                                           |
| --------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/rules/coding.md`         | `src/**/*.ts`       | `BaseRepository` layering, soft delete, Zod validation, `DomainException` + centralized constants, `Response*Dto`, `@AdminOnly()`, Clerk, module shape, ESM `.js` imports        |
| `.claude/rules/testing.md`        | specs and `test/**` | Vitest, unit/e2e layout, `API_BASE_PATH`, expected Clerk failures                                                                                                                |
| `../../.claude/rules/workflow.md` | always              | Feature workflow: superpowers overrides, `docs/specs/` paths, plan Git section, coverage baseline + test report (`../../.claude/templates/test-report.md`), review before commit |

When planning or reviewing, read `coding.md` and `testing.md` even if no matching file is open.

---

## 4. Git workflow

See the root CLAUDE.md (Git, Hooks, CI).
