import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'

export const NOTIFICATION_CHANNELS = ['email', 'push'] as const
export const NOTIFICATION_EVENTS = [
  'mention',
  'task_assigned',
  'weekly_digest',
  'security_alert',
] as const

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]

export type NotificationPref = {
  user_id: string
  channel: NotificationChannel
  event_type: NotificationEvent
  enabled: boolean
  updated_at: string
}

const COLUMNS = 'user_id, channel, event_type, enabled, updated_at'

export const notificationPrefsKey = (userId: string | undefined) =>
  ['notification_prefs', userId] as const

export function useNotificationPrefs(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: notificationPrefsKey(userId),
    queryFn: async (): Promise<NotificationPref[]> => {
      const { data, error } = await insforge.database
        .from('notification_prefs')
        .select(COLUMNS)
        .eq('user_id', userId!)
      if (error) throw new Error(error.message)
      return (data ?? []) as NotificationPref[]
    },
  })
}

export type ToggleArgs = {
  channel: NotificationChannel
  event_type: NotificationEvent
  enabled: boolean
}

export function useToggleNotificationPref(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ channel, event_type, enabled }: ToggleArgs): Promise<void> => {
      if (!userId) throw new Error('Not signed in')
      const { data: existing, error: selErr } = await insforge.database
        .from('notification_prefs')
        .select('user_id')
        .eq('user_id', userId)
        .eq('channel', channel)
        .eq('event_type', event_type)
        .maybeSingle()
      if (selErr) throw new Error(selErr.message)

      if (existing) {
        const { error } = await insforge.database
          .from('notification_prefs')
          .update({ enabled })
          .eq('user_id', userId)
          .eq('channel', channel)
          .eq('event_type', event_type)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await insforge.database
          .from('notification_prefs')
          .insert([{ user_id: userId, channel, event_type, enabled }])
        if (error) throw new Error(error.message)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationPrefsKey(userId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update notification preference')
    },
  })
}
