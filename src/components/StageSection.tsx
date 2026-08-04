import { useEffect, useState } from "react";
import { Separator } from "#/components/ui/separator";
import { getFieldLabel } from "#/lib/field-labels";
import { getSignedImageUrl } from "#/lib/image-utils";
import type { PieceStage } from "#/types/database";

export function StageSection({ stage }: { stage: PieceStage }) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	useEffect(() => {
		if (stage.image_path) {
			getSignedImageUrl(stage.image_path).then(setImageUrl);
		}
	}, [stage.image_path]);

	const fieldEntries = Object.entries(stage.fields).filter(
		([_, v]) => v !== null && v !== "",
	);

	return (
		<section>
			<Separator className="my-4" />
			<h3 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">
				{stage.title}
			</h3>

			<div className="flex flex-col gap-4 sm:flex-row">
				{stage.image_path && (
					<div className="w-full flex-shrink-0 sm:w-48">
						{imageUrl ? (
							<img
								src={imageUrl}
								alt={stage.title}
								className="w-full rounded-lg object-cover"
								loading="lazy"
							/>
						) : (
							<div className="aspect-square rounded-lg bg-[var(--sand)]" />
						)}
					</div>
				)}

				<div className="flex-1 space-y-2">
					{fieldEntries.length > 0 && (
						<dl className="space-y-1">
							{fieldEntries.map(([key, value]) => (
								<div key={key} className="flex gap-2 text-sm">
									<dt className="font-medium text-[var(--sea-ink)]">
										{getFieldLabel(key)}:
									</dt>
									<dd className="text-[var(--sea-ink-soft)]">
										{String(value)}
									</dd>
								</div>
							))}
						</dl>
					)}

					{stage.notes && (
						<div className="text-sm">
							<p className="font-medium text-[var(--sea-ink)]">Notater:</p>
							<p className="whitespace-pre-wrap text-[var(--sea-ink-soft)]">
								{stage.notes}
							</p>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
