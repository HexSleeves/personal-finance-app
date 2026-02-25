import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/bills')({
  component: BillsPage,
})

function BillsPage() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Bills & Recurring</h2>
      <p className="mt-2 text-sm text-slate-300">
        Upcoming bills timeline and due-vs-paid tracking will live here.
      </p>
    </section>
  )
}
