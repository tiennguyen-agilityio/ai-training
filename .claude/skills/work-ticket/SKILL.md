---
name: work-ticket
description: End-to-end workflow for one Trello card on the Claude Training board — discuss, plan, branch, implement, verify, review, commit, open a GitHub PR, update the card. Run only when the user invokes /work-ticket.
argument-hint: <trello card URL> [base branch, default develop] | <card URL> done
disable-model-invocation: true
---

# Work a Trello ticket end to end

Arguments: `$ARGUMENTS` — a card URL, optionally a base branch (default `develop`), or `<card URL> done`.

If the arguments end in `done`, go to `done`. Otherwise start at step 0.

Follow `.claude/rules/workflow.md` for every superpowers step; it overrides their save paths, plan header, commit steps, review diff and finishing options. Run commands from the repo root; API-only commands (verify, coverage) from `apps/api/`.

**Card lookup** (step 0 and `done`): take the short link from the card URL (`trello.com/c/<short link>/…`) and run `grep -lE '^(- )?\*\*Card:\*\*.*trello\.com/c/<short link>([/)]|$)' docs/specs/*/*/design.md`. It matches only a design's Card line, not a design that merely links the card. More than one match → ask the user which one, newest first. A glob error (no design exists yet) counts as not found.

## Gates and notifications

- Every question in the run (brainstorming clarifications, builder check, gates, branch name, choosing between designs) is asked with AskUserQuestion. Questions asked together share one call, at most 4.
  - Option A goes first, labelled "(Recommended)".
  - Then B, and C only when a real third option exists.
  - D is the tool's "Other" field, for the user's own input.
  - Wait for the answer.
- A 🛑 **Gate** is a question whose options name exactly what will happen. Without approval, stop.
- Nothing outward-facing happens outside a gate: no Trello write, commit, push or PR.
- At every gate, and whenever a step fails and you stop, call `PushNotification` first with one line saying what is needed: `work-ticket #<card no>: <step>: <what you need>` (under 200 chars). On completion, send one with the PR and card result. No notifications for other questions or routine progress.
- All Trello work goes through the `trello-manager` subagent. Pass write approvals to it explicitly: card + target list.

## Steps

0. **Pre-flight.** Run the card lookup. Found → go to Resume. Not found: if `git status --short` shows changes, stop and report them; otherwise `git checkout <base> && git pull`.
1. **Read the card.** `trello-manager`, read-only: title, full description, every checklist with its items, list, dependencies, and the current state of the related code.
   - Pick the branch name `<type>/<feature-name>` from the card (workflow rule 4). Run `git fetch origin`, then `git branch -a --list '<branch>' 'origin/<branch>'`. Any output → ask for another name.
   - 🛑 **Gate 0.** If the card is not in **IN PROGRESS**, ask to move it there. After approval, dispatch `trello-manager` with the card URL and the target list `IN PROGRESS`. Go to step 2 only after its report lists the move as done.
2. **Discuss → `design.md`.** Invoke `superpowers:brainstorming` with the card as the request, applying workflow rules 1–3 and the rule 6 overrides: always a written design, no commit.
   - Save under `docs/specs/<today>/<feature-name>/`, with the Card and Branch header lines.
   - Turn the card's description and checklists into `## Requirements from card` (R1…).
   - Discussion table; builder check after every playback.
   - When the user approves the design, add the `**Design approved:**` line.
3. **Plan → `plan.md`.** Invoke `superpowers:writing-plans`, applying rules 4–6: Git section from real git output, `## Card requirements` table with every R, Global Constraints from `apps/api/.claude/rules/` (coding.md, testing.md), no commit steps. `writing-plans` ends after saving the plan, with no commit; go to Gate 1, which holds the execution choice.
4. 🛑 **Gate 1.** Approve the plan and the branch name, and choose subagent-driven or native execution.
   - If the user changes the branch name, rerun the step 1 name check on the new name, then rename the spec dir and update the design header and the Git section.
   - On approval, add the Gate 1 row to the Git section (rule 4).
