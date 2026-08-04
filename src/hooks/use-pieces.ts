import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "#/lib/supabase";
import type {
	Piece,
	PieceImage,
	PieceStage,
	PieceWithRelations,
	Tag,
} from "#/types/database";

export function usePieces(filters?: {
	tagIds?: string[];
	clayTypeId?: string;
	search?: string;
}) {
	return useQuery({
		queryKey: ["pieces", filters],
		queryFn: async () => {
			let query = db
				.from("pieces")
				.select("*")
				.order("created_at", { ascending: false });

			if (filters?.clayTypeId) {
				query = query.eq("clay_type_id", filters.clayTypeId);
			}
			if (filters?.search) {
				query = query.ilike("title", `%${filters.search}%`);
			}

			const { data, error } = await query;
			if (error) throw error;

			if (filters?.tagIds?.length && data) {
				const { data: pieceTags } = await db
					.from("piece_tags")
					.select("piece_id, tag_id")
					.in("tag_id", filters.tagIds);

				const pieceIdsWithTags = new Set(pieceTags?.map((pt) => pt.piece_id));
				return data.filter((p) => pieceIdsWithTags.has(p.id)) as Piece[];
			}

			return data as Piece[];
		},
	});
}

export function usePiece(id: string) {
	return useQuery({
		queryKey: ["piece", id],
		queryFn: async (): Promise<PieceWithRelations> => {
			const [pieceRes, stagesRes, imagesRes, tagsRes] = await Promise.all([
				db
					.from("pieces")
					.select("*, clay_type:clay_types(*)")
					.eq("id", id)
					.single(),
				db
					.from("piece_stages")
					.select("*")
					.eq("piece_id", id)
					.order("sort_order"),
				db
					.from("piece_images")
					.select("*")
					.eq("piece_id", id)
					.order("sort_order"),
				db
					.from("piece_tags")
					.select("tag_id, tags(*, category:tag_categories(*))")
					.eq("piece_id", id),
			]);

			if (pieceRes.error) throw pieceRes.error;

			return {
				...pieceRes.data,
				stages: (stagesRes.data ?? []) as PieceStage[],
				images: (imagesRes.data ?? []) as PieceImage[],
				// The client is untyped, so Supabase infers the embedded tag as an
				// array; the tag_id FK makes it a single row at runtime
				tags: ((tagsRes.data ?? []) as unknown as { tags: Tag }[]).map(
					(pt) => pt.tags,
				),
			};
		},
		enabled: !!id,
	});
}

type CreatePieceInput = {
	title: string;
	clay_type_id?: string | null;
	piece_id_label?: string | null;
	price?: number | null;
	final_notes?: string | null;
	display_image?: string | null;
	stages: Omit<PieceStage, "id" | "piece_id" | "created_at">[];
	tag_ids: string[];
	images: { image_path: string; caption: string | null; sort_order: number }[];
};

export function useCreatePiece() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreatePieceInput) => {
			const { stages, tag_ids, images, ...pieceData } = input;

			const { data: piece, error } = await db
				.from("pieces")
				.insert(pieceData)
				.select()
				.single();

			if (error) throw error;

			if (stages.length > 0) {
				const { error: stagesError } = await db
					.from("piece_stages")
					.insert(stages.map((s) => ({ ...s, piece_id: piece.id })));
				if (stagesError) throw stagesError;
			}

			if (tag_ids.length > 0) {
				const { error: tagsError } = await db
					.from("piece_tags")
					.insert(tag_ids.map((tag_id) => ({ piece_id: piece.id, tag_id })));
				if (tagsError) throw tagsError;
			}

			if (images.length > 0) {
				const { error: imagesError } = await db
					.from("piece_images")
					.insert(images.map((img) => ({ ...img, piece_id: piece.id })));
				if (imagesError) throw imagesError;
			}

			return piece as Piece;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pieces"] });
		},
	});
}

export function useUpdatePiece() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...input }: CreatePieceInput & { id: string }) => {
			const { stages, tag_ids, images, ...pieceData } = input;

			const { error } = await db.from("pieces").update(pieceData).eq("id", id);

			if (error) throw error;

			await db.from("piece_stages").delete().eq("piece_id", id);
			if (stages.length > 0) {
				await db
					.from("piece_stages")
					.insert(stages.map((s) => ({ ...s, piece_id: id })));
			}

			await db.from("piece_tags").delete().eq("piece_id", id);
			if (tag_ids.length > 0) {
				await db
					.from("piece_tags")
					.insert(tag_ids.map((tag_id) => ({ piece_id: id, tag_id })));
			}

			await db.from("piece_images").delete().eq("piece_id", id);
			if (images.length > 0) {
				await db
					.from("piece_images")
					.insert(images.map((img) => ({ ...img, piece_id: id })));
			}

			return { id };
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["pieces"] });
			queryClient.invalidateQueries({ queryKey: ["piece", variables.id] });
		},
	});
}

export function useSetDisplayImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			imagePath,
		}: {
			id: string;
			imagePath: string;
		}) => {
			const { error } = await db
				.from("pieces")
				.update({ display_image: imagePath })
				.eq("id", id);
			if (error) throw error;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["pieces"] });
			queryClient.invalidateQueries({ queryKey: ["piece", variables.id] });
		},
	});
}

export function useDeletePiece() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await db.from("pieces").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pieces"] });
		},
	});
}
