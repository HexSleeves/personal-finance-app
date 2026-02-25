import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

function createConvexClient(url: string) {
	return new ConvexReactClient(url);
}

let cachedConvexClient: ConvexReactClient | null = null;

function getConvexClient(url: string) {
	if (!cachedConvexClient) {
		cachedConvexClient = createConvexClient(url);
	}
	return cachedConvexClient;
}

function BootstrapCurrentUser() {
	const bootstrapCurrentUser = useMutation(api.users.bootstrapCurrentUser);
	const { isLoaded, isSignedIn } = useAuth();

	useEffect(() => {
		if (!isLoaded || !isSignedIn) return;
		void bootstrapCurrentUser({});
	}, [bootstrapCurrentUser, isLoaded, isSignedIn]);

	return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
	const convexUrl = import.meta.env.VITE_CONVEX_URL;
	const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
	const convexClient = convexUrl ? getConvexClient(convexUrl) : null;

	if (!convexClient || !clerkPublishableKey) {
		return <>{children}</>;
	}

	return (
		<ClerkProvider publishableKey={clerkPublishableKey}>
			<ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
				<BootstrapCurrentUser />
				{children}
			</ConvexProviderWithClerk>
		</ClerkProvider>
	);
}
