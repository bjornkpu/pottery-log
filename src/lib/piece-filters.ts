/** Narrows pieces to those referenced by join-table rows (piece_tags, piece_folders). */
export function filterByRelation<T extends { id: string }>(
	pieces: T[],
	rows: { piece_id: string }[],
): T[] {
	const ids = new Set(rows.map((row) => row.piece_id));
	return pieces.filter((piece) => ids.has(piece.id));
}
