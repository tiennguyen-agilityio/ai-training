---
name: work-ticket
description: End-to-end workflow for one Trello card on the Claude Training board — discuss, plan, branch, implement, review, verify, commit, open a GitHub PR, update the card. Run only when the user invokes /work-ticket.
argument-hint: <trello card URL> [base branch, default develop] | <card URL> done
disable-model-invocation: true
---

# Work a Trello ticket end to end

Arguments: `$ARGUMENTS` — a card URL, optionally a base branch (default `develop`), or `<card URL> done`.

If the arguments end in `done`, go to `done`. Otherwise start at step 0.

Follow `.claude/rules/workflow.md` for every superpowers step; it overrides their save paths, plan header and commit steps. Review, verify and finishing follow the repo's own rules 7–11, not superpowers skills. Run commands from the repo root; app commands (verify, coverage) from each changed app's dir (workflow rule 0).

**Card lookup** (step 0 and `done`): take the short link from the card URL (`trello.com/c/<short link>/…`) and run `grep -lE '^(- )?\*\*Card:\*\*.*trello\.com/c/<short link>([/)]|$)' docs/specs/*/*/design.md`. It matches only a design's Card line, not a design that merely links the card. More than one match → ask the user which one, newest first. A glob error (no design exists yet) counts as not found.

## Gates and notifications

- Every question in the run (brainstorming clarifications, builder check, gates, branch name, choosing between designs) is asked with AskUserQuestion. Questions asked together share one call, at most 4.
  - Option A goes first, labelled "(Recommended)".
  - Then B, and C only when a real third option exists.
  - D is the tool's "Other" field, for the user's own input.
  - Wait for the answer.
- A 🛑 **Gate** is a question whose options name exactly what will happen. Without approval, stop.
- No commit, push or PR happens outside a gate. Moving the card is the exception, approved by invoking `/work-ticket`:
  - step 1 moves it from **TODO** to **IN PROGRESS**;
  - step 12 moves it to **REVIEW** right after the PR is created;
  - `.github/workflows/trello.yml` moves it to **DONE** when the PR is merged;
  - `done` moves it from **REVIEW** to **DONE** if `trello.yml` did not.
  Any other Trello write needs a gate.
- At every gate, and whenever a step fails and you stop, call `PushNotification` first with one line saying what is needed: `work-ticket #<card no>: <step>: <what you need>` (under 200 chars). On completion, send one with the PR and card result. No notifications for other questions or routine progress.
- All Trello work goes through the `trello-manager` subagent. Pass write approvals to it explicitly: card + target list.

## Steps

0. **Pre-flight.** Run the card lookup. Found → go to Resume. Not found: if `git status --short` shows changes, stop and report them; otherwise `git checkout <base> && git pull`.
1. **Read the card.** `trello-manager`, read-only: title, full description, every checklist with its items, list, dependencies, and the current state of the related code.
   - Check the card's list. **REVIEW**, **DONE** or any list other than TODO and IN PROGRESS → do not move it (it may already have a PR or be finished). Notify, report its list and ask: A "Stop" (Recommended) or B "Continue without moving the card". With B, step 12 does not move the card either.
   - Pick the branch name `<type>/<feature-name>` from the card (workflow rule 4). Run `git fetch origin`, then `git branch -a --list '<branch>' 'origin/<branch>'`. Any output → ask for another name.
   - Then, if the card is in **TODO**, dispatch `trello-manager` with the card URL, the source list `TODO` and the target list `IN PROGRESS`, without asking. It re-reads the card and moves it only if it is still in TODO; otherwise it reports the current list and you stop and ask. State that the move is the workflow's own, approved by invoking `/work-ticket`. Continue only after its report lists the move as done; if the move fails, stop and notify. A card already in IN PROGRESS is not moved.
2. **Discuss → `design.md`.** Invoke `superpowers:brainstorming` with the card as the request, applying workflow rules 1–3 and the rule 6 overrides: always a written design, no commit.
   - Save under `docs/specs/<today>/<feature-name>/`, with the Card and Branch header lines.
   - Turn the card's description and checklists into `## Requirements from card` (R1…).
   - Discussion table; builder check after every playback.
   - When the user approves the design, add the `**Design approved:**` line.
