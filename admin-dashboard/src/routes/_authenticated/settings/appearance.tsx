import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { AppearanceForm } from '@/features/settings/appearance/appearance-form'
import { useDisplayPrefs } from '@/features/settings/appearance/use-display-prefs'

export const Route = createFileRoute('/_authenticated/settings/appearance')({
  component: AppearancePage,
})

function AppearancePage() {
  const { user } = useAuth()
  const { data: prefs, isLoading } = useDisplayPrefs(user?.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Tune the look and feel of the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <AppearanceForm prefs={prefs ?? null} />
        )}
      </CardContent>
    </Card>
  )
}
