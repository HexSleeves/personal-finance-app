"use node";

import { v } from "convex/values";
import { CountryCode, Products } from "plaid";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action, internalAction } from "./_generated/server";
import { requireUser } from "./auth";
import { getPlaidClient } from "./plaidClient";
import { decryptTokenWithMetadata, encryptToken } from "./security";
import {
	calculateRetryDelayMs,
	classifySyncError,
	MAX_SYNC_RETRIES,
} from "./syncRetry";

type SyncSummary = {
	addedCount: number;
	modifiedCount: number;
	removedCount: number;
	cursor: string | undefined;
};

async function runTransactionsSyncForItem(
	ctx: ActionCtx,
	itemId: Id<"items">,
): Promise<SyncSummary> {
	const item: {
		_id: Id<"items">;
		userId: Id<"users">;
		encryptedAccessToken: string;
		cursor?: string;
	} | null = await ctx.runQuery(api.plaidPersistence.getItemForSync, {
		itemId,
	});

	if (!item) {
		throw new Error("Item not found");
	}

	const plaid = getPlaidClient();
	const decryptedToken = decryptTokenWithMetadata(item.encryptedAccessToken);
	const accessToken = decryptedToken.token;

	if (decryptedToken.wasLegacyFormat) {
		await ctx.runMutation(
			api.plaidPersistence.rotateItemAccessTokenCiphertext,
			{
				itemId: item._id,
				encryptedAccessToken: encryptToken(accessToken),
			},
		);
	}

	const syncRunId: Id<"syncRuns"> = await ctx.runMutation(
		api.plaidPersistence.createSyncRun,
		{
			userId: item.userId,
			itemId: item._id,
			cursorBefore: item.cursor,
		},
	);

	let cursor: string | undefined = item.cursor;
	let hasMore = true;
	let addedCount = 0;
	let modifiedCount = 0;
	let removedCount = 0;

	try {
		while (hasMore) {
			const response = await plaid.transactionsSync({
				access_token: accessToken,
				cursor,
				count: 100,
			});

			const page = response.data;
			cursor = page.next_cursor;
			hasMore = page.has_more;

			const added = page.added.map((tx) => ({
				transactionId: tx.transaction_id,
				accountId: tx.account_id,
				pendingTransactionId: tx.pending_transaction_id ?? undefined,
				amountCents: Math.round(tx.amount * 100),
				isoCurrencyCode: tx.iso_currency_code ?? "USD",
				merchantNameRaw: tx.merchant_name ?? undefined,
				nameRaw: tx.name,
				authorizedDate: tx.authorized_date ?? undefined,
				postedDate: tx.date,
				pending: tx.pending,
			}));

			const modified = page.modified.map((tx) => ({
				transactionId: tx.transaction_id,
				accountId: tx.account_id,
				pendingTransactionId: tx.pending_transaction_id ?? undefined,
				amountCents: Math.round(tx.amount * 100),
				isoCurrencyCode: tx.iso_currency_code ?? "USD",
				merchantNameRaw: tx.merchant_name ?? undefined,
				nameRaw: tx.name,
				authorizedDate: tx.authorized_date ?? undefined,
				postedDate: tx.date,
				pending: tx.pending,
			}));

			const removed = page.removed.map((tx) => ({
				transactionId: tx.transaction_id,
			}));

			addedCount += added.length;
			modifiedCount += modified.length;
			removedCount += removed.length;

			await ctx.runMutation(api.plaidPersistence.applyTransactionsSyncPage, {
				userId: item.userId,
				itemId: item._id,
				added,
				modified,
				removed,
			});
		}

		await ctx.runMutation(api.plaidPersistence.finalizeSyncRun, {
			syncRunId,
			itemId: item._id,
			status: "success",
			cursorAfter: cursor,
			addedCount,
			modifiedCount,
			removedCount,
		});

		return { addedCount, modifiedCount, removedCount, cursor };
	} catch (error) {
		const retryState = await ctx.runQuery(
			api.plaidPersistence.getItemRetryState,
			{
				itemId: item._id,
			},
		);
		const classification = classifySyncError(error);
		const failureCount = (retryState?.failureCount ?? 0) + 1;
		const retriesExhausted = failureCount >= MAX_SYNC_RETRIES;
		const shouldRetry = classification.isRetryable && !retriesExhausted;
		const retryDelayMs = shouldRetry
			? calculateRetryDelayMs(failureCount)
			: undefined;
		const retryScheduledAt =
			typeof retryDelayMs === "number" ? Date.now() + retryDelayMs : undefined;

		if (typeof retryDelayMs === "number") {
			await ctx.scheduler.runAfter(
				retryDelayMs,
				internal.plaid.runTransactionsSyncInternal,
				{
					itemId: item._id,
				},
			);
		}

		await ctx.runMutation(api.plaidPersistence.finalizeSyncRun, {
			syncRunId,
			itemId: item._id,
			status: "failed",
			cursorAfter: cursor,
			addedCount,
			modifiedCount,
			removedCount,
			errorCode: classification.errorCode,
			errorType: classification.errorType,
			errorMessage: classification.errorMessage,
			retryable: classification.isRetryable,
			retryScheduledAt,
			itemStatus: retriesExhausted ? "needs_reauth" : classification.itemStatus,
			nextRetryAt: retryScheduledAt,
			failureCount,
		});

		throw error;
	}
}

