import type { Id } from "../../../../convex/_generated/dataModel";
import { formatTimestamp } from "../lib/format";
import type { ConnectionHealth } from "../types";

const statusClasses: Record<ConnectionHealth["status"], string> = {
	healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
	degraded: "border-amber-500/30 bg-amber-500/10 text-amber-300",
	needs_reauth: "border-rose-500/30 bg-rose-500/10 text-rose-300",
	disconnected: "border-slate-600 bg-slate-700/40 text-slate-300",
};

type ConnectionHealthItemCardProps = {
	item: ConnectionHealth;
	isSignedIn: boolean;
	syncingItemId: Id<"items"> | null;
	onSyncNow: (itemId: Id<"items">) => void;
};

export function ConnectionHealthItemCard({
	item,
	isSignedIn,
	syncingItemId,
	onSyncNow,
}: ConnectionHealthItemCardProps) {
	const isSyncing = syncingItemId === item._id;

	return (
		<article className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-medium text-slate-100">{item.institutionName}</p>
					<p className="text-xs text-slate-500">Item {item.plaidItemId}</p>
				</div>
				<span
					className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses[item.status]}`}
				>
					{item.status}
				</span>
			</div>

			<div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
				<p>
					Last successful sync: {formatTimestamp(item.lastSuccessfulSyncAt)}
				</p>
				<p>Next retry: {formatTimestamp(item.nextRetryAt)}</p>
				<p>Last webhook: {formatTimestamp(item.lastWebhookAt)}</p>
				<p>Updated: {formatTimestamp(item.updatedAt)}</p>
			</div>

			{item.errorMessage && (
				<p className="text-xs text-rose-300">
					{item.errorCode ? `${item.errorCode}: ` : ""}
					{item.errorMessage}
				</p>
			)}

			<button
				type="button"
				onClick={() => onSyncNow(item._id)}
				disabled={isSyncing || !isSignedIn}
				className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSyncing ? "Syncing…" : "Sync now"}
			</button>
		</article>
	);
}
