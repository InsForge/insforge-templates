import {
  LayoutDashboard,
  ListTodo,
  Users,
  Boxes,
  MessageSquare,
  Settings,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  to: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { title: 'Tasks', to: '/tasks', icon: ListTodo },
  { title: 'Users', to: '/users', icon: Users },
  { title: 'Apps', to: '/apps', icon: Boxes },
  { title: 'Chats', to: '/chats', icon: MessageSquare },
  { title: 'Settings', to: '/settings', icon: Settings },
  { title: 'Help', to: '/help-center', icon: LifeBuoy },
]
