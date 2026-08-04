import { createFileRoute } from "@tanstack/react-router";
import { PieceGrid } from "#/components/PieceGrid";

export const Route = createFileRoute("/pieces/")({
	component: AllPiecesPage,
});

function AllPiecesPage() {
	return <PieceGrid title="Alle" />;
}
