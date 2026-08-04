import { Star } from "lucide-react";
import { cn } from "#/lib/utils";

/**
 * Marks one photo as the piece's cover image.
 *
 * Renders as a sibling of the photo, positioned in its corner, never as an
 * overlay on the <img> itself: see the note in ZoomableImage about keeping the
 * iOS long-press menu working. The caller wraps both in a "relative" element.
 */
export function CoverStar({
	isCover,
	onSetCover,
	disabled,
}: {
	isCover: boolean;
	onSetCover: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			aria-label={isCover ? "Forsidebilde" : "Sett som forsidebilde"}
			aria-pressed={isCover}
			disabled={disabled}
			title={disabled ? "Krever internett" : undefined}
			onClick={(event) => {
				// The photo underneath opens the lightbox on click
				event.stopPropagation();
				onSetCover();
			}}
			className="absolute right-1 top-1 rounded-full bg-black/50 p-1.5 text-white disabled:opacity-40"
		>
			<Star
				className={cn("h-4 w-4", isCover && "fill-current")}
				aria-hidden="true"
			/>
		</button>
	);
}
