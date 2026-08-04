import { describe, expect, it } from "vitest";
import { resolveDisplayImage } from "#/lib/display-image";

describe("resolveDisplayImage", () => {
	it("keeps the current pick when it is still a stage photo", () => {
		expect(resolveDisplayImage("a.jpg", ["a.jpg", "b.jpg"], [])).toBe("a.jpg");
	});

	it("keeps the current pick when it is still an extra photo", () => {
		expect(resolveDisplayImage("x.jpg", ["a.jpg", "b.jpg"], ["x.jpg"])).toBe(
			"x.jpg",
		);
	});

	it("falls back to the last stage photo when the pick was removed", () => {
		expect(resolveDisplayImage("gone.jpg", ["a.jpg", "b.jpg"], ["x.jpg"])).toBe(
			"b.jpg",
		);
	});

	it("falls back to the last stage photo when there is no pick", () => {
		expect(resolveDisplayImage(null, ["a.jpg", "b.jpg"], [])).toBe("b.jpg");
	});

	it("returns null when the piece has no stage photos", () => {
		expect(resolveDisplayImage(null, [], ["x.jpg"])).toBeNull();
	});
});
