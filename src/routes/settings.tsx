import { createFileRoute } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const listMyConnectionHealth = useAction(api.plaid.listMyConnectionHealth);

	return (
		<section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
			<div>
				<h2 className="text-xl font-semibold">Settings</h2>
				<p className="mt-2 text-sm text-slate-300">
					Connect institutions and monitor Plaid sync status.
				</p>
			</div>

			<div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
				<p>Next up in this slice:</p>
				<ul className="mt-2 list-disc space-y-1 pl-5">
					<li>Call createLinkToken + launch Plaid Link.</li>
					<li>Exchange public token via Convex action.</li>
					<li>Render connected item health from Convex.</li>
				</ul>
			</div>

			<button
				type="button"
				onClick={() => void listMyConnectionHealth({})}
				className="rounded-md bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/30"
			>
				Test Convex connection health action
			</button>
		</section>
	);
}
