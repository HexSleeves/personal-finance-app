import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const bootstrapUser = mutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		timezone: v.optional(v.string()),
		defaultCurrency: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				email: args.email,
				timezone: args.timezone ?? existing.timezone,
				defaultCurrency: args.defaultCurrency ?? existing.defaultCurrency,
			});
			return existing._id;
		}

		return await ctx.db.insert("users", {
			clerkId: args.clerkId,
			email: args.email,
			timezone: args.timezone ?? "America/New_York",
			defaultCurrency: args.defaultCurrency ?? "USD",
			createdAt: now,
		});
	},
});

export const getUserByClerkId = query({
	args: { clerkId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
			.unique();
	},
});
