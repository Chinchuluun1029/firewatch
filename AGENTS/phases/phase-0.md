# Phase 0: Build the Product (v1)

**Timeline**: 2026-03-30 → 2026-04-04
**Status**: ✅ Complete

---

## Goal

Build a real, working FIRE tracking product from scratch — not a prototype, not a mockup. Establish an agentic development workflow with specialist roles, then build through 7 milestones.

## Decisions Made

### Decision 001: User Model
- **Decision**: Start as personal-use app, but architect for multi-user from day one
- **Rationale**: Owner wants the option to open it up later without rewriting
- **Impact**: Every data table gets a `user_id` column, auth is implemented from the start

### Decision 002: Data Input Strategy
- **Decision**: Manual entry for v1, design data model so Plaid can integrate later
- **Rationale**: Plaid adds cost, complexity, and approval process — not worth it for MVP
- **Impact**: Build clean account/transaction models with a `source` field (manual vs plaid vs import)

### Decision 003: Service Budget
- **Decision**: ~$20/month cap for hosted services
- **Rationale**: Free tiers for Vercel + Neon, main cost is AI API
- **Impact**: Use free tiers where possible, AI features should have usage controls

### Decision 004: Demo/Trial Mode
- **Decision**: Interactive client-side simulator with fake data
- **Rationale**: Best for landing page conversion — let people play before signing up
- **Impact**: Simulator is a separate lightweight component, no auth/DB required

### Decision 005: Geographic Scope
- **Decision**: US only for v1
- **Rationale**: Simplifies currency, tax treatment, and account type modeling
- **Impact**: Can assume USD, US tax code, US account types

### Decision 006: Tech Stack
- **Decision**: React + Vite + Hono monorepo — separate frontend and backend
- **Rationale**: Owner wants to learn backend properly. Separate API gives clear separation of concerns.
- **Previous**: Next.js 15 (rejected — owner wanted separate frontend/backend for learning)
- **Components**:
  - Frontend: React 19 + Vite + TanStack Router + TanStack Query
  - Backend: Hono (TypeScript-first, runs anywhere)
  - Language: TypeScript (strict mode)
  - UI: Tailwind CSS v4 + shadcn/ui
  - Database: PostgreSQL via Neon (serverless)
  - ORM: Drizzle ORM
  - Auth: Better Auth (TypeScript-first, works with Hono + Drizzle)
  - Charts: Recharts
  - AI: OpenAI SDK (direct)
  - Monorepo: Turborepo + pnpm workspaces
  - CI/CD: GitHub Actions

### Decision 007: CI/CD
- **Decision**: GitHub Actions for CI/CD pipeline
- **Pipeline**: PR → lint/typecheck/test → preview deploy. Merge → production deploy.

---

## Milestones Completed

### M0: Scaffolding & Setup
- Monorepo with Turborepo + pnpm workspaces
- AGENTS/ folder with 4 specialist roles (co-founder, cybersecurity, finance, PM)
- TypeScript strict mode, Tailwind v4, CI pipeline
- Shared packages: `@firewatch/types`, `@firewatch/db`, `@firewatch/fire-engine`

### M1: Core Data Model + Dashboard MVP
- PostgreSQL 17 (local via Homebrew) + Drizzle ORM (12 tables)
- Better Auth (email/password sign-up/sign-in, session management)
- Accounts CRUD (401k, Roth, brokerage, HSA, etc. with tax treatment)
- FIRE Goals CRUD (LeanFIRE through custom, with milestones)
- Dashboard: net worth summary, FIRE progress bars, account table
- Login/Sign-up page

### M3: Budgeting
- Budget categories (19 defaults: 14 expense + 5 income, plus custom)
- Monthly budgets with planned vs actual per category
- Summary cards: income, expenses, savings, savings rate %
- Inline editing with save-per-row UX

### M4: Projections Engine
- `projectMultiAccount()` in fire-engine — multi-account growth by year
- Stacked area chart by tax treatment OR by individual account
- FIRE target reference line, contributions vs growth chart
- Per-account contribution and return rate controls
- 18 passing tests

### M5: AI Insights
- Financial snapshot aggregation (accounts, goals, budgets, tax breakdown)
- OpenAI GPT-4o-mini streaming analysis (when API key present)
- Rule-based fallback insights (net worth, FIRE timeline, savings rate, tax allocation)
- Asset allocation bar by tax treatment
- Markdown renderer for AI responses

### M6: Demo Mode (Polished Simulator)
- 4 preset scenarios (Early Career, Mid Career, High Earner, Starting Late)
- Multi-account simulator with per-account editing
- FIRE type selector (Lean through Coast)
- Stacked area chart with FIRE target line
- Sign-up CTA banner

### M7: Polish & Launch Prep
- Mobile-responsive hamburger menu with slide-down drawer
- Sticky header with backdrop blur
- Code-splitting: 822KB → 376KB + 397KB (recharts) + 50KB (query)
- 404 Not Found page + error boundary
- Footer with disclaimer
- Production README with setup, deployment, and v2 roadmap

---

## Final Stats
- **67 files** across 5 packages + 2 apps
- **~6,065 lines** of TypeScript/TSX
- **18 tests** passing (FIRE engine)
- **9 git commits** from scaffold to polish
- **12 database tables** (users, auth, accounts, goals, budgets, etc.)
- **9 frontend pages** (landing, demo, login, dashboard, accounts, goals, budgets, projections, insights)
