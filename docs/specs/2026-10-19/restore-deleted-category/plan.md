# Restore a Deleted Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `PATCH /api/v1/categories/:id/restore` so an admin can bring back a soft-deleted category.

**Architecture:** A generic `BaseRepository.restore` mirrors `softDelete`. `CategoryService.restore` loads the category including deleted rows, rejects one that is not deleted with a new `InvalidStateException` (409), and restores it. An `@AdminOnly()` controller route exposes it and returns `ResponseCategoryDto`.

**Tech Stack:** NestJS 12, TypeScript 6 (ESM), MikroORM, Zod (Standard Schema), Vitest, supertest.

**Spec:** `docs/specs/2026-10-19/restore-deleted-category/design.md`

## Git

| | |
| --- | --- |
| Base branch | `feat/claude-example` |
| Base commit | `e7a1f02` — chore: add work-ticket workflow, rules and test report template (2026-10-19) |
| Feature branch | `feat/restore-deleted-category` |
| MR target | `feat/claude-example` |


## Global Constraints

From `.claude/rules/coding.md`:
- `BaseRepository` is the only MikroORM-aware layer; the service never touches `EntityManager`.
- Soft delete is the `softDelete` filter, toggled with `options.includeDeleted`.
- Throw `DomainException` subclasses from services, never raw `HttpException`.
- A new error needs entries in `ERROR_CODES`, `ERROR_MESSAGES` and `ERROR_DESCRIPTIONS`, reused in the controller's `@ApiErrorResponse`.
- Return `Response*Dto.fromEntity(...)`, never the entity.
- Admin routes use `@AdminOnly()`; params use `@Param({ schema: idParamSchema })`.
- Relative imports carry the `.js` extension.
- No entity change, so no migration.

From `.claude/rules/testing.md`:
- Vitest (`vi.fn()`), unit specs next to the source.
- E2E specs build URLs from `API_BASE_PATH`, never `/api/v1`.
- Check the e2e database guard before running e2e (`verify` skill).

From the spec:
- New error values, verbatim: `categoryNotDeleted` / `Category is not deleted` / `Only a deleted category can be restored.`
- `InvalidStateException`: status 409, top-level message `ERROR_MESSAGES.EXCEPTION.CONFLICT`, `field: 'id'`.
- Restore changes only `deletedAt`; `name` and `slug` stay as they are.

## Review Focus

1. Restoring the same category twice: the second call must return 409, not 200. → Task 3, e2e "responds 409 on a second restore".
2. A restored category must be usable again: `DELETE` on it responds 204. → Task 3, e2e "can be deleted again after a restore".
3. A non-admin's attempt must leave the category deleted. → Task 3, e2e "403 leaves the category deleted".
4. `PATCH /categories/not-a-uuid/restore` must return 400, not 404. → Task 3, e2e "responds 400 for a malformed id".
5. The new route must not change `PATCH /categories/:id`. → The existing update e2e and unit tests still pass (verify run).

---

### Task 1: Restore in the service layer

**Files:**
- Modify: `src/common/constants/error-code.constant.ts` (`ERROR_CODES.CATEGORY`)
- Modify: `src/common/constants/message.constant.ts` (`ERROR_MESSAGES.CATEGORY`, `ERROR_DESCRIPTIONS.CATEGORY`)
- Modify: `src/common/exceptions/base.exception.ts`
- Modify: `src/common/repositories/base.repository.ts` (next to `softDelete`)
- Modify: `src/modules/category/services/category.service.ts`
- Test: `src/common/exceptions/base.exception.spec.ts`
- Test: `src/modules/category/services/category.service.spec.ts`

**Interfaces:**
- Produces:
  - `ERROR_CODES.CATEGORY.NOT_DELETED = 'categoryNotDeleted'`
  - `ERROR_MESSAGES.CATEGORY.NOT_DELETED = 'Category is not deleted'`
  - `ERROR_DESCRIPTIONS.CATEGORY.NOT_DELETED = 'Only a deleted category can be restored.'`
  - `class InvalidStateException extends SingleErrorDomainException { constructor(error: ErrorDetailDto) }` (409, `ERROR_MESSAGES.EXCEPTION.CONFLICT`)
  - `BaseRepository.restore(entity: T): Promise<void>`
  - `CategoryService.restore(id: string): Promise<Category>`

- [x] **Step 1: Write the failing tests**

In `base.exception.spec.ts`, import `InvalidStateException` and add:

```ts
it('InvalidStateException responds 409 with the CONFLICT message and the given error', () => {
  const error = {
    errCode: ERROR_CODES.CATEGORY.NOT_DELETED,
    field: 'id',
    message: ERROR_MESSAGES.CATEGORY.NOT_DELETED,
    description: ERROR_DESCRIPTIONS.CATEGORY.NOT_DELETED,
  };
  const exception = new InvalidStateException(error);

  expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
  expect(exception.message).toBe(ERROR_MESSAGES.EXCEPTION.CONFLICT);
  expect(exception.getErrors()).toEqual([error]);
});
```

In `category.service.spec.ts`, add `restore: Mock` to the repository mock type and `restore: vi.fn()` in `beforeEach`, then a `describe('restore')`:

