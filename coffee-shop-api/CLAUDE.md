# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. Repository layout

- **This directory, `coffee-shop-api/`**, is a NestJS 12 / TypeScript 6 / ESM backend and the only code in the repo.
- **The repo** (`ai-training`) is a training repo hosted on **GitLab, not GitHub**; its git root is one level up.
- **All tooling is rooted here** (pnpm, husky hooks, tsconfig, CLAUDE.md), and the husky hooks `cd` into this directory themselves. **Run every command below from here.**

### Key directories and files

| Path                       | What it holds                                                              |
| -------------------------- | -------------------------------------------------------------------------- |
| `docs/exercises/day-NN.md` | Exercise write-ups                                                         |
| `docs/conventions/git.md`  | The authoritative git workflow                                             |
| `README.md`                | Full ERD, endpoint table with auth levels, every env var, Docker/e2e setup |

> `docs/` holds **training material, not product docs**.
>
> `README.md` is detailed and current — **read it before asking the user about behaviour**.

---

## 2. Commands

```bash
pnpm install                 # also installs husky hooks via `prepare`
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
- Clerk calls during e2e are **expected to fail** against placeholder keys; the code logs and swallows that.
- E2E runs with `fileParallelism: false`.

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

### 3.1 Layering rules the code actually follows

**`src/common/repositories/base.repository.ts` is the only MikroORM-aware layer.**

- Module repositories declare `protected readonly entity = X`.
- They compose the ORM-agnostic protected helpers: `findOneBy`, `findMany`, `paginate`, `countOf`, `createAndSave`.
- Services **never** touch `EntityManager`.

**Soft delete is a MikroORM filter.**

- Declared on `BaseEntity`: `@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })`.
- Toggled per query through `options.includeDeleted` in `buildFindOptions`.
- Controllers decide visibility with `isActiveAdmin(user)` and pass `includeDeleted` down.
- Uniqueness checks pass `includeDeleted: true` explicitly, so deleted rows still conflict.

**Validation is Zod via Standard Schema**, not class-validator.

- class-validator is used **only** for env validation in `src/configs/env.validation.ts`.
- Request shapes live in `dto/*.schema.ts` and are attached per-parameter:
  - `@Body({ schema: createCategorySchema })`
  - `@Query({ schema: paginationQuerySchema })`
  - `@Param({ schema: idParamSchema })`
- Types come from `z.infer`.

**Errors are `DomainException` subclasses** from `src/common/exceptions/base.exception.ts`.

- Subclasses: `ValidationException`, `InvalidRequestException`, `ItemNotFoundException`, `DuplicateResourceException`, `ResourceInUseException`.
- Each carries `ErrorDetailDto[]` (`errCode`, `field`, `message`, `description`).
- `GlobalExceptionFilter` renders them as `{ statusCode, message, errors[] }`.
- Throw these from services, **not raw `HttpException`**.

**Message and code strings are centralized.**

| File                                          | Contents                               |
| --------------------------------------------- | -------------------------------------- |
| `src/common/constants/message.constant.ts`    | `ERROR_MESSAGES`, `ERROR_DESCRIPTIONS` |
| `src/common/constants/error-code.constant.ts` | `ERROR_CODES`                          |
| `src/common/constants/validation.constant.ts` | Validation bounds                      |

Controllers reuse the same constants in their `@ApiErrorResponse` docs — so **a new error needs an entry in all three places**.

**Responses** are shaped by `Response*Dto` classes with a static `fromEntity`; entities are never returned directly.

- `TransformResponseInterceptor` wraps a plain result in `{ data }`.
- It leaves an already-paginated `{ data, meta }` (built by `BaseRepository.paginate` / `mapPaginatedResult`) untouched.

**Admin routes use `@AdminOnly()`**, which bundles:

- `AuthGuard` + `RolesGuard` + `@Roles([ADMIN])` + `@ApiBearerAuth()` + the 401/403 Swagger docs.
- Route-specific error docs stay on the route.

**Clerk is the identity source of truth.**

- Admin `role`/`status` changes are pushed to Clerk first, then written back to Postgres by the `user.updated` webhook.
- Clerk access goes through the abstract `AuthProvider` (`ClerkAuthProvider` implementation) — **swap/mock there**.

---

### 3.2 Module shape

`src/modules/<feature>/` contains:

- `controllers/`
- `services/`
- `repositories/`
- `entities/`
- `dto/`
- `enums/` _(optional)_
- `<feature>.module.ts` — wires `MikroOrmModule.forFeature([Entity])` + repository + service + controller

Notes:

- `product-image` and `product-variant` have **no controllers** — they are managed through the product endpoints.
- Entity discovery is **glob-based** in `src/configs/mikro-orm.config.ts`; no manual registration.
- **ESM is real here: relative imports must carry the `.js` extension** (`./category.service.js`), even for `.ts` sources.

---

### 3.3 Tests

- Unit tests sit **next to the source** as `*.spec.ts` and cover controllers, services, and `common/`.
  - Excluded from coverage: configs, migrations, and `common/repositories/`.
- E2E specs bootstrap the app through `test/utils/init-test-app.util.ts`, which mirrors `main.ts`'s prefix / versioning / route-conflict policy.
- E2E specs build URLs from `API_BASE_PATH` in `test/utils/api-path.util.ts` — **do not hardcode `/api/v1`**.

---

## 4. Git workflow

- **Commits:** Conventional Commits, enforced by commitlint in `commit-msg`.
- **Branches:** `<type>/<short-kebab-description>`, cut from the integration branch `feat/coffee-shop-api`.
- **MRs:** feature MRs target `feat/coffee-shop-api` on GitLab and merge with a merge commit.

### Hooks

| Hook         | Runs                                             |
| ------------ | ------------------------------------------------ |
| `pre-commit` | lint-staged (eslint + prettier on staged `*.ts`) |
| `pre-push`   | `pnpm build && pnpm test`                        |

> **Fix the cause rather than passing `--no-verify`.** Full details in `docs/conventions/git.md`.

### CI

`../.github/workflows/ci.yml` is **GitHub Actions** even though development happens on GitLab:

1. lint → unit test → build
2. Docker build + Trivy scan
3. Push to GHCR
4. Render deploy

Triggers only on `coffee-shop-api/**` changes against `feat/coffee-shop-api` or `main`.
