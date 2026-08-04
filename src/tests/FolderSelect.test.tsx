// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FolderSelect } from "#/components/FolderSelect";

// vitest.config.ts does not set test.globals, so @testing-library/react's
// automatic afterEach cleanup never registers.
afterEach(() => {
	cleanup();
	vi.resetModules();
});

vi.mock("#/hooks/use-folders", () => ({
	useFolders: () => ({
		data: [
			{ id: "f1", name: "Glasur", sort_order: 1 },
			{ id: "f2", name: "Teknisk", sort_order: 2 },
		],
	}),
}));

describe("FolderSelect", () => {
	it("selects a folder that is not selected yet", () => {
		const onChange = vi.fn();
		render(<FolderSelect selectedIds={["f1"]} onChange={onChange} />);

		fireEvent.click(screen.getByText("Teknisk"));

		expect(onChange).toHaveBeenCalledWith(["f1", "f2"]);
	});

	it("deselects a folder that is already selected", () => {
		const onChange = vi.fn();
		render(<FolderSelect selectedIds={["f1", "f2"]} onChange={onChange} />);

		fireEvent.click(screen.getByText("Glasur"));

		expect(onChange).toHaveBeenCalledWith(["f2"]);
	});
});
