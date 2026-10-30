# Test Report: {{feature}}

- Time: {{YYYY-MM-DD HH:mm:ss}} (GMT+7)
- Branch: {{branch}} · Commit: {{short sha of HEAD}}{{ + uncommitted changes, if any}}
- Result: {{PASS / FAIL}} {{(N bugs)}}

## Overview

| Suite | Passed | Failed | Skipped | Duration | Scope |
| --- | --- | --- | --- | --- | --- |
| Unit test (api, Vitest) | {{passed}} | {{failed}} | {{skipped}} | {{duration}} | {{N}} files |
| E2E test (api) | {{passed}} | {{failed}} | {{skipped}} | {{duration}} | {{N}} files |
| Unit test (web, Jest) | {{passed}} | {{failed}} | {{skipped}} | {{duration}} | {{N}} suites |

<!-- One row set per changed app (.claude/rules/workflow.md rule 0); drop the rows of an app that did not change.
     E2E not run: put — in the number columns and "Skipped: <reason>" in Scope
     (e.g. "Skipped: DB resolves to coffee_shop, not *_test" or "Skipped: service-only change").
     Web has no e2e suite: add the row `| E2E test (web) | — | — | — | — | n/a: no web e2e suite |`.
     No changed app: drop this table and fill "Plan checks" below. -->

## Bugs ({{N}})

<!-- One block per failing test in this run. With no failures, write "None." and drop the block. -->

### Bug {{i}}: {{api or specFile}} — {{test name}}

| Field | Detail |
| --- | --- |
| Type | {{Unit test / E2E test}} ({{api / web}}) |
| API | {{method}} {{path}} <!-- — for unit tests, and — for web --> |
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

<!-- One "### {{app}}" block per changed app; no changed app: drop this section. -->

### {{app}}

Compared with the baseline from {{YYYY-MM-DD}}, commit {{base commit}}.

<!-- Paste the output of, run from apps/<app>/:
     node ../../.claude/scripts/coverage-diff.mjs diff ../../<spec dir>/coverage-baseline-<app>.json <changed src files>
     For api, use coverage-baseline.json when coverage-baseline-api.json is absent (a spec started before per-app baselines).
     Do not compute or edit the numbers by hand. -->

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| {{file}} | {{before}}% → {{after}}% ({{delta}}) | {{before}}% → {{after}}% ({{delta}}) | {{before}}% → {{after}}% ({{delta}}) | {{before}}% → {{after}}% ({{delta}}) |
| {{new file}} | {{pct}}% | {{pct}}% | {{pct}}% | {{pct}}% (no baseline) |

Coverage drops (warning only, not a failure):

- {{file}} {{metric}} {{before}}% → {{after}}%

> {{baseline warning — e.g. "No baseline: captured after code changes started", or "Baseline is from an older base commit"}}

## Plan checks

<!-- Only when there is no changed app (workflow rule 0): the plan's `## Plan checks`, run at step 8. Otherwise drop this section.
     In report.md, a requirement proven here is `PASS (plan check)`; a test passed in a verify run is `PASS`; a web UI requirement shown by an after screenshot is `PASS (screenshot, manual)`; anything else is `Not verified` (workflow rule 9). -->

| Check | Command or steps | Result |
| --- | --- | --- |
| {{M1: name}} | `{{command}}` or {{steps}} | {{PASS / FAIL}}: {{observed result}} |

## Scope

- Changed files:
  - {{path}}
- Unit tests run: {{per changed app: spec list, or "all (N files)" / "all (N suites)"}}
- E2E tests run: {{spec list, or "not run"}}
- Scope notes:
  - {{note}}
