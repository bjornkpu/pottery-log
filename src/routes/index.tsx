import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { FilterDialog } from "#/components/FilterDialog";
import { PieceCard } from "#/components/PieceCard";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { useOnlineStatus } from "#/hooks/use-online-status";
import { usePieces } from "#/hooks/use-pieces";

export const Route = createFileRoute("/")({ component: GridOverview });

function GridOverview() {
	const isOnline = useOnlineStatus();
	const [filters, setFilters] = useState({
		search: "",
		clayTypeId: undefined as string | undefined,
		tagIds: [] as string[],
	});
	const [filterOpen, setFilterOpen] = useState(false);

	const { data: pieces, isLoading } = usePieces({
		search: filters.search || undefined,
		clayTypeId: filters.clayTypeId,
		tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
	});

	const activeFilterCount =
		(filters.clayTypeId ? 1 : 0) + filters.tagIds.length;

	return (
		<main className="page-wrap px-4 pb-8 pt-6">
			<div className="mb-6 flex items-center gap-2">
				<Input
					placeholder="Søk..."
					value={filters.search}
					onChange={(e) => setFilters({ ...filters, search: e.target.value })}
					className="flex-1"
				/>
				<Button
					variant="outline"
					size="icon"
					onClick={() => setFilterOpen(true)}
					className="relative flex-shrink-0"
				>
					<SlidersHorizontal className="h-4 w-4" />
					{activeFilterCount > 0 && (
						<span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--lagoon)] text-[10px] font-bold text-white">
							{activeFilterCount}
						</span>
					)}
				</Button>
				<Link to="/pieces/new">
					<Button
						size="sm"
						disabled={!isOnline}
						title={!isOnline ? "Krever internett" : undefined}
					>
						<Plus className="mr-1 h-4 w-4" />
						Ny
					</Button>
				</Link>
			</div>

			<FilterDialog
				open={filterOpen}
				onOpenChange={setFilterOpen}
				filters={filters}
				onChange={setFilters}
			/>

			{isLoading ? (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
						<Skeleton key={k} className="aspect-[3/4] rounded-xl" />
					))}
				</div>
			) : pieces?.length === 0 ? (
				<div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
					<p className="text-[var(--sea-ink-soft)]">Ingen produkter ennå</p>
					<Link to="/pieces/new" className="mt-2">
						<Button variant="outline" size="sm" disabled={!isOnline}>
							Legg til ditt første produkt
						</Button>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{pieces?.map((piece) => (
						<PieceCard key={piece.id} piece={piece} />
					))}
				</div>
			)}
		</main>
	);
}
