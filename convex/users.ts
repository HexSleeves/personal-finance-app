import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireIdentity } from "./auth";

async function upsertUserFromIdentity(
	ctx: MutationCtx,
	identity: Awaited<ReturnType<typeof requireIdentity>>,
	args: {
		timezone?: string;
		defaultCurrency?: string;
	},
): Promise<Id<"users">> {
	const now = Date.now();
	const existing = await ctx.db
		.query("users")
		.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.clerkId))
		.unique();

	if (existing) {
		await ctx.db.patch(existing._id, {
			email: identity.email ?? existing.email,
			timezone: args.timezone ?? existing.timezone,
			defaultCurrency: args.defaultCurrency ?? existing.defaultCurrency,
		});
		return existing._id;
	}

	return await ctx.db.insert("users", {
		clerkId: identity.clerkId,
		email: identity.email ?? `${identity.clerkId}@unknown.local`,
		timezone: args.timezone ?? "America/New_York",
		defaultCurrency: args.defaultCurrency ?? "USD",
		createdAt: now,
	});
}

export const bootstrapCurrentUser = mutation({
	args: {
		timezone: v.optional(v.string()),
		defaultCurrency: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		return await upsertUserFromIdentity(ctx, identity, args);
	},
});

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx);
		return await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.clerkId))
			.unique();
	},
});

export const getUserByClerkIdInternal = internalQuery({
	args: { clerkId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
			.unique();
	},
});
