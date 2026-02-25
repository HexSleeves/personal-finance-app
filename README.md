# Northstar Finance (Personal Use)

Mobile-first personal finance app for US users, built with TanStack Start + Convex + Plaid.

## MVP Priorities

1. Zero-based budgets
2. Bills/recurring tracking with reminders
3. Reports/insights
4. Plaid transaction sync

See [PLAN.md](./PLAN.md) for scope and milestones.

## Tech Stack

- TanStack Start (React + TypeScript)
- Tailwind CSS
- Convex (database, backend functions, scheduled jobs)
- Plaid (US-only transactions import)

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

App runs at `http://localhost:3000`.

## Required one-time step for Convex codegen

Before TypeScript checks for Convex functions will pass, initialize Convex:

```bash
npx convex dev
```

That command provisions/links a deployment, writes env values, and generates `convex/_generated/*`.

## Convex Setup (next step)

1. Create a Convex project:
   ```bash
   npx convex dev
   ```
2. Follow the interactive prompts to authenticate and provision the project.
3. Add generated deployment variables to your local env.
4. Keep `npx convex dev` running while implementing backend functions.

## Planned Environment Variables

- `VITE_CONVEX_URL`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV` (`sandbox` | `development` | `production`)
- `PLAID_WEBHOOK_SECRET`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `RESEND_API_KEY`

## Notes

- TanStack Start in this template expects modern Node runtime support. If you see engine warnings, use Node 22+ for consistency.
- This app is designed as single-user first, with a schema that can support multi-user later.

## Phase 1 Backend Wiring (in progress)

Implemented:
- Convex user bootstrap mutation (`convex/users.ts`)
- Plaid client factory (`convex/plaidClient.ts`)
- Link token creation action (`convex/plaid.ts`)
- Public token exchange action + initial account import (`convex/plaid.ts`)
- Cursor-based transaction sync action skeleton (`convex/plaid.ts`)
- Persistence helpers for items/accounts/transactions/sync-runs (`convex/plaidPersistence.ts`)
- Plaid webhook HTTP endpoint + idempotent event processing (`convex/http.ts`, `convex/webhooks.ts`)

Still required before production use:
- Replace placeholder token encryption in `convex/security.ts` with strong authenticated encryption.
- Verify Plaid webhook signatures.
- Add authenticated user context (Clerk integration) and remove direct `userId` input from client calls.
- Add retry/backoff queueing for failed sync attempts.

### Plaid Webhook URL

After Convex is linked, configure Plaid webhook to:

`https://<your-convex-deployment>.convex.site/plaid/webhook`

(Exact host is shown by Convex once deployed.)
