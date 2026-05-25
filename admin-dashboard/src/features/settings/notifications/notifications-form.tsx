import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  useNotificationPrefs,
  useToggleNotificationPref,
  type NotificationChannel,
  type NotificationEvent,
} from './use-notification-prefs'

const EVENT_LABELS: Record<NotificationEvent, { title: string; description: string }> = {
  mention: {
    title: 'Mentions',
    description: 'When a teammate @-mentions you in a comment or message.',
  },
  task_assigned: {
    title: 'Tasks assigned',
    description: 'When a task is assigned to you or its assignee changes to you.',
  },
  weekly_digest: {
    title: 'Weekly digest',
    description: 'A Monday summary of activity in your workspaces.',
  },
  security_alert: {
    title: 'Security alerts',
    description: 'Sign-ins from new devices and important account events.',
  },
}

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: 'Email',
  push: 'Push',
}

function isEnabled(
  rows: { channel: NotificationChannel; event_type: NotificationEvent; enabled: boolean }[],
  channel: NotificationChannel,
  event_type: NotificationEvent,
): boolean {
  const row = rows.find((r) => r.channel === channel && r.event_type === event_type)
  // Default to enabled when no row exists yet — matches DB default.
  return row ? row.enabled : true
}

export function NotificationsForm() {
  const { user } = useAuth()
  const { data, isLoading } = useNotificationPrefs(user?.id)
  const toggle = useToggleNotificationPref(user?.id)
  const rows = data ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(2,90px)] items-center gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Event</span>
        {NOTIFICATION_CHANNELS.map((ch) => (
          <span key={ch} className="text-center">
            {CHANNEL_LABELS[ch]}
          </span>
        ))}
      </div>
      <ul className="divide-y">
        {NOTIFICATION_EVENTS.map((event) => {
          const meta = EVENT_LABELS[event]
          return (
            <li
              key={event}
              className="grid grid-cols-[minmax(0,1fr)_repeat(2,90px)] items-center gap-4 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{meta.title}</p>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
              {NOTIFICATION_CHANNELS.map((channel) => {
                const enabled = isEnabled(rows, channel, event)
                return (
                  <div key={channel} className="flex justify-center">
                    <Switch
                      checked={enabled}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) =>
                        toggle.mutate({ channel, event_type: event, enabled: v })
                      }
                      aria-label={`${CHANNEL_LABELS[channel]} — ${meta.title}`}
                    />
                  </div>
                )
              })}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
