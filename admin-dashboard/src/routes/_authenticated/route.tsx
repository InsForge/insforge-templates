import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { insforge } from '@/lib/insforge'
import { AppShell } from '@/components/layout/app-shell'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data } = await insforge.auth.getCurrentUser()
    if (!data?.user) throw redirect({ to: '/sign-in' })
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