5. **Branch + coverage baseline.** Using the plan's Git section:
   - `git fetch origin <base>`
   - `git checkout --no-track -b <feature branch> origin/<base>`
   - Update the Git section's Base commit from `HEAD` (rule 4).
   - Before touching code, capture `coverage-baseline.json` (workflow rule 7).
   - If the plan changes the web UI (`apps/web`), save a before screenshot of each affected screen to `docs/images/<feature-name>/<screen>-before.png` (Playwright on localhost, or the user adds it).
6. **Implement.** Invoke `superpowers:subagent-driven-development` or `superpowers:executing-plans`, as chosen at Gate 1, with the rule 6 overrides. Use TDD and tick the plan's checkboxes as tasks finish. The step ends when the last task passes.
7. **Verify + test report.** From `apps/api/`, list the changed files with `git diff --name-only --relative --diff-filter=d <base commit> -- '*.ts'` plus `git ls-files --others --exclude-standard -- '*.ts'`; if the list is not empty, run `pnpm exec eslint --fix` and `pnpm exec prettier --write` on it (workflow rule 7). Then run the `verify` skill with the unit gate on `test:cov`, then write `test-report.md` from `.claude/templates/test-report.md`. Every gate must PASS or be SKIPPED with a reason. On a failure, the notification names `test-report.md`. When it passes and the plan changes the web UI, save the after screenshots to `docs/images/<feature-name>/<screen>-after.png`.
8. **Requirements review.** Dispatch the `plan-reviewer` subagent with the plan path and the base commit; tell it to check the `## Card requirements` table too. Fix any gap, then go back to step 7.
9. **Code review.** Run `superpowers:requesting-code-review` following workflow rule 8: uncommitted diff against the base commit, plus `apps/api/.claude/rules/`. Handle findings with `superpowers:receiving-code-review`.
   - If you fixed anything, rerun step 7, then step 8, then step 9.
   - When steps 7–9 pass with no fix in between, check the plan: every checkbox is `[x]` and every `## Card requirements` row points at a finished task. Anything open → back to step 6.
   - Then tick each `R<n>` in the design's `## Requirements from card`.
   - Then write `report.md` (rule 9).
10. 🛑 **Gate 2: commit.** Run `git add -A`, then show `git diff --cached --stat`, the R coverage, a short verify / plan-review / code-review summary, and one commit message per workflow rule 11. Nothing is ticked on Trello. After approval, commit. If the user declines, run `git reset` to unstage (the changes stay in the working tree) and stop. If a hook fails, fix the cause; never use `--no-verify`.
11. 🛑 **Gate 3: finish the branch.** Run `superpowers:finishing-a-development-branch` following workflow rule 10: the `pr-description` skill drafts `pr-description.md`, you show it, and the option menu that follows is this gate. Nothing is pushed before the user approves A. If the user picks B (keep the branch), report the branch name and stop: skip Gate 4 and step 13.
12. 🛑 **Gate 4.** Move the card to **REVIEW** via `trello-manager`.
13. **Report.** Send the completion notification, then a short summary with the PR link, the card link, and the local paths of `report.md`, `test-report.md`, `pr-description.md`, `design.md` and `plan.md`. The details live in `report.md`; do not repeat them.

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
| no `coverage-baseline.json` | finish step 5: capture the baseline (workflow rule 7) |
| feature branch exists | the first unfinished step from the plan checkboxes, `test-report.md`, `report.md`, commits after the base commit (Gate 2 done) and `gh pr view <branch>` (Gate 3 done) |

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
3. Merged → 🛑 one gate: move the card to **DONE** and delete the local branch.
4. After approval, dispatch `trello-manager` to move the card. Then:
   - On the merged branch with a dirty tree: stop and report.
   - On the merged branch with a clean tree: `git checkout <base> && git pull && git branch -d <branch>`.
   - On any other branch: `git fetch origin && git branch -d <branch>`, without leaving the current branch.
5. A command that refuses → report its output, name the command that would finish the step, and stop; never run a forced command yourself.
