import imageCompression from "browser-image-compression";
import type { PixelCrop } from "react-image-crop";
import { supabase } from "#/lib/supabase";

const COMPRESSION_OPTIONS = {
	maxWidthOrHeight: 1200,
	maxSizeMB: 0.3,
	useWebWorker: true,
	fileType: "image/jpeg" as const,
	initialQuality: 0.8,
};

export async function compressImage(file: File): Promise<File> {
	return imageCompression(file, COMPRESSION_OPTIONS);
}

/**
 * Crop rectangles arrive in rendered pixels, so they are scaled up to the
 * image's natural size before drawing. Quality is high because uploadImage
 * compresses the result again.
 */
export async function cropToFile(
	image: HTMLImageElement,
	crop: PixelCrop,
): Promise<File> {
	const scaleX = image.naturalWidth / image.width;
	const scaleY = image.naturalHeight / image.height;

	const canvas = document.createElement("canvas");
	canvas.width = Math.round(crop.width * scaleX);
	canvas.height = Math.round(crop.height * scaleY);

	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D-kontekst er ikke tilgjengelig");

	ctx.drawImage(
		image,
		Math.round(crop.x * scaleX),
		Math.round(crop.y * scaleY),
		canvas.width,
		canvas.height,
		0,
		0,
		canvas.width,
		canvas.height,
	);

	const blob = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob(resolve, "image/jpeg", 0.95);
	});
	if (!blob) throw new Error("Kunne ikke beskjære bildet");

	return new File([blob], "crop.jpg", { type: "image/jpeg" });
}

export async function uploadImage(
	file: File,
	path: string,
): Promise<{ path: string; error: Error | null }> {
	const compressed = await compressImage(file);

	const { data, error } = await supabase.storage
		.from("pottery-images")
		.upload(path, compressed, {
			contentType: "image/jpeg",
			upsert: true,
		});

	if (error) return { path: "", error };
	return { path: data.path, error: null };
}

/** Paths the piece referenced before an edit that its submitted state no longer uses. */
export function orphanedPaths(
	initial: string[],
	submitted: string[],
): string[] {
	const kept = new Set(submitted);
	return [...new Set(initial)].filter((path) => !kept.has(path));
}

export async function deleteImages(paths: string[]): Promise<void> {
	if (paths.length === 0) return;
	await supabase.storage.from("pottery-images").remove(paths);
}

export function getImageUrl(path: string): string {
	const { data } = supabase.storage.from("pottery-images").getPublicUrl(path);
	return data.publicUrl;
}

export function getSignedImageUrl(path: string): Promise<string> {
	return supabase.storage
		.from("pottery-images")
		.createSignedUrl(path, 3600)
		.then(({ data }) => data?.signedUrl ?? "");
}