3. **Plan → `plan.md`.** Invoke `superpowers:writing-plans`, applying rules 4–6: Git section from real git output, `## Card requirements` table with every R, `## Risks`, `## Plan checks` when the plan's files give no changed app (rule 4), Global Constraints from the rules of each changed app (rule 5), no commit steps. `writing-plans` ends after saving the plan, with no commit, and does not offer an execution choice; go to Gate 1.
4. 🛑 **Gate 1.** Approve the plan and the branch name. The plan always runs natively with `executing-plans` (step 6).
   - Before asking, show: the `plan.md` path and its task titles; the changed apps from `changed-apps.mjs --files` (or "no changed app" and the plan checks); the branch name; and from the plan's `## Risks` the riskiest task, every `accepted` risk, and the rejected approaches.
   - Options:
     - A "Approve and start" (Recommended): add the Gate 1 row to the Git section (rule 4), then go to step 5. If C changed the design, also set the design's `**Design approved:**` line to today.
     - B "Stop here": nothing else is created; `/work-ticket <card URL>` later resumes at Gate 1.
     - C "Request changes", with the change in the answer's notes or in D (Other): a change to the plan, the scope, the design or the branch name. Edit `plan.md` (a scope, requirement or design change also updates `design.md` and its Discussion table), show what changed and ask again. A new branch name reruns the step 1 name check, then renames the spec dir and updates the branch and spec-dir paths in the design and plan headers (`**Branch:**`, `**Spec:**`) and the Git section.
5. **Branch + coverage baseline.** Using the plan's Git section:
   - `git fetch origin <base>`
   - `git checkout --no-track -b <feature branch> origin/<base>`
   - Update the Git section's Base commit from `HEAD` (rule 4).
   - Before touching code, run `node .claude/scripts/changed-apps.mjs --files <the plan's files>` (workflow rule 0) and capture one `coverage-baseline-<app>.json` per changed app (rule 7). No changed app → no baseline.
   - If the plan changes the web UI (`apps/web`), save a before screenshot of each affected screen to `docs/images/<feature-name>/<screen>-before.png` (Playwright on localhost, or the user adds it).
6. **Implement.** Invoke `superpowers:executing-plans` with the rule 6 overrides; never `subagent-driven-development` here. For each task:
   - TDD: write the AC's test, watch it fail, implement, watch it pass.
   - Dispatch the `plan-reviewer` subagent with the plan path and the task number. It checks that task against its acceptance criteria and that each test the plan names for it asserts the AC.
   - A gap → fix it before the next task. Then tick the task's checkbox.
   - A deviation from the plan → workflow rule 6. One that changes what Gate 1 approved is a 🛑 **plan-change gate**: stop before making it and ask with the options in rule 6. An "unapproved deviation" from `plan-reviewer` goes to the same gate. Any other deviation is only recorded, in the plan's `## Deviations` before `plan-reviewer` runs, and in the ledger.
   After the last task, run the autofix on the whole change (workflow rule 7: `lint-staged --diff=<base commit> --no-hide-partially-staged`), rebuild each `rebuild` entry's `dist`, then, for each changed app (workflow rule 0), from `apps/<app>/`, run `pnpm run build` and `pnpm run test`; both must pass before step 7. No changed app → only the autofix runs here.
7. **Code review.** Run the autofix (workflow rule 7; it includes `git add -N` on the untracked files), then invoke the `code-review` skill at `medium`. Per workflow rule 8, name the target (the working tree against the base commit) and the rules files. Handle findings per rule 8:
   - A bug or a rules violation → fix, run the related tests and the autofix, then `code-review` on the fix. Round limit: workflow rule 8.
   - A fix that deviates from the plan (workflow rule 6) goes through the plan-change gate first. This also covers the fixes that step 8 and step 10 send back here.
   - A cleanup or a false positive → do not fix; keep one line for `report.md`.
