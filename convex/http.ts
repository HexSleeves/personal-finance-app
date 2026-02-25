import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
	path: "/plaid/webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const body = await request.text();
		const idempotencyKey =
			request.headers.get("plaid-webhook-id") ??
			request.headers.get("x-request-id") ??
			`${Date.now()}-${Math.random().toString(36).slice(2)}`;

		const result = await ctx.runAction(
			api.webhooksNode.verifyAndProcessPlaidWebhook,
			{
				body,
				idempotencyKey,
				plaidVerificationHeader:
					request.headers.get("Plaid-Verification") ?? undefined,
			},
		);

		if (result.status === "unauthorized") {
			return new Response(
				JSON.stringify({ ok: false, error: "unauthorized" }),
				{
					status: 401,
					headers: { "content-type": "application/json" },
				},
			);
		}

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	}),
});

export default http;
