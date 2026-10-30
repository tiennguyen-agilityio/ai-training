<!-- Title: one Conventional Commits subject, e.g. `fix: treat empty page query param as unset`. -->

**Ticket:** <!-- Trello card URL, or "none" -->

## Summary

<!-- 1–3 sentences: what was wrong or missing, and what this PR does. Body under 200 words, tables not counted. -->

## Changes

<!-- One bullet per change. Name only files that are in the diff. -->

-

## Before / after

<!-- One row per behaviour this PR changes; write every Case cell in the same format. -->

| Case | Before | After |
| --- | --- | --- |
|  |  |  |

## Screenshots

<!-- Only when the PR changes the web UI (apps/web); otherwise delete this section. Images live in docs/images/<feature-name>/ as <screen>-before.png and <screen>-after.png, committed with the code, and are embedded as ![<screen> after](https://github.com/<owner>/<repo>/blob/<commit sha>/docs/images/<feature-name>/<screen>-after.png?raw=true). One row per changed screen. Never use images for test results. -->

| Screen | Before | After |
| --- | --- | --- |
|  |  |  |

## How to test

<!-- Commands a reviewer runs, then the verify result of the last run: one table per changed app (.claude/rules/workflow.md rule 0), headed by the app; drop the table of an app that did not change. -->

**api**

| Gate | Result |
| --- | --- |
| Lint |  |
| Format |  |
| Build |  |
| Unit tests |  |
| E2E tests |  |

**web**

| Gate | Result |
| --- | --- |
| Lint |  |
| Format |  |
| Type check |  |
| Build |  |
| Unit tests |  |
| E2E tests | n/a: no web e2e suite |

<!-- No changed app (only Claude config, Markdown, root config, .github/, docs/ or other packages/* changed): replace the tables with the plan checks from test-report.md:

| Check | Command or steps | Result |
| --- | --- | --- |
|  |  |  |

With no spec dir, use one row instead: | Verify | Not applicable: no app code changed |. With a spec dir whose test-report.md has no Plan checks section yet: <TODO: run the plan checks>.

Requirements shown as `PASS (screenshot, manual)` or `PASS (plan check)` in report.md go in their own list here, apart from the test results. -->

<!-- Optional, for failing or unusual runs: the vitest/jest summary lines as text.
<details><summary>Test output</summary>

    <vitest/jest summary lines>

</details>
-->

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
