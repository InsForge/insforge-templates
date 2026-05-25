import { useRouterState } from '@tanstack/react-router'
import { UserMenu } from './user-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_ITEMS } from './sidebar-nav'

function titleFromPath(pathname: string): string {
  const match = NAV_ITEMS.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`))
  return match?.title ?? 'Dashboard'
}

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <h1 className="text-base font-semibold tracking-tight">{titleFromPath(pathname)}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
