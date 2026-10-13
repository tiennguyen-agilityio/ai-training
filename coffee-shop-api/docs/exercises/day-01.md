# Day 01: Mental model + Claude basics

**Exercise:** In Claude chat, get a useful answer to three real work questions (one bug summary, one "explain this concept", one drafting task); note what prompt changes improved the answer.

## 1. Bug summary

**Question:** List endpoints return 400 when `page` is sent empty (`GET /api/v1/categories?page=&limit=2`) instead of falling back to the default page 1.

**First prompt:**
```text
List endpoints return 400 -Validation failed when `page` is sent empty (`GET /api/v1/categories?page&limit=2`)?
```

**First answer (summary):**
- Assumed the stack was `ValidationPipe` + class-validator/class-transformer.
- Root cause: `?page&limit=2` arrives as `{ page: '' }`. The key exists, so `@IsOptional()` and the default value do not apply. `Number('')` becomes `0`, and `@Min(1)` rejects it.
- Fix: a custom `@ToInt(default)` transform that maps `''`/`null`/`undefined` to the default but leaves junk like `abc` for validation to reject. Also suggested having the client skip empty params, plus e2e tests for `?page`, `?page=`, `?limit=2` (expect 200) and `?page=abc` (expect 400).
- Problem: the explanation of the mechanism is right, but the fix does not fit this project. We use `StandardSchemaValidationPipe` + Zod 4 (`src/common/dto/pagination.schema.ts`), not class-validator. The same thing happens in Zod: `z.coerce.number()` turns `''` into `0`, and `.default(1)` only applies to `undefined`.

**Improved prompt:**
```text
Stack: NestJS 12, global StandardSchemaValidationPipe, Zod 4 (no class-validator).

Pagination schema (src/common/dto/pagination.schema.ts):
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

Bug: GET /api/v1/categories?page=&limit=2 (also ?page&limit=2) returns
400 "Validation failed" for `page`.
Expected: an empty `page`/`limit` falls back to the default (1 / 10).
`?page=abc` and `?page=0` must still return 400.

1. Explain the root cause in Zod terms.
2. Give a minimal fix in the shared schema so every list endpoint gets it.
3. Add vitest + supertest e2e cases for the cases above.
```

**Prompt changes that improved the answer:**
- Name the real stack (NestJS + `StandardSchemaValidationPipe` + Zod 4). Without it, Claude guessed class-validator, and its fix could not be applied here.
- Paste the actual schema code so the answer works on our code, not a generic DTO.
- State expected vs. actual behavior, plus the edge cases that must still fail (`abc`, `0`). This keeps the fix from becoming too lenient.
- Ask for numbered outputs (cause → fix → tests) and name the test tools (vitest + supertest) so the answer is ready to use.

## 2. Explain this concept

**Question:** How does `ValidationPipe` work in NestJS?

**First prompt:**
```text
Explain ValidationPipe in NestJS
```

**First answer (summary):**
- What a pipe is: it runs after guards and interceptors, right before the handler, and either transforms or validates the input.
- `ValidationPipe` with class-validator + class-transformer: setup in `main.ts` / `APP_PIPE`, DTOs must be classes, the 400 error shape, and the internal flow (`plainToInstance()` then `validate()`).
- Options table (`whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`, `exceptionFactory`, ...), plus scenarios: converting query/param types, nested DTOs with `@ValidateNested()` + `@Type()`, and mapped types for update DTOs.
- Pitfalls: interfaces are not validated, arrays need `ParseArrayPipe`, `"false"` becomes `true` with implicit conversion, missing `whitelist` allows mass assignment.
- Weak points: the answer is correct but very long and covers almost every feature at once (setup, options table, nested DTOs, mapped types, scoping, built-in pipes...). The many unrelated snippets make it hard to see the main idea.

**Improved prompt:**
```text
Explain ValidationPipe in NestJS.

About me: backend dev, comfortable with Express and basic NestJS
(modules, controllers, DTOs). I want to understand the concept,
not install it.

Cover, in this order:
1. Where ValidationPipe runs in the request lifecycle.
2. What happens step by step when a request arrives
   (transform -> validate -> error or pass).
3. The 3-4 options that matter most in practice, and why.
4. Common pitfalls, especially with query strings
   (every value arrives as a string).

Use one running example (a create DTO + a pagination query DTO)
instead of many separate snippets. Keep it under ~400 words.
```

