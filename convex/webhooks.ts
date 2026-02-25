import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

export const processPlaidWebhook = action({
	args: {
		body: v.string(),
		idempotencyKey: v.string(),
	},
	handler: async (ctx, args) => {
		const payload = JSON.parse(args.body) as {
			webhook_type?: string;
			webhook_code?: string;
			item_id?: string;
		};

		const eventType = `${payload.webhook_type ?? "unknown"}:${payload.webhook_code ?? "unknown"}`;

		const inserted = await ctx.runMutation(
			api.plaidPersistence.upsertWebhookEvent,
			{
				eventType,
				idempotencyKey: args.idempotencyKey,
				payloadJson: args.body,
			},
		);

		if (!inserted.inserted) {
			return { status: "duplicate_ignored" as const };
		}

		if (payload.item_id && payload.webhook_type === "TRANSACTIONS") {
			const item = await ctx.runQuery(
				api.plaidPersistence.getItemByPlaidItemId,
				{
					plaidItemId: payload.item_id,
				},
			);

			if (item) {
				await ctx.runAction(api.plaid.runTransactionsSync, {
					itemId: item._id,
				});
			}
		}

		await ctx.runMutation(api.plaidPersistence.markWebhookEventProcessed, {
			webhookEventId: inserted.webhookEventId,
		});

		return { status: "ok" as const };
	},
});
