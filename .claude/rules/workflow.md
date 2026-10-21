# Feature workflow (overrides for superpowers)

For a feature or bug task, use the superpowers skills: `brainstorming` → `writing-plans` → `subagent-driven-development` or `executing-plans` → `requesting-code-review` → `finishing-a-development-branch`. They allow user preferences to override their defaults; in this repo, the rules below override them. `/work-ticket` runs the whole flow for a Trello card.

## 1. Save paths

- Design (brainstorming): `docs/specs/YYYY-MM-DD/<feature-name>/design.md`
- Plan (writing-plans): `docs/specs/YYYY-MM-DD/<feature-name>/plan.md`
- Report (end of review): `docs/specs/YYYY-MM-DD/<feature-name>/report.md`
- Test report (every verify run): `docs/specs/YYYY-MM-DD/<feature-name>/test-report.md`
- Coverage baseline (before any code change): `docs/specs/YYYY-MM-DD/<feature-name>/coverage-baseline.json`
- Paths are relative to the repo root.
- `<feature-name>` is a kebab-case slug, identical to the part after `<type>/` in the branch name. All three files are committed.

## 2. Discussion table in the design

The design records every question asked during brainstorming and builder checks:

```markdown
## Discussion

| # | Question | Answer (user) | Decision / impact |
| --- | --- | --- | --- |

Answered by the code (not asked):
- <fact> — `<path>`
```

Read the code before asking. Anything the code answers goes in the second list, not to the user.

## 3. Builder check after every playback

Superpowers runs the builder check once, at the end. Here it runs after each playback chunk the user has corrected: dispatch the builder check on the current design draft, bring its "theirs" pile back as the next questions (at most 5 per round, most important first, each answerable in one line), record answers in the Discussion table, repeat. Stop when the check returns nothing for the user. After 5 rounds, stop and show the user what is still open.

## 4. Git section in the plan header

Add right after `**Spec:**`, filled from real git output, never guessed:

```markdown
## Git

| | |
| --- | --- |
| Base branch | `develop` |
| Base commit | `<short sha>` — <subject> (<YYYY-MM-DD>) |
| Feature branch | `<type>/<feature-name>` |
| MR target | `develop` |
```

- Base branch defaults to `develop` (`docs/conventions/git.md`). MR target defaults to the base branch.
- Base commit: `git fetch origin <base>`, then `git log -1 --format='%h — %s (%ad)' --date=short origin/<base>`.
- `<type>` is `fix`, `feat` or `refactor`. If the branch already exists (`git branch -a --list`), ask the user for another name.

## 5. Global Constraints

The plan's Global Constraints come from `apps/api/.claude/rules/coding.md` and `apps/api/.claude/rules/testing.md`. Read both while planning, even if no `src/` file has been opened yet, and cite the rules that apply.

## 6. No commit steps in tasks

Tasks end at "run the tests, expect PASS". Commits happen only after the user approves them (Gate 2 in `/work-ticket`, or when the user asks).

## 7. Verification and test report

Use the `verify` skill (lint without `--fix`, build, unit, e2e with the database guard). Never `pnpm run lint` as a check — it autofixes.

- **Coverage baseline.** Right after creating the feature branch and before changing any code, from `apps/api/`, run `pnpm run test:cov --coverage.reporter=json-summary --coverage.reporter=text-summary`, then `node .claude/skills/verify/coverage-diff.mjs snapshot ../../<spec dir>/coverage-baseline.json`. If code already changed (e.g. on resume), take the baseline on a clean checkout of the base commit, or note "no clean baseline" in the report.
- **Unit gate runs with coverage.** In this workflow the unit gate is the same `test:cov` command, not `pnpm run test`, so tests run once.
- **Test report after every verify run**, pass or fail, overwritten each time. Fill `.claude/templates/test-report.md` into `<spec dir>/test-report.md`:
  - Overview numbers come from the vitest output of this run (passed / failed / skipped / duration / file count).
  - One Bugs block per failing test, with the location, a rerun command, whether it fails in isolation (rerun that test alone), and the cause. Request/Response only for e2e; never include tokens or cookies.
  - The Coverage table is the output of `node .claude/skills/verify/coverage-diff.mjs diff ../../<spec dir>/coverage-baseline.json <changed src files>`, run from `apps/api/`, pasted unchanged. Drops are warnings, not failures.
  - A skipped e2e run is a row with `—` and "Skipped: <reason>".
- The last verify run before commit produces the report that gets committed; it must match the code being committed.

## 8. Code review before commit

Use `superpowers:requesting-code-review`, adjusted for uncommitted work:

- `{BASE_SHA}` is the base commit from the plan's Git section; `{HEAD_SHA}` is `WORKTREE (uncommitted)`.
- Tell the reviewer to run `git diff <base commit>` (staged and unstaged) and `git status --short -uall`, and to read untracked files in full. `git diff BASE..HEAD` would miss uncommitted code.
- `{PLAN_OR_REQUIREMENTS}` is the plan path. The reviewer also checks against `apps/api/.claude/rules/coding.md` and `apps/api/.claude/rules/testing.md`.
- Handle feedback with `superpowers:receiving-code-review`: fix Critical and Important, then rerun `verify` and the review; record Minor in the report; push back with reasoning when the reviewer is wrong.
- With subagent-driven execution each task was already reviewed; this whole-change review still runs.

## 9. Report

Before asking to commit, write `report.md`: a link to `test-report.md`, the `verify` table, plan-review result (gaps found and fixed), code-review result (Critical/Important fixed, Minor left), tests added, and decisions made at each gate.

## 10. Finishing the branch

Use `superpowers:finishing-a-development-branch` with:

- Step 1 runs the `verify` skill instead of a generic test command.
- Step 3 takes the base branch from the plan's Git section.
- Step 4 recommends option 2. This repo merges through GitLab MRs with a merge commit, so a local merge skips review.
- Option 2: `git push -u origin <branch>`, then `glab mr create --source-branch <branch> --target-branch <MR target>`. The description follows `docs/exercises/day-01.md` §3 — Title / Summary / Changes / How to test, a before/after table, under 200 words, only facts from the diff and the verify run — and links `report.md` and `test-report.md`. Show the user the draft before creating the MR.
