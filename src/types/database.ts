export type ClayType = {
	id: string;
	name: string;
	description: string | null;
};

export type TagCategory = {
	id: string;
	name: string;
	is_freeform: boolean;
};

export type Tag = {
	id: string;
	name: string;
	category_id: string;
	created_by: string | null;
	category?: TagCategory;
};

export type Folder = {
	id: string;
	name: string;
	sort_order: number;
};

export type StageDefault = {
	id: string;
	name: string;
	default_fields: string[];
	sort_order: number;
	is_system: boolean;
};

export type PieceStage = {
	id: string;
	piece_id: string;
	stage_def_id: string | null;
	title: string;
	image_path: string | null;
	fields: Record<string, string | number>;
	notes: string | null;
	sort_order: number;
	created_at: string;
};

export type PieceImage = {
	id: string;
	piece_id: string;
	image_path: string;
	caption: string | null;
	sort_order: number;
	created_at: string;
};

export type Piece = {
	id: string;
	title: string;
	display_image: string | null;
	clay_type_id: string | null;
	piece_id_label: string | null;
	price: number | null;
	final_notes: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
};

export type PieceWithRelations = Piece & {
	clay_type: ClayType | null;
	stages: PieceStage[];
	tags: Tag[];
	folders: Folder[];
	images: PieceImage[];
};
