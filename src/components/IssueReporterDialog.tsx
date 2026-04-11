import { Bug, Camera, Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { useIssueReporter } from "#/hooks/use-issue-reporter";
import { buildIssueUrl } from "#/lib/issue-url";

type IssueType = "bug" | "enhancement";

const issueTypes: { value: IssueType; label: string; icon: typeof Bug }[] = [
	{ value: "bug", label: "Bug", icon: Bug },
	{ value: "enhancement", label: "Feature", icon: Sparkles },
];

const placeholders: Record<IssueType, { title: string; desc: string }> = {
	bug: {
		title: "F.eks. Bilde vises ikke i redigeringsmodus",
		desc: "Hva skjedde? Hva forventet du skulle skje?",
	},
	enhancement: {
		title: "F.eks. Mulighet for å sortere etter dato",
		desc: "Beskriv hva du ønsker og hvorfor det er nyttig",
	},
};

export function IssueReporterDialog() {
	const { open, setOpen: onOpenChange } = useIssueReporter();
	const [type, setType] = useState<IssueType>("bug");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [tookScreenshot, setTookScreenshot] = useState(false);

	function reset() {
		setType("bug");
		setTitle("");
		setDescription("");
		setTookScreenshot(false);
	}

	function handleOpenChange(value: boolean) {
		if (!value) reset();
		onOpenChange(value);
	}

	function handleCloseForScreenshot() {
		setTookScreenshot(true);
		onOpenChange(false);
	}

	function handleSubmit() {
		const url = buildIssueUrl({
			title: title.trim() || undefined,
			description: description.trim() || undefined,
			type,
		});
		window.open(url, "_blank");
		handleOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false}>
				<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
					Opprett issue
				</h2>

				{/* Screenshot prompt */}
				{!tookScreenshot ? (
					<button
						type="button"
						onClick={handleCloseForScreenshot}
						className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--line)] px-4 py-3 text-left transition hover:border-[var(--lagoon)] hover:bg-[var(--lagoon)]/5"
					>
						<Camera className="h-5 w-5 flex-shrink-0 text-[var(--lagoon)]" />
						<div>
							<p className="text-sm font-medium text-[var(--sea-ink)]">
								Ta skjermbilde først?
							</p>
							<p className="text-xs text-[var(--sea-ink-soft)]">
								Lukker dialogen så du kan ta bilde — kom tilbake når du er klar
							</p>
						</div>
					</button>
				) : (
					<div className="flex items-start gap-2 rounded-lg border border-[var(--lagoon)]/20 bg-[var(--lagoon)]/5 px-3 py-2 text-xs text-[var(--lagoon)]">
						<Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
						Husk å lime inn skjermbildet i GitHub (Ctrl+V / langt trykk → Lim
						inn)
					</div>
				)}

				{/* Type picker */}
				<div className="grid grid-cols-2 gap-2">
					{issueTypes.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => setType(t.value)}
							className={`flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition ${
								type === t.value
									? "border-[var(--lagoon)] bg-[var(--lagoon)]/10 text-[var(--sea-ink)]"
									: "border-[var(--line)] text-[var(--sea-ink-soft)] hover:border-[var(--sea-ink-soft)]"
							}`}
						>
							<t.icon className="h-5 w-5" />
							{t.label}
						</button>
					))}
				</div>

				{/* Title */}
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder={placeholders[type].title}
				/>

				{/* Description */}
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder={placeholders[type].desc}
					rows={4}
				/>

				{/* Actions */}
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => handleOpenChange(false)}
					>
						Avbryt
					</Button>
					<Button className="flex-1" onClick={handleSubmit}>
						Åpne i GitHub →
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
