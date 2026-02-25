import type { AuthConfig } from "convex/server";

export default {
	providers: [
		{
			domain: "https://on-malamute-35.clerk.accounts.dev",
			applicationID: "convex",
		},
	],
} satisfies AuthConfig;
