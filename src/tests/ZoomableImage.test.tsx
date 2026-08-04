// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { ZoomableImage } from "#/components/ZoomableImage";

const SRC = "https://example.test/storage/v1/bolle.jpg?token=abc";

beforeAll(() => {
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

beforeEach(() => {
	vi.clearAllMocks();
});

// vitest.config.ts does not set test.globals, so @testing-library/react's
// automatic afterEach cleanup (which checks for a global `afterEach`) never
// registers. Without this, each `render` in this file stacks another
// ZoomableImage into the document instead of replacing the previous one.
afterEach(() => {
	cleanup();
});

describe("ZoomableImage", () => {
	it("opens the dialog when the thumbnail is activated", () => {
		render(<ZoomableImage src={SRC} alt="Bolle" />);

		screen.getByRole("button", { name: "Vis Bolle i full størrelse" }).click();

		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
	});

	it("shows the same src in the dialog as in the thumbnail", () => {
		render(<ZoomableImage src={SRC} alt="Bolle" />);

		const [thumbnail, full] = screen.getAllByAltText("Bolle");

		expect(full.getAttribute("src")).toBe(thumbnail.getAttribute("src"));
		expect(full.getAttribute("src")).toBe(SRC);
	});

	it("applies the caller's className to the thumbnail only", () => {
		render(<ZoomableImage src={SRC} alt="Bolle" className="aspect-square" />);

		const [thumbnail, full] = screen.getAllByAltText("Bolle");

		expect(thumbnail.className).toContain("aspect-square");
		expect(full.className).not.toContain("aspect-square");
	});

	it("closes the dialog when the dialog element itself is clicked", () => {
		render(<ZoomableImage src={SRC} alt="Bolle" />);

		fireEvent.click(screen.getByRole("dialog", { hidden: true }));

		expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
	});

	it("does not close the dialog when the fullscreen image is clicked", () => {
		render(<ZoomableImage src={SRC} alt="Bolle" />);

		const [, full] = screen.getAllByAltText("Bolle");
		fireEvent.click(full);

		expect(HTMLDialogElement.prototype.close).not.toHaveBeenCalled();
	});

	it("closes the dialog when the Lukk button is clicked", () => {
		render(<ZoomableImage src={SRC} alt="Bolle" />);

		fireEvent.click(screen.getByRole("button", { name: "Lukk", hidden: true }));

		expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
	});
});