8. **Verify + test report + `report.md`.** Run the autofix again and the rebuild precondition (workflow rule 7), then, for each changed app (workflow rule 0), from `apps/<app>/`, read and run `apps/<app>/.claude/skills/verify/SKILL.md` with the unit gate on `test:cov`, and write `test-report.md` from `.claude/templates/test-report.md`, with each app's rows and Coverage block. Every gate must PASS, or be SKIPPED or n/a with a reason. No changed app → run the plan's `## Plan checks` instead and write their results in the report's "Plan checks" section.
   - Verify runs before the after screenshots: `next build` rewrites `.next`, so start `next dev` again for the screenshots.
   - On a failure, the notification names `test-report.md`. A fix that changes logic in `src/` goes back to step 7 for that fix; a test, lint or format fix reruns this step. This overrides the `verify` skill's step 4 ("Fix and rerun") for logic fixes.
   - Round limit: workflow rule 8 (shared with step 7 before the commit).
   - When it passes:
     - every plan checkbox is `[x]`;
     - every `R<n>` in the design's `## Requirements from card` has a row in the plan's `## Card requirements` table;
     - every row has one evidence type from workflow rule 9: `PASS`, `PASS (screenshot, manual)`, `PASS (plan check)` or `Not verified`. An AC without a test, or whose test is in a SKIPPED gate (e.g. the API's e2e skipped by the database guard), is Not verified with the reason, never PASS, and does not send you back to step 6;
     - anything open → back to step 6.
   - Tick each `R<n>` in the design's `## Requirements from card` whose row is `PASS`, `PASS (screenshot, manual)` or `PASS (plan check)`; a Not verified `R<n>` stays unticked. Then write `report.md` (rule 9) with `Security: pending`. A rerun from step 10 keeps the existing Security line and its findings.
   - If the plan changes the web UI, save the after screenshots to `docs/images/<feature-name>/<screen>-after.png`, after verify.
9. 🛑 **Gate 2: commit.** Run `git add -A`, then show `git diff --cached --stat`, the R coverage, the plan's `## Deviations` (or "none"), a short verify / code-review summary, the after screenshots of every `PASS (screenshot, manual)` row, and one commit message per workflow rule 11. Approving the commit confirms those screenshots. A screenshot the user reports wrong in D goes back to step 7 for its fix, then step 8, and Gate 2 asks again (workflow rule 8 round limit). Nothing is ticked on Trello. After approval, commit. If the user declines, run `git reset` to unstage (the changes stay in the working tree) and stop. If a hook fails, fix the cause; never use `--no-verify`.
10. **Security review.** Check `<base commit>..HEAD` against the areas listed in workflow rule 8 (access control, config or secrets, dependencies). None touched → replace `Security: pending` in `report.md` with `Security: skipped, no security-relevant change` and go to step 11. Otherwise invoke the `security-review` skill:
    - No finding → `Security: no findings`.
    - A finding → fix it, then `code-review` on the fix (step 7), then step 8; that rerun keeps the Security line.
    - Then 🛑 Gate 2 again: `git add -A`, show `git diff --cached --stat`, and after approval `git commit --amend --no-edit`.
    - Then rerun `security-review`. Round limit: workflow rule 8 (2 rounds after the commit).
    - When it is clean, write `Security: findings fixed` with each finding and its fix.
11. 🛑 **Gate 3: push + open PR.** Follow workflow rule 10:
    - The `pr-description` skill drafts `pr-description.md`; show its title, body and TODOs.
    - This gate's options are A "Push and create the PR with this description" (Recommended) and B "Keep the branch as-is".
    - Nothing is pushed before the user picks A.
    - A → push and `gh pr create`, per rule 10.
    - B → report the branch name and stop: skip steps 12 and 13.
12. **Card → REVIEW.** No gate: right after `gh pr create` succeeds, dispatch `trello-manager` with the card URL, the source list `IN PROGRESS` and the target list `REVIEW` (skip if B was chosen at step 1). State that the move is the workflow's own, approved by invoking `/work-ticket`. If the move fails, stop and notify.
13. **Report.** Send the completion notification, then a short summary with the PR link, the card link (in REVIEW; `.github/workflows/trello.yml` moves it to DONE when the PR is merged, and if that run fails, `/work-ticket <card URL> done` is the fallback), and the local paths of `report.md`, `test-report.md`, `pr-description.md`, `design.md` and `plan.md`. The details live in `report.md`; do not repeat them.

## Resume

The spec dir is the directory of the matched `design.md`; every later file is read from and written to it. Re-read the spec files in it: `design.md`, `plan.md`, `report.md`, `test-report.md` and `pr-description.md`. Do not redo finished steps.

The feature branch is the design's `**Branch:**` line; an older design without `**Branch:**` uses the plan's Feature branch row.

Where to continue (the first matching row wins):

| Found | Continue at |
| --- | --- |
| a feature branch is known and `gh pr view <branch> --json state` shows `MERGED` | the card is finished: report it, suggest `<card URL> done`, and stop |
| design without `**Design approved:**` | step 2 (finish the design, ask for approval) |
| approved design, no `plan.md` | step 3 |
| `plan.md` without the Gate 1 row | Gate 1 |
| feature branch missing | step 5 |
| Base commit differs from `git merge-base <feature branch> origin/<base>` (after `git fetch origin <base>`) | finish step 5: set Base commit from that merge-base, then capture the baseline |
| a changed app without a baseline | finish step 5: capture its baseline (workflow rule 7), unless `node .claude/scripts/changed-apps.mjs <base commit>` already lists that app: its code has changed, so note "no clean baseline" for it instead (rule 7). Classify the changed apps with `node .claude/scripts/changed-apps.mjs --files <the plan's files>`, not from `git diff`: the diff is empty on a fresh branch and partial mid-work. An existing `coverage-baseline.json` is the API baseline. No changed app → no baseline needed |
| commits after the base commit, `Security: pending` in `report.md` and uncommitted changes | a security fix in progress: finish step 10 from its step 7 → step 8 → Gate 2 amend |
| feature branch exists | the first unfinished step from the plan checkboxes, `test-report.md`, `report.md`, commits after the base commit (Gate 2 done), a Security line in `report.md` other than `Security: pending` (step 10 done) and `gh pr view <branch>` (Gate 3 done). The code review leaves no record: with every checkbox ticked and no `report.md`, continue at step 7 (a finished review may run once more) |

Before continuing, act on git:

| Feature branch | Current state | Action |
| --- | --- | --- |
| does not exist | clean tree | `git checkout <base> && git pull` |
| does not exist | dirty tree | stop and report |
| exists | on it | continue; its uncommitted changes are the work in progress |
| exists | on another branch, clean | `git checkout <feature branch>` |
| exists | on another branch, dirty | stop and report |

## `done`

1. Run the card lookup. No match → report and stop. Take the branch and the base from the plan's Git section; with no `plan.md`, take the branch from the design's `**Branch:**` line and the base from the arguments.
2. `gh pr view <branch> --json state,url`. Not merged → report the state and stop.
3. Merged → `trello-manager` (read-only) reads the card's list. If it is still in **REVIEW** (`.github/workflows/trello.yml` normally moves it), dispatch `trello-manager` with the card URL, the source list `REVIEW` and the target list `DONE`, without asking: the move is the workflow's own, approved by invoking `done`. If the move fails, stop and notify. A card in any other list than REVIEW or DONE (for example one left in place by option B at step 1) is not moved: report its list.
4. Delete the local branch, without asking: invoking `done` on a merged PR approves it, and `git branch -d` refuses a branch with commits that are not merged.
   - On the merged branch with a dirty tree: stop and report.
   - On the merged branch with a clean tree: `git checkout <base> && git pull && git branch -d <branch>`.
   - On any other branch: `git branch -d <branch>`, without leaving the current branch. It checks the branch against its upstream (`origin/<branch>`), so no fetch is needed.
5. A command that refuses → report its output, name the command that would finish the step, and stop; never run a forced command yourself.
