import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { PieceForm } from "#/components/PieceForm";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useDeletePiece, usePiece, useUpdatePiece } from "#/hooks/use-pieces";

export const Route = createFileRoute("/pieces/$id/edit")({
	component: EditPiecePage,
});

function EditPiecePage() {
	const { id } = Route.useParams();
	const { data: piece, isLoading } = usePiece(id);
	const updatePiece = useUpdatePiece();
	const deletePiece = useDeletePiece();
	const router = useRouter();

	if (isLoading) {
		return (
			<main className="page-wrap px-4 pb-8 pt-6">
				<Skeleton className="h-8 w-48" />
			</main>
		);
	}

	if (!piece) {
		return (
			<main className="page-wrap px-4 pb-8 pt-6">
				<p>Fant ikke produktet.</p>
				<Link to="/">Tilbake</Link>
			</main>
		);
	}

	async function handleDelete() {
		if (!confirm("Slett dette produktet?")) return;
		await deletePiece.mutateAsync(id);
		router.navigate({ to: "/" });
	}

	return (
		<main className="page-wrap px-4 pb-8 pt-6">
			<div className="mb-6 flex items-center gap-2">
				<Link
					to="/pieces/$id"
					params={{ id }}
					className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<h1 className="flex-1 text-2xl font-bold text-[var(--sea-ink)]">
					Rediger: {piece.title}
				</h1>
				<Button
					variant="outline"
					size="icon"
					onClick={handleDelete}
					className="text-red-600 hover:bg-red-50 hover:text-red-700"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
				<Button type="submit" size="sm" form="piece-form">
					<Save className="mr-1.5 h-4 w-4" />
					Lagre
				</Button>
			</div>

			<PieceForm
				formId="piece-form"
				initialData={piece}
				submitLabel="Lagre endringer"
				onSubmit={async (data) => {
					await updatePiece.mutateAsync({ id, ...data });
					router.navigate({ to: "/pieces/$id", params: { id } });
				}}
			/>
		</main>
	);
}
