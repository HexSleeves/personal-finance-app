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
- Security hardening now implemented:
  - Access token encryption upgraded to AES-256-GCM in `convex/security.ts` with `v2:` payload format.
  - Legacy `plain:` / `v1:` reads supported temporarily with auto-rotation to `v2:` on sync path.
  - Plaid webhook signature verification implemented in `convex/plaidWebhookVerify.ts`.
  - Node runtime webhook verification + dispatch action added in `convex/webhooksNode.ts` and called from `convex/http.ts`.
- Tests added for security/webhook verification:
  - `convex/security.test.ts`
  - `convex/plaidWebhookVerify.test.ts`
- Typecheck currently passes with Convex-generated types.

### Important caveats

- Auth context is not yet enforced end-to-end (user IDs are still passed to some actions/mutations).
- Sync retries/backoff and degraded-item handling are not implemented yet.

## Operational notes

- Vite host issue for exe.dev proxy fixed in `vite.config.ts`:
  - `server.allowedHosts = ['noon-disk.exe.xyz']`
- Public dev URL format:
  - `https://noon-disk.exe.xyz:3000/`

## Environment setup

- Example env vars in `.env.example`
- Convex codegen requires running:
  - `bun run convex:dev`
- Bun-first local commands:
  - `bun install`
  - `bun run dev`
  - `bun run typecheck`
  - `bun run build`
  - `bun run lint`
  - `bun run check`
- Biome config ignores generated and dependency directories (`convex/_generated`, `node_modules`).

## Git history summary (recent)

- `chore: scaffold TanStack Start app with Convex-first finance MVP plan`
- `feat: scaffold finance module routes with MVP mock data views`
- `fix: allow exe.dev proxy host in vite dev server`
- `feat: add phase-1 Convex backend wiring for users, plaid sync, and webhooks`
- `fix: use Convex Id type for mapped account ids in transaction sync`
- `fix: break plaid sync action type cycle with extracted helper`
- `fix: resolve convex action ctx type mismatch in plaid sync helper`
- `refactor: type plaid sync helper with Convex ActionCtx`
- `fix(convex): move webhook signature verification to node runtime`
- `chore: add biome scripts and bun-first workflow`

## Where to continue

- Continue from TODO.md in priority order.
- First deliverables should be security + auth hardening, then real Plaid connect UI, then transaction workflow.
