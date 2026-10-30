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

Routes live in `src/app` (`(shop)`, `dashboard`, `sign-in`, `sign-up`); `src/middleware.ts` protects them. The role of every `src/` folder is in the Layers table of `.claude/rules/coding.md`.

## Shared config

`tsconfig.json`, `eslint.config.mjs` and `prettier.config.mjs` extend `@repo/typescript-config`, `@repo/eslint-config/next` and `@repo/prettier-config` in `packages/`. When upgrading `next`, bump `eslint-config-next` in `packages/eslint-config/package.json` to the same version.

## Environment

Copy `.env.example` to `.env`. `NEXT_PUBLIC_API_URL` points at the API (`pnpm dev:api` serves `http://localhost:3000`). `pnpm build` needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; CI reads it from the GitHub Actions variable of the same name.

## Claude rules

The coding and testing rules live in `.claude/rules/` and the workflow rule in the root `.claude/rules/`, loaded when Claude works with matching files:

| File                              | Loaded for                            | Covers                                                                                                                                                                      |
| --------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/rules/coding.md`         | `src/**/*.{ts,tsx}`                   | Layers, naming and exports, server and client, services and TanStack Query hooks, shared packages, forms, constants, auth, styling and accessibility, TypeScript lint rules |
| `.claude/rules/testing.md`        | `src/**/*.test.{ts,tsx}`, Jest config | Jest + React Testing Library, test locations, queries, mocks, what to test, coverage, integrity                                                                             |
| `../../.claude/rules/workflow.md` | always                                | Feature workflow: superpowers overrides, `docs/specs/` paths, changed apps, coverage baseline + test report, review before commit                                           |

When planning or reviewing, read `coding.md` and `testing.md` even if no matching file is open. Run `apps/web:verify` (`.claude/skills/verify/SKILL.md`) before calling a web change done.
