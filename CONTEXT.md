# CONTEXT.md

## Project

- **Name**: Northstar Finance (personal-use budgeting app)
- **Path**: `/home/exedev/personal-finance-app`
- **Stack**: TanStack Start (React/TS) + Convex + Plaid
- **Primary goals (MVP)**:
  1. Zero-based budgets
  2. Bills/recurring + reminders + due-vs-paid tracking
  3. Reports/insights
  4. Plaid transaction import/sync (US-only)

## User decisions already made

- Budget style: **zero-based budgeting**
- Bills: **reminders yes**, **due date vs paid tracking yes**
- Storage: **cloud sync**
- Backend DB/platform choice: **Convex** (explicitly preferred over Supabase)
- Frontend framework choice: **TanStack Start** (explicitly preferred over Next.js)

## Current implementation status

### Frontend

- App shell with nav routes exists:
  - `/` Dashboard
  - `/budgets`
  - `/bills`
  - `/transactions`
  - `/reports`
  - `/settings`
- Current route content is mostly scaffold/mocked (not connected to Convex data yet).
- Mock data module: `src/lib/mock-data.ts`
- Domain types: `src/lib/domain.ts`

### Backend (Convex) — Phase 1 wiring done

- Schema scaffold: `convex/schema.ts`
- User bootstrap/query:
  - `convex/users.ts`
- Plaid integration skeleton:
  - `convex/plaidClient.ts`
  - `convex/plaid.ts`
  - `convex/plaidPersistence.ts`
  - `convex/webhooks.ts`
  - `convex/http.ts`
- Typecheck currently passes with Convex-generated types.

### Important caveats

- `convex/security.ts` currently contains **placeholder token protection**, not production-grade encryption.
- Plaid webhook signature verification is **not implemented yet**.
- Auth context is not yet enforced end-to-end (user IDs are still passed to some actions/mutations).

## Operational notes

- Vite host issue for exe.dev proxy fixed in `vite.config.ts`:
  - `server.allowedHosts = ['noon-disk.exe.xyz']`
- Public dev URL format:
  - `https://noon-disk.exe.xyz:3000/`

## Environment setup

- Example env vars in `.env.example`
- Convex codegen requires running:
  - `npx convex dev`
- Typical local commands:
  - `npm run dev`
  - `npx tsc --noEmit`
  - `npm run build`

## Git history summary (recent)

- `chore: scaffold TanStack Start app with Convex-first finance MVP plan`
- `feat: scaffold finance module routes with MVP mock data views`
- `fix: allow exe.dev proxy host in vite dev server`
- `feat: add phase-1 Convex backend wiring for users, plaid sync, and webhooks`
- `fix: use Convex Id type for mapped account ids in transaction sync`
- `fix: break plaid sync action type cycle with extracted helper`
- `fix: resolve convex action ctx type mismatch in plaid sync helper`
- `refactor: type plaid sync helper with Convex ActionCtx`

## Where to continue

- Continue from TODO.md in priority order.
- First deliverables should be security + auth hardening, then real Plaid connect UI, then transaction workflow.
