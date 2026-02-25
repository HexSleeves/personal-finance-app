import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { createContext, useContext, useEffect } from "react";
import { api } from "../../convex/_generated/api";

type AppAuthState = {
	isLoaded: boolean;
	isSignedIn: boolean;
	clerkEnabled: boolean;
};

const AppAuthContext = createContext<AppAuthState>({
	isLoaded: false,
	isSignedIn: false,
	clerkEnabled: false,
});

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

function ClerkAuthStateProvider({ children }: { children: React.ReactNode }) {
	const { isLoaded, isSignedIn } = useAuth();
	return (
		<AppAuthContext.Provider
			value={{ isLoaded, isSignedIn: !!isSignedIn, clerkEnabled: true }}
		>
			{children}
		</AppAuthContext.Provider>
	);
}

export function useAppAuth() {
	return useContext(AppAuthContext);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
	const convexUrl = import.meta.env.VITE_CONVEX_URL;
	const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
	const convexClient = convexUrl ? getConvexClient(convexUrl) : null;

	if (!convexClient) {
		return (
			<AppAuthContext.Provider
				value={{ isLoaded: true, isSignedIn: false, clerkEnabled: false }}
			>
				{children}
			</AppAuthContext.Provider>
		);
	}

	if (!clerkPublishableKey) {
		return (
			<ConvexProvider client={convexClient}>
				<AppAuthContext.Provider
					value={{ isLoaded: true, isSignedIn: false, clerkEnabled: false }}
				>
					{children}
				</AppAuthContext.Provider>
			</ConvexProvider>
		);
	}

	return (
		<ClerkProvider publishableKey={clerkPublishableKey}>
			<ClerkAuthStateProvider>
				<ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
					<BootstrapCurrentUser />
					{children}
				</ConvexProviderWithClerk>
			</ClerkAuthStateProvider>
		</ClerkProvider>
	);
}
