import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationsForm } from '@/features/settings/notifications/notifications-form'

export const Route = createFileRoute('/_authenticated/settings/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose which channels deliver each kind of notification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationsForm />
      </CardContent>
    </Card>
  )
}
