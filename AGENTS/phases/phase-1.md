# Phase 1: QA & Design Review

**Status**: 🔄 Active
**Goal**: Manually test every feature, find bugs/nits, revisit design decisions, improve UX before deployment.

---

## How This Phase Works

This is NOT a building phase — it's a **review and fix** phase. The process:

1. **Owner tests the app** — sign up, create accounts, set goals, create budgets, run projections, generate insights, play with the demo
2. **Owner reports issues** — bugs, UX nits, design concerns, missing edge cases
3. **Co-founder triages** — categorize as bug / UX improvement / design decision / scope creep
4. **Fix together** — address issues in priority order, owner approves each fix
5. **Revisit decisions** — any Phase 0 decisions that feel wrong after real usage get re-evaluated

## Testing Checklist

### Auth Flow
- [ ] Sign up with email/password
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Session persistence (refresh page while logged in)
- [ ] Protected routes redirect to login
- [ ] Error messages for bad credentials

### Accounts
- [ ] Create account with all categories (retirement, brokerage, savings, HSA, etc.)
- [ ] Create account with all tax treatments
- [ ] Edit account balance
- [ ] Delete account
- [ ] Empty state when no accounts
- [ ] Verify dashboard reflects account changes

### FIRE Goals
- [ ] Create each FIRE type (Lean, FIRE, Chubby, Fat, Barista, Coast, Custom)
- [ ] Auto-calculated FIRE number matches expectations
- [ ] Progress bar accuracy
- [ ] Delete goal
- [ ] Multiple simultaneous goals
- [ ] Dashboard FIRE progress updates when accounts change

### Budgets
- [ ] Seed default categories
- [ ] Create monthly budget
- [ ] Add planned/actual amounts
- [ ] Savings rate calculation accuracy
- [ ] Create custom category
- [ ] Delete budget
- [ ] Multiple months
- [ ] Duplicate month prevention

### Projections
- [ ] Run projection with multiple accounts
- [ ] Per-account contribution/return inputs
- [ ] Chart renders correctly (stacked areas, FIRE target line)
- [ ] Toggle between tax type and account view
- [ ] Inflation-adjusted toggle
- [ ] Years slider updates chart
- [ ] Years to FIRE calculation

### AI Insights
- [ ] Snapshot loads with correct data
- [ ] Rule-based insights generate (without API key)
- [ ] AI streaming works (with API key)
- [ ] Disclaimer is visible
- [ ] Asset allocation bar is accurate

### Demo/Simulator
- [ ] All 4 presets load correctly
- [ ] FIRE type selector updates calculations
- [ ] Account editor add/remove/edit
- [ ] Chart updates on any input change
- [ ] CTA links work

### Mobile Responsiveness
- [ ] Hamburger menu opens/closes
- [ ] Menu closes on navigation
- [ ] All pages readable on mobile width
- [ ] Charts scroll horizontally on small screens
- [ ] Forms usable on mobile
- [ ] Tables don't break layout

### Edge Cases
- [ ] Zero accounts → appropriate empty states
- [ ] Very large balances (millions)
- [ ] Very small balances (cents)
- [ ] Negative savings rate
- [ ] Zero contributions in projections
- [ ] Long account/goal names

---

## Issues Found

> Add issues here as they're discovered during testing.

### Bugs
*(none yet — start testing!)*

### UX Nits
*(none yet)*

### Design Decisions to Revisit
*(none yet)*

---

## When Phase 1 Is Done

Phase 1 is done when:
- [ ] Every checklist item above has been tested
- [ ] All critical bugs are fixed
- [ ] Owner is satisfied with the UX
- [ ] Design decisions have been revisited and confirmed or changed
- [ ] App is ready for deployment
