import { create } from "zustand";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { ConnectionHealth } from "../types";

type SettingsStoreState = {
	items: Array<ConnectionHealth>;
	isLoadingHealth: boolean;
	isConnecting: boolean;
	syncingItemId: Id<"items"> | null;
	notice: string | null;
	error: string | null;
	envChecks: Record<string, boolean> | null;
};

type SettingsStoreActions = {
	setItems: (items: Array<ConnectionHealth>) => void;
	setIsLoadingHealth: (isLoadingHealth: boolean) => void;
	setIsConnecting: (isConnecting: boolean) => void;
	setSyncingItemId: (syncingItemId: Id<"items"> | null) => void;
	setNotice: (notice: string | null) => void;
	setError: (error: string | null) => void;
	setEnvChecks: (envChecks: Record<string, boolean> | null) => void;
	reset: () => void;
};

type SettingsStore = SettingsStoreState & SettingsStoreActions;

const initialState: SettingsStoreState = {
	items: [],
	isLoadingHealth: false,
	isConnecting: false,
	syncingItemId: null,
	notice: null,
	error: null,
	envChecks: null,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
	...initialState,
	setItems: (items) => set({ items }),
	setIsLoadingHealth: (isLoadingHealth) => set({ isLoadingHealth }),
	setIsConnecting: (isConnecting) => set({ isConnecting }),
	setSyncingItemId: (syncingItemId) => set({ syncingItemId }),
	setNotice: (notice) => set({ notice }),
	setError: (error) => set({ error }),
	setEnvChecks: (envChecks) => set({ envChecks }),
	reset: () => set(initialState),
}));
