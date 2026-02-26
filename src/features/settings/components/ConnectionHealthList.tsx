import type { Id } from "../../../../convex/_generated/dataModel";
import type { ConnectionHealth } from "../types";
import { ConnectionHealthItemCard } from "./ConnectionHealthItemCard";

type ConnectionHealthListProps = {
	items: Array<ConnectionHealth>;
	isLoadingHealth: boolean;
	isSignedIn: boolean;
	syncingItemId: Id<"items"> | null;
	onRefresh: () => void;
	onSyncNow: (itemId: Id<"items">) => void;
};

export function ConnectionHealthList({
	items,
	isLoadingHealth,
	isSignedIn,
	syncingItemId,
	onRefresh,
	onSyncNow,
}: ConnectionHealthListProps) {
	return (
		<>
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-slate-200">
					Connection health
				</h3>
				<button
					type="button"
					onClick={onRefresh}
					disabled={isLoadingHealth || !isSignedIn}
					className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isLoadingHealth ? "Refreshing…" : "Refresh"}
				</button>
			</div>

			{items.length === 0 ? (
				<p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
					{isLoadingHealth
						? "Loading connections…"
						: "No institutions connected yet."}
				</p>
			) : (
				<div className="space-y-3">
					{items.map((item) => (
						<ConnectionHealthItemCard
							key={item._id}
							item={item}
							isSignedIn={isSignedIn}
							syncingItemId={syncingItemId}
							onSyncNow={onSyncNow}
						/>
					))}
				</div>
			)}
		</>
	);
}
