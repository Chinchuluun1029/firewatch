# 🔥 Firewatch

**Track your path to Financial Independence / Retire Early (FIRE)**

Firewatch is a personal finance tool for tracking FIRE progress, projecting net worth growth across account types, managing budgets, and getting AI-powered insights on your financial journey.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Hono](https://img.shields.io/badge/Hono-4-E36002)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)

## Features

- **🎯 FIRE Goals** — Track LeanFIRE, ChubbyFIRE, FatFIRE, BaristaFIRE, CoastFIRE, or custom targets
- **📈 Net Worth Projections** — Interactive charts showing growth across tax-deferred, tax-free, and brokerage accounts
- **💰 Budgeting** — Monthly income/expense tracking with planned vs actual and savings rate
- **🤖 AI Insights** — GPT-powered analysis of your finances (with rule-based fallback)
- **📊 Multi-Account Tracking** — 401(k), Roth IRA, HSA, brokerage, crypto, real estate, and more
- **🔥 Interactive Demo** — Try the FIRE simulator without signing up
- **🏔️ Milestones** — Set checkpoints on your FIRE journey

## Architecture

```
┌─────────────────┐    Hono RPC     ┌──────────────────┐
│   apps/web      │  (type-safe)    │   apps/api       │
│   React + Vite  │ ◄────────────►  │   Hono + Drizzle │
│   Tailwind v4   │                 │   Better Auth    │
│   Recharts      │                 │   OpenAI SDK     │
│   TanStack      │                 │       │          │
└─────────────────┘                 │   PostgreSQL     │
                                    └──────────────────┘
```

**Monorepo structure:**

| Package | Description |
|---------|-------------|
| `apps/web` | React 19 + Vite frontend with TanStack Router/Query |
| `apps/api` | Hono API server with Better Auth + Drizzle ORM |
| `packages/db` | Drizzle schema, migrations, database client |
| `packages/types` | Shared TypeScript types (accounts, FIRE, budgets) |
| `packages/fire-engine` | FIRE calculation engine (pure functions, 18 tests) |
| `AGENTS/` | Agentic development context (roles, decisions, architecture) |

## Getting Started

### Prerequisites

- **Node.js 22+** (`node -v`)
- **pnpm 10+** (`npm install -g pnpm`)
- **PostgreSQL 17** (`brew install postgresql@17 && brew services start postgresql@17`)

### Setup

```bash
# Clone the repo
git clone <repo-url> firewatch
cd firewatch

# Install dependencies
pnpm install

# Create the database
createdb firewatch

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Push schema to database
cd packages/db
DATABASE_URL="postgresql://$(whoami)@localhost:5432/firewatch" npx drizzle-kit push
cd ../..
```

### Development

```bash
# Start the API server (Terminal 1)
pnpm --filter @firewatch/api dev

# Start the frontend (Terminal 2)
pnpm --filter @firewatch/web dev

# Run all tests
pnpm --filter @firewatch/fire-engine test

# Type-check everything
pnpm --filter @firewatch/api typecheck
```

Then open [http://localhost:5173](http://localhost:5173)

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter @firewatch/web dev` | Start frontend dev server (port 5173) |
| `pnpm --filter @firewatch/api dev` | Start API dev server (port 3001) |
| `pnpm --filter @firewatch/fire-engine test` | Run FIRE engine tests |
| `pnpm --filter @firewatch/web build` | Build frontend for production |
| `pnpm --filter @firewatch/api typecheck` | Type-check the API |
| `pnpm db:studio` | Open Drizzle Studio (database browser) |

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `BETTER_AUTH_SECRET` | Auth session encryption key | ✅ |
| `BETTER_AUTH_URL` | API server URL | ✅ |
| `FRONTEND_URL` | Frontend URL (for CORS) | ✅ |
| `PORT` | API server port (default: 3001) | |
| `OPENAI_API_KEY` | For AI insights (optional) | |

## Pages

| Page | URL | Auth | Description |
|------|-----|------|-------------|
| Landing | `/` | No | Marketing page with feature highlights |
| Demo | `/demo` | No | Interactive FIRE simulator with presets |
| Login | `/login` | No | Sign up / sign in |
| Dashboard | `/dashboard` | Yes | Net worth summary, FIRE progress, accounts |
| Accounts | `/accounts` | Yes | Add/manage financial accounts |
| Goals | `/goals` | Yes | Create/track FIRE goals |
| Budgets | `/budgets` | Yes | Monthly budget with categories |
| Projections | `/projections` | Yes | Interactive net worth charts |
| Insights | `/insights` | Yes | AI-powered financial analysis |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TanStack Router + Query, Tailwind CSS v4, Recharts |
| Backend | Hono, Better Auth, Drizzle ORM, Zod |
| Database | PostgreSQL (local or Neon serverless) |
| AI | OpenAI GPT-4o-mini (optional) |
| Monorepo | Turborepo + pnpm workspaces |
| CI/CD | GitHub Actions |

## Deployment

### Frontend (Vercel)
1. Connect repo to Vercel
2. Set root directory to `apps/web`
3. Build command: `pnpm --filter @firewatch/web build`
4. Output directory: `apps/web/dist`

### API (Railway / Fly.io)
1. Set root directory to `apps/api`
2. Start command: `npx tsx src/index.ts`
3. Set all environment variables from `.env.example`

### Database (Neon)
1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`
3. Run `npx drizzle-kit push` to create tables

## v2 Roadmap

- [ ] Plaid integration for automatic bank connections
- [ ] Monte Carlo simulations for projection accuracy
- [ ] CSV import/export for account data
- [ ] Roth conversion ladder calculator
- [ ] Multi-currency support
- [ ] Recurring transaction automation
- [ ] Mobile app (React Native or PWA)
- [ ] Sharing & household mode (multiple users, one FIRE plan)

## License

Private — not yet open source.
