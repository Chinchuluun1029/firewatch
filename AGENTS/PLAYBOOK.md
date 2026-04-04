# Firewatch — Playbook

> **Read this file first in every new session.** It tells you who the product owner is, how to work with them, what's been done, and what's next.

---

## Product Owner Profile

- **Role**: Front-end developer learning backend, devops, and databases
- **Communication style**: Wants to stay in the loop and in control. Explain what you're doing and why.
- **Decision authority**: Owner makes all decisions. Present options with tradeoffs, recommend one, but never override.
- **Learning**: Teach as you build. Use analogies for backend/devops concepts.

## How Sessions Work

1. **Read this file** — understand current state
2. **Read the active phase file** — `AGENTS/phases/phase-{N}.md` for context on what's in progress
3. **Check `AGENTS/decisions.md`** — for active-phase decisions
4. **Check `AGENTS/architecture.md`** — for structural context
5. **Review the codebase** — `git log --oneline -5` to see recent work
6. **Resume work** — pick up from the phase file's task list

## Working Principles

- **This is a real product.** Every line of code should be production-quality.
- **Build in stages the owner can see.** No "big bang" reveals.
- **Stop at decision points.** Present options, don't just pick one.
- **Challenge assumptions.** If something doesn't make sense, say so.
- **Separate "now" from "later."** Protect the current phase from scope creep.
- **Test before moving on.** Every feature gets verified before the next one starts.
- **Be honest about limitations.** Adjusted expectations > disappointment.

## Tech Stack (locked in Phase 0)

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TanStack Router + Query, Tailwind CSS v4, Recharts |
| Backend | Hono, Better Auth, Drizzle ORM, Zod |
| Database | PostgreSQL (local or Neon) |
| AI | OpenAI GPT-4o-mini (optional) |
| Monorepo | Turborepo + pnpm workspaces |
| CI/CD | GitHub Actions |

## Current State

### Phase 0: Build the Product ✅ COMPLETE
All 7 milestones delivered. See `AGENTS/phases/phase-0.md` for full archive.

**What exists:**
- Working app with auth, accounts, goals, budgets, projections, AI insights, demo
- 9 pages, 12 database tables, 18 tests, mobile-responsive nav
- Code-split bundle, error boundaries, production README

### Phase 1: QA & Design Review 🔄 ACTIVE
See `AGENTS/decisions.md` for active decisions.

**Goal**: Manually test every feature, find bugs/nits, revisit design decisions, improve UX.

---

## Repository Map

```
firewatch/
├── AGENTS/              # This folder — roles, decisions, architecture
│   ├── PLAYBOOK.md      # ← YOU ARE HERE (read first every session)
│   ├── phases/          # Archived phase docs
│   ├── co-founder.md    # Development rules
│   ├── cybersecurity.md # Security review guidelines
│   ├── finance.md       # FIRE terminology, tax codes, formulas
│   ├── project-manager.md # Priorities, milestones, scope
│   ├── decisions.md     # ACTIVE phase decisions only
│   └── architecture.md  # System diagram, folder structure
├── apps/
│   ├── web/             # React frontend (Vite)
│   └── api/             # Hono API backend
├── packages/
│   ├── db/              # Drizzle schema + migrations
│   ├── types/           # Shared TypeScript types
│   └── fire-engine/     # FIRE calculators (18 tests)
└── README.md            # Setup + deployment guide
```

## Running the App

```bash
# Prerequisites: Node 22+, pnpm 10+, PostgreSQL 17
# Terminal 1
cd apps/api && npx tsx --env-file=../../.env src/index.ts

# Terminal 2
cd apps/web && npx vite

# Open http://localhost:5173
```

## How to Update This File

When a phase completes:
1. Archive the phase → `AGENTS/phases/phase-{N}.md`
2. Reset `AGENTS/decisions.md` for the new phase
3. Update the "Current State" section above
4. Update the active phase reference
