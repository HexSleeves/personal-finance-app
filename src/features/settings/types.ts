import type { Id } from "../../../convex/_generated/dataModel";

export type ConnectionHealth = {
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
