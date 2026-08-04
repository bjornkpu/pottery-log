import imageCompression from "browser-image-compression";
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