**Improved answer (summary):**
- Followed the 4 requested sections in order: where it runs → step by step → options that matter → query-string pitfalls. No installation or setup steps.
- Lifecycle: `Middleware → Guards → Interceptors (before) → Pipes → Handler`, plus a useful consequence: guards run first, so auth fails before validation is even attempted.
- One running example (`CreateProductDto` + `ListProductsQuery`) used all the way through. The step-by-step part traces a real request (`GET /products?page=2&inStock=true`): read the type → transform (`'2'` → `2`, default `limit: 20`) → validate → 400 or pass.
- Exactly 4 options, each with *why*: `whitelist` (blocks mass assignment), `forbidNonWhitelisted` (client typos show up as errors), `transform` (otherwise types lie and defaults never apply), `enableImplicitConversion` (convenient but causes the boolean trap).
- 5 query-string pitfalls: `'false'` → `true`, empty string → `0` (`?page=` fails `@Min(1)`, which is exactly the section 1 bug), defaults only exist with `transform: true`, one value vs. an array (`?tag=a&tag=b`), and body numbers vs. query strings.
- About 410 words including code, roughly at the limit, vs. a much longer feature dump the first time.

**Prompt changes that improved the answer:**
- Said what I already know (Express + basic NestJS, "understand, not install") → no `npm i`, no `main.ts` setup, no beginner explanations. The answer starts directly with the concept.
- Gave an ordered list of what to cover → the answer used the same 4 sections in the same order instead of choosing its own long structure.
- Asked for "the 3-4 options that matter most, and why" → 4 options, each with a practical reason, instead of a 9-row options table.
- Asked for one running example → the same two DTOs explain the flow, the options and the pitfalls. The step-by-step trace of one real request is the clearest part.
- Pointed it at query-string pitfalls → the answer focused on the problems we actually hit, including the empty-string → `0` case from section 1.
- Set a word limit (~400) → about 410 words including code, much shorter and easier to read than the first answer.

## 3. Drafting task

**Question:** Write a merge request (MR) description for the fix to the empty `page` bug (section 1).

**First prompt:**
```text
Write an MR description to fix the 400 blank page error
```

**First answer (summary):**
- A ready-to-paste GitLab MR description: a Conventional Commits title, then Problem / Solution / Changes / Behavior / How to test / Notes.
- Good parts: it explained the root cause clearly, and the before/after table covered both the fixed cases (`?page`, `?page=`) and the cases that must still fail (`?page=abc`, `?page=0`, `?limit=500`).
- Weak points: Claude does not know what the MR actually changed, so it **made up** the implementation: file paths, a `@ToOptionalInt()` decorator, moving defaults into the service, the test file, and `npm run test:e2e`. It even differs from the `@ToInt(1)` fix it suggested in section 1. It looks finished, but every detail would need to be checked against the real diff.
- The prompt was vague ("400 blank page error" could mean a blank UI page), so Claude had to guess what the bug was. It also chose the template, length and tone itself. The answer is long for a small fix.

**Improved prompt:**
```text
Write a GitLab MR description for a small bug fix. Readers: the 2-3 backend
devs who review my MRs.

Use only the facts below. Do not invent file names, functions or commands.
If something is missing, leave a <TODO> placeholder.

Bug: list endpoints return 400 "Validation failed" when `page` is empty
(GET /api/v1/categories?page=&limit=2 or ?page&limit=2).
Root cause: an empty query value arrives as '', is coerced to 0 and fails
min(1). The default only applies when the key is missing.
Fix: <what I changed, in 1-2 lines>
Files changed: <paste `git diff --stat`>
Still returns 400: ?page=abc, ?page=0, ?limit=500.
Tests: <test command + what was added>

Format (our template): Title (Conventional Commits) / Summary / Changes /
How to test. Add a small before/after table.
Under 200 words, plain and direct, no marketing tone.
```

**Improved answer (summary):**
- Followed the requested template exactly: Conventional Commits title (`fix(api): treat empty page query param as unset in list endpoints`) / Summary / Changes / How to test, plus the before/after table.
- About 150 words (limit was 200), plain tone. The Summary restates the root cause in three sentences.
- **Invented nothing.** Fix, files and test command stayed as `<TODO>` placeholders. Claude said at the start that those fields were missing, and offered to fill them once I paste `git diff --stat`, a line on the fix, and the test command.
- The table included every "still 400" case I listed (`?page=abc`, `?page=0`, `?limit=500`).
- Minor issue: the table rows are inconsistent (the first two show the full URL, the rest only the query string). Cause: my prompt itself mixed the formats (`GET /api/v1/categories?page=&limit=2` next to `?page&limit=2` and `?page=abc`), and Claude copied them as written.

