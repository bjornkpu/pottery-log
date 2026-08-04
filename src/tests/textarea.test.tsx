// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { Textarea } from "#/components/ui/textarea";

// jsdom has no layout engine, so scrollHeight is permanently 0 and the resize
// effect would look like a no-op. Deriving it from the value makes the
// behaviour observable: 20px per line, plus 16px of vertical padding.
beforeAll(() => {
	Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
		configurable: true,
		get(this: HTMLTextAreaElement) {
			return this.value.split("\n").length * 20 + 16;
		},
	});
});

// vitest.config.ts does not set test.globals, so @testing-library/react's
// automatic afterEach cleanup never registers.
afterEach(() => {
	cleanup();
});

describe("Textarea", () => {
	it("sizes itself to its content on mount", () => {
		const value = Array.from({ length: 8 }, (_, i) => `line ${i}`).join("\n");

		render(<Textarea value={value} onChange={() => {}} />);

		// 8 lines * 20px + 16px padding
		expect(screen.getByRole("textbox").style.height).toBe("176px");
	});

	it("shrinks again when the value gets shorter", () => {
		const long = Array.from({ length: 8 }, (_, i) => `line ${i}`).join("\n");
		const { rerender } = render(<Textarea value={long} onChange={() => {}} />);

		expect(screen.getByRole("textbox").style.height).toBe("176px");

		rerender(<Textarea value="one line" onChange={() => {}} />);

		expect(screen.getByRole("textbox").style.height).toBe("36px");
	});

	it("keeps the height bounds in CSS and uses no second sizing mechanism", () => {
		render(<Textarea value="" onChange={() => {}} />);

		const classes = screen.getByRole("textbox").className.split(" ");

		expect(classes).toContain("min-h-24");
		expect(classes).toContain("max-h-64");
		expect(classes).not.toContain("field-sizing-content");
	});
});
