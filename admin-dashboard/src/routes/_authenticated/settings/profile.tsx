import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import { AvatarUploader } from '@/features/settings/profile/avatar-uploader'
import { ProfileForm } from '@/features/settings/profile/profile-form'
import { useProfile } from '@/features/settings/profile/use-profile'

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>How others see you across the workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <AvatarUploader
              profile={profile ?? null}
              fallbackLabel={profile?.name || user?.email || '??'}
            />
            <Separator />
            <ProfileForm profile={profile ?? null} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
