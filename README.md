# Claude Training

pnpm + Turborepo monorepo.

| Path | What |
| --- | --- |
| `apps/api` | NestJS API — see [apps/api/README.md](apps/api/README.md) |
| `web` | Next.js frontend — see [web/README.md](web/README.md) (joins the workspace in phase 2; until then install with `cd web && pnpm install --ignore-workspace`) |
| `docs` | Training exercises, conventions, specs |

```bash
pnpm install        # workspace + git hooks
pnpm dev            # all apps
pnpm build:api      # one app; also dev:api, test:api, lint:api, start:api
pnpm api <script>   # any API script, e.g. pnpm api migration:up
```

## Upgrading an existing clone

After pulling the move from `coffee-shop-api/` to `apps/api/`:

1. `pnpm install` at the root (re-points the git hooks to `.husky/_`; until then hooks silently do nothing)
2. Move your untracked env files: `mv coffee-shop-api/.env* apps/api/`
3. `rm -rf coffee-shop-api` (only ignored leftovers such as `node_modules` and `dist` remain there)
