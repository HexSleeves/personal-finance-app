import { createFileRoute } from '@tanstack/react-router'
import { formatDollars, mockAllocations, mockBudgetMonth } from '../lib/mock-data'

export const Route = createFileRoute('/budgets')({
  component: BudgetsPage,
})

function BudgetsPage() {
  const allocated = mockAllocations.reduce((sum, row) => sum + row.plannedCents, 0)
  const spent = mockAllocations.reduce((sum, row) => sum + row.actualCents, 0)
  const unassigned = mockBudgetMonth.plannedIncomeCents - allocated

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold">Budgets · Zero-Based</h2>
        <p className="mt-2 text-sm text-slate-300">
          Planned income: {formatDollars(mockBudgetMonth.plannedIncomeCents)} ·
          Allocated: {formatDollars(allocated)} · Spent: {formatDollars(spent)}
        </p>
        <p className="mt-1 text-sm text-cyan-300">
          Unassigned: {formatDollars(unassigned)}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/70 text-slate-300">
            <tr>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Planned</th>
              <th className="px-4 py-3">Actual</th>
              <th className="px-4 py-3">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {mockAllocations.map((row) => {
              const remaining = row.plannedCents - row.actualCents
              return (
                <tr key={row.categoryId} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-400">{row.groupName}</td>
                  <td className="px-4 py-3">{row.categoryName}</td>
                  <td className="px-4 py-3">{formatDollars(row.plannedCents)}</td>
                  <td className="px-4 py-3">{formatDollars(row.actualCents)}</td>
                  <td
                    className={`px-4 py-3 ${
                      remaining < 0 ? 'text-rose-300' : 'text-emerald-300'
                    }`}
                  >
                    {formatDollars(remaining)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
