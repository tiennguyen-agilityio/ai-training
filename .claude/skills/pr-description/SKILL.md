---
name: pr-description
description: Draft a GitHub PR title and description for the current branch from .claude/templates/pr-description.md, using only facts from the diff, the spec files and the verify result. Use when the user asks for a PR description or wants to open a PR, and at Gate 3 of /work-ticket.
argument-hint: [base branch, default develop]
---

# Draft a PR description

Arguments: `$ARGUMENTS` — optionally a base branch (default `develop`). Run from the repo root.

1. **Collect the inputs.**
   - Branch: `git branch --show-current`.
   - Base branch and PR target: inside `/work-ticket`, the plan's Git section; otherwise the argument or `develop`.
   - Base commit: `git fetch origin <base>`, then `git merge-base HEAD origin/<base>`.
   - Spec dir: the directory that holds `docs/specs/*/<feature-name>/plan.md`, where `<feature-name>` is the part of the branch after `<type>/`. Several → the newest date. None → no spec dir.
   - `git status --short`: uncommitted changes are not part of the PR; tell the user if there are any.
2. **Draft.** Dispatch the `pr-writer` subagent with the branch, base commit, PR target, spec dir (or "none") and the template path `.claude/templates/pr-description.md`.
3. **Save.** Write the body it returns to `<spec dir>/pr-description.md`, or to `.superpowers/pr-description.md` when there is no spec dir. Both paths are gitignored. Keep the title for `gh pr create --title`.
4. **Show.** Show the title, the body and the TODO list. Every `<TODO>` is resolved with the user before the PR is created, never filled by guessing. A missing screenshot is added under `docs/images/<feature-name>/` and the commit amended once the user approves; then draft again.
5. **Next.** Inside `/work-ticket`, go back to Gate 3. Otherwise ask with AskUserQuestion: A "Push and create the PR with this description" (Recommended), B "Keep the draft only". On A:
   - `git push -u origin <branch>`, then `gh pr create --base <PR target> --head <branch> --title "<title>" --body-file <draft path>`;
   - report the PR URL.

To change the draft, edit the saved file, show it again and ask again. Nothing is pushed and no PR is created without an approved answer.
