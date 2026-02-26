import { useAction } from "convex/react";
import { useCallback, useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { openPlaidLink } from "../lib/plaidLink";
import { useSettingsStore } from "../store/useSettingsStore";

const isDev = import.meta.env.DEV;

type UseSettingsConnectionsArgs = {
	isLoaded: boolean;
	isSignedIn: boolean;
};

export function useSettingsConnections({
	isLoaded,
	isSignedIn,
}: UseSettingsConnectionsArgs) {
	const createLinkToken = useAction(api.plaid.createLinkToken);
	const exchangePublicTokenAndSync = useAction(
		api.plaid.exchangePublicTokenAndSync,
	);
	const listMyConnectionHealth = useAction(api.plaid.listMyConnectionHealth);
	const runTransactionsSync = useAction(api.plaid.runTransactionsSync);
	const getEnvironmentDiagnostics = useAction(
		api.plaid.getEnvironmentDiagnostics,
	);

	const items = useSettingsStore((state) => state.items);
	const isLoadingHealth = useSettingsStore((state) => state.isLoadingHealth);
	const isConnecting = useSettingsStore((state) => state.isConnecting);
	const syncingItemId = useSettingsStore((state) => state.syncingItemId);
	const notice = useSettingsStore((state) => state.notice);
	const error = useSettingsStore((state) => state.error);
	const envChecks = useSettingsStore((state) => state.envChecks);
	const setItems = useSettingsStore((state) => state.setItems);
	const setIsLoadingHealth = useSettingsStore(
		(state) => state.setIsLoadingHealth,
	);
	const setIsConnecting = useSettingsStore((state) => state.setIsConnecting);
	const setSyncingItemId = useSettingsStore((state) => state.setSyncingItemId);
	const setNotice = useSettingsStore((state) => state.setNotice);
	const setError = useSettingsStore((state) => state.setError);
	const setEnvChecks = useSettingsStore((state) => state.setEnvChecks);

	const refreshHealth = useCallback(async () => {
		setIsLoadingHealth(true);
		try {
			const nextItems = await listMyConnectionHealth({});
			setItems(nextItems);
		} catch (refreshError) {
			setError(
				refreshError instanceof Error
					? refreshError.message
					: "Failed to load connection health",
			);
		} finally {
			setIsLoadingHealth(false);
		}
	}, [listMyConnectionHealth, setError, setIsLoadingHealth, setItems]);

	useEffect(() => {
		if (!isLoaded || !isSignedIn) return;
		void refreshHealth();
		if (isDev) {
			void getEnvironmentDiagnostics({})
				.then((result) => setEnvChecks(result.checks))
				.catch(() => setEnvChecks(null));
		}
	}, [
		isLoaded,
		isSignedIn,
		refreshHealth,
		getEnvironmentDiagnostics,
		setEnvChecks,
	]);

	const handleConnect = useCallback(async () => {
		setNotice(null);
		setError(null);
		setIsConnecting(true);
		try {
			const token = await createLinkToken({});
			const linkResult = await openPlaidLink(token.linkToken);
			if (linkResult.status === "canceled") {
				setNotice("Bank connection canceled.");
				return;
			}

			const exchangeResult = await exchangePublicTokenAndSync({
				publicToken: linkResult.publicToken,
			});
			setNotice(
				`Connected successfully. Imported ${exchangeResult.syncSummary.addedCount} transactions.`,
			);
			await refreshHealth();
		} catch (connectError) {
			setError(
				connectError instanceof Error
					? connectError.message
					: "Failed to connect bank",
			);
		} finally {
			setIsConnecting(false);
		}
	}, [
		createLinkToken,
		exchangePublicTokenAndSync,
		refreshHealth,
		setError,
		setIsConnecting,
		setNotice,
	]);

	const handleSyncNow = useCallback(
		async (itemId: Id<"items">) => {
			setNotice(null);
			setError(null);
			setSyncingItemId(itemId);
			try {
				const result = await runTransactionsSync({ itemId });
				setNotice(
					`Sync complete. Added ${result.addedCount}, modified ${result.modifiedCount}, removed ${result.removedCount}.`,
				);
				await refreshHealth();
			} catch (syncError) {
				setError(
					syncError instanceof Error ? syncError.message : "Sync failed",
				);
			} finally {
				setSyncingItemId(null);
			}
		},
		[refreshHealth, runTransactionsSync, setError, setNotice, setSyncingItemId],
	);

	return {
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
	};
}
