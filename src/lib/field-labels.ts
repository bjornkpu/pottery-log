const FIELD_LABELS: Record<string, string> = {
	gram_leire: "Gram leire",
	etter_dreiing_g: "Etter dreiing (g)",
	hoyde_cm: "Høyde (cm)",
	bredde_cm: "Bredde (cm)",
	brann_temp: "Brennetemperatur",
	ovn_detalj: "Ovndetalj",
	glasur_filter: "Glasurfilter",
	glasur_lag: "Glasurlag",
	metode: "Metode",
	sluttvekt_g: "Sluttvekt (g)",
	slutthoyde_cm: "Slutthøyde (cm)",
	sluttbredde_cm: "Sluttbredde (cm)",
};

export function getFieldLabel(key: string): string {
	return (
		FIELD_LABELS[key] ??
		key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
	);
}

export function getFieldType(key: string): "number" | "text" {
	if (key.endsWith("_g") || key.endsWith("_cm") || key === "gram_leire")
		return "number";
	return "text";
}
