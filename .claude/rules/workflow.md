# Feature workflow (overrides for superpowers)

For a feature or bug task, use the superpowers skills `brainstorming` → `writing-plans` → `executing-plans` (or `subagent-driven-development` outside `/work-ticket`). They allow user preferences to override their defaults; in this repo, the rules below override them. After implementing, follow this repo's own rules in this order: code review (rule 8), verify of each changed app (rule 7), report (rule 9), commit (rule 11), security review on the commit (rule 8), finishing the branch (rule 10). `/work-ticket` runs the whole flow for a Trello card.

## 0. Changed apps

The changed apps decide which rules, `verify` skill, coverage baseline and security triggers apply. They are what `node .claude/scripts/changed-apps.mjs <base commit>` prints, run from the repo root, and are never classified by hand:

```json
{"apps":["api","web"],"rebuild":["@repo/schemas"],"noApp":false}
```

- Before code exists (planning at step 3, the baseline at step 5), run it with `--files <every file the plan creates or modifies>`.
- Only code or app-config files count: anything under `apps/<app>/` except `apps/<app>/.claude/**` and `*.md`. A change only to Claude config or Markdown has no changed app.
- `packages/constants` and `packages/schemas` count as both apps. Their own gates (lint, format, build, Vitest) are not part of this workflow: lint-staged lints and formats their staged files at commit, and the root pre-push builds and tests them. Other `packages/*`, root config, `.github/` and `docs/` count as no app.
- Each `rebuild` entry has its `dist` rebuilt before the app gates (rule 7), so `tsc`, `next build` and `nest build` never check against a stale one.
- No changed app (`"noApp":true`): no coverage baseline and no `verify`. Step 8 runs the plan's `## Plan checks` and still writes `test-report.md`, with a "Plan checks" section.
- Nested config loads only after a file under the app is touched. Read each changed app's `apps/<app>/.claude/rules/*.md` and `apps/<app>/.claude/skills/verify/SKILL.md` explicitly instead of waiting for them to load.

## 1. Save paths

- Design (brainstorming): `docs/specs/YYYY-MM-DD/<feature-name>/design.md`
- Plan (writing-plans): `docs/specs/YYYY-MM-DD/<feature-name>/plan.md`
- Report (end of review): `docs/specs/YYYY-MM-DD/<feature-name>/report.md`
- Test report (every verify run): `docs/specs/YYYY-MM-DD/<feature-name>/test-report.md`
- Coverage baseline (before any code change): `docs/specs/YYYY-MM-DD/<feature-name>/coverage-baseline-<app>.json`, one per changed app (rule 0), none with no changed app. A spec started before per-app baselines may hold `coverage-baseline.json`: it is the API baseline.
- PR description (Gate 3): `docs/specs/YYYY-MM-DD/<feature-name>/pr-description.md`
- Screenshots (web UI changes only): `docs/images/<feature-name>/<screen>-before.png` and `<screen>-after.png`. Unlike `docs/specs/`, they are committed with the code and embedded in the PR description.
- `test-report.md` has Overview rows and a Coverage block per changed app, or a "Plan checks" section with no changed app (rule 7, `.claude/templates/test-report.md`); `report.md` has one `verify` table per changed app (rule 9).
- Paths are relative to the repo root.
- `<feature-name>` is a kebab-case slug, identical to the part after `<type>/` in the branch name.
- The spec dir is created with the design, under that day's date; every later file goes in the same dir.
- `docs/specs/` is gitignored: these files stay local and are never committed or pushed, including the default commits of `brainstorming` and `writing-plans`.

## 2. Design header, card requirements and Discussion table

When the task comes from a card, put these right under the design's title:

```markdown
**Card:** <Trello card URL>
**Branch:** <type>/<feature-name>
```

Add `**Design approved:** <YYYY-MM-DD>` below them when the user approves the design.

The design lists every requirement on the card, analysed from the description (list items or sentences) and the Trello checklists, whatever form they have there:

```markdown
## Requirements from card

- [ ] R1 — <requirement in the card's words> (description | checklist)
```

Each `R<n>` is ticked at step 8 of `/work-ticket`, once its evidence in the final verify run is `PASS`, `PASS (screenshot, manual)` or `PASS (plan check)` (rule 9).

The design records every question asked during brainstorming and builder checks:

```markdown
## Discussion

| # | Question | Answer (user) | Decision / impact |
| --- | --- | --- | --- |

Answered by the code (not asked):
- <fact> — `<path>`
```

