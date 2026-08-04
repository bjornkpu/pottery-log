import { createFileRoute } from "@tanstack/react-router";
import { PieceGrid } from "#/components/PieceGrid";
import { useFolders } from "#/hooks/use-folders";

export const Route = createFileRoute("/folders/$folderId")({
	component: FolderPage,
});

function FolderPage() {
	const { folderId } = Route.useParams();
	const { data: folders } = useFolders();
	const folder = folders?.find((f) => f.id === folderId);

	return <PieceGrid title={folder?.name ?? "Mappe"} folderId={folderId} />;
}
