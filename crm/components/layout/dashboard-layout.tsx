import { Sidebar } from '@/components/layout/sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-6xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
