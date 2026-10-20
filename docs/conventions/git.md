# Git conventions

How we clone, branch, commit and push in this repo. The hooks enforce most of these rules, so a commit or push that breaks them fails locally.

## Clone and set up

```bash
git clone git@gitlab.asoft-python.com:tien.nguyen/ai-training.git
cd ai-training
pnpm install          # whole workspace + git hooks (husky, via the root `prepare`)
```

The git root is the pnpm workspace root; the hooks run from there.

## Branches

| Branch | Purpose |
|---|---|
| `feat/coffee-shop-api` | Integration branch for the API. Feature MRs target this branch. |
| `<type>/<short-kebab-description>` | One branch per task, created from the integration branch. |

Use the same `<type>` as the commit (see below). Examples from history:

- `feat/prevent-delete-category-with-products`
- `feat/update-validation-for-user`
- `refactor/dedup-common-logic`

```bash
git checkout feat/coffee-shop-api
git pull
git checkout -b fix/empty-page-query-param
```

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint (`@commitlint/config-conventional`) in the `commit-msg` hook.

```text
<type>(<optional scope>): <short summary in imperative mood>
```

- Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- Lowercase summary, no trailing period, for example `fix: treat empty page query param as unset`.
- One logical change per commit.

## Hooks

| Hook | Runs | Effect |
|---|---|---|
| `pre-commit` | `lint-staged` | Closest config per staged file: API `*.ts` → `eslint --fix` + `prettier --write`; `packages/` and root files → `prettier --write` |
| `commit-msg` | `commitlint` | Rejects messages that are not Conventional Commits |
| `pre-push` | `turbo run build test --affected` | Builds and tests only the packages changed against `origin/feat/claude-example` (override with `TURBO_SCM_BASE`); blocks the push on failure |

Fix the cause instead of skipping hooks with `--no-verify`.

## Push and merge request

```bash
git push -u origin <branch>
```

Then open a GitLab MR into `feat/coffee-shop-api`. MRs are merged with a merge commit (`Merge branch '<branch>' into 'feat/coffee-shop-api'`). For the MR description, see the template used in [day 01, section 3](../exercises/day-01.md#3-drafting-task).
