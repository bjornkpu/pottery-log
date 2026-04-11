import { Bug, GitCommitHorizontal } from "lucide-react";
import { useIssueReporter } from "#/hooks/use-issue-reporter";

const commitSha: string | undefined = (
	window as unknown as Record<string, unknown>
).__POTTERY_LOG_VERSION__ as string | undefined;

export default function Footer() {
	const { setOpen } = useIssueReporter();

	return (
		<footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
			<div className="page-wrap flex items-center justify-center gap-4 text-sm">
				{commitSha && (
					<>
						<a
							href={`https://github.com/bjornkpu/pottery-log/commit/${commitSha}`}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						>
							<GitCommitHorizontal className="h-3.5 w-3.5" />
							{commitSha.slice(0, 7)}
						</a>
						<span className="text-[var(--line)]">·</span>
					</>
				)}
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="inline-flex items-center gap-1 text-[var(--lagoon)] hover:text-[var(--sea-ink)]"
				>
					<Bug className="h-3.5 w-3.5" />
					Opprett issue
				</button>
			</div>
		</footer>
	);
}
