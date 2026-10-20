# Test Report: {{feature}}

- Time: {{YYYY-MM-DD HH:mm:ss}} (GMT+7)
- Branch: {{branch}} · Commit: {{short sha of HEAD}}{{ + uncommitted changes, if any}}
- Result: {{PASS / FAIL}} {{(N bugs)}}

## Overview

| Suite | Passed | Failed | Skipped | Duration | Scope |
| --- | --- | --- | --- | --- | --- |
| Unit test | {{passed}} | {{failed}} | {{skipped}} | {{duration}} | {{N}} files |
| E2E test | {{passed}} | {{failed}} | {{skipped}} | {{duration}} | {{N}} files |

<!-- E2E not run: put — in the number columns and "Skipped: <reason>" in Scope
     (e.g. "Skipped: DB resolves to coffee_shop, not *_test" or "Skipped: service-only change"). -->

## Bugs ({{N}})

<!-- One block per failing test in this run. With no failures, write "None." and drop the block. -->

### Bug {{i}}: {{api or specFile}} — {{test name}}

| Field | Detail |
| --- | --- |
| Type | {{Unit test / E2E test}} |
| API | {{method}} {{path}} <!-- — for unit tests --> |
| Expected | {{expected value}} |
| Actual | {{actual value}} |
| Error message | {{message}} |
| Location | {{file}}:{{line}} |
| Rerun | `{{command}}` |
| Fails in isolation | {{yes / no}} |
| Cause | {{code bug / wrong test / flaky}} — {{short explanation}} |

**Request** <!-- E2E only; never include tokens or cookies -->

```json
{{headers that matter}}
{{request body}}
```

**Response** <!-- E2E only -->

```json
{{response body}}
```

## Coverage

Compared with the baseline from {{YYYY-MM-DD}}, commit {{base commit}}.

<!-- Paste the output of:
     node .claude/skills/verify/coverage-diff.mjs diff <spec dir>/coverage-baseline.json <changed src files>
     Do not compute or edit the numbers by hand. -->

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| {{file}} | {{before}}% → {{after}}% ({{delta}}) | {{before}}% → {{after}}% ({{delta}}) | {{before}}% → {{after}}% ({{delta}}) | {{before}}% → {{after}}% ({{delta}}) |
| {{new file}} | {{pct}}% | {{pct}}% | {{pct}}% | {{pct}}% (no baseline) |

Coverage drops (warning only, not a failure):

- {{file}} {{metric}} {{before}}% → {{after}}%

> {{baseline warning — e.g. "No baseline: captured after code changes started", or "Baseline is from an older base commit"}}

## Scope

- Changed files:
  - {{path}}
- Unit tests run: {{spec list, or "all (N files)"}}
- E2E tests run: {{spec list, or "not run"}}
- Scope notes:
  - {{note}}
