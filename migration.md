# Migration Notes for Next Agent

Date: 2026-02-26
Repo: `/home/exedev/personal-finance-app`
Branch: `main`

## Current Product/Tech Context

- App: Northstar Finance (personal-use US finance app)
- Stack: TanStack Start + React + TypeScript + Tailwind + Convex + Plaid + Clerk
- Auth wiring is active (Clerk + Convex)
- Plaid connect flow is implemented in Settings

## Recently Completed (already committed)

1. `623867e` — `feat(settings): add plaid link connect flow and connection health UI`
   - Connect account button calls Convex `createLinkToken`
   - Plaid Link modal launches and returns public token
   - Public token exchange + initial sync
   - Connection health UI with status + manual sync
   - Added internal sync action path for webhook/scheduler usage

2. `567157d` — `feat(auth-ui): add clerk sign in/out controls in app header`
   - Header now shows Sign in / Sign out controls

3. `53fe37f` — `feat(settings): add dev env diagnostics for plaid setup`
   - Dev-only diagnostics section in Settings
   - Backend action `getEnvironmentDiagnostics`

## Important Operational Notes

- Cursor remote issue was diagnosed as corrupted remote server install (`~/.cursor-server/.../package.json` was truncated).
- Corrupted version directory was removed to force reinstall on reconnect.
- If reconnect fails again, clear that version directory and retry.

## In-Progress Refactor State (NOT committed)

A decomposition refactor was started but not integrated yet. New untracked files exist under:

- `src/features/settings/components/SettingsHeader.tsx`
- `src/features/settings/hooks/useSettingsConnections.ts`
- `src/features/settings/lib/plaidLink.ts`
- `src/features/settings/lib/format.ts`
- `src/features/settings/types.ts`

These files are scaffolding only right now; `src/routes/settings.tsx` has not been switched to consume them yet.

## User Direction (latest)

User explicitly requested:

- break out large components into smaller reusable components
- **use Zustand for state management**
- create this `migration.md` for handoff

## Recommended Next Steps (priority order)

1. **Adopt Zustand for Settings state first**
   - Add dependency: `zustand`
   - Create `src/features/settings/store/useSettingsStore.ts`
   - Move Settings UI state into store:
     - `items`, `isLoadingHealth`, `isConnecting`, `syncingItemId`, `notice`, `error`, `envChecks`
   - Keep side-effect orchestration in hook/service layer initially

2. **Complete Settings decomposition**
   - Convert route to composition using feature modules:
     - hook: `useSettingsConnections`
     - presentational components (header, diagnostics block, health list, item card, alerts)
   - Keep behavior unchanged

3. **Run validation suite**
   - `bunx convex codegen`
   - `bun run check`
   - `bun run typecheck`
   - `bun run test`
   - `bun run build`

4. **Commit with clear message**
   - Suggested: `refactor(settings): compose settings page and move ui state to zustand`

## Guardrails for Next Agent

- Do not regress auth safety:
  - public Plaid actions must remain auth-derived
  - internal sync action should stay internal-only for scheduler/webhook paths
- Keep SSR-safe behavior when Clerk env keys are absent
- Preserve dev-only env diagnostics behavior

## Current Working Tree Snapshot (at handoff)

- Tracked files: clean
- Untracked: `src/features/settings/**` scaffolding files listed above
