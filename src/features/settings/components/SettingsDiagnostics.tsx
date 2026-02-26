type SettingsDiagnosticsProps = {
	isDev: boolean;
	isSignedIn: boolean;
	envChecks: Record<string, boolean> | null;
};

export function SettingsDiagnostics({
	isDev,
	isSignedIn,
	envChecks,
}: SettingsDiagnosticsProps) {
	if (!isDev || !isSignedIn || !envChecks) return null;

	return (
		<div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
			<p className="mb-1 font-semibold text-slate-200">
				Environment diagnostics (dev-only)
			</p>
			<ul className="space-y-1">
				{Object.entries(envChecks).map(([key, ok]) => (
					<li key={key} className="flex items-center gap-2">
						<span className={ok ? "text-emerald-300" : "text-rose-300"}>
							{ok ? "✓" : "✗"}
						</span>
						<span>{key}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
