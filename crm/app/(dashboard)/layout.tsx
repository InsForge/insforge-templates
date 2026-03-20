import { redirect } from 'next/navigation';
import { getCurrentViewer } from '@/lib/auth-state';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const viewer = await getCurrentViewer();

  if (!viewer.isAuthenticated) {
    redirect('/auth/sign-in');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
