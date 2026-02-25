"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { verifyPlaidWebhookSignature } from "./plaidWebhookVerify";

export const verifyAndProcessPlaidWebhook = action({
	args: {
		body: v.string(),
		idempotencyKey: v.string(),
		plaidVerificationHeader: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		try {
			await verifyPlaidWebhookSignature(
				args.body,
				args.plaidVerificationHeader ?? null,
			);
		} catch (error) {
			console.warn("Rejected Plaid webhook signature", error);
			return { status: "unauthorized" as const };
		}

		await ctx.runAction(api.webhooks.processPlaidWebhook, {
			body: args.body,
			idempotencyKey: args.idempotencyKey,
		});

		return { status: "ok" as const };
	},
});
