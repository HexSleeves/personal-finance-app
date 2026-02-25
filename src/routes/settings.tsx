import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
			<h2 className="text-xl font-semibold">Settings</h2>
			<ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
				<li>Plaid connections + account health</li>
				<li>Reminder channels and timing</li>
				<li>Category and rule management</li>
				<li>Export and data retention options</li>
			</ul>
		</section>
	);
}
