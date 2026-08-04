import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { StageSection } from "#/components/StageSection";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { ZoomableImage } from "#/components/ZoomableImage";
import { useOnlineStatus } from "#/hooks/use-online-status";
import { usePiece } from "#/hooks/use-pieces";
import { getSignedImageUrl } from "#/lib/image-utils";

export const Route = createFileRoute("/pieces/$id/")({
	component: PieceDetailPage,
});

function PieceDetailPage() {
	const { id } = Route.useParams();
	const { data: piece, isLoading } = usePiece(id);
	const isOnline = useOnlineStatus();

	if (isLoading) {
		return (
			<main className="page-wrap px-4 pb-8 pt-6">
				<Skeleton className="mb-4 h-8 w-48" />
				<Skeleton className="h-64 w-full" />
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

	return (
		<main className="page-wrap px-4 pb-8 pt-6">
			<div className="mb-4 flex items-center gap-2">
				<Link
					to="/"
					className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<h1 className="flex-1 text-2xl font-bold text-[var(--sea-ink)]">
					{piece.title}
				</h1>
				<Link to="/pieces/$id/edit" params={{ id }}>
					<Button
						variant="outline"
						size="icon"
						disabled={!isOnline}
						title={!isOnline ? "Krever internett" : undefined}
					>
						<Pencil className="h-4 w-4" />
					</Button>
				</Link>
			</div>

			{/* Metadata */}
			<div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
				{piece.tags.map((tag) => (
					<Badge key={tag.id} variant="secondary">
						{tag.name}
					</Badge>
				))}
				{piece.piece_id_label && (
					<span className="text-[var(--sea-ink-soft)]">
						ID: {piece.piece_id_label}
					</span>
				)}
				{piece.price != null && (
					<span className="text-[var(--sea-ink-soft)]">
						Pris: {piece.price} kr
					</span>
				)}
				{piece.clay_type && (
					<span className="text-[var(--sea-ink-soft)]">
						{piece.clay_type.name}
					</span>
				)}
			</div>

			{/* Stages */}
			{piece.stages.map((stage) => (
				<StageSection key={stage.id} stage={stage} />
			))}

			{/* Slutttanker */}
			{piece.final_notes && (
				<>
					<Separator className="my-4" />
					<h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
						Slutttanker
					</h3>
					<p className="whitespace-pre-wrap text-sm text-[var(--sea-ink-soft)]">
						{piece.final_notes}
					</p>
				</>
			)}

			{/* Extra images */}
			{piece.images.length > 0 && (
				<>
					<Separator className="my-4" />
					<h3 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">
						Ekstra bilder
					</h3>
					<ExtraImagesGallery images={piece.images} />
				</>
			)}
		</main>
	);
}

function ExtraImagesGallery({
	images,
}: {
	images: { image_path: string; caption: string | null }[];
}) {
	const [urls, setUrls] = useState<Record<string, string>>({});

	useEffect(() => {
		images.forEach((img) => {
			getSignedImageUrl(img.image_path).then((url) => {
				setUrls((prev) => ({ ...prev, [img.image_path]: url }));
			});
		});
	}, [images]);

	return (
		<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
			{images.map((img) => (
				<div key={img.image_path}>
					{urls[img.image_path] ? (
						<ZoomableImage
							src={urls[img.image_path]}
							alt={img.caption ?? "Ekstra bilde"}
							className="aspect-square w-full rounded-lg object-cover"
						/>
					) : (
						<div className="aspect-square rounded-lg bg-[var(--sand)]" />
					)}
					{img.caption && (
						<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
							{img.caption}
						</p>
					)}
				</div>
			))}
		</div>
	);
}
