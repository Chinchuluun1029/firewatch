# Firewatch — Architecture

## System Overview

```
┌──────────────────┐         ┌──────────────────────────┐
│   Frontend       │         │   Backend (Hono API)     │
│   (Vercel)       │  RPC    │   (Cloudflare/Railway)   │
│                  │ ◄─────► │                          │
│  React 19        │  Type   │  Hono Framework          │
│  + Vite          │  Safe   │  + Better Auth           │
│  + TanStack      │         │  + Drizzle ORM           │
│    Router/Query  │         │  + OpenAI SDK            │
│  + Tailwind v4   │         │                          │
│  + shadcn/ui     │         │       │                  │
│  + Recharts      │         │       ▼                  │
│                  │         │  ┌──────────────────┐    │
└──────────────────┘         │  │ Neon PostgreSQL  │    │
                             │  │ (Free Tier)      │    │
                             │  └──────────────────┘    │
                             └──────────────────────────┘
```

**Key insight for you**: This is a classic "SPA + API" architecture. The frontend is a single-page app that talks to a separate API server over HTTP. Every modern app (Twitter, Spotify, etc.) works this way. You'll learn how both sides work independently.

## Tech Stack Details

### Frontend (`apps/web`)
- **React 19** — the UI library you know
- **Vite** — blazing fast dev server and build tool (replaces Create React App / Webpack)
- **TanStack Router** — type-safe file-based routing for React (the modern replacement for React Router)
- **TanStack Query** — server state management (caching, refetching, loading states)
- **Tailwind CSS v4** — utility-first styling, latest version
- **shadcn/ui** — copy-paste component library, we own the code
- **Recharts** — composable React charts for financial dashboards

