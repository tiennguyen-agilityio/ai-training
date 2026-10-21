# CLAUDE.md — web

Next.js 15 (App Router), React 19, Tailwind v4, shadcn/ui, Clerk. Package `web` in the root pnpm workspace; monorepo guidance is in the root `CLAUDE.md`.

## Commands (from here, or `pnpm web <script>` from the root)

```bash
pnpm dev          # http://localhost:3001
pnpm build        # also runs ESLint and the type check
pnpm lint         # eslint --fix
pnpm test         # Jest + React Testing Library
pnpm test:cov
```

## Structure

`src/app` (routes: `(shop)`, `dashboard`, `sign-in`, `sign-up`), `src/sections` (page sections), `src/layouts`, `src/components`, `src/services` (API client), `src/hooks`, `src/store`, `src/providers`, `src/schemas`, `src/constants`, `src/theme`, `src/types`, `src/utils`.

## Environment

Copy `.env.example` to `.env`. `NEXT_PUBLIC_API_URL` points at the API (`pnpm dev:api` serves `http://localhost:3000`). `pnpm build` needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; CI reads it from the GitHub Actions variable of the same name.
