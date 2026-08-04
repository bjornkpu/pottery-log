import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder, Layers, Plus } from "lucide-react";
import type * as React from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useFolders } from "#/hooks/use-folders";
import { useOnlineStatus } from "#/hooks/use-online-status";

export const Route = createFileRoute("/")({ component: FolderOverview });

function FolderOverview() {
	const isOnline = useOnlineStatus();
	const { data: folders, isLoading } = useFolders();

	return (
		<main className="page-wrap px-4 pb-8 pt-6">
			<div className="mb-6 flex items-center gap-2">
				<h1 className="flex-1 text-2xl font-bold text-[var(--sea-ink)]">
					Mapper
				</h1>
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

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{isLoading
					? ["a", "b", "c", "d"].map((k) => (
							<Skeleton key={k} className="aspect-[3/4] rounded-xl" />
						))
					: folders?.map((folder) => (
							<Link
								key={folder.id}
								to="/folders/$folderId"
								params={{ folderId: folder.id }}
								className="no-underline"
							>
								<TileCard
									icon={<Folder className="h-8 w-8" />}
									name={folder.name}
								/>
							</Link>
						))}
				<Link to="/pieces" className="no-underline">
					<TileCard icon={<Layers className="h-8 w-8" />} name="Alle" />
				</Link>
			</div>
		</main>
	);
}

function TileCard({ icon, name }: { icon: React.ReactNode; name: string }) {
	return (
		<Card className="aspect-[3/4] gap-0 overflow-hidden py-0 transition hover:shadow-md">
			<CardContent className="flex h-full flex-col items-center justify-center gap-2 p-2 text-[var(--sea-ink)]">
				{icon}
				<p className="truncate text-sm font-medium">{name}</p>
			</CardContent>
		</Card>
	);
}
