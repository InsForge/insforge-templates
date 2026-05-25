import { Outlet, createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { value: 'profile', label: 'Profile', to: '/settings/profile' as const },
  { value: 'account', label: 'Account', to: '/settings/account' as const },
  { value: 'appearance', label: 'Appearance', to: '/settings/appearance' as const },
  { value: 'display', label: 'Display', to: '/settings/display' as const },
  { value: 'notifications', label: 'Notifications', to: '/settings/notifications' as const },
]

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsLayout,
})

function SettingsLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const active = TABS.find((t) => pathname.startsWith(t.to))?.value ?? 'profile'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your profile, preferences, and notifications.
        </p>
      </div>

      <Tabs
        value={active}
        onValueChange={(v) => {
          const tab = TABS.find((t) => t.value === v)
          if (tab) navigate({ to: tab.to })
        }}
      >
        <TabsList className="h-auto flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div>
        <Outlet />
      </div>
    </div>
  )
}
