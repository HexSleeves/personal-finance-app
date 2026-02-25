import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export function getPlaidClient() {
	const clientId = process.env.PLAID_CLIENT_ID;
	const secret = process.env.PLAID_SECRET;
	const env = (process.env.PLAID_ENV ??
		"sandbox") as keyof typeof PlaidEnvironments;

	if (!clientId || !secret) {
		throw new Error("Missing PLAID_CLIENT_ID/PLAID_SECRET");
	}

	const configuration = new Configuration({
		basePath: PlaidEnvironments[env],
		baseOptions: {
			headers: {
				"PLAID-CLIENT-ID": clientId,
				"PLAID-SECRET": secret,
			},
		},
	});

	return new PlaidApi(configuration);
}