### Backend (`apps/api`)
- **Hono** — ultra-fast TypeScript-first web framework (think Express but modern and type-safe)
- **Hono RPC** — generates typed API client from your routes (frontend knows every endpoint's types automatically)
- **Better Auth** — TypeScript-first auth library (OAuth, email/password, sessions)
- **Drizzle ORM** — type-safe SQL queries, schema-as-code, migrations
- **OpenAI SDK** — direct API calls for AI insights
- **Zod** — runtime type validation for all API inputs

### Data Layer
- **PostgreSQL** via **Neon** — serverless, auto-scales, generous free tier
- **Drizzle Kit** — schema migrations and introspection

### Shared Packages
- **`packages/db`** — Drizzle schema, migrations, query helpers (used by API)
- **`packages/types`** — shared TypeScript types (used by both frontend and API)
- **`packages/fire-engine`** — FIRE calculation logic (pure functions, no dependencies)

### Monorepo Tooling
- **Turborepo** — orchestrates builds across packages, caches intelligently
- **pnpm** — fast, disk-efficient package manager with workspace support

### Infrastructure
- **Vercel** — frontend hosting, preview deploys
- **Cloudflare Workers** or **Railway** — API hosting
- **GitHub Actions** — CI/CD pipeline
- **Neon** — managed PostgreSQL

## Folder Structure

```
firewatch/
├── AGENTS/                       # Agentic development context
│   ├── README.md
│   ├── co-founder.md
│   ├── cybersecurity.md
│   ├── finance.md
│   ├── project-manager.md
│   ├── decisions.md
│   └── architecture.md          # ← This file
│
├── apps/
│   ├── web/                     # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── routes/          # TanStack Router file-based routes
│   │   │   │   ├── __root.tsx   # Root layout
│   │   │   │   ├── index.tsx    # Landing page
│   │   │   │   ├── demo.tsx     # Interactive simulator
│   │   │   │   ├── login.tsx    # Auth pages
│   │   │   │   └── _dashboard/  # Protected layout group
│   │   │   │       ├── route.tsx      # Dashboard layout (sidebar, nav)
│   │   │   │       ├── index.tsx      # Main dashboard
│   │   │   │       ├── accounts.tsx   # Account management
│   │   │   │       ├── budgets.tsx    # Budgeting
│   │   │   │       ├── projections.tsx # Net worth projections
│   │   │   │       ├── goals.tsx      # FIRE goals & milestones
│   │   │   │       └── insights.tsx   # AI-powered insights
│   │   │   │
│   │   │   ├── components/      # UI components
│   │   │   │   ├── ui/          # shadcn/ui base components
│   │   │   │   ├── charts/      # Financial chart components
│   │   │   │   ├── forms/       # Form components
│   │   │   │   └── layout/      # Layout (nav, sidebar, shell)
│   │   │   │
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Frontend utilities
│   │   │   │   ├── api.ts       # Hono RPC client (typed API calls)
│   │   │   │   └── auth.ts      # Better Auth client
│   │   │   └── main.tsx         # App entry point
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                     # Hono backend
│       ├── src/
│       │   ├── routes/          # API route handlers
│       │   │   ├── accounts.ts  # Account CRUD
│       │   │   ├── budgets.ts   # Budget CRUD
│       │   │   ├── goals.ts     # FIRE goals CRUD
│       │   │   ├── projections.ts # Projection engine endpoints
│       │   │   ├── insights.ts  # AI insight endpoints
│       │   │   └── auth.ts      # Auth routes (Better Auth)
│       │   │
│       │   ├── middleware/      # Hono middleware
│       │   │   ├── auth.ts      # Auth guard middleware
│       │   │   └── validate.ts  # Zod validation middleware
│       │   │
│       │   ├── services/        # Business logic layer
│       │   │   ├── accounts.ts
│       │   │   ├── budgets.ts
│       │   │   ├── projections.ts
│       │   │   └── insights.ts
│       │   │
│       │   ├── lib/             # Backend utilities
│       │   │   ├── db.ts        # Drizzle client instance
│       │   │   ├── auth.ts      # Better Auth server config
│       │   │   └── openai.ts    # OpenAI client
│       │   │
│       │   └── index.ts         # Hono app entry point
│       │
│       ├── drizzle.config.ts
│       └── package.json
│
├── packages/
│   ├── db/                      # Shared database package
│   │   ├── src/
│   │   │   ├── schema/          # Drizzle table definitions
│   │   │   │   ├── users.ts
│   │   │   │   ├── accounts.ts
│   │   │   │   ├── transactions.ts
│   │   │   │   ├── goals.ts
│   │   │   │   ├── budgets.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/      # SQL migration files
│   │   │   └── index.ts         # Package exports
│   │   └── package.json
│   │
│   ├── types/                   # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── accounts.ts
│   │   │   ├── fire.ts
│   │   │   ├── budgets.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── fire-engine/             # FIRE calculation engine
│       ├── src/
│       │   ├── calculators.ts   # Core FIRE formulas
│       │   ├── projections.ts   # Growth projection logic
│       │   ├── tax.ts           # Tax treatment by account type
│       │   └── index.ts
│       ├── __tests__/           # Unit tests for financial math
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # PR checks: lint, typecheck, test
│       └── deploy.yml           # Production deploy on merge
│
├── turbo.json                   # Turborepo config
├── pnpm-workspace.yaml          # pnpm workspace config
├── package.json                 # Root package.json
├── tsconfig.json                # Base TypeScript config
└── README.md
```

## Data Model (High Level)

```
Users
  ├── Accounts (401k, Roth IRA, Brokerage, etc.)
  │     ├── Balances (historical snapshots)
  │     └── Transactions (manual entries, future: Plaid)
  │
  ├── FIRE Goals (LeanFIRE, FatFIRE, custom targets)
  │     └── Milestones (checkpoints toward each goal)
  │
  ├── Budgets
  │     ├── Categories (housing, food, transport, etc.)
  │     └── Entries (income & expenses)
  │
  └── Projections (saved scenarios)
        └── Assumptions (return rates, inflation, contributions)
```

## Key Design Decisions

1. **Separate frontend and backend** — clear separation of concerns, better learning, independent scaling
2. **Hono RPC for type safety** — frontend gets auto-generated typed API client from backend routes
3. **Drizzle over Prisma** — lighter, faster, SQL-first approach
4. **shadcn/ui over a component library** — we own every component, full customization
5. **Database sessions over JWT** — more secure for financial data
6. **`source` field on transactions** — enables Plaid integration without schema changes
7. **`user_id` on every table** — multi-user ready from day one
8. **`fire-engine` as a shared package** — pure calculation logic with no dependencies, fully testable
9. **Monorepo with Turborepo** — one repo, multiple apps, shared packages, cached builds

## How the Pieces Talk to Each Other

```
Browser                Frontend (React)           Backend (Hono)          Database
  │                        │                          │                     │
  │  user clicks       ┌───▼───┐                      │                     │
  │ ──────────────────► │ React │                      │                     │
  │                     │ Route │                      │                     │
  │                     └───┬───┘                      │                     │
  │                         │ TanStack Query           │                     │
  │                         │ calls API via        ┌───▼───┐                │
  │                         │ Hono RPC client ───► │ Hono  │                │
  │                         │ (type-safe!)         │ Route │                │
  │                         │                      └───┬───┘                │
  │                         │                          │ Middleware checks   │
  │                         │                          │ auth + validates    │
  │                         │                          │                     │
  │                         │                      ┌───▼───┐            ┌───▼───┐
  │                         │                      │Service│ ──Drizzle──► │  DB   │
  │                         │                      └───┬───┘            └───┬───┘
  │                         │                          │                     │
  │                     ┌───▼───┐                      │                     │
  │  UI updates    ◄──── │ React │ ◄── JSON response ──┘                     │
  │ ◄──────────────────  │       │                                           │
  │                     └───────┘                                           │
```

## Security Architecture

See [cybersecurity.md](./cybersecurity.md) for full security guidelines.

Key points:
- All financial data encrypted at rest (Neon handles this)
- HTTPS everywhere (Vercel + Cloudflare handle this)
- Server-side input validation with Zod on every Hono route
- No sensitive data in client-side state
- Better Auth handles session security (httpOnly cookies)
- CORS configured to only allow the frontend origin
- API rate limiting via Hono middleware
