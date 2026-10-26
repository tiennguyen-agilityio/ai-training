# Node.js E-commerce Website

## OVERVIEW

The web app lives in **`apps/web/`** (package `web` in the root pnpm workspace): **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui** (tokens in `src/app/globals.css`, components in `src/components/ui/`). Tooling: ESLint, Prettier, Jest + React Testing Library. Git hooks live at the repo root (`.husky/`); run `pnpm install` at the root to enable them.

---

## STRUCTURE FOLDER

```text
apps/web/
├── src/
│   ├── app/                    # App Router
│   │   ├── layout.tsx
│   │   ├── globals.css         # Theme + Tailwind @theme
│   │   ├── (shop)/             # Shop, URL /
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── dashboard/          # URL /dashboard
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn / primitives
│   │   ├── features/           # By domain
│   │   └── shared/             # Header, footer, … (when present)
│   ├── hooks/
│   ├── utils/
│   ├── services/               # Server Actions, API client
│   ├── store/
│   ├── types/
│   └── middleware.ts
├── public/
├── components.json
├── eslint.config.mjs
├── jest.config.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prettier.config.mjs     # extends @repo/prettier-config (no semicolons)
└── tsconfig.json
```

---

## GETTING STARTED

| Command                             | Description            |
| ----------------------------------- | ---------------------- |
| `pnpm dev`                          | Dev server (Turbopack) |
| `pnpm build`                        | Production build       |
| `pnpm start`                        | Run production build   |
| `pnpm lint`                         | ESLint (`--fix`)       |
| `pnpm format` / `pnpm format:check` | Prettier               |
| `pnpm test`                         | Jest once (CI)         |
| `pnpm test:watch`                   | Jest watch mode        |
| `pnpm test:cov`                     | Jest with coverage     |

For Clerk and other secrets, use `.env` (see `.env.example`). For environment variable details, email **tien.nguyen@asnet.com.vn**.

---

## DEPLOY

Web is deployed to Vercel (project `ai-training`) by GitHub Actions (`.github/workflows/ci.yml` calls the reusable `.github/workflows/deploy-web.yml`), only after the `quality` job (test + build) passes and only when `web` is affected (for PR previews: `web` or the API). The Vercel project is not connected to Git (`vercel.json` sets `git.deploymentEnabled: false`), so nothing else deploys it.

| Environment | Trigger                 | URL                                                                           | Vercel env |
| ----------- | ----------------------- | ----------------------------------------------------------------------------- | ---------- |
| Preview     | PR into `develop`       | new URL per push that changes web or the API; one PR comment shows the latest | Preview    |
| Development | merge into `develop`    | https://ai-training-develop.vercel.app (alias to the latest build)            | Preview    |
| Production  | `main` (not configured) | —                                                                             | Production |

- `vercel.json` sets only the build command and turns off Git deploys, so these Vercel project settings must stay: Framework Preset Next.js, Root Directory `apps/web`, Node.js 24.x, Install Command not overridden (default `pnpm install` installs the whole workspace).
- App env vars live in the Vercel project: Preview, shared by preview and development. Production is reserved for `main`.
- GitHub holds only the secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and the variable `VERCEL_DEVELOP_ALIAS`.
- The browser calls the API at `NEXT_PUBLIC_API_URL`. Development and web-only PRs use the develop API. A PR that changes the API gets its own API preview (Render service `ai-training-api-preview-pull-request-<n>`, usually `https://ai-training-api-preview-pull-request-<n>.onrender.com`; the PR comment shows the real URL, see the root `CLAUDE.md`), and its web preview is built against it (`deploy-web.yml` input `api_url`).
- The API's `CORS_ORIGIN` lists the development alias and the wildcard `https://ai-training-*-tiennd0502gmailcoms-projects.vercel.app` for preview URLs; API previews copy it from develop.
