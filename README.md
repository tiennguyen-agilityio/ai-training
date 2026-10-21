# Claude Training

pnpm + Turborepo monorepo.

| Path | What |
| --- | --- |
| `apps/api` | NestJS API — see [apps/api/README.md](apps/api/README.md) |
| `apps/web` | Next.js frontend — see [apps/web/README.md](apps/web/README.md) |
| `docs` | Training exercises, conventions, specs |

```bash
pnpm install        # workspace + git hooks
pnpm dev            # all apps
pnpm build:api      # one app; also dev:api, test:api, lint:api, start:api (and the same for :web)
pnpm api <script>   # any API script, e.g. pnpm api migration:up; pnpm web <script> for web
```

## Upgrading an existing clone

After pulling the move from `coffee-shop-api/` to `apps/api/`:

1. `pnpm install` at the root (re-points the git hooks to `.husky/_`; until then hooks silently do nothing)
2. Move your untracked env files: `mv coffee-shop-api/.env* apps/api/`
3. `rm -rf coffee-shop-api` (only ignored leftovers such as `node_modules` and `dist` remain there)

After pulling the move from `web/` to `apps/web/`:

1. Stop any running `next dev` started from `web/`
2. `pnpm install` at the root (web now installs with the workspace; its own lockfile is gone)
3. Move your untracked env files: `mv web/.env* apps/web/`
4. `rm -rf web` (only ignored leftovers such as `node_modules` and `.next` remain there)