Read the code before asking. Anything the code answers goes in the second list, not to the user.

In `/work-ticket`, when information is missing or ambiguous, or a requirement is unclear, ask with AskUserQuestion in the format the work-ticket skill defines; this overrides `brainstorming`'s one open question with no list of answers. "Answer (user)" records the chosen option or the text the user typed in D.

## 3. Builder check after every playback

Superpowers runs the builder check once, at the end. Here it runs after each playback chunk the user has corrected: dispatch the builder check on the current design draft, bring its "theirs" pile back as the next questions (at most 4 per round, most important first, in one AskUserQuestion call), record answers in the Discussion table, repeat. Stop when the check returns nothing for the user. After 5 rounds, stop and show the user what is still open.

## 4. Git section in the plan header

Add right after `**Spec:**`, filled from real git output, never guessed:

```markdown
## Git

| | |
| --- | --- |
| Base branch | `develop` |
| Base commit | `<short sha>` — <subject> (<YYYY-MM-DD>) |
| Feature branch | `<type>/<feature-name>` |
| PR target | `develop` |
```

- `origin` is GitHub, the only remote used.
- Base branch defaults to `develop` (`docs/conventions/git.md`). PR target defaults to the base branch.
- Base commit at planning time: `git fetch origin <base>`, then `git log -1 --format='%h — %s (%ad)' --date=short origin/<base>`.
- Base commit at branch creation: replace it with `git log -1 --format='%h — %s (%ad)' --date=short HEAD`, run on the new feature branch.
- At Gate 1 approval, add the row `| Gate 1 | approved <YYYY-MM-DD>, <native or subagent-driven> |` at the end of the table; `/work-ticket` always writes `native`. The plan never has it before then.
- `<type>` is `fix`, `feat` or `refactor`. Pick `<type>/<feature-name>` from the card before writing the design.
- Branch name check: `git fetch origin`, then `git branch -a --list '<branch>' 'origin/<branch>'`. Any output → ask the user for another name.

Right after the Git section, map every card requirement to a task and a test:

```markdown
## Card requirements

| R | Task | Test |
| --- | --- | --- |
| R1 | Task <n> | `<test name>` |
```

Right after `## Card requirements`, list what could go wrong while building the change, for Gate 1 to question:

```markdown
## Risks

| Risk | Source | Mitigation |
| --- | --- | --- |
| <what could break> | <design constraint or anti-goal, or `<path>`> | Task <n> (`<test name>`) or `accepted: <reason>` |

- Riskiest task: Task <n> — <why>.
- Rejected approaches: <approach> — <why>.
```

- A risk is about making the change: an existing caller, query or migration it could break, a limit or ordering it relies on, a step that is hard to undo. Input cases that no test covers stay in `writing-plans`' Review Focus.
- Each risk has a mitigation task with its test, or is `accepted` with the reason.
- Rejected approaches come from the design's decisions and from planning; "none" if only one approach was considered.
- No risk found → the table becomes one line `None found: <what was checked>`; the two bullets stay.

When the plan's files give no changed app (rule 0, `--files`), add `## Plan checks` after `## Risks` (and `## Deviations`, once it exists), before the first task. Each check `M<n>` has its command or steps and the expected result, and every R's Test cell in `## Card requirements` names the checks that prove it. Step 8 runs them in place of `verify` (rule 7), and rule 9 records them as `PASS (plan check)`. An approved deviation that changes the changed apps updates the plan with it (rule 6): `## Plan checks` and the Test cells when the change now has no changed app, the tests when it gains one (the report then notes "no clean baseline" for that app, rule 7).

## 5. Global Constraints

The plan's Global Constraints come from the rules of each changed app (rule 0, with `--files` on the plan's files): `apps/<app>/.claude/rules/coding.md` and `testing.md`. Read them while planning, even if no `src/` file has been opened yet, and cite the rules that apply. With no changed app, they come from the conventions of the files the plan touches (for example the format of the rules or skills it edits).

## 6. No commits or hand-offs until approval

Tasks end at "run the tests, expect PASS". Commits happen only after the user approves them (Gate 2 in `/work-ticket`, or when the user asks).

