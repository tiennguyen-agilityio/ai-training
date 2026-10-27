# CLAUDE.md

Guidance for Claude Code in this repo. App-specific guidance lives next to each app: `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`.

## Layout

- pnpm workspace driven by Turborepo. Git root and workspace root are the same directory; run commands from here unless noted.
- `apps/api/`: NestJS 12 / TypeScript 6 / ESM backend (package `api`).
- `apps/web/`: Next.js frontend (package `web`); see `apps/web/CLAUDE.md`.
- `packages/`: shared config that both apps extend: `@repo/typescript-config` (`nestjs.json`, `nextjs.json`), `@repo/eslint-config` (`nest`, `next`), `@repo/prettier-config` (web adds `semi: false`). Change a rule there, not in an app, then lint both apps.
- `packages/constants` (`@repo/constants`): runtime code both apps import — validation bounds and messages and the product and user enums, taken from the API (the source of truth). ESM, built to `dist` by `tsc` on `pnpm install` (`prepare`) and by turbo `^build`; the API Docker image copies its `dist`.
- Shared devDependency versions (`eslint`, `prettier`, `typescript`, `typescript-eslint`, `@types/node`, …) live in the `catalog:` of `pnpm-workspace.yaml`; apps reference them as `"catalog:"`.
- `docs/`: training material (exercises, conventions), not product docs. `docs/specs/` holds the workflow's design and plan files; it is gitignored, so they are local-only. `docs/conventions/git.md` is the authoritative git workflow.
- `.claude/`: shared workflow, agents, and the `work-ticket` and `pr-description` skills. `hooks/block-forbidden-command.mjs` (PreToolUse on `Bash|Edit|Write|MultiEdit`, wired in `.claude/settings.json`) asks before Claude skips git hooks, force-pushes or pushes to `develop`/`main`, discards uncommitted work, runs `rm -rf` on the project or home, drops DB data or Docker volumes, pipes a script into a shell, or writes to a secret file. `hooks/notify-on-finish.mjs` (UserPromptSubmit, Stop, and Notification on `permission_prompt|elicitation_dialog`) shows a macOS notification (`osascript`; other systems stay silent) when Claude needs you or finishes a turn of at least 60 s with no background task left; `CLAUDE_NOTIFY=0` turns it off, and it does nothing when `CI` or `GITHUB_ACTIONS` is set. API rules and the `verify` skill are in `apps/api/.claude/`.

## Commands

```bash
pnpm install          # whole workspace + git hooks (root "prepare")
pnpm dev | build | lint | test | test:cov | format | format:check   # all packages, via turbo
pnpm dev:api | build:api | lint:api | test:api | start:api            # one app
pnpm dev:web | build:web | lint:web | test:web | start:web
pnpm api <script>     # any API script, e.g. pnpm api migration:up, pnpm api test:e2e
pnpm web <script>     # any web script, e.g. pnpm web test:cov
pnpm build --affected # only packages changed against TURBO_SCM_BASE
```

`lint` runs `eslint --fix`; use the `verify` skill (plain `eslint`) to check without rewriting.

## Git

- Conventional Commits (commitlint in `commit-msg`). Branches `<type>/<short-kebab-description>`; work branches from and targets `develop`. PRs go into `develop` on GitHub and merge with a merge commit.
- Hooks (root `.husky/`):
  - `pre-commit` runs lint-staged with the closest config per staged file: the `lint-staged` block in an app's or `packages/constants`' `package.json`, or the root `.lintstagedrc.json` (Prettier) for the other `packages/` and root files.
  - `pre-push` runs `turbo run build test --affected` against `origin/develop`. Override with `TURBO_SCM_BASE=<ref> git push`. A missing ref runs every package.
- Fix the cause rather than passing `--no-verify`.
- PR descriptions follow `.claude/templates/pr-description.md`; the `pr-description` skill drafts one.

## CI

GitHub Actions; each workflow's header comment explains its jobs.

- `.github/workflows/ci.yml` runs on every PR into `develop`/`main` (no path filter) and on push to `develop`/`main` (path-filtered). It calls `deploy-api.yml` (GHCR + Render) and `deploy-web.yml` (Vercel CLI; the Vercel project is not connected to Git). Shared shell helpers live in `.github/scripts/`. `preview-cleanup.yml` deletes a PR's API preview when the PR closes; `trello.yml` moves the card on the PR's `**Ticket:**` line to DONE on merge.
- A same-repo PR into `develop` gets its own Render API preview (image `:pull-request-<n>`) and a Vercel web preview built against it. `:develop` only ever holds merged code.
- Previews use the develop database; CI never runs migrations (the PR comment warns when `apps/api/src/migrations/` changes).
- `pull-request-checks` is the only required status check: keep every PR job in its `needs`, and never add a path filter to `pull_request`.
- Render settings are in environment `develop-deploy` (secret `RENDER_API_KEY`, variable `RENDER_SERVICE_ID`); Vercel uses repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. No production deploy is configured.
