# Design: Restore a deleted category (API)

- **Card:** [#1 [Feature] Let admins restore a deleted category from the Categories list](https://trello.com/c/OxXGjbGm/1-feature-let-admins-restore-a-deleted-category-from-the-categories-list)
- **Reporter:** Shop manager
- **Date:** 2026-10-19
- **Status:** ready for review

## Intent

Today a deleted category cannot be brought back. It cannot be re-created either: creating a category with the name of a deleted one (for example "Espresso") fails with "Category name already exists", because the name uniqueness check includes deleted rows. The admin website needs an action in the Categories list that restores a deleted category so it works like any other category again.

This card covers **only the API** in `coffee-shop-api`. The admin website is built separately.

## Goals

- An admin-only endpoint that restores one soft-deleted category.
- After a restore, the category behaves like a category that was never deleted: it is visible to everyone in `GET /categories` and `GET /categories/:id`, and it can be updated and deleted again.
- Clear, distinct errors the admin website can act on.

## Non-goals

- Any UI work (restore icon, confirm popup). Those belong to the admin website.
- Restoring from the "Add category" form when the name clashes. Decided in `docs/exercises/day-02.md` (Ticket 2, scope decision): that error stays, and the admin restores from the list.
- Bulk restore.
- Restore endpoints for other modules. The repository helper is generic, but only categories get an endpoint in this card.

## Anti-goals

- A restore that silently succeeds on a category that is not deleted, hiding a stale admin list.
- Reusing an exception whose name says something false (`DuplicateResourceException`, `ResourceInUseException`) for the "not deleted" case.

## Behaviour

`PATCH /api/v1/categories/:id/restore`, `@AdminOnly()`, no request body.

| Case | Status | Body |
| --- | --- | --- |
| Category is soft-deleted | **200** | `{ data: ResponseCategoryDto }` with `deletedAt: null` |
| `id` is not a valid id | **400** | `VALIDATION_FAILED`, from `idParamSchema` (existing) |
| No session | **401** | from `@AdminOnly()` (existing) |
| Caller is not an active admin | **403** | from `@AdminOnly()` (existing) |
| No category with this id, deleted or not | **404** | `categoryNotFound` (existing constants) |
| Category exists and is not deleted | **409** | `categoryNotDeleted` (new) |

New error, added in all three constant files as `coding.md` requires:

| Constant | Value |
| --- | --- |
| `ERROR_CODES.CATEGORY.NOT_DELETED` | `categoryNotDeleted` |
| `ERROR_MESSAGES.CATEGORY.NOT_DELETED` | `Category is not deleted` |
| `ERROR_DESCRIPTIONS.CATEGORY.NOT_DELETED` | `Only a deleted category can be restored.` |

The 409 is thrown with a new `InvalidStateException` (409, top-level message `ERROR_MESSAGES.EXCEPTION.CONFLICT`) in `src/common/exceptions/base.exception.ts`, with `field: 'id'` like the other category errors.

No name check is needed on restore: `Category.name` is `@Unique()` across deleted and active rows, so no active category can hold the restored category's name.

## How it is built

- `BaseRepository.restore(entity)`: sets `deletedAt = null` and saves; the counterpart of `softDelete`.
- `CategoryService.restore(id)`:
  1. `findOne(id, { includeDeleted: true })` → 404 if missing.
  2. If `deletedAt` is null → `InvalidStateException` (409).
  3. `categoryRepository.restore(category)`, return the category.
- `CategoryController.restore`: `@Patch(':id/restore')`, `@AdminOnly()`, `@ApiOperation`, `@ApiDataResponse(200, ResponseCategoryDto)`, `@ApiErrorResponse` for 404 and 409; returns `ResponseCategoryDto.fromEntity`.
- No entity change, so no migration.

## Tests

- Unit, `category.service.spec.ts`: restores a deleted category; 404 when missing; 409 when not deleted; `findById` is called with `includeDeleted: true`.
- Unit, `category.controller.spec.ts`: delegates to the service and maps to `ResponseCategoryDto`.
- E2E, `test/e2e/category.e2e-spec.ts`: 401 without a session, 403 for a non-admin, 200 for an admin with `deletedAt: null`, 404 for an unknown id, 409 for an active category, and a non-admin `GET /categories` sees the category again after the restore.

## Calls made by Claude (not asked)

- Endpoint shape `PATCH /categories/:id/restore` with no body, returning 200 and the category, to match `PATCH /categories/:id`.
- New `InvalidStateException` instead of reusing an existing 409 class whose name would be wrong.
- Restore keeps `name` and `slug` unchanged. `slug` is not unique, so a restored "Espresso" can share the slug `espresso` with an active "espresso" (the name check is case-sensitive). That clash can already happen between two active categories and no route looks up by slug, so restore adds no slug check.

## Left to the builder

- Swagger summary wording.
- Test fixture setup, following the existing category specs.

## Discussion

| # | Question | Answer (user) | Decision / impact |
| --- | --- | --- | --- |
| 1 | Is this an API for the admin website's restore button, after which the category works normally again? | Yes, API only. | Scope is `coffee-shop-api`; no UI. |
| 2 | What should restoring a category that is not deleted return? 400 or 409, and with what message? | 409. | `409 categoryNotDeleted` "Category is not deleted", via a new `InvalidStateException`. 400 stays for malformed ids. |
| 3 | Does the restore change anything besides the category itself? | No — category only. | Restore touches only the category row. |

Answered by the code (not asked):

- Admins already see deleted categories in the list, so the card's dependency (day-02 Ticket 1) is done — commit `e2c5a4c`, `src/modules/category/controllers/category.controller.ts` (`includeDeleted: isActiveAdmin(user)`).
- No restore exists in any layer — `grep -i restore src/` matches only test mocks.
- Soft delete sets `deletedAt` and the `softDelete` filter hides it — `src/common/entities/base.entity.ts`, `src/common/repositories/base.repository.ts` (`softDelete`, `buildFindOptions`).
- `name` is unique across deleted rows, so restore cannot create a duplicate — `src/modules/category/entities/category.entity.ts` (`@Unique()`), `CategoryService.create` (`includeDeleted: true`).
- Restoring from the "Add category" form is out of scope — `docs/exercises/day-02.md`, Ticket 2 scope decision.
- 409 is the repo's status for state conflicts on categories — `CATEGORY_HAS_PRODUCTS_ERROR` on `DELETE /categories/:id`.
- `ResponseCategoryDto` already exposes `deletedAt` — `src/modules/category/dto/response-category.dto.ts`.
