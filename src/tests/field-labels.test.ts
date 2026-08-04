import { describe, expect, it } from "vitest";
import { getFieldLabel, getFieldType } from "#/lib/field-labels";

describe("getFieldLabel", () => {
	it("returns known label for mapped key", () => {
		expect(getFieldLabel("gram_leire")).toBe("Gram leire");
		expect(getFieldLabel("slutthoyde_cm")).toBe("Slutthøyde (cm)");
	});

	it("falls back to formatted key for unknown keys", () => {
		expect(getFieldLabel("custom_field")).toBe("Custom field");
	});
});

describe("getFieldType", () => {
	it("returns number for measurement keys", () => {
		expect(getFieldType("gram_leire")).toBe("number");
		expect(getFieldType("hoyde_cm")).toBe("number");
		expect(getFieldType("sluttvekt_g")).toBe("number");
	});

	it("returns text for non-measurement keys", () => {
		expect(getFieldType("metode")).toBe("text");
		expect(getFieldType("ovn_detalj")).toBe("text");
	});
});
