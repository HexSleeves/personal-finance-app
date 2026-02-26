type SettingsHeaderProps = {
	isSignedIn: boolean;
	isConnecting: boolean;
	onConnect: () => void;
};

export function SettingsHeader({
	isSignedIn,
	isConnecting,
	onConnect,
}: SettingsHeaderProps) {
	return (
		<div className="flex items-start justify-between gap-4">
			<div>
				<h2 className="text-xl font-semibold">Settings</h2>
				<p className="mt-2 text-sm text-slate-300">
					Connect institutions and monitor Plaid sync status.
				</p>
			</div>
			<button
				type="button"
				onClick={onConnect}
				disabled={!isSignedIn || isConnecting}
				className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
			>
				{isConnecting ? "Connecting…" : "Connect account"}
			</button>
		</div>
	);
}
