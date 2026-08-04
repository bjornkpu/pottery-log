import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "#/lib/supabase";
import type { Folder } from "#/types/database";

export function useFolders() {
	return useQuery({
		queryKey: ["folders"],
		queryFn: async () => {
			const { data, error } = await db
				.from("folders")
				.select("*")
				.order("sort_order");
			if (error) throw error;
			return data as Folder[];
		},
	});
}

export function useCreateFolder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { name: string; sort_order: number }) => {
			const { data, error } = await db
				.from("folders")
				.insert(input)
				.select()
				.single();
			if (error) throw error;
			return data as Folder;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["folders"] });
		},
	});
}

export function useRenameFolder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, name }: { id: string; name: string }) => {
			const { error } = await db.from("folders").update({ name }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["folders"] });
		},
	});
}

export function useDeleteFolder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await db.from("folders").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["folders"] });
			// A folder-scoped grid may be on screen
			queryClient.invalidateQueries({ queryKey: ["pieces"] });
		},
	});
}
