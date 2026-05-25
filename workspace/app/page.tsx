import { redirect } from 'next/navigation';
import { getCurrentUser, getOrCreateDefaultWorkspace } from '@/lib/workspace-actions';

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/sign-in');
  }
  const workspaceId = await getOrCreateDefaultWorkspace();
  if (!workspaceId) {
    redirect('/auth/sign-in');
  }
  redirect(`/w/${workspaceId}`);
}
