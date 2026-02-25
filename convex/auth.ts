import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

type IdentityLike = {
	subject: string;
	email?: string;
	name?: string;
};

export type AuthIdentity = {
	clerkId: string;
	email?: string;
	name?: string;
};

export async function requireIdentity(
	ctx:
		| Pick<QueryCtx, "auth">
		| Pick<MutationCtx, "auth">
		| Pick<ActionCtx, "auth">,
): Promise<AuthIdentity> {
	const identity = (await ctx.auth.getUserIdentity()) as IdentityLike | null;
	if (!identity?.subject) {
		throw new Error("Unauthorized");
	}

	return {
		clerkId: identity.subject,
		email: identity.email,
		name: identity.name,
	};
}

export async function requireUser(
	ctx:
		| Pick<QueryCtx, "auth" | "db">
		| Pick<MutationCtx, "auth" | "db">
		| Pick<ActionCtx, "auth" | "runQuery">,
): Promise<Doc<"users">> {
	const identity = await requireIdentity(ctx);

	if ("db" in ctx) {
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.clerkId))
			.unique();
		if (!user) {
			throw new Error("User not initialized");
		}
		return user;
	}

	const user = await ctx.runQuery(internal.users.getUserByClerkIdInternal, {
		clerkId: identity.clerkId,
	});
	if (!user) {
		throw new Error("User not initialized");
	}
	return user;
}
