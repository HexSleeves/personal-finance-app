type ItemStatus = "degraded" | "needs_reauth";

export type SyncFailureClassification = {
	errorCode?: string;
	errorType?: string;
	errorMessage: string;
	httpStatus?: number;
	isRetryable: boolean;
	itemStatus: ItemStatus;
};

const NEEDS_REAUTH_ERROR_CODES = new Set([
	"ITEM_LOGIN_REQUIRED",
	"INVALID_ACCESS_TOKEN",
	"ACCESS_NOT_GRANTED",
]);

const TRANSIENT_ERROR_CODES = new Set([
	"RATE_LIMIT_EXCEEDED",
	"INSTITUTION_DOWN",
	"INSTITUTION_NOT_RESPONDING",
	"PRODUCT_NOT_READY",
	"INTERNAL_SERVER_ERROR",
	"TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION",
]);

export const MAX_SYNC_RETRIES = 5;
export const BASE_RETRY_DELAY_MS = 60_000;
export const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;

export function calculateRetryDelayMs(failureCount: number): number {
	const exponent = Math.max(0, failureCount - 1);
	return Math.min(BASE_RETRY_DELAY_MS * 2 ** exponent, MAX_RETRY_DELAY_MS);
}

export function classifySyncError(error: unknown): SyncFailureClassification {
	const raw = error as {
		message?: string;
		response?: {
			status?: number;
			data?: {
				error_code?: string;
				error_type?: string;
				error_message?: string;
				display_message?: string | null;
			};
		};
	};

	const httpStatus = raw.response?.status;
	const data = raw.response?.data;
	const errorCode = data?.error_code;
	const errorType = data?.error_type;
	const errorMessage =
		data?.display_message ??
		data?.error_message ??
		raw.message ??
		"Unknown sync error";

	if (errorCode && NEEDS_REAUTH_ERROR_CODES.has(errorCode)) {
		return {
			errorCode,
			errorType,
			errorMessage,
			httpStatus,
			isRetryable: false,
			itemStatus: "needs_reauth",
		};
	}

	const isTransientCode = !!errorCode && TRANSIENT_ERROR_CODES.has(errorCode);
	const is5xx = typeof httpStatus === "number" && httpStatus >= 500;
	const isRetryable = isTransientCode || is5xx || !errorCode;

	return {
		errorCode,
		errorType,
		errorMessage,
		httpStatus,
		isRetryable,
		itemStatus: "degraded",
	};
}
