import { X } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { useFolders } from "#/hooks/use-folders";

type FolderSelectProps = {
	selectedIds: string[];
	onChange: (ids: string[]) => void;
};

export function FolderSelect({ selectedIds, onChange }: FolderSelectProps) {
	const { data: folders } = useFolders();

	function toggle(folderId: string) {
		if (selectedIds.includes(folderId)) {
			onChange(selectedIds.filter((id) => id !== folderId));
		} else {
			onChange([...selectedIds, folderId]);
		}
	}

	return (
		<div className="flex flex-wrap gap-1.5">
			{folders?.map((folder) => (
				<Badge
					key={folder.id}
					variant={selectedIds.includes(folder.id) ? "default" : "outline"}
					className="cursor-pointer"
					onClick={() => toggle(folder.id)}
				>
					{folder.name}
					{selectedIds.includes(folder.id) && <X className="ml-1 h-3 w-3" />}
				</Badge>
			))}
		</div>
	);
}
