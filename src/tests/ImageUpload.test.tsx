// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageUpload } from "#/components/ImageUpload";

const PREVIEW = "https://example.test/storage/v1/bolle.jpg?token=abc";

const cropped = new File(["cropped"], "crop.jpg", { type: "image/jpeg" });

vi.mock("#/components/ImageCropDialog", () => ({
	ImageCropDialog: ({
		src,
		open,
		onCropped,
	}: {
		src: string;
		open: boolean;
		onCropped: (file: File) => void;
	}) =>
		open ? (
			<div data-testid="crop-dialog" data-src={src}>
				<button type="button" onClick={() => onCropped(cropped)}>
					bruk utsnitt
				</button>
			</div>
		) : null,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("ImageUpload", () => {
	it("offers no crop button without an image", () => {
		render(<ImageUpload onChange={vi.fn()} />);

		expect(screen.queryByRole("button", { name: "Beskjær bilde" })).toBeNull();
	});

	it("opens the crop dialog with the previewed image", () => {
		render(<ImageUpload onChange={vi.fn()} previewUrl={PREVIEW} />);

		fireEvent.click(screen.getByRole("button", { name: "Beskjær bilde" }));

		expect(screen.getByTestId("crop-dialog").dataset.src).toBe(PREVIEW);
	});

	it("reports a crop through onChange like a newly picked file", () => {
		const onChange = vi.fn();
		render(<ImageUpload onChange={onChange} previewUrl={PREVIEW} />);

		fireEvent.click(screen.getByRole("button", { name: "Beskjær bilde" }));
		fireEvent.click(screen.getByRole("button", { name: "bruk utsnitt" }));

		expect(onChange).toHaveBeenCalledWith(cropped);
	});
});
