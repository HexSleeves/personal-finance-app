# PLAN — Personal Finance App (TanStack Start + Convex + Plaid)

## Product Scope

Build a single-user (future multi-user ready), US-only personal finance web app with mobile-first UX.

### MVP priorities
1. Zero-based budgets
2. Bills + recurring items with reminders and due-vs-paid tracking
3. Reports/insights
4. Plaid transaction import + ongoing sync

## Assumptions

- Personal-use only at launch.
- Cloud sync required across devices.
- PWA-first; no native app in MVP.
- US institutions only via Plaid.
- Email + in-app reminders in MVP.

## Out of Scope (MVP)

- Investments/portfolio tracking
- Credit score
- Debt optimization
- Tax tools
- Household collaboration
- Receipt OCR
- International accounts/currencies

## Architecture Decisions

### Platform
- **Frontend**: TanStack Start (React + TypeScript)
- **Styling**: Tailwind CSS
- **Backend/Data/Jobs**: Convex
- **Bank Data**: Plaid (Link + Transactions)
- **Auth**: Clerk (planned integration)
- **Notifications**: Resend (planned integration)

### Data Strategy
- Keep Plaid raw transaction fields separate from user edits.
- User changes (category, notes, split, exclude flags) stored as overrides.
- Canonical transaction view resolves with precedence:
  1) user overrides
  2) derived app values
  3) Plaid raw values

### Sync Strategy
- Initial backfill via `/transactions/sync` loop until `has_more=false`.
- Incremental sync from stored cursor per item.
- Webhooks enqueue debounced sync jobs.
- Idempotency keys on webhook processing.
- Soft-delete removed Plaid transactions.

## MVP Feature Spec

### Budgets (Zero-Based)
- Monthly planned income target
- Category-group allocations
- Unassigned amount indicator
- Budget vs actual per category
- Copy previous month allocations

### Bills / Recurring
- Recurring series auto-suggestions
- Editable cadence, amount, due rules
- Upcoming bills list (30/60 days)
- States: upcoming, due soon, paid, overdue, skipped
- Reminders: in-app + email
- Due date vs paid date tracking

### Reports
- Budget vs Actual (monthly)
- Spending by category
- Cash flow trend
- Month-over-month comparison
- Upcoming obligations
- Needs review queue
- CSV export

## Execution Plan (10 Weeks)

### Week 1
- Repo setup + project skeleton
- Route shell and navigation
- Core domain types
- Convex schema draft

### Week 2
- Plaid connect flow endpoints in Convex actions
- Item/account persistence
- Initial transaction sync pipeline

### Week 3
- Webhook ingest + idempotency + retry pipeline
- Transaction list, search, filters, manual entry

### Week 4
- Categories, rules, bulk edit, split transactions

### Week 5
- Zero-based monthly budgets + dashboard widgets

### Week 6
- Recurring detection + bill series editor

### Week 7
- Upcoming bills + reminders + paid tracking

### Week 8
- Reports + CSV export

### Week 9
- Hardening: duplicates, pending vs posted, relink flows

### Week 10
- QA, bug fixes, launch checklist

## Risks & Mitigations

- **Plaid sync edge cases** → cursor-based sync, sync logs, replay tools
- **Recurring detection false positives** → confidence score + user approval
- **Category drift** → rule engine with priority and preview
- **Scope creep** → strict MVP gating

## Definition of Done (MVP)

- Plaid connect + stable incremental sync
- Zero-based budget flow usable monthly
- Bill due/paid/reminder workflow complete
- 5–7 key reports accurate against ledger checks
- CSV export reliable
- Mobile-first UX acceptable for daily use
- Basic security hygiene in place (no secret leakage in logs)

## Immediate Build Tasks (started now)

1. Replace starter landing page with finance app shell.
2. Add core routes: Dashboard, Budgets, Bills, Transactions, Reports, Settings.
3. Add foundational domain models/types for budgeting + bills + transactions.
4. Add Convex schema scaffold for core entities.
5. Add README section for running app + Convex onboarding.
