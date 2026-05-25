import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { DisplayForm } from '@/features/settings/display/display-form'
import { useDisplayPrefs } from '@/features/settings/appearance/use-display-prefs'

export const Route = createFileRoute('/_authenticated/settings/display')({
  component: DisplayPage,
})

function DisplayPage() {
  const { user } = useAuth()
  const { data: prefs, isLoading } = useDisplayPrefs(user?.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display</CardTitle>
        <CardDescription>Customize layout density and language.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <DisplayForm prefs={prefs ?? null} />
        )}
      </CardContent>
    </Card>
  )
}
