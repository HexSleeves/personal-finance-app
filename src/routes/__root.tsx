import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { AppProviders } from "../lib/providers";
import appCss from "../styles.css?url";

const navItems = [
	{ to: "/", label: "Dashboard" },
	{ to: "/budgets", label: "Budgets" },
	{ to: "/bills", label: "Bills" },
	{ to: "/transactions", label: "Transactions" },
	{ to: "/reports", label: "Reports" },
	{ to: "/settings", label: "Settings" },
];

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Northstar Finance" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="bg-slate-950 text-slate-100">
				<AppProviders>
					<div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
						<header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
							<div className="mb-3 flex items-center justify-between gap-3">
								<div>
									<h1 className="text-lg font-semibold">Northstar Finance</h1>
									<p className="text-xs text-slate-400">
										Zero-based budgeting, bills, and insights
									</p>
								</div>
								<span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
									MVP in progress
								</span>
							</div>
							<nav className="flex flex-wrap gap-2">
								{navItems.map((item) => (
									<Link
										key={item.to}
										to={item.to}
										activeProps={{
											className:
												"rounded-md bg-cyan-500/20 px-3 py-1.5 text-sm text-cyan-300",
										}}
										inactiveProps={{
											className:
												"rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700",
										}}
									>
										{item.label}
									</Link>
								))}
							</nav>
						</header>

						<main>{children}</main>
					</div>

					<TanStackDevtools
						config={{ position: "bottom-right" }}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				</AppProviders>
				<Scripts />
			</body>
		</html>
	);
}