**Third prompt (fix the table format):**
```text
Write a GitLab MR description for a small bug fix. Readers: the 2-3 backend
devs who review my MRs.

Use only the facts below. Do not invent file names, functions or commands.
If something is missing, leave a <TODO> placeholder.

Bug: list endpoints return 400 "Validation failed" when `page` is empty.
Endpoint: GET /api/v1/categories
Root cause: an empty query value arrives as '', is coerced to 0 and fails
min(1). The default only applies when the key is missing.

Cases (query string only):
- Now fixed (400 -> 200, page defaults to 1): ?page=&limit=2, ?page&limit=2
- Must still return 400: ?page=abc, ?page=0, ?limit=500

Fix: <what I changed, in 1-2 lines>
Files changed: <paste `git diff --stat`>
Tests: <test command + what was added>

Format (our template): Title (Conventional Commits) / Summary / Changes /
How to test.
Add a before/after table with columns: Request | Before | After.
Write every Request cell as the query string only (e.g. `?page=&limit=2`),
and name the endpoint once in the sentence above the table.
Under 200 words, plain and direct, no marketing tone.
```

**Third answer (summary):**
- Table fixed: every Request cell is a query string only (`?page=&limit=2`, `?page&limit=2`, `?page=abc`, `?page=0`, `?limit=500`), and the endpoint appears once in the line above the table ("Results for `GET /api/v1/categories`").
- All 5 cases are present, in the order I listed them (2 fixed, 3 still 400). The After column is more precise: `200 (page = 1)` instead of `200 (default page)`.
- Still invented nothing: Fix, files and tests stay `<TODO>`, and Claude again asked for the missing data.
- Shorter (about 130 words vs. 150): "How to test" now points to the table ("Check each request in the table returns the After status") instead of repeating every case.

**Prompt changes that improved the answer:**
- Gave the real facts (bug, root cause, edge cases) instead of a vague one-liner → the Summary and table are accurate, with no invented implementation.
- Added the rule "Do not invent ... leave a `<TODO>` placeholder" → this worked: instead of made-up file paths, decorators and commands, the gaps were clearly marked and Claude asked for the missing data.
- Gave the team's template and order → 4 sections instead of the 6 Claude picked on its own.
- Set a word limit and tone (under 200 words, plain) → about 150 words, much shorter than the first answer.
- Named the readers (backend reviewers) → technical, compact wording with no background explanation.
- Described the bug precisely (example URLs) instead of "400 blank page error" → no guessing about what the bug was.

Prompt 2 → prompt 3:
- Wrote all input examples in one consistent format (endpoint once, cases as query strings only) → the table rows came out consistent. Claude follows the format of the examples more than a general instruction.
- Grouped the cases into "now fixed" and "must still return 400", with the expected result → each group became table rows in the same order, and the After column became more precise (`200 (page = 1)`).
- Specified the table exactly (columns, how to write Request cells, where the endpoint goes) → Claude followed every rule, including the line "Results for `GET /api/v1/categories`" above the table.
- Side effect: once the cases were clearly in the table, "How to test" referred to the table instead of repeating them → shorter answer (about 130 words).

## Discussion: where AI output surprised me

**Good:**
- From a one-line prompt, Claude still explained the root cause correctly: the key exists but holds an empty string, so the default is skipped, `''` is coerced to `0`, and the min-1 check fails.
- It went further than asked: it raised the API design choice (strict 400 vs. falling back to the default), suggested a client-side fix, and gave test cases that include the negative case `?page=abc`.
- The `ValidationPipe` explanation was well organized (concept → setup → internals → options → pitfalls) and included practical pitfalls that are easy to miss, such as `"false"` turning into `true` with implicit conversion, and arrays not being validated without `ParseArrayPipe`.
- The MR description had a reviewer-friendly structure without being asked, especially the before/after table that also lists the cases that must still return 400.
- For the explain question, a structured prompt (what I know, what to cover in order, one running example, word limit) turned a feature dump into a focused explanation. It even included the empty `page` → `0` pitfall from the section 1 bug without being asked about it.
- One explicit instruction ("do not invent, leave `<TODO>`") completely changed how Claude handled missing information: it flagged the gaps and asked for the data instead of making it up.

**Bad:**
- Claude confidently assumed the wrong validation library (class-validator instead of Zod) and did not say this was a guess or ask which one we use. The code looked right but cannot be used in this project.
- In the "explain" question, a one-line prompt produced a long feature dump (setup, a full options table, many unrelated snippets) instead of a focused explanation. Without guidance on audience, scope and length, Claude tries to cover everything.
- In the drafting task, Claude wrote an MR description full of specific details (file paths, a new decorator, test commands) that it had invented. Writing tasks are the riskiest place for this: the result looks finished, so made-up facts are easy to miss.
- Lesson: when the prompt lacks context, the AI fills the gaps with the most common setup. Always give the stack and the relevant code. For writing tasks, give the facts and tell it not to invent any. For a consistent output format, first make the input examples consistent.
