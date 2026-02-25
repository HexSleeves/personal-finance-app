# TODO.md

This is the execution tasklist for the next agent. Follow in order unless blocked.

---

## P0 — Security + correctness before wider feature work

### 1) Replace token placeholder encryption

**Files**: `convex/security.ts`, maybe `convex/plaid.ts`, docs

- [ ] Replace current `plain:` fallback with mandatory authenticated encryption.
- [ ] Use Node `crypto` AES-256-GCM (or equivalent) with random IV per token.
- [ ] Store payload format versioned (`v2:`), include auth tag.
- [ ] Require `TOKEN_ENCRYPTION_KEY` at startup for any encrypt/decrypt operation.
- [ ] Add migration path for existing `plain:` records:
  - [ ] support temporary read for legacy format
  - [ ] auto-reencrypt on successful decrypt/write path
- [ ] Add unit tests for encrypt/decrypt roundtrip and tamper detection.

**Acceptance**:

- No plaintext token storage path remains.
- Decryption fails for tampered ciphertext.

### 2) Verify Plaid webhook signatures

**Files**: `convex/http.ts`, possibly new helper `convex/plaidWebhookVerify.ts`

- [ ] Implement Plaid webhook verification using documented headers/signing approach.
- [ ] Reject invalid signatures with 401.
- [ ] Keep idempotency behavior for valid events.
- [ ] Ensure body is verified as raw text payload before parse.
- [ ] Add tests/fixtures for valid + invalid signature cases.

**Acceptance**:

- Unsigned/invalid webhook payloads do not trigger sync.

### 3) Add resilient retry strategy for sync failures

**Files**: `convex/plaid.ts`, `convex/webhooks.ts`, maybe new queue table in schema

- [ ] Add retry metadata for failed sync runs.
- [ ] Exponential backoff for transient failures.
- [ ] Cap max retries; mark item as degraded/needs_reauth when appropriate.
- [ ] Store actionable error code/message for UI.

**Acceptance**:

- Failed syncs are retried automatically and observable.

---

## P1 — Auth hardening and user context enforcement

### 4) Integrate Clerk with Convex auth context

**Files**: frontend auth wiring, Convex auth config, `convex/users.ts`, call sites

- [ ] Add Clerk provider and session handling to app shell.
- [ ] Configure Convex auth integration.
- [ ] Implement `requireUser(ctx)` helper to resolve current app user record.
- [ ] Remove client-supplied `userId` from public actions/mutations.
- [ ] Update Plaid actions to derive user from auth identity.

**Acceptance**:

- All finance mutations/actions use authenticated context user.

### 5) Initial user bootstrap flow

- [ ] On first sign-in, create user row with defaults (timezone/currency).
- [ ] Add safe idempotent bootstrap call from app init.

**Acceptance**:

- New login creates user once; repeat logins do not duplicate.

---

## P1 — Plaid connect UX end-to-end

### 6) Implement Connect Bank in Settings

**Files**: `src/routes/settings.tsx`, new client hooks/components

- [ ] Add “Connect account” button.
- [ ] Call Convex `createLinkToken` action.
- [ ] Launch Plaid Link in browser.
- [ ] Exchange public token and trigger initial sync.
- [ ] Show success/failure toast states.

**Acceptance**:

- User can connect a sandbox institution and see item/account records created.

### 7) Connection health UI

- [ ] Display institutions/items with status (healthy/degraded/needs_reauth/disconnected).
- [ ] Show last successful sync time.
- [ ] Add manual “Sync now” action.

**Acceptance**:

- User can understand connection state and trigger sync manually.

---

## P2 — Transactions vertical slice (first real daily value)

### 8) Replace mocked transactions with Convex data

**Files**: `src/routes/transactions.tsx`, new queries/mutations in `convex/transactions.ts`

- [ ] Create query for paginated transaction list (exclude soft-deleted by default).
- [ ] Add server-side filter params: date range, account, category, pending, text search.
- [ ] Wire table to query results.

### 9) Transaction edits

- [ ] Category assignment mutation.
- [ ] Manual transaction create mutation.
- [ ] Bulk category update for selected rows.
- [ ] Persist user overrides separate from raw Plaid payload.

### 10) Review queue

- [ ] Query for `needs_review` and uncategorized tx.
- [ ] Quick actions: categorize / ignore / mark reviewed.

**Acceptance**:

- Connected account transactions visible and editable with persisted overrides.

---

## P2 — Zero-based budgets MVP

### 11) Budget month + allocations

**Files**: `convex/budgets.ts`, `src/routes/budgets.tsx`

- [ ] Create/get budget month by YYYY-MM.
- [ ] Set planned income.
- [ ] CRUD category allocations.
- [ ] Compute allocated, spent, remaining, unassigned.
- [ ] Support copy previous month allocations.

### 12) Budget page UX

- [ ] Editable allocation table.
- [ ] Unassigned indicator and over-allocation warnings.
- [ ] Simple progress visuals for category spending.

**Acceptance**:

- User can run month planning and track real spend vs plan.

---

## P3 — Bills & recurring MVP

### 13) Recurring detection

**Files**: new `convex/bills.ts` + scheduled job

- [ ] Heuristic detection from transactions (merchant similarity + cadence + amount tolerance).
- [ ] Store candidate recurring series with confidence.
- [ ] Require user confirm before activation.

### 14) Bill instances + workflow

- [ ] Generate upcoming bill instances.
- [ ] Track states: upcoming, due_soon, paid, overdue, skipped.
- [ ] Match paid transaction to bill instance.
- [ ] Track due date vs paid date deltas.

### 15) Reminders

- [ ] Scheduled reminder job.
- [ ] In-app reminder feed and email integration (Resend).
- [ ] Deduplicate reminder sends.

**Acceptance**:

- Upcoming bill list is accurate; reminders and paid tracking work.

---

## P3 — Reports + export

### 16) Report queries (MVP set)

- [ ] Budget vs actual by category
- [ ] Spending by category
- [ ] Cash flow trend
- [ ] Month-over-month deltas
- [ ] Upcoming obligations
- [ ] Needs review summary

### 17) CSV export

- [ ] Export filtered transaction ledger as CSV.
- [ ] Include account/category/tags/pending/manual flags.

**Acceptance**:

- Report totals reconcile against transaction ledger spot-checks.

---

## Engineering hygiene (run every PR)

- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] Add/update tests for any changed domain logic.
- [ ] Update `README.md` for env vars, setup, and new workflows.
- [ ] Commit with focused message.

---

## Suggested immediate next PR (small + high value)

1. **Security PR**
   - real token encryption + webhook signature verification.
2. **Auth PR**
   - Clerk + Convex auth context + remove `userId` args.
3. **Plaid UX PR**
   - Settings connect button + sandbox account link + sync status view.
