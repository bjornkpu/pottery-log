import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] backdrop-blur-lg">
			<nav className="page-wrap flex items-center gap-3 py-3 sm:py-4">
				<h1 className="m-0 flex-shrink-0 text-lg font-bold tracking-tight text-[var(--sea-ink)]">
					<Link to="/" className="no-underline text-[var(--sea-ink)]">
						Pottery Log
					</Link>
				</h1>

				<div className="ml-auto">
					<Link
						to="/settings"
						className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
					>
						<Settings className="h-5 w-5" />
					</Link>
				</div>
			</nav>
		</header>
	);
}
