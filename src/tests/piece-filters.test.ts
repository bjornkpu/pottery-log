import { describe, expect, it } from "vitest";
import { filterByRelation } from "#/lib/piece-filters";

const pieces = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("filterByRelation", () => {
	it("keeps only the pieces named by the join rows", () => {
		const result = filterByRelation(pieces, [
			{ piece_id: "a" },
			{ piece_id: "c" },
		]);

		expect(result).toEqual([{ id: "a" }, { id: "c" }]);
	});

	it("returns nothing when no join row matches", () => {
		expect(filterByRelation(pieces, [{ piece_id: "zzz" }])).toEqual([]);
	});

	it("returns nothing for an empty row set", () => {
		expect(filterByRelation(pieces, [])).toEqual([]);
	});

	it("returns a piece once even when it has several join rows", () => {
		const result = filterByRelation(pieces, [
			{ piece_id: "b" },
			{ piece_id: "b" },
		]);

		expect(result).toEqual([{ id: "b" }]);
	});
});
