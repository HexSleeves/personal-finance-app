import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
})

function TransactionsPage() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Transactions</h2>
      <p className="mt-2 text-sm text-slate-300">
        Search, filters, bulk edits, splits, and manual transaction entry are
        next.
      </p>
    </section>
  )
}