- `'restores a soft-deleted category and returns it'`: `findById` resolves `buildCategory({ deletedAt: new Date() })`; `restore` is mocked to set `deletedAt = null`. Expect `findById` called with `('category-id-1', { includeDeleted: true })`, `restore` called with that category, and the result's `deletedAt` to be `null`.
- `'throws InvalidStateException when the category is not deleted'`: `findById` resolves `buildCategory()`. Expect the rejection to be an `InvalidStateException` whose `getErrors()[0].errCode` is `ERROR_CODES.CATEGORY.NOT_DELETED`, and `restore` not called.
- `'throws ItemNotFoundException for a missing id'`: `findById` resolves `null`. Expect `ItemNotFoundException` and `restore` not called.

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/common/exceptions/base.exception.spec.ts src/modules/category/services/category.service.spec.ts`
Expected: FAIL — `InvalidStateException` is not exported, `service.restore` is not a function.

- [x] **Step 3: Implement**

- Add the three constants.
- Add `InvalidStateException` after `ResourceInUseException`, same shape as `DuplicateResourceException`.
- Add `BaseRepository.restore(entity)`: set `entity.deletedAt = null`, then `this.save(entity)`.
- Add `CategoryService.restore(id)`: `this.findOne(id, { includeDeleted: true })`; if `category.deletedAt === null`, throw `InvalidStateException` with `errCode` / `message` / `description` from the `NOT_DELETED` constants and `field: 'id'`; otherwise `await this.categoryRepository.restore(category)` and return the category.

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/common/exceptions/base.exception.spec.ts src/modules/category/services/category.service.spec.ts`
Expected: PASS

### Task 2: Restore route

**Files:**
- Modify: `src/modules/category/controllers/category.controller.ts` (after `update`, before `remove`; new error block next to `CATEGORY_HAS_PRODUCTS_ERROR`)
- Test: `src/modules/category/controllers/category.controller.spec.ts`

**Interfaces:**
- Consumes: `CategoryService.restore(id: string): Promise<Category>`, `InvalidStateException`, `ERROR_*.CATEGORY.NOT_DELETED` (Task 1).
- Produces: `CategoryController.restore({ id }: IdParam): Promise<ResponseCategoryDto>` on `PATCH categories/:id/restore`.

- [x] **Step 1: Write the failing tests**

Add `restore: Mock` / `restore: vi.fn()` to the service mock, then a `describe('restore')`:

- `'delegates to CategoryService.restore and maps to ResponseCategoryDto'`: `restore` resolves `{ ...category, deletedAt: null }`. Expect `restore` called with `'category-id-1'` and the result to equal `ResponseCategoryDto.fromEntity` of it.
- `'propagates InvalidStateException'`: `restore` rejects with an `InvalidStateException` built from the `NOT_DELETED` constants. Expect the call to reject with that class.

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/modules/category/controllers/category.controller.spec.ts`
Expected: FAIL — `controller.restore` is not a function.

- [x] **Step 3: Implement**

- `CATEGORY_NOT_DELETED_ERROR` block, built like `CATEGORY_HAS_PRODUCTS_ERROR` from the `NOT_DELETED` constants.
- `@Patch(':id/restore')`, `@AdminOnly()`, `@ApiOperation({ summary: 'Restore a deleted category (admin only)' })`, `@ApiDataResponse(HttpStatus.OK, ResponseCategoryDto)`, `@ApiErrorResponse` for 404 (`CATEGORY_NOT_FOUND_ERROR`) and 409 (`ERROR_MESSAGES.CATEGORY.NOT_DELETED`, `CATEGORY_NOT_DELETED_ERROR`).
- Body: `ResponseCategoryDto.fromEntity(await this.categoryService.restore(id))`.

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/modules/category/controllers/category.controller.spec.ts`
Expected: PASS

### Task 3: E2E coverage

**Files:**
- Test: `test/e2e/category.e2e-spec.ts`

**Interfaces:**
- Consumes: `PATCH ${API_BASE_PATH}/categories/:id/restore` (Task 2); existing helpers `createTestUser`, `createTestCategory`, `mockSessionFor`, `uniqueName`, and `RequestContext.create(orm.em, () => categoryService.remove(id))` to soft-delete a fixture.

- [x] **Step 1: Write the tests**

- In `'mutating routes without a Clerk session'`, add `['patch', `${API_BASE_PATH}/categories/some-id/restore`]` to the `it.each` table (401).
- In `'mutating routes with an authenticated non-ADMIN user'`: `'PATCH /categories/:id/restore responds 403 and leaves the category deleted'` — soft-delete a fixture, call as a USER, expect 403; then as an ADMIN, `GET /categories?search=<name>` shows it with `deletedAt` not null.
- In `'mutating routes with an authenticated ADMIN user'`:
  - `'PATCH /categories/:id/restore responds 200 and a non-ADMIN sees the category again'` — soft-delete a fixture, restore as ADMIN, expect 200 with `data.id === category.id` and `data.deletedAt === null`; then `mockSessionFor(null)` and `GET /categories/:id` responds 200.
  - `'PATCH /categories/:id/restore responds 404 for a missing category'` — id `00000000-0000-0000-0000-000000000000`, expect 404 and `errors[0].errCode === ERROR_CODES.CATEGORY.NOT_FOUND`.
  - `'PATCH /categories/:id/restore responds 409 for a category that is not deleted'` — active fixture, expect 409 and `errors[0].errCode === ERROR_CODES.CATEGORY.NOT_DELETED`.
  - `'PATCH /categories/:id/restore responds 409 on a second restore'` — soft-delete, restore (200), restore again (409 `NOT_DELETED`).
  - `'a restored category can be deleted again'` — soft-delete, restore, then `DELETE /categories/:id` responds 204.
  - `'PATCH /categories/:id/restore responds 400 for a malformed id'` — `not-a-uuid`, expect 400.

- [x] **Step 2: Check the e2e database guard**

Follow the `verify` skill's e2e guard: the database in `.env.test` must be a separate `*_test` database. If it is not, stop and report; do not run e2e.

- [x] **Step 3: Run the e2e spec**

Run: `pnpm vitest run --config ./vitest.config.e2e.ts test/e2e/category.e2e-spec.ts`
Expected: PASS, including every existing category e2e test.
