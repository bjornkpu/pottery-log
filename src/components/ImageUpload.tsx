import { Crop, ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { ImageCropDialog } from "#/components/ImageCropDialog";

type ImageUploadProps = {
	onChange: (file: File | null) => void;
	previewUrl?: string | null;
};

export function ImageUpload({ onChange, previewUrl }: ImageUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [localPreview, setLocalPreview] = useState<string | null>(null);
	const [cropping, setCropping] = useState(false);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0] ?? null;
		if (file) {
			onChange(file);
			setLocalPreview(URL.createObjectURL(file));
		}
	}

	function handleCropped(file: File) {
		onChange(file);
		setLocalPreview(URL.createObjectURL(file));
	}

	function handleRemove() {
		onChange(null);
		setLocalPreview(null);
		if (inputRef.current) inputRef.current.value = "";
	}

	const displayUrl = localPreview ?? previewUrl;

	return (
		<div className="relative">
			{displayUrl ? (
				<div className="relative">
					<img
						src={displayUrl}
						alt="Forhåndsvisning"
						className="w-full rounded-lg object-cover"
					/>
					<button
						type="button"
						onClick={handleRemove}
						className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
					>
						<X className="h-4 w-4" />
					</button>
					{/* Bottom-right so it clears the remove button on a narrow tile */}
					<button
						type="button"
						onClick={() => setCropping(true)}
						aria-label="Beskjær bilde"
						className="absolute right-2 bottom-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
					>
						<Crop className="h-4 w-4" />
					</button>
					<ImageCropDialog
						src={displayUrl}
						open={cropping}
						onOpenChange={setCropping}
						onCropped={handleCropped}
					/>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] bg-[var(--sand)] text-[var(--sea-ink-soft)] hover:border-[var(--lagoon)]"
				>
					<ImagePlus className="h-8 w-8" />
				</button>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleChange}
				className="hidden"
			/>
		</div>
	);
}
