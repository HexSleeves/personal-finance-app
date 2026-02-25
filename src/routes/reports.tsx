import { createFileRoute } from "@tanstack/react-router";

const reportList = [
	"Budget vs Actual",
	"Category Spend Breakdown",
	"Cash Flow Trend",
	"Month-over-Month Comparison",
	"Upcoming Obligations",
	"Needs Review Queue",
	"CSV Export Ledger",
];

export const Route = createFileRoute("/reports")({
	component: ReportsPage,
});

function ReportsPage() {
	return (
		<section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
			<h2 className="text-xl font-semibold">Reports</h2>
			<ul className="mt-3 grid gap-2 text-sm text-slate-300">
				{reportList.map((report) => (
					<li key={report} className="rounded-md bg-slate-800/60 px-3 py-2">
						{report}
					</li>
				))}
			</ul>
		</section>
	);
}
