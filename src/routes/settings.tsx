import { createFileRoute } from "@tanstack/react-router";
import { ConnectionHealthList } from "../features/settings/components/ConnectionHealthList";
import { SettingsAlerts } from "../features/settings/components/SettingsAlerts";
import { SettingsAuthNotice } from "../features/settings/components/SettingsAuthNotice";
import { SettingsDiagnostics } from "../features/settings/components/SettingsDiagnostics";
import { SettingsHeader } from "../features/settings/components/SettingsHeader";
import { useSettingsConnections } from "../features/settings/hooks/useSettingsConnections";
import { useAppAuth } from "../lib/providers";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { isLoaded, isSignedIn } = useAppAuth();
	const {
		isDev,
		items,
		isLoadingHealth,
		isConnecting,
		syncingItemId,
		notice,
		error,
		envChecks,
		handleConnect,
		handleSyncNow,
		refreshHealth,
	} = useSettingsConnections({ isLoaded, isSignedIn });

	return (
		<section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
			<SettingsHeader
				isSignedIn={isSignedIn}
				isConnecting={isConnecting}
				onConnect={() => void handleConnect()}
			/>

			<SettingsAuthNotice isSignedIn={isSignedIn} />

			<SettingsDiagnostics
				isDev={isDev}
				isSignedIn={isSignedIn}
				envChecks={envChecks}
			/>

			<SettingsAlerts notice={notice} error={error} />

			<ConnectionHealthList
				items={items}
				isLoadingHealth={isLoadingHealth}
				isSignedIn={isSignedIn}
				syncingItemId={syncingItemId}
				onRefresh={() => void refreshHealth()}
				onSyncNow={(itemId) => void handleSyncNow(itemId)}
			/>
		</section>
	);
}
