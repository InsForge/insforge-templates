import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'

export type ThemePref = 'light' | 'dark' | 'system'
export type FontPref = 'default' | 'serif' | 'mono'
export type LayoutDensity = 'comfortable' | 'compact'

export type DisplayPrefs = {
  user_id: string
  theme: ThemePref
  font: FontPref
  layout_density: LayoutDensity
  sidebar_collapsed: boolean
  language: string
  updated_at: string
}

export type DisplayPrefsPayload = Partial<Omit<DisplayPrefs, 'user_id' | 'updated_at'>>

const COLUMNS = 'user_id, theme, font, layout_density, sidebar_collapsed, language, updated_at'

export const displayPrefsKey = (userId: string | undefined) => ['display_prefs', userId] as const

export function useDisplayPrefs(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: displayPrefsKey(userId),
    queryFn: async (): Promise<DisplayPrefs | null> => {
      const { data, error } = await insforge.database
        .from('display_prefs')
        .select(COLUMNS)
        .eq('user_id', userId!)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return (data ?? null) as DisplayPrefs | null
    },
  })
}

export function useUpsertDisplayPrefs(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DisplayPrefsPayload): Promise<void> => {
      if (!userId) throw new Error('Not signed in')
      const { data: existing, error: selErr } = await insforge.database
        .from('display_prefs')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()
      if (selErr) throw new Error(selErr.message)

      if (existing) {
        const { error } = await insforge.database
          .from('display_prefs')
          .update(payload)
          .eq('user_id', userId)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await insforge.database
          .from('display_prefs')
          .insert([{ user_id: userId, ...payload }])
        if (error) throw new Error(error.message)
      }
    },
    onSuccess: () => {
      toast.success('Preferences saved')
      void qc.invalidateQueries({ queryKey: displayPrefsKey(userId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save preferences')
    },
  })
}
