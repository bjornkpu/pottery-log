import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "#/lib/supabase";
import type { StageDefault } from "#/types/database";

export function useStageDefaults() {
	return useQuery({
		queryKey: ["stage-defaults"],
		queryFn: async () => {
			const { data, error } = await db
				.from("stage_defaults")
				.select("*")
				.order("sort_order");
			if (error) throw error;
			return data as StageDefault[];
		},
	});
}

export function useCreateStageDefault() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			name: string;
			default_fields: string[];
			sort_order: number;
		}) => {
			const { data, error } = await db
				.from("stage_defaults")
				.insert({ ...input, is_system: false })
				.select()
				.single();
			if (error) throw error;
			return data as StageDefault;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stage-defaults"] });
		},
	});
}

export function useUpdateStageDefault() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...input
		}: {
			id: string;
			name: string;
			default_fields: string[];
			sort_order: number;
		}) => {
			const { error } = await db
				.from("stage_defaults")
				.update(input)
				.eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stage-defaults"] });
		},
	});
}

export function useDeleteStageDefault() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await db.from("stage_defaults").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stage-defaults"] });
		},
	});
}
