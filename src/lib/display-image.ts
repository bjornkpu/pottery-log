/**
 * Decides which photo is the cover after a piece is saved.
 *
 * A pick the user made by hand wins for as long as that photo is still on the
 * piece. Otherwise the newest stage photo takes over, which is what pieces got
 * before picking existed. An extra photo only becomes the cover through an
 * explicit pick, never through this fallback.
 */
export function resolveDisplayImage(
	current: string | null,
	stagePaths: string[],
	extraPaths: string[],
): string | null {
	if (
		current &&
		(stagePaths.includes(current) || extraPaths.includes(current))
	) {
		return current;
	}
	return stagePaths.at(-1) ?? null;
}
