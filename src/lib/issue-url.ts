const REPO_URL = "https://github.com/bjornkpu/pottery-log";

const commitSha: string | undefined = (
	window as unknown as Record<string, unknown>
).__POTTERY_LOG_VERSION__ as string | undefined;

type IssueType = "bug" | "enhancement";

export function buildIssueUrl(opts?: {
	title?: string;
	description?: string;
	type?: IssueType;
}): string {
	const { title, description, type } = opts ?? {};

	const contextLines = [
		`- **Side:** ${window.location.pathname}`,
		`- **Versjon:** ${commitSha ?? "ukjent"}`,
		`- **Nettleser:** ${navigator.userAgent}`,
	].join("\n");

	const bodyParts: string[] = [];

	if (description) {
		bodyParts.push(description);
	} else {
		bodyParts.push("<!-- Beskriv problemet eller forslaget -->");
	}

	bodyParts.push("");
	bodyParts.push("## Kontekst");
	bodyParts.push(contextLines);

	const params = new URLSearchParams();
	params.set("body", bodyParts.join("\n"));
	if (title) params.set("title", title);
	if (type) params.set("labels", type);

	return `${REPO_URL}/issues/new?${params.toString()}`;
}
