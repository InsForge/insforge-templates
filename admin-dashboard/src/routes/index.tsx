import { createFileRoute, redirect } from '@tanstack/react-router'
import { insforge } from '@/lib/insforge'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data } = await insforge.auth.getCurrentUser()
    if (data?.user) throw redirect({ to: '/dashboard' })
    throw redirect({ to: '/sign-in' })
  },
})
