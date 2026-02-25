import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/budgets')({
  component: BudgetsPage,
})

function BudgetsPage() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Budgets</h2>
      <p className="mt-2 text-sm text-slate-300">
        Zero-based monthly budget planner is scaffolded. Next: category group
        allocations, unassigned tracker, and copy-from-last-month.
      </p>
    </section>
  )
}
