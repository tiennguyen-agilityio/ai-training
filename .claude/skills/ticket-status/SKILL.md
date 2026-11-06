---
name: ticket-status
description: Show where a /work-ticket card stopped (flow step, task, task step, files changed since the last boundary, next action, and the PR state at the PR step) without changing or continuing anything. Run only when the user invokes /ticket-status.
argument-hint: [spec dir]
disable-model-invocation: true
---

# Show a card's saved status

Arguments: `$ARGUMENTS` — optional, a spec dir (`docs/specs/<date>/<feature>`).

1. From the repo root, run `node .claude/scripts/ticket-state.mjs status --no-brief`, adding the spec dir when one is given.
   - On a card's branch it prints that card's status, ending with one `Next:` line.
   - On any other branch it prints one line per card in progress, or `No card in progress`.
   - Exit 3 (`No saved status`) means the card has no usable saved status; say so.
2. Show the output unchanged.
3. Only when its `Next:` line starts with `check the PR` (the card is at step 11 or the card move), run `gh pr view <branch> --json state,url` with the `Branch:` line's branch, and add one line: `PR: <state> <url>`, or `PR: none` when no PR exists, or `PR: unknown (<gh error>)` when `gh` fails (offline, not logged in). The saved status may lag here: the session can stop between `gh pr create` and `close`.

Read only. Do not run the `Next:` action, edit files, switch branches, call Trello, or run any `gh` command other than `gh pr view`. To continue the card, the user runs `/work-ticket <card URL>`.
