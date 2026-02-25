import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Settings</h2>
      <p className="mt-2 text-sm text-slate-300">
        Account connections, notification preferences, categories, and export
        controls will be managed here.
      </p>
    </section>
  )
}
