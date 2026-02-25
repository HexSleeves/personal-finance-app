import { createFileRoute } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAppAuth } from "../lib/providers";

const isDev = import.meta.env.DEV;

type ConnectionHealth = {
	_id: Id<"items">;
	plaidItemId: string;
	status: "healthy" | "degraded" | "needs_reauth" | "disconnected";
	errorCode?: string;
	errorMessage?: string;
	lastWebhookAt?: number;
	updatedAt: number;
	nextRetryAt?: number;
	lastSuccessfulSyncAt?: number;
	institutionName: string;
};

type PlaidLinkResult =
	| { status: "success"; publicToken: string }
	| { status: "canceled" };

type PlaidWindow = Window & {
	Plaid?: {
		create: (config: {
			token: string;
			onSuccess: (publicToken: string) => void;
			onExit: (error: { error_message?: string } | null) => void;
		}) => {
			open: () => void;
			destroy: () => void;
		};
	};
};

let plaidScriptPromise: Promise<void> | null = null;

function loadPlaidScript(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(
			new Error("Plaid Link requires a browser environment"),
		);
	}
	if ((window as PlaidWindow).Plaid) {
		return Promise.resolve();
	}
	if (plaidScriptPromise) {
		return plaidScriptPromise;
	}

	plaidScriptPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			'script[data-plaid-link="true"]',
		);
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener(
				"error",
				() => reject(new Error("Failed to load Plaid Link script")),
				{ once: true },
			);
			return;
		}

		const script = document.createElement("script");
		script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
		script.async = true;
		script.dataset.plaidLink = "true";
		script.onload = () => resolve();
		script.onerror = () =>
			reject(new Error("Failed to load Plaid Link script"));
		document.head.appendChild(script);
	});

	return plaidScriptPromise;
}

async function openPlaidLink(linkToken: string): Promise<PlaidLinkResult> {
	await loadPlaidScript();

	const plaid = (window as PlaidWindow).Plaid;
	if (!plaid) {
		throw new Error("Plaid Link did not initialize");
	}

	return await new Promise((resolve, reject) => {
		const handler = plaid.create({
			token: linkToken,
			onSuccess: (publicToken) => {
				handler.destroy();
				resolve({ status: "success", publicToken });
			},
			onExit: (error) => {
				handler.destroy();
				if (!error) {
					resolve({ status: "canceled" });
					return;
				}
				reject(new Error(error.error_message ?? "Plaid Link failed"));
			},
		});

		handler.open();
	});
}

function formatTimestamp(timestamp?: number) {
	if (!timestamp) return "—";
	return new Date(timestamp).toLocaleString();
}

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { isLoaded, isSignedIn } = useAppAuth();
	const createLinkToken = useAction(api.plaid.createLinkToken);
	const exchangePublicTokenAndSync = useAction(
		api.plaid.exchangePublicTokenAndSync,
	);
	const listMyConnectionHealth = useAction(api.plaid.listMyConnectionHealth);
	const runTransactionsSync = useAction(api.plaid.runTransactionsSync);
	const getEnvironmentDiagnostics = useAction(
		api.plaid.getEnvironmentDiagnostics,
	);

	const [items, setItems] = useState<Array<ConnectionHealth>>([]);
	const [isLoadingHealth, setIsLoadingHealth] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [syncingItemId, setSyncingItemId] = useState<Id<"items"> | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [envChecks, setEnvChecks] = useState<Record<string, boolean> | null>(
		null,
	);

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
	}, [listMyConnectionHealth]);

	useEffect(() => {
		if (!isLoaded || !isSignedIn) return;
		void refreshHealth();
		if (isDev) {
			void getEnvironmentDiagnostics({})
				.then((result) => setEnvChecks(result.checks))
				.catch(() => setEnvChecks(null));
		}
	}, [isLoaded, isSignedIn, refreshHealth, getEnvironmentDiagnostics]);

	const handleConnect = async () => {
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
	};

	const handleSyncNow = async (itemId: Id<"items">) => {
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
			setError(syncError instanceof Error ? syncError.message : "Sync failed");
		} finally {
			setSyncingItemId(null);
		}
	};

	const statusClasses: Record<ConnectionHealth["status"], string> = {
		healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
		degraded: "border-amber-500/30 bg-amber-500/10 text-amber-300",
		needs_reauth: "border-rose-500/30 bg-rose-500/10 text-rose-300",
		disconnected: "border-slate-600 bg-slate-700/40 text-slate-300",
	};

	return (
		<section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">Settings</h2>
					<p className="mt-2 text-sm text-slate-300">
						Connect institutions and monitor Plaid sync status.
					</p>
				</div>
				<button
					type="button"
					onClick={() => void handleConnect()}
					disabled={!isSignedIn || isConnecting}
					className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
				>
					{isConnecting ? "Connecting…" : "Connect account"}
				</button>
			</div>

			{!isSignedIn && (
				<p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
					Sign in with Clerk to connect institutions.
				</p>
			)}

			{isDev && isSignedIn && envChecks && (
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
			)}

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

			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-slate-200">
					Connection health
				</h3>
				<button
					type="button"
					onClick={() => void refreshHealth()}
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
						<article
							key={item._id}
							className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="font-medium text-slate-100">
										{item.institutionName}
									</p>
									<p className="text-xs text-slate-500">
										Item {item.plaidItemId}
									</p>
								</div>
								<span
									className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses[item.status]}`}
								>
									{item.status}
								</span>
							</div>

							<div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
								<p>
									Last successful sync:{" "}
									{formatTimestamp(item.lastSuccessfulSyncAt)}
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
								onClick={() => void handleSyncNow(item._id)}
								disabled={syncingItemId === item._id || !isSignedIn}
								className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{syncingItemId === item._id ? "Syncing…" : "Sync now"}
							</button>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
