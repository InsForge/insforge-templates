import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'

export type Profile = {
  user_id: string
  name: string | null
  avatar_url: string | null
  avatar_key: string | null
  bio: string | null
  phone: string | null
  urls: string[]
  updated_at: string
}

export type ProfilePayload = {
  name?: string | null
  avatar_url?: string | null
  avatar_key?: string | null
  bio?: string | null
  phone?: string | null
  urls?: string[]
}

const COLUMNS = 'user_id, name, avatar_url, avatar_key, bio, phone, urls, updated_at'

export const profileKey = (userId: string | undefined) => ['profile', userId] as const

export function useProfile(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: profileKey(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await insforge.database
        .from('profiles')
        .select(COLUMNS)
        .eq('user_id', userId!)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return null
      const row = data as Profile & { urls: unknown }
      return { ...row, urls: Array.isArray(row.urls) ? (row.urls as string[]) : [] }
    },
  })
}

export function useUpsertProfile(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProfilePayload): Promise<void> => {
      if (!userId) throw new Error('Not signed in')
      const { data: existing, error: selErr } = await insforge.database
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()
      if (selErr) throw new Error(selErr.message)

      if (existing) {
        const { error } = await insforge.database
          .from('profiles')
          .update(payload)
          .eq('user_id', userId)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await insforge.database
          .from('profiles')
          .insert([{ user_id: userId, ...payload }])
        if (error) throw new Error(error.message)
      }
    },
    onSuccess: () => {
      toast.success('Profile saved')
      void qc.invalidateQueries({ queryKey: profileKey(userId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save profile')
    },
  })
}
