# Feature workflow (overrides for superpowers)

For a feature or bug task, use the superpowers skills `brainstorming` → `writing-plans` → `executing-plans` (or `subagent-driven-development` outside `/work-ticket`). They allow user preferences to override their defaults; in this repo, the rules below override them. After implementing, follow this repo's own rules in this order: code review (rule 8), verify (rule 7), report (rule 9), commit (rule 11), security review on the commit (rule 8), finishing the branch (rule 10). `/work-ticket` runs the whole flow for a Trello card.

## 1. Save paths

- Design (brainstorming): `docs/specs/YYYY-MM-DD/<feature-name>/design.md`
- Plan (writing-plans): `docs/specs/YYYY-MM-DD/<feature-name>/plan.md`
- Report (end of review): `docs/specs/YYYY-MM-DD/<feature-name>/report.md`
- Test report (every verify run): `docs/specs/YYYY-MM-DD/<feature-name>/test-report.md`
- Coverage baseline (before any code change): `docs/specs/YYYY-MM-DD/<feature-name>/coverage-baseline.json`
- PR description (Gate 3): `docs/specs/YYYY-MM-DD/<feature-name>/pr-description.md`
- Screenshots (web UI changes only): `docs/images/<feature-name>/<screen>-before.png` and `<screen>-after.png`. Unlike `docs/specs/`, they are committed with the code and embedded in the PR description.
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

Each `R<n>` is ticked at step 8 of `/work-ticket`, once its test passes in the final verify run.

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
- `executing-plans` in `/work-ticket`: after each task passes, dispatch the `plan-reviewer` subagent with the plan path and the task number. It checks that task against its acceptance criteria and that each test the plan names for it asserts the AC. Fix any gap before the next task.
- `subagent-driven-development` (not used by `/work-ticket`):
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

Steps 1–2 (the autofix) also run right after implementing, before the code review (rule 8), so the review reads a formatted diff; in `/work-ticket` that is the end of step 6. `verify` runs after the code review, at step 8 of `/work-ticket`.

- **Coverage baseline.** Right after creating the feature branch and before changing any code, from `apps/api/`, run `pnpm run test:cov --coverage.reporter=json-summary --coverage.reporter=text-summary`, then `node .claude/skills/verify/coverage-diff.mjs snapshot ../../<spec dir>/coverage-baseline.json`. If code already changed (e.g. on resume), note "no clean baseline" in the report.
- **Unit gate runs with coverage.** Inside `verify`, the unit gate is the same `test:cov` command, not `pnpm run test`, so tests run once per verify run. The `pnpm run test` at the end of `/work-ticket` step 6 is separate: it catches one task breaking another before the code review.
- **Test report after every verify run**, pass or fail, overwritten each time. Fill `.claude/templates/test-report.md` into `<spec dir>/test-report.md`:
  - Overview numbers come from the vitest output of this run (passed / failed / skipped / duration / file count).
  - One Bugs block per failing test, with the location, a rerun command, whether it fails in isolation (rerun that test alone), and the cause. Request/Response only for e2e; never include tokens or cookies.
  - The Coverage table is the output of `node .claude/skills/verify/coverage-diff.mjs diff ../../<spec dir>/coverage-baseline.json <changed src files>`, run from `apps/api/`, pasted unchanged. Drops are warnings, not failures.
  - A skipped e2e run is a row with `—` and "Skipped: <reason>".
- The last verify run before commit produces the report; it must match the code being committed.

## 8. Code review and security review

**Code review, before the commit.** First run `git add -N` on the untracked files from `git status --short -uall`, so `git diff` shows new files too. Then invoke the built-in `code-review` skill at `medium`, and name in the prompt:
- the target: the working tree against the plan's base commit, i.e. `git diff <base commit>`. Its default target falls back to `git diff HEAD~1` on a branch with no upstream, and on a fresh feature branch that is the last merged PR;
- the rules to check against: `apps/api/.claude/rules/coding.md` and `apps/api/.claude/rules/testing.md`.

The acceptance criteria were already checked per task (rule 6). Handle each finding by its type:

| Finding | Action |
| --- | --- |
| Bug: wrong behaviour, crash, data loss, security hole, an AC not met | Fix |
| Violation of `apps/api/.claude/rules/coding.md` or `testing.md` | Fix |
| Cleanup or suggestion (naming, refactor, simplification) | Do not fix; one line in `report.md` |
| False positive | Push back with the reason; one line in `report.md` |

After fixing a bug, run the related tests, then `code-review` on the fix. In `/work-ticket`, a fix that changes logic in `src/` after a failed verify also goes back to the code review for that fix, instead of the `verify` skill's step 4 ("Fix and rerun").

**Round limit.** A round is one fix plus the check that follows it: `code-review` on a logic fix, or a `verify` rerun for a test, lint or format fix. The first review of the whole change is not a round. At most 2 rounds before the commit (code review and verify together) and 2 more after it (the security review, where one round is a finding's fix → code review → verify → amend → rerun). Then stop, notify and ask the user.

**Security review, after the commit and before the push.** Run it when the committed change (`<base commit>..HEAD`) touches access control (guards, `@AdminOnly`/`@Roles`, Clerk auth, the global `APP_GUARD`, `apps/api/src/modules/webhook/`), config or secrets (`configs/`, `.env*`, CORS, Docker, CI workflows) or dependencies (`package.json`, the lockfile, the `catalog:`). Otherwise skip it.

Invoke the built-in `security-review` skill. It runs `git diff origin/HEAD...`, the committed branch diff against origin's default branch (`develop`), so it needs the commit but no PR. First check `git rev-parse --abbrev-ref origin/HEAD`. If it fails, or is not `origin/<base branch>` from the plan, that diff is not this change's diff: tell the user and ask before running it. A missing `origin/HEAD` is set with `git remote set-head origin -a`. A finding:
1. fix it, then run the code review on the fix;
2. run `verify` (rule 7);
3. `git add -A`, show `git diff --cached --stat`, and amend the commit after the user approves Gate 2 again;
4. rerun `security-review`.

The round limit above applies. Nothing is pushed yet, so no force-push is needed.

The multi-agent `/claude-security` scan is not part of this flow. The user runs it by hand on a high-risk PR, before a release, or as a periodic scan.

## 9. Report

Before asking to commit, write `report.md` with:

- a link to `test-report.md` and the `verify` table;
- an `R → test → PASS` table from the final verify run. An AC with no test, or whose test sits in a SKIPPED gate (e.g. e2e skipped by the database guard), is listed under Not verified with the reason, for the user to check, never as PASS;
- the code-review result: findings fixed, and findings left with their reason (cleanup or false positive);
- one Security line. Step 8 writes `Security: pending`. Step 10 of `/work-ticket`, after the commit, replaces it with `no findings`, `findings fixed` (plus each finding and its fix) or `skipped, no security-relevant change`. A rerun of step 8 during step 10 keeps the Security line and its findings as they are;
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
