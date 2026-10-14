# Day 02: Ticket analysis

**Workshop:** Take 5 real tickets from the training backlog. For each, write a three-sentence analysis: what it asks, what's ambiguous, first step. Use Claude to find gaps and draft clarifying questions, then compare with a partner's analysis.

**Exercise:** Write the questions you'd ask the reporter, then role-play reporter/dev in pairs.

| # | Ticket | Reporter | Dependencies | Status |
|---|---|---|---|---|
| 1 | [Deleted categories are not shown in the admin dashboard](#ticket-1-deleted-categories-not-shown-in-the-admin-dashboard-bug) | Shop manager | — | TODO |
| 2 | [Let admins restore a deleted category from the list](#ticket-2-restore-a-deleted-category-feature) | Shop manager | #1 (admins must see deleted categories before they can restore them) | TODO |
| 3 | [Searching categories for "%" returns all categories](#ticket-3-category-search-with--returns-everything-bug) | Shop manager | — | TODO |
| 4 | [Support filtering by status in the user list](#ticket-4-filter-users-by-status-in-the-user-list-feature) | Shop manager | — | TODO |
| 5 | [Allow users to update the price, discount and quantity of a product](#ticket-5-update-product-price-discount-and-quantity-feature) | Shop manager | — | TODO |

Status follows the Trello board: TODO → IN PROGRESS → REVIEW → DONE.

## Method

**Ticket source:** no partner and no shared training backlog, so I picked 5 topics from real behavior and gaps in coffee-shop-api (2 bugs, 3 features), and Claude wrote them as tickets in a "real reporter" style (short, describing symptoms, missing details). Claude also plays the reporter in the role-play and keeps the reporter's real intent hidden until I ask the right questions.

1. Write my own three-sentence analysis **before** asking Claude, so the comparison is fair.
2. Send the ticket to Claude with the prompt below.
3. Note which gaps Claude found that I missed (and anything it got wrong).
4. Merge the result into a final list of questions for the reporter.
5. Role-play: I ask the reporter my questions, and Claude answers in the reporter's role (only what that person would know).

**Prompt used for every ticket:**
```text
You are helping me analyse a ticket before I start work on it.
I'm a <role, e.g. backend dev> on <project, 1 line>.

Ticket:
<paste the ticket exactly as written: title, description, acceptance criteria>

1. In 3 sentences: what it asks, what's ambiguous, the first step.
2. List the gaps: missing acceptance criteria, unclear scope, edge cases,
   dependencies, risks. Only list gaps that come from the ticket text;
   do not assume details that aren't there.
3. Draft at most 5 clarifying questions for the reporter, most important
   first. Each question must be answerable in one line.
```

---

## Ticket 1: Deleted categories not shown in the admin dashboard (bug)

**Ticket:**
> **[Bug] Deleted categories are not shown in the admin dashboard**
> Reporter: Shop manager
>
> **Where:** admin website → Dashboard → Categories page
>
> **Steps to reproduce:**
> 1. Log in to the admin website.
> 2. Delete a category, for example "Espresso".
> 3. Go back to the Categories page.
>
> **Actual:** the deleted category is gone from the list. I can't see it anywhere.
>
> **Expected:** as an admin, I can still see deleted categories in the list.
>
> **How often:** every time.

**My analysis (before Claude):**
- **What it asks:** show deleted categories in the category list on the admin dashboard.
- **What's ambiguous:** should deleted categories use the same "deleted" style as deleted products and users? Should the edit and delete actions be disabled for them?
- **First step:** reproduce it locally and check the API response to confirm the bug, then read the code to find the exact cause.

**Gaps Claude found that I missed:**
- Why the admin needs them: to restore (links to Ticket 2) or only to look them up.
- What to show: the delete date is available (`deletedAt`), but "who deleted it" is not stored today and would need a new field.
- Scope: other places that use the category list, e.g. the category dropdown when creating a product. Deleted categories must not appear there.
- Edge cases: pagination, search and sorting when deleted categories are mixed in.
- Regression or new feature: did deleted categories ever show before?

**Where Claude was wrong or over-reached:**
- Said "disappearing after delete is normal behavior". In this system it's the opposite: the category API is designed to return deleted categories to active admins (`includeDeleted: isActiveAdmin(user)`), so this is a real bug against the design.
- Risk "the records may have been hard-deleted, so the data is lost": categories are soft-deleted (`deletedAt`), the data is still there.
- Edge cases "a deleted category that still has products" and "a deleted name that matches an active category" can't happen: deleting a category with products is blocked, and names are unique in the database.
- Asked the reporter whether products and users should work the same way. That's answered by the code (products already include deleted ones for admins, users always do), not a reporter question.
- The dependency it mentioned ("Can't re-create a category…") came from an old version of the restore ticket in the same chat. The current Ticket 2 (restore) depends on this ticket; it doesn't conflict.

**Questions for the reporter (final):**
1. Have you ever seen deleted categories in the list before, or is this the first time you need them?
2. What do you need deleted categories for: to restore them, or only to look them up?
3. Should they appear in the same list marked "Deleted", or in a separate tab or filter?
4. When choosing a category for a product, should deleted categories be hidden?

**My analysis vs. Claude:**
- I focused on the UI (same "deleted" style as products/users, disabled actions). Claude covered the business side more: how to show them, why they're needed, and other places that list categories.
- Claude couldn't see the code, so it treated "disappears after delete" as normal and worried about hard deletes. My first step (check the API response, then read the code) is what settles whether it's a backend or frontend bug.

**Role-play notes (reporter's answers):**
1. Not sure if they ever showed before. The reporter only noticed this week, after deleting a category by mistake and trying to find it again.
2. Mainly to **restore** a category deleted by mistake, and also to check what has been deleted. → Ticket 2 (restore) is the real goal; this ticket is the first step.
3. The same list is fine, but deleted categories must be **clearly marked** (greyed out or a "Deleted" label), not look like active ones.
4. Yes, **hide** deleted categories when choosing a category for a product.

**Outcome:** treat this as a bug (the API is designed to return deleted categories to active admins). Acceptance criteria:
- Active admins see deleted categories in the Categories list, clearly marked as deleted.
- Deleted categories never appear in the category dropdown when creating or editing a product.
- Restoring is handled in Ticket 2.

---

## Ticket 2: Restore a deleted category (feature)

**Ticket:**
> **[Feature] Let admins restore a deleted category from the Categories list**
> Reporter: Shop manager
>
> **Where:** admin website → Categories page
>
> **Today:** there is no way to get back a deleted category. When I try to add a category that I deleted before (for example "Espresso"), I get the error "Category name already exists", so I can't create it again either.
>
> **Request:** as an admin, I want a restore action in the Categories list for deleted categories.

**My analysis (before Claude):**
- **What it asks:** admins need to be able to restore a deleted category, so they don't have to add a category again with a name that was deleted before.
- **What's ambiguous:** how should the restore action look: a new "restore" icon in the actions? Is there a specific design? Should there be a confirm popup before restoring?
- **First step:** check whether there is a UI design for the restore action. If there isn't, confirm with the reporter and suggest a "restore" icon in the row actions. Then work out how restore works in the backend (set `deletedAt = null`).

**Gaps Claude found that I missed:**
- Name matching: if the admin types `espresso` (lowercase), should it still offer to restore "Espresso"?

**Where Claude was wrong or over-reached:**
- Asked whether products come back with the category. A category that still has products can't be deleted, so there are none to bring back.
- Asked whether to keep the old details or use the new input. A category only has a name and a slug, and the name is the same, so there's nothing to choose.
- Asked whether only some roles (e.g. managers) can restore. There are only `ADMIN` and `USER` roles, and category writes are admin-only.
- Said repeated delete/re-create could leave several old records with the same name. The `UNIQUE` constraint on `name` makes that impossible.
- Asked which statuses exist besides deleted/active. There is no status field; deletion is stored in `deletedAt`.

**Questions for the reporter (final):**
1. You'd like to restore a category from the Categories list, with a "restore" icon in the row actions, right?
2. Should there be a confirm step before restoring?

**My analysis vs. Claude:**
- I focused on the UI of the restore action (icon, design, confirm popup) and proposed restoring from the Categories list. Claude also suggested restoring from the "Add category" form when the name clashes; I kept it out of scope: the error stays, and the admin can find and restore the category in the list.
- Without the code, most of Claude's other questions (products, roles, statuses, duplicate records) are already answered by the system's rules.

**Role-play notes (reporter's answers):**
1. Yes, restoring from the Categories list is the easiest. The reporter just wants to see the deleted category and click one button to bring it back. It must be **the same category** as before, because its link was already shared on Facebook.
2. No confirm step needed (restoring isn't risky), but show a **success message** after restoring.

**Outcome:** acceptance criteria:
- Deleted categories in the Categories list have a "restore" action (depends on Ticket 1, which makes them visible).
- Restoring brings back the same category (same name and link), with no confirm step.
- A success message is shown after restoring.
- Creating a category with a deleted name still shows "Category name already exists"; the admin restores it from the list instead.

---

## Ticket 3: Category search with "%" returns everything (bug)

**Ticket:**
> **[Bug] Searching categories for "%" returns all categories**
> Reporter: Shop manager
>
> **Where:** admin website → Categories page → search box
>
> **Steps to reproduce:**
> 1. Go to the Categories page.
> 2. Type `%` in the search box.
>
> **Actual:** all categories show up in the results (11 of 11).
>
> **Expected:** no results, because no category name contains "%".
>
> **How often:** every time.

**My analysis (before Claude):**
- **What it asks:** searching for `%` should return only the categories whose name contains "%", instead of all categories as it does today.
- **What's ambiguous:** is it only the `%` character, or do other special characters have the same problem? Should special characters be removed from the text typed into the search box?
- **First step:** reproduce the bug locally, then check whether the search code is shared with other places.

**Gaps Claude found that I missed:**
- Call the API directly (bypassing the UI) to see whether the bug is in the API or the admin website. (Checked: `GET /api/v1/categories?search=%25` returns all 11, so the API is the source.)
- Risk: someone may be using `%` on purpose to list everything.
- Acceptance criteria: searching `50%` should find a category named "50% off". This is also why removing special characters (my idea) would be wrong.

**Where Claude was wrong or over-reached:**
- Asked the reporter about `_` and about the Products/Users search boxes. A dev can check that directly (`_` also returns 11 of 11; the code is shared).
- Worried the frontend might change the query before sending it. Calling the API directly already shows the bug, so the backend is at fault.
- Listed case sensitivity and partial vs. exact matching as unclear. The code uses `ILIKE '%term%'`: partial and case-insensitive.
- Asked which environment. It already reproduces locally, so this adds little.

**Questions for the reporter (final):**
1. How did you find this? Were you searching for something specific?
2. Does anyone on your team use `%` on purpose to list all categories?
3. If a category were named "50% off", should searching `50%` find it?

**My analysis vs. Claude:**
- We both asked whether other special characters have the same problem. Claude went further: check the API directly, and the risk that someone uses `%` on purpose.
- My idea of removing special characters would break searching for names that really contain them.

**Role-play notes (reporter's answers):**
1. Found it by accident: typed "50%" to find a discount category and the whole list came up. Then tried just `%` and got the same result.
2. Nobody uses `%` on purpose. To see all categories, people just clear the search box.
3. Yes, searching "50%" should find categories whose name contains "50%".

**Outcome:** acceptance criteria:
- Search treats `%` (and other special characters) as normal text, not as a "match anything" wildcard.
- Searching `%` returns only categories whose name contains "%" (none with today's data).
- Searching "50%" finds a category named "50% off".
- An empty search box still shows all categories.

---


## Ticket 4: Filter users by status in the user list (feature)

**Ticket:**
> **[Feature] Support filtering by status in the user list**
> Reporter: Shop manager
>
> **Where:** admin website → Users page
>
> **Today:** I can only filter users by role. To find users with a certain status I have to scroll through the whole list.
>
> **Request:** please add a status filter so I can find users by their status.

**My analysis (before Claude):**
- **What it asks:** add a status filter to the user list page.
- **What's ambiguous:** should the UI be a select, like the role filter? Should the options be the statuses that exist today (Active, Inactive)?
- **First step:** check whether there is a UI design for this. If not, suggest a select filter like the role filter. Also check which statuses users actually have.

**Gaps Claude found that I missed:**
- What "status" means to the reporter: ask them to list the statuses they need, instead of assuming the system values. Risk: if their wording doesn't match the stored data, the filter won't solve the problem.
- Select one status or several at once.
- How it combines with the role filter (AND or OR).
- What the API does with an invalid status value (400 or ignore).
- What to show when no users match.

**Where Claude was wrong or over-reached:**
- Worried about users with no status (null). The `status` column is not nullable and defaults to `ACTIVE`.
- Wasn't sure users have a status field at all. They do (`ACTIVE` / `INACTIVE`).
- Wasn't sure the list is paginated. It is (`page`, `limit`).
- Suggested "find users" might mean search. A search box already exists.
- Asked whether the page should show all statuses by default. A dev can pick that sensible default; it isn't worth asking.

**Questions for the reporter (final):**
1. The status filter will be a select, like the role filter, right?
2. We'll support filtering by one status at a time, or "All", right?
3. There are only two statuses today (Active and Inactive), so the select will have three options: All (default), Active and Inactive(includes deleted users). Is that right?

**My analysis vs. Claude:**
- I defined "status" by the values in the system (Active, Inactive) and assumed a select like the role filter. Claude pointed out that "status" isn't defined in the ticket and that the reporter should say what it means to them. That's the main risk of this ticket.
- Without the code, Claude worried about things the system already answers (null status, missing field, paging, search).

**Role-play notes (reporter's answers):**
1. Yes, a select like the role filter.
2. Yes, one status at a time or "All". No need to pick several.
3. Yes, three options are enough.

**Outcome:** acceptance criteria:
- A single-select status filter on the Users page, styled like the role filter.
- Options: All (default), Active, Inactive.
- "Inactive" also returns deleted users (they have the Inactive status).
- Works together with the role filter and the search box.
- Nice to have (not in scope): mark deleted users in the list.

---

## Ticket 5: Update product price, discount and quantity (feature)

**Ticket:**
> **[Feature] Allow users to update the price, discount type, discount value and quantity of a product**
> Reporter: Shop manager
>
> **Where:** admin website → Products → Edit product
>
> **Today:** our coffee prices went up this month, but on the Edit product page I can't find any field to edit the price, discount type, discount value or quantity. I need inputs to edit them.
>
> **Request:** please let users update the price, discount type, discount value and quantity when editing a product.

**My analysis (before Claude):**
- **What it asks:** add inputs to the Edit product page so the price, discount type, discount value and quantity can be updated.
- **What's ambiguous:** the UI/UX, and whether the validation stays the same as when adding a product. Is there anything else to watch out for?
- **First step:** check and confirm the UI/UX and the validation for editing a product, and check whether the backend already supports it.

**Gaps Claude found that I missed:**
- Quantity: set a new total, or add/subtract from the current stock?
- Price history: keep the old price or a change history, or just overwrite it?
- Removing an existing discount from a product.
- Acceptance criteria: the form is prefilled with the current values, and a success message is shown after saving.

**Where Claude was wrong or over-reached:**
- Missed (and so did I): these fields belong to each **variant** (size), not to the product, and a product has several variants. "The price of a product" is ambiguous.
- Asked which roles can edit. Only admins can edit products.
- Asked which discount types exist. They're already defined: `PERCENT` and `FIXED`.
- Listed many validation edge cases (zero or negative price, percent above 100, negative or decimal quantity). The create flow already has these rules (`price ≥ 1`, integer `quantity ≥ 0`, percent `< 100`); editing should reuse them, as I noted.

**Questions for the reporter (final):**
1. For now, we only need to edit the price, discount and quantity of the sizes that already exist, not add new sizes, right?
2. When editing the quantity, we'll set the new total stock directly, right? Or should it add to / subtract from the current stock?

**My analysis vs. Claude:**
- We both wanted to check the UI, the validation and whether the backend supports it. Claude went further on business rules: how quantity changes, price history, and removing a discount.
- Neither of us wrote down that these fields are per variant (size). Claude couldn't see the code, so it also asked about rules that already exist (roles, discount types, validation).

**Role-play notes (reporter's answers):**
1. Yes, only the sizes that already exist (e.g. 250g and 1kg). Each size has its own price, so the reporter needs to edit the price, discount and quantity **per size**. Adding new sizes isn't needed for now.
2. Yes, set the new total stock directly. The reporter counts the stock and enters that number; no adding or subtracting.

**Outcome:** acceptance criteria:
- On the Edit product page, the admin can edit the price, discount type, discount value and quantity: the same fields entered when creating the product.
- Quantity is entered as the new total stock (it replaces the current value; no adding or subtracting).

---

## Git block

**Task:** `pull --rebase`, reading `git log` / `git diff`, merge conflict #1 (lead seeds a conflict deliberately).

**Status:** skipped. Already comfortable with `pull --rebase`, `git log` / `git diff` and resolving merge conflicts in daily work.
