import { describe, it, expect, vi } from "vitest";

vi.mock("browser-image-compression", () => ({
	default: vi.fn((_file, options) => {
		expect(options.maxWidthOrHeight).toBe(1200);
		expect(options.initialQuality).toBe(0.8);
		expect(options.fileType).toBe("image/jpeg");
		return Promise.resolve(new File(["compressed"], "test.jpg"));
	}),
}));

vi.mock("#/lib/supabase", () => ({
	supabase: {
		storage: {
			from: () => ({
				upload: vi
					.fn()
					.mockResolvedValue({ data: { path: "test/path.jpg" }, error: null }),
				getPublicUrl: () => ({
					data: { publicUrl: "https://example.com/test.jpg" },
				}),
				createSignedUrl: vi
					.fn()
					.mockResolvedValue({
						data: { signedUrl: "https://example.com/signed.jpg" },
					}),
			}),
		},
	},
}));

describe("image-utils", () => {
	it("compresses with correct options", async () => {
		const { compressImage } = await import("#/lib/image-utils");
		const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
		const result = await compressImage(file);
		expect(result).toBeInstanceOf(File);
	});
});
