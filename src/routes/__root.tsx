import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { IssueReporterDialog } from "../components/IssueReporterDialog";
import { OfflineBanner } from "../components/OfflineBanner";
import { useAuth } from "../hooks/use-auth";
import { IssueReporterProvider } from "../hooks/use-issue-reporter";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<AuthGate>
			<Outlet />
		</AuthGate>
	);
}

function AuthGate({ children }: { children: React.ReactNode }) {
	const { session, loading, signIn } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-[var(--sea-ink-soft)]">Laster...</p>
			</div>
		);
	}

	if (!session) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center px-4">
				<form
					onSubmit={async (e) => {
						e.preventDefault();
						setSubmitting(true);
						setError(null);
						const { error } = await signIn(email, password);
						setSubmitting(false);
						if (error) setError(error.message);
					}}
					className="w-full max-w-sm space-y-4"
				>
					<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
						Pottery Log
					</h1>
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Logg inn for å fortsette
					</p>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium">
							E-post
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							Passord
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>
					<button
						type="submit"
						disabled={submitting}
						className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{submitting ? "Logger inn..." : "Logg inn"}
					</button>
				</form>
			</main>
		);
	}

	return (
		<IssueReporterProvider>
			<OfflineBanner />
			<Header />
			{children}
			<Footer />
			<IssueReporterDialog />
			<TanStackDevtools
				config={{ position: "bottom-right" }}
				plugins={[
					{ name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> },
					TanStackQueryDevtools,
				]}
			/>
		</IssueReporterProvider>
	);
}
