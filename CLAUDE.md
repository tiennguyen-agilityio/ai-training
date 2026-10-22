# CLAUDE.md

Guidance for Claude Code in this repo. App-specific guidance lives next to each app: `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`.

## Layout

- pnpm workspace driven by Turborepo. Git root and workspace root are the same directory; run commands from here unless noted.
- `apps/api/`: NestJS 12 / TypeScript 6 / ESM backend (package `api`).
- `apps/web/`: Next.js frontend (package `web`); see `apps/web/CLAUDE.md`.
- `packages/`: shared config that both apps extend: `@repo/typescript-config` (`nestjs.json`, `nextjs.json`), `@repo/eslint-config` (`nest`, `next`), `@repo/prettier-config` (web adds `semi: false`). Change a rule there, not in an app, then lint both apps.
- Shared devDependency versions (`eslint`, `prettier`, `typescript`, `typescript-eslint`, `@types/node`, …) live in the `catalog:` of `pnpm-workspace.yaml`; apps reference them as `"catalog:"`.
- `docs/`: training material (exercises, conventions), not product docs. `docs/specs/` holds the workflow's design and plan files; it is gitignored, so they are local-only. `docs/conventions/git.md` is the authoritative git workflow.
- `.claude/`: shared workflow, agents and the `work-ticket` skill. API rules and the `verify` skill are in `apps/api/.claude/`.

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
  - `pre-commit` runs lint-staged with the closest config per staged file: the app's `package.json`, or the root `.lintstagedrc.json` (Prettier) for `packages/` and root files.
  - `pre-push` runs `turbo run build test --affected` against `origin/develop`. Override with `TURBO_SCM_BASE=<ref> git push`. A missing ref runs every package.
- Fix the cause rather than passing `--no-verify`.

## CI

`.github/workflows/ci.yml` is GitHub Actions. It runs for `develop` (GHCR `:develop` + Render develop deploy) and `main` (production):

1. `quality`: `turbo run test build --affected`; there is no lint step.
2. Docker build of `apps/api/Dockerfile` (context `.`) + Trivy, only when the API is affected.
3. GHCR push.
4. Render deploy.
