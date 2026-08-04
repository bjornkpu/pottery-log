import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bug, LogOut, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import ThemeToggle from "#/components/ThemeToggle";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { useAuth } from "#/hooks/use-auth";
import {
	useClayTypes,
	useCreateClayType,
	useDeleteClayType,
} from "#/hooks/use-clay-types";
import {
	useCreateFolder,
	useDeleteFolder,
	useFolders,
	useRenameFolder,
} from "#/hooks/use-folders";
import { useIssueReporter } from "#/hooks/use-issue-reporter";
import { useOnlineStatus } from "#/hooks/use-online-status";
import {
	useCreateStageDefault,
	useDeleteStageDefault,
	useStageDefaults,
} from "#/hooks/use-stage-defaults";
import {
	useCreateTag,
	useCreateTagCategory,
	useDeleteTag,
	useDeleteTagCategory,
	useTagCategories,
	useTags,
} from "#/hooks/use-tags";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const isOnline = useOnlineStatus();
	const { signOut, user } = useAuth();
	const { setOpen: openIssueReporter } = useIssueReporter();

	return (
		<main className="page-wrap px-4 pb-8 pt-6">
			<div className="mb-6 flex items-center gap-2">
				<Link
					to="/"
					className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
					Innstillinger
				</h1>
			</div>

			<div className="space-y-8">
				{/* Theme */}
				<section className="flex items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3">
					<div>
						<h2 className="text-sm font-semibold text-[var(--sea-ink)]">
							Tema
						</h2>
						<p className="text-xs text-[var(--sea-ink-soft)]">
							Velg mellom lys, mørk eller auto
						</p>
					</div>
					<ThemeToggle />
				</section>

				{/* Issue reporter */}
				<section className="rounded-lg border border-[var(--lagoon)] bg-[var(--lagoon)]/5 px-4 py-4">
					<h2 className="text-sm font-semibold text-[var(--sea-ink)]">
						Rapporter issue
					</h2>
					<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
						Fant du en feil eller har forslag? Opprett en issue på GitHub.
					</p>
					<Button
						size="sm"
						className="mt-3"
						onClick={() => openIssueReporter(true)}
					>
						<Bug className="mr-1.5 h-4 w-4" />
						Opprett issue
					</Button>
				</section>

				{/* Account / Logout */}
				<section className="flex items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3">
					<span className="text-sm text-[var(--sea-ink-soft)]">
						{user?.email}
					</span>
					<Button variant="outline" size="sm" onClick={() => signOut()}>
						<LogOut className="mr-1.5 h-4 w-4" />
						Logg ut
					</Button>
				</section>

				<Separator />

				<ClayTypesSection disabled={!isOnline} />
				<Separator />
				<FoldersSection disabled={!isOnline} />
				<Separator />
				<TagsSection disabled={!isOnline} />
				<Separator />
				<StageDefaultsSection disabled={!isOnline} />
			</div>
		</main>
	);
}

function ClayTypesSection({ disabled }: { disabled: boolean }) {
	const { data: clayTypes } = useClayTypes();
	const createClayType = useCreateClayType();
	const deleteClayType = useDeleteClayType();
	const [newName, setNewName] = useState("");

	return (
		<section>
			<h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">
				Leiretyper
			</h2>
			<div className="space-y-2">
				{clayTypes?.map((ct) => (
					<div
						key={ct.id}
						className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2"
					>
						<span className="text-sm">{ct.name}</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => deleteClayType.mutate(ct.id)}
							disabled={disabled}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				))}
			</div>
			<div className="mt-3 flex gap-2">
				<Input
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					placeholder="Ny leiretype..."
					className="flex-1"
					disabled={disabled}
					onKeyDown={(e) => {
						if (e.key === "Enter" && newName.trim() && !disabled) {
							createClayType.mutate({ name: newName.trim() });
							setNewName("");
						}
					}}
				/>
				<Button
					onClick={() => {
						if (newName.trim()) {
							createClayType.mutate({ name: newName.trim() });
							setNewName("");
						}
					}}
					size="sm"
					disabled={disabled}
				>
					<Plus className="mr-1 h-4 w-4" /> Legg til
				</Button>
			</div>
		</section>
	);
}

function FoldersSection({ disabled }: { disabled: boolean }) {
	const { data: folders } = useFolders();
	const createFolder = useCreateFolder();
	const renameFolder = useRenameFolder();
	const deleteFolder = useDeleteFolder();
	const [newName, setNewName] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const renameDoneRef = useRef(false);

	function handleCreate() {
		if (!newName.trim()) return;
		createFolder.mutate({
			name: newName.trim(),
			sort_order: Math.max(0, ...(folders ?? []).map((f) => f.sort_order)) + 1,
		});
		setNewName("");
	}

	function commitRename() {
		if (renameDoneRef.current) return;
		renameDoneRef.current = true;
		if (!disabled && editingId && editingName.trim()) {
			renameFolder.mutate({ id: editingId, name: editingName.trim() });
		}
		setEditingId(null);
	}

	return (
		<section>
			<h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">
				Mapper
			</h2>
			<div className="space-y-2">
				{folders?.map((folder) => (
					<div
						key={folder.id}
						className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2"
					>
						{editingId === folder.id ? (
							<Input
								value={editingName}
								onChange={(e) => setEditingName(e.target.value)}
								onBlur={commitRename}
								onKeyDown={(e) => {
									if (e.key === "Enter") commitRename();
									if (e.key === "Escape") {
										renameDoneRef.current = true;
										setEditingId(null);
									}
								}}
								className="h-8 flex-1 text-sm"
								autoFocus
							/>
						) : (
							<button
								type="button"
								className="flex-1 text-left text-sm"
								onClick={() => {
									if (disabled) return;
									renameDoneRef.current = false;
									setEditingId(folder.id);
									setEditingName(folder.name);
								}}
							>
								{folder.name}
							</button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => deleteFolder.mutate(folder.id)}
							disabled={disabled}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				))}
			</div>
			<div className="mt-3 flex gap-2">
				<Input
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					placeholder="Ny mappe..."
					className="flex-1"
					disabled={disabled}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !disabled) handleCreate();
					}}
				/>
				<Button onClick={handleCreate} size="sm" disabled={disabled}>
					<Plus className="mr-1 h-4 w-4" /> Legg til
				</Button>
			</div>
		</section>
	);
}

