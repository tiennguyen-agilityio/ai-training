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
