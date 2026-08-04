// @vitest-environment jsdom

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageCropDialog } from "#/components/ImageCropDialog";

const SRC = "https://example.test/storage/v1/bolle.jpg?token=abc";

const cropped = new File(["cropped"], "crop.jpg", { type: "image/jpeg" });

vi.mock("#/lib/image-utils", () => ({
	cropToFile: vi.fn(() => Promise.resolve(cropped)),
}));

// react-image-crop measures the rendered image, which jsdom never lays out, so
// it is replaced by a stub that reports a fixed crop when its button is used.
vi.mock("react-image-crop", () => ({
	default: ({
		children,
		onChange,
	}: {
		children: React.ReactNode;
		onChange: (crop: {
			unit: "px";
			x: number;
			y: number;
			width: number;
			height: number;
		}) => void;
	}) => (
		<div>
			<button
				type="button"
				onClick={() =>
					onChange({ unit: "px", x: 1, y: 2, width: 30, height: 40 })
				}
			>
				sett utsnitt
			</button>
			{children}
		</div>
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("ImageCropDialog", () => {
	it("renders nothing while closed", () => {
		render(
			<ImageCropDialog
				src={SRC}
				open={false}
				onOpenChange={vi.fn()}
				onCropped={vi.fn()}
			/>,
		);

		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("disables Bruk until a crop has been selected", () => {
		render(
			<ImageCropDialog
				src={SRC}
				open
				onOpenChange={vi.fn()}
				onCropped={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Bruk" }).hasAttribute("disabled"),
		).toBe(true);

		fireEvent.click(screen.getByRole("button", { name: "sett utsnitt" }));

		expect(
			screen.getByRole("button", { name: "Bruk" }).hasAttribute("disabled"),
		).toBe(false);
	});

	it("loads the image with crossOrigin so the canvas is not tainted", () => {
		render(
			<ImageCropDialog
				src={SRC}
				open
				onOpenChange={vi.fn()}
				onCropped={vi.fn()}
			/>,
		);

		expect(
			screen.getByAltText("Beskjær bilde").getAttribute("crossorigin"),
		).toBe("anonymous");
	});

	it("hands the cropped file up and closes on Bruk", async () => {
		const onCropped = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<ImageCropDialog
				src={SRC}
				open
				onOpenChange={onOpenChange}
				onCropped={onCropped}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "sett utsnitt" }));
		fireEvent.click(screen.getByRole("button", { name: "Bruk" }));

		await waitFor(() => {
			expect(onCropped).toHaveBeenCalledWith(cropped);
		});
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("closes without emitting a file when cropping fails", async () => {
		const { cropToFile } = await import("#/lib/image-utils");
		vi.mocked(cropToFile).mockRejectedValueOnce(new Error("tainted"));

		const onCropped = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<ImageCropDialog
				src={SRC}
				open
				onOpenChange={onOpenChange}
				onCropped={onCropped}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "sett utsnitt" }));
		fireEvent.click(screen.getByRole("button", { name: "Bruk" }));

		await waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
		expect(onCropped).not.toHaveBeenCalled();
	});
});
