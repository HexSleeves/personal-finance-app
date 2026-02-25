import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const getItemByPlaidItemId = query({
	args: { plaidItemId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("items")
			.withIndex("by_plaid_item_id", (q) =>
				q.eq("plaidItemId", args.plaidItemId),
			)
			.unique();
	},
});

export const getItemForSync = query({
	args: { itemId: v.id("items") },
	handler: async (ctx, args) => {
		const item = await ctx.db.get(args.itemId);
		if (!item) return null;
		return {
			_id: item._id,
			userId: item.userId,
			plaidItemId: item.plaidItemId,
			encryptedAccessToken: item.encryptedAccessToken,
			cursor: item.cursor,
		};
	},
});

export const upsertItemWithInstitution = mutation({
	args: {
		userId: v.id("users"),
		plaidItemId: v.string(),
		plaidInstitutionId: v.string(),
		institutionName: v.string(),
		institutionLogoUrl: v.optional(v.string()),
		encryptedAccessToken: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		let institution = await ctx.db
			.query("institutions")
			.withIndex("by_plaid_institution_id", (q) =>
				q.eq("plaidInstitutionId", args.plaidInstitutionId),
			)
			.unique();

		if (!institution) {
			const institutionId = await ctx.db.insert("institutions", {
				plaidInstitutionId: args.plaidInstitutionId,
				name: args.institutionName,
				logoUrl: args.institutionLogoUrl,
			});
			institution = await ctx.db.get(institutionId);
		}

		if (!institution) {
			throw new Error("Failed to create institution");
		}

		const existingItem = await ctx.db
			.query("items")
			.withIndex("by_plaid_item_id", (q) =>
				q.eq("plaidItemId", args.plaidItemId),
			)
			.unique();

		if (existingItem) {
			await ctx.db.patch(existingItem._id, {
				institutionId: institution._id,
				encryptedAccessToken: args.encryptedAccessToken,
				status: "healthy",
				updatedAt: now,
			});
			return existingItem._id;
		}

		return await ctx.db.insert("items", {
			userId: args.userId,
			institutionId: institution._id,
			plaidItemId: args.plaidItemId,
			encryptedAccessToken: args.encryptedAccessToken,
			status: "healthy",
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const upsertAccounts = mutation({
	args: {
		userId: v.id("users"),
		itemId: v.id("items"),
		accounts: v.array(
			v.object({
				plaidAccountId: v.string(),
				name: v.string(),
				type: v.string(),
				subtype: v.optional(v.string()),
				mask: v.optional(v.string()),
				currentBalanceCents: v.optional(v.number()),
				availableBalanceCents: v.optional(v.number()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		for (const account of args.accounts) {
			const existing = await ctx.db
				.query("accounts")
				.withIndex("by_plaid_account_id", (q) =>
					q.eq("plaidAccountId", account.plaidAccountId),
				)
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, {
					name: account.name,
					type: account.type,
					subtype: account.subtype,
					mask: account.mask,
					currentBalanceCents: account.currentBalanceCents,
					availableBalanceCents: account.availableBalanceCents,
					isActive: true,
					updatedAt: now,
				});
			} else {
				await ctx.db.insert("accounts", {
					userId: args.userId,
					itemId: args.itemId,
					plaidAccountId: account.plaidAccountId,
					name: account.name,
					type: account.type,
					subtype: account.subtype,
					mask: account.mask,
					currentBalanceCents: account.currentBalanceCents,
					availableBalanceCents: account.availableBalanceCents,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				});
			}
		}
	},
});

export const createSyncRun = mutation({
	args: {
		userId: v.id("users"),
		itemId: v.id("items"),
		cursorBefore: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("syncRuns", {
			userId: args.userId,
			itemId: args.itemId,
			startedAt: Date.now(),
			status: "running",
			cursorBefore: args.cursorBefore,
			addedCount: 0,
			modifiedCount: 0,
			removedCount: 0,
		});
	},
});

export const finalizeSyncRun = mutation({
	args: {
		syncRunId: v.id("syncRuns"),
		itemId: v.id("items"),
		cursorAfter: v.optional(v.string()),
		addedCount: v.number(),
		modifiedCount: v.number(),
		removedCount: v.number(),
		status: v.union(v.literal("success"), v.literal("failed")),
		errorCode: v.optional(v.string()),
		errorType: v.optional(v.string()),
		errorMessage: v.optional(v.string()),
		retryable: v.optional(v.boolean()),
		retryScheduledAt: v.optional(v.number()),
		itemStatus: v.optional(
			v.union(v.literal("degraded"), v.literal("needs_reauth")),
		),
		nextRetryAt: v.optional(v.number()),
		failureCount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		await ctx.db.patch(args.syncRunId, {
			finishedAt: now,
			status: args.status,
			cursorAfter: args.cursorAfter,
			addedCount: args.addedCount,
			modifiedCount: args.modifiedCount,
			removedCount: args.removedCount,
			errorCode: args.errorCode,
			errorType: args.errorType,
			errorMessage: args.errorMessage,
			retryable: args.retryable,
			retryScheduledAt: args.retryScheduledAt,
		});

		if (args.status === "success") {
			await ctx.db.patch(args.itemId, {
				cursor: args.cursorAfter,
				status: "healthy",
				errorCode: undefined,
				errorMessage: undefined,
				failureCount: 0,
				nextRetryAt: undefined,
				updatedAt: now,
			});
			return;
		}

		await ctx.db.patch(args.itemId, {
			status: args.itemStatus ?? "degraded",
			errorCode: args.errorCode,
			errorMessage: args.errorMessage,
			failureCount: args.failureCount,
			nextRetryAt: args.nextRetryAt,
			updatedAt: now,
		});
	},
});

export const applyTransactionsSyncPage = mutation({
	args: {
		userId: v.id("users"),
		itemId: v.id("items"),
		added: v.array(
			v.object({
				transactionId: v.string(),
				accountId: v.string(),
				pendingTransactionId: v.optional(v.string()),
				amountCents: v.number(),
				isoCurrencyCode: v.string(),
				merchantNameRaw: v.optional(v.string()),
				nameRaw: v.string(),
				authorizedDate: v.optional(v.string()),
				postedDate: v.optional(v.string()),
				pending: v.boolean(),
			}),
		),
		modified: v.array(
			v.object({
				transactionId: v.string(),
				accountId: v.string(),
				pendingTransactionId: v.optional(v.string()),
				amountCents: v.number(),
				isoCurrencyCode: v.string(),
				merchantNameRaw: v.optional(v.string()),
				nameRaw: v.string(),
				authorizedDate: v.optional(v.string()),
				postedDate: v.optional(v.string()),
				pending: v.boolean(),
			}),
		),
		removed: v.array(v.object({ transactionId: v.string() })),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		const accountByPlaidId = new Map<string, Id<"accounts">>();
		const accounts = await ctx.db
			.query("accounts")
			.withIndex("by_item_id", (q) => q.eq("itemId", args.itemId))
			.collect();

		for (const account of accounts) {
			accountByPlaidId.set(account.plaidAccountId, account._id);
		}

		const upsertOne = async (
			row: (typeof args.added)[number] | (typeof args.modified)[number],
		) => {
			const accountId = accountByPlaidId.get(row.accountId);
			if (!accountId) return;

			const existing = await ctx.db
				.query("transactions")
				.withIndex("by_plaid_transaction_id", (q) =>
					q.eq("plaidTransactionId", row.transactionId),
				)
				.unique();

			const payload = {
				userId: args.userId,
				accountId: accountId as Id<"accounts">,
				plaidTransactionId: row.transactionId,
				pendingTransactionId: row.pendingTransactionId,
				amountCents: row.amountCents,
				isoCurrencyCode: row.isoCurrencyCode,
				merchantNameRaw: row.merchantNameRaw,
				nameRaw: row.nameRaw,
				authorizedDate: row.authorizedDate,
				postedDate: row.postedDate,
				pending: row.pending,
				hashFingerprint: `${row.accountId}:${row.transactionId}`,
				updatedAt: now,
			};

			if (existing) {
				await ctx.db.patch(existing._id, {
					...payload,
					removedAt: undefined,
				});
			} else {
				await ctx.db.insert("transactions", {
					...payload,
					isTransfer: false,
					excludeFromBudget: false,
					manual: false,
					reviewStatus: "none",
					createdAt: now,
				});
			}
		};

		for (const tx of args.added) await upsertOne(tx);
		for (const tx of args.modified) await upsertOne(tx);

		for (const tx of args.removed) {
			const existing = await ctx.db
				.query("transactions")
				.withIndex("by_plaid_transaction_id", (q) =>
					q.eq("plaidTransactionId", tx.transactionId),
				)
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, {
					removedAt: now,
					updatedAt: now,
				});
			}
		}
	},
});

export const upsertWebhookEvent = mutation({
	args: {
		eventType: v.string(),
		idempotencyKey: v.string(),
		payloadJson: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("webhookEvents")
			.withIndex("by_idempotency_key", (q) =>
				q.eq("idempotencyKey", args.idempotencyKey),
			)
			.unique();

		if (existing) {
			return { inserted: false, webhookEventId: existing._id };
		}

		const webhookEventId = await ctx.db.insert("webhookEvents", {
			source: "plaid",
			eventType: args.eventType,
			idempotencyKey: args.idempotencyKey,
			payloadJson: args.payloadJson,
			createdAt: Date.now(),
		});

		return { inserted: true, webhookEventId };
	},
});

export const markWebhookEventProcessed = mutation({
	args: { webhookEventId: v.id("webhookEvents") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.webhookEventId, { processedAt: Date.now() });
	},
});

export const rotateItemAccessTokenCiphertext = mutation({
	args: {
		itemId: v.id("items"),
		encryptedAccessToken: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.itemId, {
			encryptedAccessToken: args.encryptedAccessToken,
			updatedAt: Date.now(),
		});
	},
});

export const getItemRetryState = query({
	args: { itemId: v.id("items") },
	handler: async (ctx, args) => {
		const item = await ctx.db.get(args.itemId);
		if (!item) return null;
		return {
			failureCount: item.failureCount ?? 0,
			nextRetryAt: item.nextRetryAt,
			status: item.status,
		};
	},
});

export const listRetryableItemsDue = query({
	args: { now: v.number() },
	handler: async (ctx, args) => {
		const degradedItems = await ctx.db
			.query("items")
			.withIndex("by_status", (q) => q.eq("status", "degraded"))
			.collect();

		return degradedItems
			.filter(
				(item) => (item.nextRetryAt ?? Number.MAX_SAFE_INTEGER) <= args.now,
			)
			.map((item) => ({ _id: item._id }));
	},
});
