import { useRef, useState } from "react";
import ReactCrop, { type PixelCrop } from "react-image-crop";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { cropToFile } from "#/lib/image-utils";
import "react-image-crop/dist/ReactCrop.css";

type ImageCropDialogProps = {
	src: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCropped: (file: File) => void;
};

export function ImageCropDialog({
	src,
	open,
	onOpenChange,
	onCropped,
}: ImageCropDialogProps) {
	const imageRef = useRef<HTMLImageElement>(null);
	const [crop, setCrop] = useState<PixelCrop>();

	const hasArea = Boolean(crop && crop.width > 0 && crop.height > 0);

	async function handleApply() {
		const image = imageRef.current;
		if (image && crop) {
			try {
				onCropped(await cropToFile(image, crop));
			} catch {
				// Leave the image untouched; a failed crop must not clear the field.
			}
		}
		setCrop(undefined);
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Beskjær bilde</DialogTitle>
				</DialogHeader>
				<ReactCrop crop={crop} onChange={(pixelCrop) => setCrop(pixelCrop)}>
					{/* crossOrigin keeps the canvas untainted for cross-origin signed URLs */}
					<img
						ref={imageRef}
						src={src}
						alt="Beskjær bilde"
						crossOrigin="anonymous"
						className="max-h-[60dvh] w-full object-contain"
					/>
				</ReactCrop>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Avbryt
					</Button>
					<Button type="button" disabled={!hasArea} onClick={handleApply}>
						Bruk
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
