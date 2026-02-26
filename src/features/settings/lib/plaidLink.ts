type PlaidLinkResult =
	| { status: "success"; publicToken: string }
	| { status: "canceled" };

type PlaidWindow = Window & {
	Plaid?: {
		create: (config: {
			token: string;
			onSuccess: (publicToken: string) => void;
			onExit: (error: { error_message?: string } | null) => void;
		}) => {
			open: () => void;
			destroy: () => void;
		};
	};
};

let plaidScriptPromise: Promise<void> | null = null;

function loadPlaidScript(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(
			new Error("Plaid Link requires a browser environment"),
		);
	}
	if ((window as PlaidWindow).Plaid) {
		return Promise.resolve();
	}
	if (plaidScriptPromise) {
		return plaidScriptPromise;
	}

	plaidScriptPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			'script[data-plaid-link="true"]',
		);
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener(
				"error",
				() => reject(new Error("Failed to load Plaid Link script")),
				{ once: true },
			);
			return;
		}

		const script = document.createElement("script");
		script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
		script.async = true;
		script.dataset.plaidLink = "true";
		script.onload = () => resolve();
		script.onerror = () =>
			reject(new Error("Failed to load Plaid Link script"));
		document.head.appendChild(script);
	});

	return plaidScriptPromise;
}

export async function openPlaidLink(
	linkToken: string,
): Promise<PlaidLinkResult> {
	await loadPlaidScript();

	const plaid = (window as PlaidWindow).Plaid;
	if (!plaid) {
		throw new Error("Plaid Link did not initialize");
	}

	return await new Promise((resolve, reject) => {
		const handler = plaid.create({
			token: linkToken,
			onSuccess: (publicToken) => {
				handler.destroy();
				resolve({ status: "success", publicToken });
			},
			onExit: (error) => {
				handler.destroy();
				if (!error) {
					resolve({ status: "canceled" });
					return;
				}
				reject(new Error(error.error_message ?? "Plaid Link failed"));
			},
		});

		handler.open();
	});
}
