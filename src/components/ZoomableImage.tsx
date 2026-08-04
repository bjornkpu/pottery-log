import { X } from "lucide-react";
import { useRef } from "react";

/**
 * A thumbnail that opens fullscreen when tapped.
 *
 * Both images render a plain <img> with no overlay, no touch handlers, and no
 * touch-action or callout CSS, so iOS keeps offering its native long-press
 * "Legg til i Bilder" menu and its native pinch-zoom. See
 * docs/superpowers/specs/2026-08-04-image-lightbox-design.md before changing
 * the markup here.
 */
export function ZoomableImage({
	src,
	alt,
	className,
}: {
	src: string;
	alt: string;
	className?: string;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	return (
		<>
			{/* biome-ignore lint/a11y/useSemanticElements: wrapping the image in a
			    <button> risks suppressing the iOS long-press save menu, which is half
			    of what this component exists for; the role keeps the native <img>
			    behaviour intact */}
			<img
				src={src}
				alt={alt}
				className={className}
				loading="lazy"
				// biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: same reason as the useSemanticElements suppression above
				role="button"
				tabIndex={0}
				onClick={() => dialogRef.current?.showModal()}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						dialogRef.current?.showModal();
					}
				}}
			/>

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close is
			    a mouse/touch-only affordance; keyboard users already have the native
			    Escape-to-close on <dialog> and the "Lukk" button below */}
			<dialog
				ref={dialogRef}
				aria-label={alt}
				className="fixed inset-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-transparent p-0 backdrop:bg-black/90"
				// Closes on the empty area around the image only. Clicks on the image
				// itself must not close, or ending a pan while zoomed would dismiss it.
				onClick={(event) => {
					if (event.target === event.currentTarget) dialogRef.current?.close();
				}}
			>
				<img src={src} alt={alt} className="max-h-full max-w-full" />
				<button
					type="button"
					aria-label="Lukk"
					onClick={() => dialogRef.current?.close()}
					className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"
				>
					<X className="h-6 w-6" />
				</button>
			</dialog>
		</>
	);
}
