export function formatTimestamp(timestamp?: number) {
	if (!timestamp) return "—";
	return new Date(timestamp).toLocaleString();
}
