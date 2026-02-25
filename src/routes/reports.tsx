import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Reports</h2>
      <p className="mt-2 text-sm text-slate-300">
        Budget vs actual, category spend, cash flow, and month-over-month views
        will be implemented in this section.
      </p>
    </section>
  )
}
