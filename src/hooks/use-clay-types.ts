import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '#/lib/supabase'
import type { ClayType } from '#/types/database'

export function useClayTypes() {
  return useQuery({
    queryKey: ['clay-types'],
    queryFn: async () => {
      const { data, error } = await db
        .from('clay_types')
        .select('*')
        .order('name')
      if (error) throw error
      return data as ClayType[]
    },
  })
}

export function useCreateClayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await db
        .from('clay_types')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as ClayType
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clay-types'] })
    },
  })
}

export function useDeleteClayType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('clay_types').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clay-types'] })
    },
  })
}
