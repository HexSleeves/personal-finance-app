type SettingsAlertsProps = {
	notice: string | null;
	error: string | null;
};

export function SettingsAlerts({ notice, error }: SettingsAlertsProps) {
	return (
		<>
			{notice && (
				<p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
					{notice}
				</p>
			)}
			{error && (
				<p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
					{error}
				</p>
			)}
		</>
	);
}
