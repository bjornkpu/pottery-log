import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "#/lib/supabase";
import type { Tag, TagCategory } from "#/types/database";

export function useTagCategories() {
	return useQuery({
		queryKey: ["tag-categories"],
		queryFn: async () => {
			const { data, error } = await db
				.from("tag_categories")
				.select("*")
				.order("name");
			if (error) throw error;
			return data as TagCategory[];
		},
	});
}

export function useTags(categoryId?: string) {
	return useQuery({
		queryKey: ["tags", categoryId],
		queryFn: async () => {
			let query = db
				.from("tags")
				.select("*, category:tag_categories(*)")
				.order("name");

			if (categoryId) {
				query = query.eq("category_id", categoryId);
			}

			const { data, error } = await query;
			if (error) throw error;
			return data as Tag[];
		},
	});
}

export function useCreateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { name: string; category_id: string }) => {
			const { data, error } = await db
				.from("tags")
				.insert(input)
				.select()
				.single();
			if (error) throw error;
			return data as Tag;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
		},
	});
}

export function useDeleteTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await db.from("tags").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
		},
	});
}

export function useCreateTagCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { name: string; is_freeform: boolean }) => {
			const { data, error } = await db
				.from("tag_categories")
				.insert(input)
				.select()
				.single();
			if (error) throw error;
			return data as TagCategory;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tag-categories"] });
		},
	});
}

export function useDeleteTagCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await db.from("tag_categories").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tag-categories"] });
			queryClient.invalidateQueries({ queryKey: ["tags"] });
		},
	});
}
