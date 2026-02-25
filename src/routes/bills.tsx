import { createFileRoute } from "@tanstack/react-router";
import { formatDollars, mockBills } from "../lib/mock-data";

export const Route = createFileRoute("/bills")({
	component: BillsPage,
});

function BillsPage() {
	return (
		<section className="space-y-4">
			<div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
				<h2 className="text-xl font-semibold">Bills & Recurring</h2>
				<p className="mt-2 text-sm text-slate-300">
					Reminder + due-vs-paid workflow scaffolded. Next step: mark paid from
					matching transactions and send reminders.
				</p>
			</div>

			<div className="grid gap-3">
				{mockBills.map((bill) => (
					<article
						key={bill.name}
						className="rounded-xl border border-slate-800 bg-slate-900 p-4"
					>
						<div className="flex items-center justify-between">
							<h3 className="font-medium">{bill.name}</h3>
							<span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
								upcoming
							</span>
						</div>
						<p className="mt-2 text-sm text-slate-300">
							{formatDollars(bill.expectedAmountCents)} · {bill.cadence}
						</p>
						<p className="text-sm text-slate-400">
							Due {bill.nextDueDate} · remind {bill.reminderDaysBefore} days
							before
						</p>
					</article>
				))}
			</div>
		</section>
	);
}
