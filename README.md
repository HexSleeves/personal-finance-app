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
npm run dev
```

App runs at `http://localhost:3000`.

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
