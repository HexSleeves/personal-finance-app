type SettingsAuthNoticeProps = {
	isSignedIn: boolean;
};

export function SettingsAuthNotice({ isSignedIn }: SettingsAuthNoticeProps) {
	if (isSignedIn) return null;

	return (
		<p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
			Sign in with Clerk to connect institutions.
		</p>
	);
}
