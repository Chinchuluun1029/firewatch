# Firewatch — Decision Log

All architectural and product decisions, recorded so future sessions have context.

---

## Decision 001: User Model
- **Date**: 2026-03-30
- **Decision**: Start as personal-use app, but architect for multi-user from day one
- **Rationale**: Owner wants the option to open it up later without rewriting
- **Impact**: Every data table gets a `user_id` column, auth is implemented from the start
- **Status**: ✅ Accepted

## Decision 002: Data Input Strategy
- **Date**: 2026-03-30
- **Decision**: Manual entry for v1, design data model so Plaid can integrate later
- **Rationale**: Plaid adds cost, complexity, and approval process — not worth it for MVP
- **Impact**: Build clean account/transaction models with a `source` field (manual vs plaid vs import)
- **Status**: ✅ Accepted

## Decision 003: Budget
- **Date**: 2026-03-30
- **Decision**: ~$20/month cap for hosted services
- **Rationale**: Free tiers for Vercel + Neon, main cost is AI API
- **Impact**: Use free tiers where possible, AI features should have usage controls
- **Status**: ✅ Accepted

## Decision 004: Demo/Trial Mode
- **Date**: 2026-03-30
- **Decision**: Interactive client-side simulator with fake data
- **Rationale**: Best for landing page conversion — let people play before signing up
- **Impact**: Simulator is a separate lightweight component, no auth/DB required
- **Status**: ✅ Accepted

## Decision 005: Geographic Scope
- **Date**: 2026-03-30
- **Decision**: US only for v1
- **Rationale**: Simplifies currency, tax treatment, and account type modeling
- **Impact**: Can assume USD, US tax code, US account types
- **Status**: ✅ Accepted

## Decision 006: Tech Stack
- **Date**: 2026-03-30 (revised)
- **Decision**: React + Vite + Hono monorepo — separate frontend and backend
- **Rationale**: Owner wants to learn backend properly. Separate API gives clear separation of concerns and real backend experience. Hono is the leading TypeScript-first backend framework.
- **Impact**: See architecture.md for full details
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
  - Type Safety: Hono RPC for end-to-end type-safe API calls
  - Monorepo: Turborepo + pnpm workspaces
  - Hosting: Vercel (frontend) + Cloudflare Workers or Railway (API)
  - CI/CD: GitHub Actions
- **Previous**: Next.js 15 (rejected — owner wanted separate frontend/backend for learning)
- **Status**: ✅ Accepted

## Decision 007: CI/CD
- **Date**: 2026-03-30
- **Decision**: GitHub Actions for CI/CD pipeline
- **Pipeline**:
  - On PR: lint → type-check → test → Vercel preview deploy
  - On merge to main: auto-deploy to production
  - Weekly: dependency vulnerability audit
- **Status**: ✅ Accepted
