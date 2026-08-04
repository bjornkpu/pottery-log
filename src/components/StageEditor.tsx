import { GripVertical, Trash2 } from "lucide-react";
import { ImageUpload } from "#/components/ImageUpload";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { getFieldLabel, getFieldType } from "#/lib/field-labels";

export type StageFormData = {
	/** Stable client-side identity, so React keys survive reordering and removal */
	id: string;
	stage_def_id: string | null;
	title: string;
	image: File | string | null;
	fields: Record<string, string | number>;
	notes: string;
	sort_order: number;
};

type StageEditorProps = {
	stage: StageFormData;
	onChange: (stage: StageFormData) => void;
	onRemove: () => void;
	previewUrl?: string | null;
};

export function StageEditor({
	stage,
	onChange,
	onRemove,
	previewUrl,
}: StageEditorProps) {
	const fieldKeys = Object.keys(stage.fields);

	return (
		<div className="rounded-lg border border-[var(--line)] p-4">
			<div className="mb-3 flex items-center gap-2">
				<GripVertical className="h-4 w-4 text-[var(--sea-ink-soft)]" />
				<Input
					value={stage.title}
					onChange={(e) => onChange({ ...stage, title: e.target.value })}
					className="flex-1 font-semibold"
					placeholder="Stadienavn"
				/>
				<Button variant="ghost" size="sm" onClick={onRemove} type="button">
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row">
				<div className="w-full sm:w-40">
					<ImageUpload
						onChange={(file) => onChange({ ...stage, image: file })}
						previewUrl={previewUrl}
					/>
				</div>

				<div className="flex-1 space-y-3">
					{fieldKeys.map((key) => (
						<div key={key} className="flex items-center gap-2">
							<Label className="w-32 flex-shrink-0 text-xs">
								{getFieldLabel(key)}
							</Label>
							<Input
								type={getFieldType(key) === "number" ? "number" : "text"}
								value={stage.fields[key] ?? ""}
								onChange={(e) => {
									const val =
										getFieldType(key) === "number" && e.target.value
											? Number(e.target.value)
											: e.target.value;
									onChange({
										...stage,
										fields: { ...stage.fields, [key]: val },
									});
								}}
								className="h-8 text-sm"
							/>
						</div>
					))}

					<div>
						<Label className="text-xs">Notater</Label>
						<Textarea
							value={stage.notes}
							onChange={(e) => onChange({ ...stage, notes: e.target.value })}
							className="text-sm"
							placeholder="Skriv notater..."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