function TagsSection({ disabled }: { disabled: boolean }) {
	const { data: categories } = useTagCategories();
	const { data: tags } = useTags();
	const createTag = useCreateTag();
	const deleteTag = useDeleteTag();
	const createCategory = useCreateTagCategory();
	const deleteCategory = useDeleteTagCategory();
	const [newTagNames, setNewTagNames] = useState<Record<string, string>>({});
	const [newCatName, setNewCatName] = useState("");

	return (
		<section>
			<h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Tags</h2>

			{categories?.map((cat) => {
				const catTags = tags?.filter((t) => t.category_id === cat.id) ?? [];
				return (
					<div key={cat.id} className="mb-4">
						<div className="mb-2 flex items-center gap-2">
							<h3 className="text-sm font-medium text-[var(--sea-ink)]">
								{cat.name}{" "}
								{cat.is_freeform && (
									<span className="text-xs text-[var(--sea-ink-soft)]">
										(fritekst)
									</span>
								)}
							</h3>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => deleteCategory.mutate(cat.id)}
								disabled={disabled}
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						</div>
						<div className="flex flex-wrap gap-1.5 mb-2">
							{catTags.map((tag) => (
								<span
									key={tag.id}
									className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
								>
									{tag.name}
									<button
										type="button"
										onClick={() => deleteTag.mutate(tag.id)}
										disabled={disabled}
									>
										<Trash2 className="h-3 w-3" />
									</button>
								</span>
							))}
						</div>
						<div className="flex gap-2">
							<Input
								value={newTagNames[cat.id] ?? ""}
								onChange={(e) =>
									setNewTagNames({ ...newTagNames, [cat.id]: e.target.value })
								}
								placeholder="Ny tag..."
								className="h-8 w-40 text-sm"
								disabled={disabled}
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										newTagNames[cat.id]?.trim() &&
										!disabled
									) {
										createTag.mutate({
											name: newTagNames[cat.id].trim(),
											category_id: cat.id,
										});
										setNewTagNames({ ...newTagNames, [cat.id]: "" });
									}
								}}
							/>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									if (newTagNames[cat.id]?.trim()) {
										createTag.mutate({
											name: newTagNames[cat.id].trim(),
											category_id: cat.id,
										});
										setNewTagNames({ ...newTagNames, [cat.id]: "" });
									}
								}}
								disabled={disabled}
							>
								<Plus className="h-3 w-3" />
							</Button>
						</div>
					</div>
				);
			})}

			<Separator className="my-3" />
			<div className="flex gap-2">
				<Input
					value={newCatName}
					onChange={(e) => setNewCatName(e.target.value)}
					placeholder="Ny kategori..."
					className="flex-1"
					disabled={disabled}
				/>
				<Button
					size="sm"
					onClick={() => {
						if (newCatName.trim()) {
							createCategory.mutate({
								name: newCatName.trim(),
								is_freeform: false,
							});
							setNewCatName("");
						}
					}}
					disabled={disabled}
				>
					<Plus className="mr-1 h-4 w-4" /> Kategori
				</Button>
			</div>
		</section>
	);
}

function StageDefaultsSection({ disabled }: { disabled: boolean }) {
	const { data: defaults } = useStageDefaults();
	const createDefault = useCreateStageDefault();
	const deleteDefault = useDeleteStageDefault();
	const [newName, setNewName] = useState("");

	return (
		<section>
			<h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">
				Standard-stadier
			</h2>
			<div className="space-y-2">
				{defaults?.map((d) => (
					<div
						key={d.id}
						className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2"
					>
						<div>
							<span className="text-sm font-medium">{d.name}</span>
							{d.is_system && (
								<span className="ml-2 text-xs text-[var(--sea-ink-soft)]">
									(system)
								</span>
							)}
							<p className="text-xs text-[var(--sea-ink-soft)]">
								Felt: {(d.default_fields as string[]).join(", ") || "ingen"}
							</p>
						</div>
						{!d.is_system && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => deleteDefault.mutate(d.id)}
								disabled={disabled}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				))}
			</div>
			<div className="mt-3 flex gap-2">
				<Input
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					placeholder="Nytt stadium..."
					className="flex-1"
					disabled={disabled}
					onKeyDown={(e) => {
						if (e.key === "Enter" && newName.trim() && !disabled) {
							createDefault.mutate({
								name: newName.trim(),
								default_fields: [],
								sort_order: (defaults?.length ?? 0) + 1,
							});
							setNewName("");
						}
					}}
				/>
				<Button
					size="sm"
					onClick={() => {
						if (newName.trim()) {
							createDefault.mutate({
								name: newName.trim(),
								default_fields: [],
								sort_order: (defaults?.length ?? 0) + 1,
							});
							setNewName("");
						}
					}}
					disabled={disabled}
				>
					<Plus className="mr-1 h-4 w-4" /> Legg til
				</Button>
			</div>
		</section>
	);
}
