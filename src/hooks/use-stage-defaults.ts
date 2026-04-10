import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import type { StageDefault } from '#/types/database'

export function useStageDefaults() {
  return useQuery({
    queryKey: ['stage-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_defaults')
        .select('*')
        .schema('pottery')
        .order('sort_order')
      if (error) throw error
      return data as StageDefault[]
    },
  })
}

export function useCreateStageDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; default_fields: string[]; sort_order: number }) => {
      const { data, error } = await supabase
        .from('stage_defaults')
        .insert({ ...input, is_system: false })
        .schema('pottery')
        .select()
        .single()
      if (error) throw error
      return data as StageDefault
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-defaults'] })
    },
  })
}

export function useUpdateStageDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name: string; default_fields: string[]; sort_order: number }) => {
      const { error } = await supabase
        .from('stage_defaults')
        .update(input)
        .schema('pottery')
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-defaults'] })
    },
  })
}

export function useDeleteStageDefault() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stage_defaults').delete().schema('pottery').eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-defaults'] })
    },
  })
}
