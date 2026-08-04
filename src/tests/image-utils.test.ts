import { describe, expect, it, vi } from "vitest";

vi.mock("browser-image-compression", () => ({
	default: vi.fn((_file, options) => {
		expect(options.maxWidthOrHeight).toBe(1200);
		expect(options.initialQuality).toBe(0.8);
		expect(options.fileType).toBe("image/jpeg");
		return Promise.resolve(new File(["compressed"], "test.jpg"));
	}),
}));

vi.mock("#/lib/supabase", () => {
	// One bucket object across calls, so tests and the code under test share the
	// same mock functions.
	const bucket = {
		upload: vi
			.fn()
			.mockResolvedValue({ data: { path: "test/path.jpg" }, error: null }),
		getPublicUrl: () => ({
			data: { publicUrl: "https://example.com/test.jpg" },
		}),
		createSignedUrl: vi.fn().mockResolvedValue({
			data: { signedUrl: "https://example.com/signed.jpg" },
		}),
		remove: vi.fn().mockResolvedValue({ error: null }),
	};
	return { supabase: { storage: { from: () => bucket } } };
});

describe("image-utils", () => {
	it("compresses with correct options", async () => {
		const { compressImage } = await import("#/lib/image-utils");
		const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
		const result = await compressImage(file);
		expect(result).toBeInstanceOf(File);
	});
});

describe("orphanedPaths", () => {
	it("returns a path that was replaced", async () => {
		const { orphanedPaths } = await import("#/lib/image-utils");
		expect(orphanedPaths(["a/old.jpg"], ["a/new.jpg"])).toEqual(["a/old.jpg"]);
	});

	it("returns a path that is no longer referenced", async () => {
		const { orphanedPaths } = await import("#/lib/image-utils");
		expect(orphanedPaths(["a/1.jpg", "a/2.jpg"], ["a/1.jpg"])).toEqual([
			"a/2.jpg",
		]);
	});

	it("returns nothing when every path is still referenced", async () => {
		const { orphanedPaths } = await import("#/lib/image-utils");
		expect(orphanedPaths(["a/1.jpg"], ["a/1.jpg", "a/2.jpg"])).toEqual([]);
	});

	it("returns nothing for a piece that had no images", async () => {
		const { orphanedPaths } = await import("#/lib/image-utils");
		expect(orphanedPaths([], ["a/1.jpg"])).toEqual([]);
	});

	it("ignores duplicates so a path is never deleted twice", async () => {
		const { orphanedPaths } = await import("#/lib/image-utils");
		expect(orphanedPaths(["a/1.jpg", "a/1.jpg"], [])).toEqual(["a/1.jpg"]);
	});
});

describe("deleteImages", () => {
	it("does not call storage for an empty list", async () => {
		const { deleteImages } = await import("#/lib/image-utils");
		const { supabase } = await import("#/lib/supabase");
		const remove = supabase.storage.from("pottery-images").remove;

		await deleteImages([]);

		expect(remove).not.toHaveBeenCalled();
	});

	it("removes every given path in one call", async () => {
		const { deleteImages } = await import("#/lib/image-utils");
		const { supabase } = await import("#/lib/supabase");
		const remove = supabase.storage.from("pottery-images").remove;

		await deleteImages(["a/1.jpg", "a/2.jpg"]);

		expect(remove).toHaveBeenCalledWith(["a/1.jpg", "a/2.jpg"]);
	});
});
