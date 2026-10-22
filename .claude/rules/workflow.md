# Feature workflow (overrides for superpowers)

For a feature or bug task, use the superpowers skills: `brainstorming` → `writing-plans` → `subagent-driven-development` or `executing-plans` → `requesting-code-review` → `finishing-a-development-branch`. They allow user preferences to override their defaults; in this repo, the rules below override them. `/work-ticket` runs the whole flow for a Trello card.

## 1. Save paths

- Design (brainstorming): `docs/specs/YYYY-MM-DD/<feature-name>/design.md`
- Plan (writing-plans): `docs/specs/YYYY-MM-DD/<feature-name>/plan.md`
- Report (end of review): `docs/specs/YYYY-MM-DD/<feature-name>/report.md`
- Test report (every verify run): `docs/specs/YYYY-MM-DD/<feature-name>/test-report.md`
- Coverage baseline (before any code change): `docs/specs/YYYY-MM-DD/<feature-name>/coverage-baseline.json`
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

Each `R<n>` is ticked at step 9 of `/work-ticket`, once its task is finished.

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
- At Gate 1 approval, add the row `| Gate 1 | approved <YYYY-MM-DD>, <native or subagent-driven> |` at the end of the table. The plan never has it before then.
- `<type>` is `fix`, `feat` or `refactor`. Pick `<type>/<feature-name>` from the card before writing the design.
- Branch name check: `git fetch origin`, then `git branch -a --list '<branch>' 'origin/<branch>'`. Any output → ask the user for another name.

Right after the Git section, map every card requirement to a task and a test:

```markdown
## Card requirements

| R | Task | Test |
| --- | --- | --- |
| R1 | Task <n> | `<test name>` |
```

## 5. Global Constraints

The plan's Global Constraints come from `apps/api/.claude/rules/coding.md` and `apps/api/.claude/rules/testing.md`. Read both while planning, even if no `src/` file has been opened yet, and cite the rules that apply.

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
- `subagent-driven-development`:
  - implementers do not commit;
  - do not run `review-package`;
  - for each task review and fix re-review, write `git diff HEAD -U10` and `git status --short -uall` to a file under `.superpowers/sdd/` and give the reviewer its path;
  - the reviewer reads untracked files in full and judges only the current task's requirements, since the diff also holds earlier tasks.
- `subagent-driven-development` and `executing-plans`: end when the last task is done; no final whole-branch review; no `finishing-a-development-branch`.

## 7. Verification and test report

Start from `apps/api/`:

1. List the changed files: `git diff --name-only --relative --diff-filter=d <base commit> -- '*.ts'` plus `git ls-files --others --exclude-standard -- '*.ts'`.
2. If the list is not empty, run `pnpm exec eslint --fix <files>` and `pnpm exec prettier --write <files>` on it.
3. Run the `verify` skill (lint without `--fix`, format check, build, unit, e2e with the database guard). Never `pnpm run lint` as a check — it autofixes.

- **Coverage baseline.** Right after creating the feature branch and before changing any code, from `apps/api/`, run `pnpm run test:cov --coverage.reporter=json-summary --coverage.reporter=text-summary`, then `node .claude/skills/verify/coverage-diff.mjs snapshot ../../<spec dir>/coverage-baseline.json`. If code already changed (e.g. on resume), note "no clean baseline" in the report.
- **Unit gate runs with coverage.** In this workflow the unit gate is the same `test:cov` command, not `pnpm run test`, so tests run once.
- **Test report after every verify run**, pass or fail, overwritten each time. Fill `.claude/templates/test-report.md` into `<spec dir>/test-report.md`:
  - Overview numbers come from the vitest output of this run (passed / failed / skipped / duration / file count).
  - One Bugs block per failing test, with the location, a rerun command, whether it fails in isolation (rerun that test alone), and the cause. Request/Response only for e2e; never include tokens or cookies.
  - The Coverage table is the output of `node .claude/skills/verify/coverage-diff.mjs diff ../../<spec dir>/coverage-baseline.json <changed src files>`, run from `apps/api/`, pasted unchanged. Drops are warnings, not failures.
  - A skipped e2e run is a row with `—` and "Skipped: <reason>".
- The last verify run before commit produces the report; it must match the code being committed.

## 8. Code review before commit

Use `superpowers:requesting-code-review`, adjusted for uncommitted work:

- `{BASE_SHA}` is the base commit from the plan's Git section; `{HEAD_SHA}` is `WORKTREE (uncommitted)`.
- Tell the reviewer to run `git diff <base commit>` (staged and unstaged) and `git status --short -uall`, and to read untracked files in full. `git diff BASE..HEAD` would miss uncommitted code.
- `{PLAN_OR_REQUIREMENTS}` is the plan path. The reviewer also checks against `apps/api/.claude/rules/coding.md` and `apps/api/.claude/rules/testing.md`.
- Handle feedback with `superpowers:receiving-code-review`: fix Critical and Important, then rerun `verify` and the review; record Minor in the report; push back with reasoning when the reviewer is wrong.
- In `/work-ticket`, a fix from the requirements review (step 8) or the code review (step 9) reruns step 7, then step 8, then step 9. `report.md` is written only when steps 7–9 pass with no fix in between.
- With subagent-driven execution each task was already reviewed; this whole-change review still runs.

## 9. Report

Before asking to commit, write `report.md`: a link to `test-report.md`, the `verify` table, plan-review result (gaps found and fixed), code-review result (Critical/Important fixed, Minor left), card requirement coverage, tests added, and decisions made at each gate.

## 10. Finishing the branch

Use `superpowers:finishing-a-development-branch` with:

- Step 1 runs the `verify` skill instead of a generic test command.
- Step 3 takes the base branch from the plan's Git section.
- Step 4 offers A "Push and create a Pull Request" (Recommended) and B "Keep the branch as-is". The local merge option is not offered, because this repo merges through GitHub PRs with a merge commit.
- Option A: `git push -u origin <branch>`, then `gh pr create --base <PR target> --head <branch>`. The description follows `docs/exercises/day-01.md` §3 — Title / Summary / Changes / How to test, a before/after table, under 200 words, only facts from the diff and the verify run; the verify result goes in How to test. Show the user the draft before creating the PR.

## 11. Commit

- One commit for the code and tests.
- The message is one Conventional Commits subject (`feat`, `fix` or `refactor`): no body, no `Co-Authored-By` or other trailer.
- The commit uses the user's git identity.
- `docs/specs/` is not part of it.
