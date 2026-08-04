import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useTags, useTagCategories, useCreateTag } from "#/hooks/use-tags";
import { useState } from "react";
import { X, Plus } from "lucide-react";

type TagSelectProps = {
	selectedIds: string[];
	onChange: (ids: string[]) => void;
};

export function TagSelect({ selectedIds, onChange }: TagSelectProps) {
	const { data: tags } = useTags();
	const { data: categories } = useTagCategories();
	const createTag = useCreateTag();
	const [newTagName, setNewTagName] = useState("");
	const [addingToCategory, setAddingToCategory] = useState<string | null>(null);

	function toggle(tagId: string) {
		if (selectedIds.includes(tagId)) {
			onChange(selectedIds.filter((id) => id !== tagId));
		} else {
			onChange([...selectedIds, tagId]);
		}
	}

	async function handleCreateTag(categoryId: string) {
		if (!newTagName.trim()) return;
		const tag = await createTag.mutateAsync({
			name: newTagName.trim(),
			category_id: categoryId,
		});
		onChange([...selectedIds, tag.id]);
		setNewTagName("");
		setAddingToCategory(null);
	}

	return (
		<div className="space-y-3">
			{categories?.map((cat) => {
				const catTags = tags?.filter((t) => t.category_id === cat.id) ?? [];
				return (
					<div key={cat.id}>
						<p className="mb-1 text-xs font-medium uppercase text-[var(--sea-ink-soft)]">
							{cat.name}
						</p>
						<div className="flex flex-wrap gap-1.5">
							{catTags.map((tag) => (
								<Badge
									key={tag.id}
									variant={selectedIds.includes(tag.id) ? "default" : "outline"}
									className="cursor-pointer"
									onClick={() => toggle(tag.id)}
								>
									{tag.name}
									{selectedIds.includes(tag.id) && (
										<X className="ml-1 h-3 w-3" />
									)}
								</Badge>
							))}
							{addingToCategory === cat.id ? (
								<div className="flex items-center gap-1">
									<Input
										value={newTagName}
										onChange={(e) => setNewTagName(e.target.value)}
										onKeyDown={(e) =>
											e.key === "Enter" && handleCreateTag(cat.id)
										}
										placeholder="Ny tag..."
										className="h-6 w-24 text-xs"
										autoFocus
									/>
									<Button size="sm" onClick={() => handleCreateTag(cat.id)}>
										OK
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => setAddingToCategory(null)}
									>
										<X className="h-3 w-3" />
									</Button>
								</div>
							) : (
								<Badge
									variant="outline"
									className="cursor-pointer border-dashed"
									onClick={() => setAddingToCategory(cat.id)}
								>
									<Plus className="mr-1 h-3 w-3" /> Ny
								</Badge>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
