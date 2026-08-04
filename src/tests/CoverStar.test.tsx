import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoverStar } from "#/components/CoverStar";

// vitest.config.ts does not set test.globals, so @testing-library/react's
// automatic afterEach cleanup never registers.
afterEach(() => {
	cleanup();
});

describe("CoverStar", () => {
	it("labels itself as the action when the photo is not the cover", () => {
		render(<CoverStar isCover={false} onSetCover={() => {}} />);
		expect(screen.getByLabelText("Sett som forsidebilde")).toBeDefined();
	});

	it("labels itself as the state when the photo is the cover", () => {
		render(<CoverStar isCover={true} onSetCover={() => {}} />);
		expect(screen.getByLabelText("Forsidebilde")).toBeDefined();
	});

	it("calls onSetCover when clicked", () => {
		const onSetCover = vi.fn();
		render(<CoverStar isCover={false} onSetCover={onSetCover} />);
		screen.getByLabelText("Sett som forsidebilde").click();
		expect(onSetCover).toHaveBeenCalledOnce();
	});

	it("does not call onSetCover when disabled", () => {
		const onSetCover = vi.fn();
		render(<CoverStar isCover={false} onSetCover={onSetCover} disabled />);
		screen.getByLabelText("Sett som forsidebilde").click();
		expect(onSetCover).not.toHaveBeenCalled();
	});
});