- No worktree: the feature branch in the main checkout is the workspace; do not invoke `using-git-worktrees` and do not run its setup or baseline steps (dependencies are installed; the coverage baseline at step 5 is the baseline run).
- `brainstorming` in `/work-ticket`:
  - always write `design.md` at project size;
  - do not offer the opt-out;
  - do not size it down to a chat answer;
  - no spike;
  - read the code without asking permission first;
  - do not commit.
- `writing-plans`: no commit steps; it ends after saving the plan and does not invoke an execution skill.
- `executing-plans` in `/work-ticket`: after each task passes, dispatch the `plan-reviewer` subagent with the plan path and the task number. It checks that task against its acceptance criteria and that each test the plan names for it asserts the AC. Fix any gap before the next task.
- Deviations from the plan in `/work-ticket`, at step 6 and in any fix at steps 7, 8 and 10 (overrides `executing-plans`' "Rulings, not stalls" and adds a fifth case to its "Four things stop you"). Classify each one by whether it changes what Gate 1 approved:
  - It changes an acceptance criterion, the scope, the `## Card requirements` mapping, an endpoint or request/response shape, an entity or migration, which apps are changed (rule 0), a web route or page added or removed, the `apps/web/src/middleware.ts` matcher, the `apiClient`/service result contract, a dependency, or touches a file the plan does not list (a generated name the plan describes, such as `Migration<timestamp>.ts`, counts as listed) → stop before making it and ask:
    - A "Update the plan as proposed" (Recommended): edit `plan.md`, including `## Card requirements`, `## Risks` and `## Plan checks` (rule 4) when the change affects them, and add the entry to `## Deviations` (task, what changes, why, `approved <YYYY-MM-DD>`). A new task takes the next free number; never renumber tasks, since the ledger records them by number. An R dropped from scope keeps its row, with `out of scope, approved <YYYY-MM-DD>` in the Test column.
    - B "Keep the plan; find another way". If no way inside the plan works, ask again with only A and C.
    - C "Stop to revise the design and plan": add the entry to `## Deviations` marked `pending`, remove the Gate 1 row (and the design's `**Design approved:**` line if the design must change), then stop and notify. On resume, revise the plan for each `pending` entry before Gate 1 asks again; after approval, continue at step 6 on the existing branch.
  - Anything else (an internal name, a helper split out, the order of steps inside a task) → no question; add the entry to `## Deviations` (task, what changed, why) before dispatching `plan-reviewer`.
  - Either way, also write the `Ruling:` line in the `executing-plans` ledger: a task brief copies only its own `### Task N` section, so the ledger is how later tasks learn the decision.
  - `## Deviations` sits right after `## Risks`, before the first task; at the end of the plan, the brief of the last task would include it.
  - Not deviations: files the workflow itself creates (`docs/images/<feature-name>/` screenshots) and the lockfile change of an approved dependency.
  - A deviation that `plan-reviewer` reports as already in the diff gets the same question, with B meaning revert it.
- `subagent-driven-development` (not used by `/work-ticket`):
  - implementers do not commit;
  - do not run `review-package`;
  - for each task review and fix re-review, write `git diff HEAD -U10` and `git status --short -uall` to a file under `.superpowers/sdd/` and give the reviewer its path;
  - the reviewer reads untracked files in full and judges only the current task's requirements, since the diff also holds earlier tasks.
- `subagent-driven-development` and `executing-plans`: end when the last task is done; no final whole-branch review; no `finishing-a-development-branch`.

## 7. Verification and test report

**Autofix**, once for the whole change, from the repo root, with or without a changed app:

1. Run `git add -N` on the untracked files from `git status --short -uall`.
2. Run `pnpm exec lint-staged --diff=<base commit> --no-hide-partially-staged`. It runs the pre-commit hook's own tasks (each file's closest lint-staged config: an app's or package's `package.json`, or the root `.lintstagedrc.json`) on every file changed since the base commit, instead of only the staged ones. `--no-hide-partially-staged` makes the tasks see the working tree: without it, edits made after an earlier run are hidden, left unformatted, and their restore can conflict. Like the hook, it stages the files it touched, so review and verify read `git diff <base commit>`, never a bare `git diff`. A lint error it cannot fix: fix the cause and run it again.

The autofix runs before every code review (rule 8): the first review of the change at the end of step 6 of `/work-ticket`, and each review of a fix. It runs again at step 8, before `verify`. The commit hook then has nothing left to rewrite, so the reviewed and verified code is the committed code.

**Verify**, for each changed app (rule 0), from `apps/<app>/`. With no changed app, skip it: step 8 runs the plan's `## Plan checks` instead.

- Precondition, once per run before any app's verify, from the repo root: `pnpm --filter <pkg> build` for each `rebuild` entry.
- Run the app's `verify` skill (`apps/<app>/.claude/skills/verify/SKILL.md`). api: lint without `--fix`, format check, build, unit, e2e with the database guard. web: lint without `--fix`, format check, type check, build, unit. Never `pnpm run lint` as a check — it autofixes.

The coverage command `<cov>` depends on the app's runner:

| App | Runner | `<cov>` |
| --- | --- | --- |
| api | Vitest | `pnpm run test:cov --coverage.reporter=json-summary --coverage.reporter=text-summary` |
| web | Jest | `pnpm run test:cov --coverageReporters=json-summary --coverageReporters=text-summary` |

- **Coverage baseline.** Right after creating the feature branch and before changing any code, for each changed app, from `apps/<app>/`, run `<cov>`, then `node ../../.claude/scripts/coverage-diff.mjs snapshot ../../<spec dir>/coverage-baseline-<app>.json`. If code already changed (e.g. on resume), or an app becomes changed after this step (an approved deviation), note "no clean baseline" for that app in the report.
- **Unit gate runs with coverage.** Inside `verify`, the unit gate is the same `<cov>` command, not `pnpm run test`, so tests run once per verify run. The `pnpm run test` of each changed app at the end of `/work-ticket` step 6 is separate: it catches one task breaking another before the code review.
- **One verify run covers every changed app.** A fix after it reruns only the apps whose files the fix changed, or both apps if a package changed. The fix and its rerun are one round (rule 8).
- **Test report after every verify run**, pass or fail, overwritten each time. Fill `.claude/templates/test-report.md` into `<spec dir>/test-report.md`, with Overview rows and a Coverage block per changed app:
  - Overview numbers come from the vitest (api) or jest (web) output of this run (passed / failed / skipped / duration / file count, with jest's suite count as the file count).
  - One Bugs block per failing test, with the location, a rerun command, whether it fails in isolation (rerun that test alone), and the cause. Request/Response only for e2e; never include tokens or cookies.
  - The Coverage table is the output of `node ../../.claude/scripts/coverage-diff.mjs diff ../../<spec dir>/coverage-baseline-<app>.json <changed src files>`, run from `apps/<app>/`, pasted unchanged. For api, use `coverage-baseline.json` when `coverage-baseline-api.json` is absent. Drops are warnings, not failures.
  - A skipped e2e run is a row with `—` and "Skipped: <reason>". Web has no e2e suite: its row is n/a.
  - With no changed app, the report has a "Plan checks" section (`Check | Command or steps | Result`) instead of the app sections.
- The last verify run before commit produces the report; it must match the code being committed.

## 8. Code review and security review

**Code review, before the commit.** First run the autofix (rule 7), which also runs `git add -N` on the untracked files, so `git diff <base commit>` shows new files too and the review reads formatted code. Then invoke the built-in `code-review` skill at `medium`, and name in the prompt:
- the target: the working tree against the plan's base commit, i.e. `git diff <base commit>`. Its default target falls back to `git diff HEAD~1` on a branch with no upstream, and on a fresh feature branch that is the last merged PR;
- the rules to check against: `apps/<app>/.claude/rules/coding.md` and `testing.md` of each changed app; with no changed app, the plan's Global Constraints.

The acceptance criteria were already checked per task (rule 6). Handle each finding by its type:

| Finding | Action |
| --- | --- |
| Bug: wrong behaviour, crash, data loss, security hole, an AC not met | Fix |
| Violation of a changed app's `coding.md` or `testing.md` (with no changed app, the plan's Global Constraints) | Fix |
| Cleanup or suggestion (naming, refactor, simplification) | Do not fix; one line in `report.md` |
| False positive | Push back with the reason; one line in `report.md` |

After fixing a bug, run the related tests and the autofix (rule 7), then `code-review` on the fix. In `/work-ticket`, a fix that changes logic in `src/` after a failed verify also goes back to the code review for that fix, instead of the `verify` skill's step 4 ("Fix and rerun").

**Round limit.** A round is one fix plus the check that follows it: `code-review` on a logic fix, or a `verify` rerun for a test, lint or format fix. The first review of the whole change is not a round. At most 2 rounds before the commit (code review and verify together) and 2 more after it (the security review, where one round is a finding's fix → code review → verify → amend → rerun). Then stop, notify and ask the user. A screenshot the user reports wrong at Gate 2 goes back to the code review (for its fix) and verify, then Gate 2 asks again; that counts as a round.

**Security review, after the commit and before the push.** Run it when the committed change (`<base commit>..HEAD`) touches access control (guards, `@AdminOnly`/`@Roles`, Clerk auth, the global `APP_GUARD`, `apps/api/src/modules/webhook/`, `apps/web/src/middleware.ts`, `apps/web/src/services/api.ts`), config or secrets (`configs/`, `.env*`, CORS, Docker, CI workflows, `apps/web/next.config.ts`, `apps/web/vercel.json`) or dependencies (`package.json`, the lockfile, the `catalog:`). Otherwise skip it.

Invoke the built-in `security-review` skill. It runs `git diff origin/HEAD...`, the committed branch diff against origin's default branch (`develop`), so it needs the commit but no PR. First check `git rev-parse --abbrev-ref origin/HEAD`. If it fails, or is not `origin/<base branch>` from the plan, that diff is not this change's diff: tell the user and ask before running it. A missing `origin/HEAD` is set with `git remote set-head origin -a`. A finding:
1. fix it, then run the code review on the fix;
2. run `verify` (rule 7);
3. `git add -A`, show `git diff --cached --stat`, and amend the commit after the user approves Gate 2 again;
4. rerun `security-review`.

The round limit above applies. Nothing is pushed yet, so no force-push is needed.

The multi-agent `/claude-security` scan is not part of this flow. The user runs it by hand on a high-risk PR, before a release, or as a periodic scan.

## 9. Report

Before asking to commit, write `report.md` with:

- a link to `test-report.md` and one `verify` table per changed app (with no changed app, the plan checks);
- an `R → test → result` table from the final verify run. Each row has one evidence type:
  - `PASS`: a test passed in the final verify run;
  - `PASS (screenshot, manual)`: a web UI requirement shown by the `docs/images/<feature-name>/<screen>-after.png` the row links. These rows are listed apart from the test PASS rows, never counted with them, and confirmed by the user at Gate 2;
  - `PASS (plan check)`: a check from the plan's `## Plan checks`, with its command or steps and the observed result. Only when there is no changed app;
  - `Not verified`, with the reason, for the user to check, never PASS: an AC with no test, a test in a SKIPPED gate (e.g. e2e skipped by the database guard), or a test that only a package runs ("package tests run only in pre-push");
- the code-review result: findings fixed, and findings left with their reason (cleanup or false positive);
- one Security line. Step 8 writes `Security: pending`. Step 10 of `/work-ticket`, after the commit, replaces it with `no findings`, `findings fixed` (plus each finding and its fix) or `skipped, no security-relevant change`. A rerun of step 8 during step 10 keeps the Security line and its findings as they are;
- the plan's `## Deviations`, or "none";
- tests added, and decisions made at each gate.

## 10. Finishing the branch

No `superpowers:finishing-a-development-branch`, and no verify rerun: the last verify run produced the report, and pre-push runs `turbo run build test --affected`.

- Run the `pr-description` skill, which saves the draft to `<spec dir>/pr-description.md`. Show the title, the body and its TODOs.
- Then ask A "Push and create the PR with this description" (Recommended) or B "Keep the branch as-is". There is no local merge option: this repo merges through GitHub PRs with a merge commit. Nothing is pushed before the user picks A.
- To change the draft, the user answers in D (Other); edit `pr-description.md`, show it again and ask again. Every `<TODO>` is resolved before A runs; a missing screenshot is added under `docs/images/<feature-name>/` and the commit amended once the user approves.
- Option A: `git push -u origin <branch>`, then `gh pr create --base <PR target> --head <branch> --title "<title>" --body-file <spec dir>/pr-description.md`. The base branch and the PR target come from the plan's Git section. In `/work-ticket`, step 12 then moves the card to REVIEW; `.github/workflows/trello.yml` moves the card on the description's `**Ticket:**` line to DONE when the PR is merged.

## 11. Commit

- One commit for the code, the tests and any screenshots in `docs/images/`.
- The message is one Conventional Commits subject (`feat`, `fix` or `refactor`): no body, no `Co-Authored-By` or other trailer.
- The commit uses the user's git identity.
- `docs/specs/` is not part of it.
