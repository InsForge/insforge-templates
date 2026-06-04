import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser, acceptInvite } from '@/lib/workspace-actions';

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  let workspaceId: string | null = null;
  try {
    workspaceId = await acceptInvite(token);
  } catch {
    workspaceId = null;
  }

  if (workspaceId) {
    redirect(`/w/${workspaceId}`);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center">
          <h1 className="text-lg font-semibold">Invite invalid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invite link is no longer valid or has expired.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
