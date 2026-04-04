# Copilot Instructions for Firewatch

## MANDATORY: Read Before Any Work

Before doing ANY work on this codebase, you MUST read these files in order:

1. `AGENTS/PLAYBOOK.md` — Current project state, owner profile, working principles
2. `AGENTS/phases/phase-1.md` — Active phase plan (update this path when phases change)
3. `AGENTS/decisions.md` — Active-phase decision log
4. `AGENTS/architecture.md` — System diagram, folder structure, data model

## Project Context

Firewatch is a personal FIRE (Financial Independence / Retire Early) tracking app. It's a real product, not a prototype. The product owner is a front-end developer learning backend/devops/databases.

## Key Rules

- **Product owner makes decisions.** Present options with tradeoffs, recommend one, but never override.
- **Teach as you build.** The owner wants to learn — explain the "why" not just the "what."
- **Stop at decision points.** If you hit a fork, present options instead of just picking one.
- **Test everything.** Verify changes work before considering them done.
- **No scope creep.** If something isn't in the current phase, suggest it for later.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend** (`apps/web`): React 19 + Vite + TanStack Router/Query + Tailwind v4 + Recharts
- **Backend** (`apps/api`): Hono + Better Auth + Drizzle ORM + Zod
- **Database**: PostgreSQL (local or Neon)
- **Shared packages**: `@firewatch/types`, `@firewatch/db`, `@firewatch/fire-engine`
- **TypeScript strict mode** everywhere — no `any` types (except the Better Auth proxy workaround in `apps/api/src/lib/auth.ts`)

## Dev Commands

```bash
# Start API:      pnpm --filter @firewatch/api dev
# Start Frontend: pnpm --filter @firewatch/web dev
# Run tests:      pnpm --filter @firewatch/fire-engine test
# Typecheck API:  pnpm --filter @firewatch/api typecheck
# Build frontend: pnpm --filter @firewatch/web build
```

## Agent Specialists

For domain-specific tasks, read the relevant agent file in `AGENTS/`:
- `cybersecurity.md` — Security review, auth, data protection
- `finance.md` — FIRE formulas, tax codes, account types
- `project-manager.md` — Priorities, scope management
