import { createFileRoute } from '@tanstack/react-router'

const dashboardCards = [
  {
    title: 'Budget Month',
    value: 'February 2026',
    meta: '$5,200 planned · $1,940 spent · $3,260 left',
  },
  {
    title: 'Bills Due (Next 14 Days)',
    value: '4 bills',
    meta: '$1,287 upcoming · 1 overdue',
  },
  {
    title: 'Needs Review',
    value: '12 transactions',
    meta: 'Uncategorized, recurring suggestions, and rule misses',
  },
]

export const Route = createFileRoute('/')({ component: DashboardPage })

function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Mobile-first personal finance command center. Plaid + Convex integration
          will populate these cards.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{card.value}</p>
            <p className="mt-1 text-sm text-slate-300">{card.meta}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="font-semibold">Current sprint</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Set up Convex schema + auth context</li>
          <li>Implement Plaid Link token + token exchange actions</li>
          <li>Build transactions list with search and category edits</li>
        </ul>
      </section>
    </div>
  )
}
