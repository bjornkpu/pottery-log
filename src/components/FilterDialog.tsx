import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { useClayTypes } from "#/hooks/use-clay-types";
import { useTagCategories, useTags } from "#/hooks/use-tags";

type FilterState = {
	search: string;
	clayTypeId: string | undefined;
	tagIds: string[];
};

type FilterDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: FilterState;
	onChange: (filters: FilterState) => void;
};

export function FilterDialog({
	open,
	onOpenChange,
	filters,
	onChange,
}: FilterDialogProps) {
	const { data: clayTypes } = useClayTypes();
	const { data: tags } = useTags();
	const { data: categories } = useTagCategories();

	const managedCategories = categories?.filter((c) => !c.is_freeform) ?? [];

	function handleReset() {
		onChange({ ...filters, clayTypeId: undefined, tagIds: [] });
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Filtrer</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Select
						value={filters.clayTypeId ?? "all"}
						onValueChange={(v) =>
							onChange({ ...filters, clayTypeId: v === "all" ? undefined : v })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Leiretype" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Alle leiretyper</SelectItem>
							{clayTypes?.map((ct) => (
								<SelectItem key={ct.id} value={ct.id}>
									{ct.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{managedCategories.map((cat) => {
						const catTags = tags?.filter((t) => t.category_id === cat.id) ?? [];
						if (catTags.length === 0) return null;

						return (
							<Select
								key={cat.id}
								value={
									filters.tagIds.find((id) =>
										catTags.some((t) => t.id === id),
									) ?? "all"
								}
								onValueChange={(v) => {
									const otherTagIds = filters.tagIds.filter(
										(id) => !catTags.some((t) => t.id === id),
									);
									const newTagIds =
										v === "all" ? otherTagIds : [...otherTagIds, v];
									onChange({ ...filters, tagIds: newTagIds });
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder={cat.name} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										Alle {cat.name.toLowerCase()}
									</SelectItem>
									{catTags.map((tag) => (
										<SelectItem key={tag.id} value={tag.id}>
											{tag.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						);
					})}
				</div>

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={handleReset}>
						Nullstill
					</Button>
					<Button size="sm" onClick={() => onOpenChange(false)}>
						Lukk
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