export const createLinkToken = action({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		const plaid = getPlaidClient();
		const response = await plaid.linkTokenCreate({
			user: { client_user_id: user.clerkId },
			client_name: "Northstar Finance",
			products: [Products.Transactions],
			country_codes: [CountryCode.Us],
			language: "en",
			redirect_uri: process.env.PLAID_REDIRECT_URI,
			webhook: process.env.PLAID_WEBHOOK_URL,
		});

		return {
			linkToken: response.data.link_token,
			expiration: response.data.expiration,
			requestId: response.data.request_id,
		};
	},
});

export const exchangePublicTokenAndSync = action({
	args: {
		publicToken: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const plaid = getPlaidClient();

		const exchange = await plaid.itemPublicTokenExchange({
			public_token: args.publicToken,
		});

		const plaidItemId = exchange.data.item_id;
		const accessToken = exchange.data.access_token;

		const itemInfo = await plaid.itemGet({ access_token: accessToken });
		const institutionId = itemInfo.data.item.institution_id;
		if (!institutionId) {
			throw new Error("Institution ID not returned from Plaid");
		}

		const institution = await plaid.institutionsGetById({
			institution_id: institutionId,
			country_codes: [CountryCode.Us],
			options: { include_optional_metadata: true },
		});

		const itemDocId: Id<"items"> = await ctx.runMutation(
			api.plaidPersistence.upsertItemWithInstitution,
			{
				userId: user._id,
				plaidItemId,
				plaidInstitutionId: institutionId,
				institutionName: institution.data.institution.name,
				institutionLogoUrl: institution.data.institution.logo ?? undefined,
				encryptedAccessToken: encryptToken(accessToken),
			},
		);

		const accounts = await plaid.accountsGet({ access_token: accessToken });
		await ctx.runMutation(api.plaidPersistence.upsertAccounts, {
			userId: user._id,
			itemId: itemDocId,
			accounts: accounts.data.accounts.map((account) => ({
				plaidAccountId: account.account_id,
				name: account.name,
				type: account.type,
				subtype: account.subtype ?? undefined,
				mask: account.mask ?? undefined,
				currentBalanceCents:
					account.balances.current == null
						? undefined
						: Math.round(account.balances.current * 100),
				availableBalanceCents:
					account.balances.available == null
						? undefined
						: Math.round(account.balances.available * 100),
			})),
		});

		const syncSummary = await runTransactionsSyncForItem(ctx, itemDocId);

		return { itemId: itemDocId, syncSummary };
	},
});

export const runTransactionsSync = action({
	args: { itemId: v.id("items") },
	handler: async (ctx, args): Promise<SyncSummary> => {
		const user = await requireUser(ctx);
		const item = await ctx.runQuery(api.plaidPersistence.getItemForSync, {
			itemId: args.itemId,
		});
		if (!item || item.userId !== user._id) {
			throw new Error("Item not found");
		}

		return await runTransactionsSyncForItem(ctx, args.itemId);
	},
});

export const runTransactionsSyncInternal = internalAction({
	args: { itemId: v.id("items") },
	handler: async (ctx, args): Promise<SyncSummary> => {
		return await runTransactionsSyncForItem(ctx, args.itemId);
	},
});

export const retryDueItemSyncs = action({
	args: {},
	handler: async (
		ctx,
	): Promise<{
		triedCount: number;
		successCount: number;
		results: Array<{
			itemId: Id<"items">;
			status: "success" | "failed";
			errorMessage?: string;
		}>;
	}> => {
		const user = await requireUser(ctx);
		const dueItems: Array<{ _id: Id<"items"> }> = await ctx.runQuery(
			internal.plaidPersistence.listRetryableItemsDue,
			{
				now: Date.now(),
			},
		);

		const results: Array<{
			itemId: Id<"items">;
			status: "success" | "failed";
			errorMessage?: string;
		}> = [];

		for (const item of dueItems) {
			const itemDoc = await ctx.runQuery(api.plaidPersistence.getItemForSync, {
				itemId: item._id,
			});
			if (!itemDoc || itemDoc.userId !== user._id) {
				continue;
			}

			try {
				await runTransactionsSyncForItem(ctx, item._id);
				results.push({ itemId: item._id, status: "success" });
			} catch (error) {
				results.push({
					itemId: item._id,
					status: "failed",
					errorMessage:
						error instanceof Error ? error.message : "Unknown sync retry error",
				});
			}
		}

		return {
			triedCount: dueItems.length,
			successCount: results.filter((result) => result.status === "success")
				.length,
			results,
		};
	},
});

export const listMyConnectionHealth = action({
	args: {},
	handler: async (
		ctx,
	): Promise<
		Array<{
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
		}>
	> => {
		const user = await requireUser(ctx);
		return await ctx.runQuery(internal.plaidPersistence.listItemsByUser, {
			userId: user._id,
		});
	},
});

export const getEnvironmentDiagnostics = action({
	args: {},
	handler: async (ctx) => {
		await requireUser(ctx);

		const checks = {
			PLAID_CLIENT_ID: !!process.env.PLAID_CLIENT_ID,
			PLAID_SECRET: !!process.env.PLAID_SECRET,
			TOKEN_ENCRYPTION_KEY: !!process.env.TOKEN_ENCRYPTION_KEY,
			PLAID_ENV: !!process.env.PLAID_ENV,
			CLERK_JWT_ISSUER_DOMAIN: !!process.env.CLERK_JWT_ISSUER_DOMAIN,
		};

		return {
			checks,
			allRequiredSet: Object.values(checks).every(Boolean),
		};
	},
});
