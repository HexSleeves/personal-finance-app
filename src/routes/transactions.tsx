import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatDollars, mockTransactions } from "../lib/mock-data";

export const Route = createFileRoute("/transactions")({
	component: TransactionsPage,
});

function TransactionsPage() {
	const [query, setQuery] = useState("");
	const [pendingOnly, setPendingOnly] = useState(false);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return mockTransactions.filter((t) => {
			if (pendingOnly && !t.pending) return false;
			if (!q) return true;
			return (
				t.merchantName.toLowerCase().includes(q) ||
				t.accountName.toLowerCase().includes(q) ||
				(t.categoryName ?? "").toLowerCase().includes(q)
			);
		});
	}, [pendingOnly, query]);

	return (
		<section className="space-y-4">
			<div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
				<h2 className="text-xl font-semibold">Transactions</h2>
				<div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search merchant, account, or category"
						className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring-2"
					/>
					<label className="flex items-center gap-2 text-sm text-slate-300">
						<input
							type="checkbox"
							checked={pendingOnly}
							onChange={(e) => setPendingOnly(e.target.checked)}
						/>
						Pending only
					</label>
				</div>
			</div>

			<div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
				<table className="w-full text-left text-sm">
					<thead className="bg-slate-800/70 text-slate-300">
						<tr>
							<th className="px-4 py-3">Date</th>
							<th className="px-4 py-3">Merchant</th>
							<th className="px-4 py-3">Account</th>
							<th className="px-4 py-3">Category</th>
							<th className="px-4 py-3">Amount</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((tx) => (
							<tr key={tx.id} className="border-t border-slate-800">
								<td className="px-4 py-3 text-slate-400">{tx.postedDate}</td>
								<td className="px-4 py-3">
									{tx.merchantName}
									{tx.pending ? (
										<span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
											pending
										</span>
									) : null}
									{tx.needsReview ? (
										<span className="ml-2 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">
											review
										</span>
									) : null}
								</td>
								<td className="px-4 py-3">{tx.accountName}</td>
								<td className="px-4 py-3">
									{tx.categoryName ?? "Uncategorized"}
								</td>
								<td
									className={`px-4 py-3 ${
										tx.amountCents < 0 ? "text-rose-300" : "text-emerald-300"
									}`}
								>
									{formatDollars(tx.amountCents)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
