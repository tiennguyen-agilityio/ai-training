---
name: work-ticket
description: End-to-end workflow for one Trello card on the Claude Training board — discuss, plan, branch, implement, verify, review, commit, open a GitLab MR, update the card. Run only when the user invokes /work-ticket.
argument-hint: <trello card URL> [base branch, default feat/claude-example] | <card URL> done
disable-model-invocation: true
---

# Work a Trello ticket end to end

Arguments: `$ARGUMENTS` — a card URL, optionally a base branch (default `feat/claude-example`), or `<card URL> done`.

Follow `.claude/rules/workflow.md` for every superpowers step; it overrides their save paths, plan header, commit steps, review diff and finishing options. Run commands from `coffee-shop-api/`.

## Gates and notifications

- A 🛑 **Gate** is one AskUserQuestion that names exactly what will happen. Without approval, stop.
- Nothing outward-facing happens outside a gate: no Trello write, commit, push or MR.
- At every gate, and whenever a step fails and you stop, call `PushNotification` first with one line saying what is needed: `work-ticket #<card no>: <step>: <what you need>` (under 200 chars). On completion, send one with the MR and card result. No notifications for routine progress.
- All Trello work goes through the `trello-manager` subagent. Pass write approvals to it explicitly: card + target list.

## Steps

0. **Pre-flight.** If `git status --short` shows changes, stop and report them. Otherwise `git checkout <base> && git pull`.
1. **Read the card.** `trello-manager`, read-only: title, description, list, dependencies, and the current state of the related code.
   - 🛑 **Gate 0.** If the card is not in **IN PROGRESS**, ask to move it there. After approval, dispatch `trello-manager` with the card URL and the target list `IN PROGRESS`. Go to step 2 only after its report lists the move as done.
2. **Discuss → `design.md`.** Invoke `superpowers:brainstorming` with the card as the request, applying workflow rules 1–3: Discussion table, builder check after every playback, save under `docs/specs/<today>/<feature-name>/`.
3. **Plan → `plan.md`.** Invoke `superpowers:writing-plans`, applying rules 4–6: Git section from real git output, Global Constraints from `.claude/rules/`, no commit steps.
4. 🛑 **Gate 1.** Approve the plan and choose subagent-driven or native execution.
5. **Branch + coverage baseline.** Run `git checkout -b <feature branch> <base commit>` using the plan's Git section. If `origin/<base>` has moved past the base commit, ask whether to rebase onto the newest commit; if yes, update the Git section. Then, before touching code, capture `coverage-baseline.json` (workflow rule 7).
6. **Implement.** Invoke `superpowers:subagent-driven-development` or `superpowers:executing-plans`, as chosen at Gate 1. Use TDD and tick the plan's checkboxes as tasks finish.
7. **Verify + test report.** Run the `verify` skill with the unit gate on `test:cov` (workflow rule 7), then write `test-report.md` from `.claude/templates/test-report.md`. Every gate must PASS or be SKIPPED with a reason. On a failure, the notification names `test-report.md`.
8. **Requirements review.** Dispatch the `plan-reviewer` subagent with the plan path and the base commit. Fix any gap, then go back to step 7.
9. **Code review.** Run `superpowers:requesting-code-review` following workflow rule 8: uncommitted diff against the base commit, plus `.claude/rules/`. Handle findings with `superpowers:receiving-code-review`. If you fixed anything, go back to step 7. When the review is clean, write `report.md` (rule 9).
10. 🛑 **Gate 2: commit.** Show `git diff --stat`, a short verify / plan-review / code-review summary, and the commit messages:
    - `docs: add design and plan for <feature>` for `design.md`, `plan.md`, `report.md`, `test-report.md` and `coverage-baseline.json`;
    - `fix: …` or `feat: …` for code and tests.

    Use Conventional Commits and end each message with the session's Co-Authored-By line. If a hook fails, fix the cause; never use `--no-verify`.
11. 🛑 **Gate 3: finish the branch.** Run `superpowers:finishing-a-development-branch` following workflow rule 10. Its option menu is this gate. For an MR, the user approves the description draft before `glab mr create`.
12. 🛑 **Gate 4.** Move the card to **REVIEW** via `trello-manager`.
13. **Report.** Send the completion notification, then a short summary with links to `report.md`, `test-report.md`, `design.md`, `plan.md`, the MR and the card. The details live in `report.md`; do not repeat them.

## Resume

If the feature branch exists or `docs/specs/*/<feature-name>/` is found, re-read `design.md`, `plan.md`, `report.md` and `test-report.md`. Continue from the first unfinished step, using the plan checkboxes and git state. Do not redo finished steps.

## `done`

Check the MR with `glab mr view <branch>`. If it is merged, 🛑 ask to move the card to **DONE** via `trello-manager`. If it is not merged, report the MR state and stop.
