# Firewatch — Agentic Team

This folder defines the roles, rules, and memory for agentic development of **Firewatch**, a personal FIRE (Financial Independence / Retire Early) tracking platform.

## How This Works

Every LLM session working on this codebase should read the relevant agent file(s) before doing work. These files define:

- **Roles**: Who does what (co-founder, security, finance, PM)
- **Rules**: Constraints and principles that never change
- **Memory**: Decisions, preferences, and context that persist across sessions

## Agent Roster

| Agent | File | Responsibility |
|-------|------|---------------|
| Technical Co-Founder | [co-founder.md](./co-founder.md) | Architecture, implementation, technical decisions |
| Cybersecurity Lead | [cybersecurity.md](./cybersecurity.md) | Security review, auth, data protection, threat modeling |
| Finance Specialist | [finance.md](./finance.md) | FIRE terminology, tax codes, financial modeling accuracy |
| Project Manager | [project-manager.md](./project-manager.md) | Priorities, milestones, scope management, timelines |

## Usage

When starting any LLM-assisted development session on this project:

1. Always read `co-founder.md` first — it has the foundational rules
2. Read the relevant specialist agent file for the task at hand
3. Reference `architecture.md` (once created) for structural decisions
4. Check `decisions.md` (once created) for prior decisions log

## Project: Firewatch

A personal finance tool for tracking FIRE progress, projecting net worth across account types, budgeting, and getting AI-powered insights — built to be a real, shippable product.
