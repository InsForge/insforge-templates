'use client';

import { ChatShell } from '@/components/chat-shell';
import { RailProvider } from '@/lib/chat/rail-context';

// Hoists ChatShell out of the per-page render so that navigating between
// /chat and /chat/[id] does NOT unmount + remount the sidebar (which
// was the cause of the recent-chats list visibly flashing on each
// click). The page itself only renders the main content; the citation
// rail is pushed up through RailContext.
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <RailProvider>
      <ChatShell>{children}</ChatShell>
    </RailProvider>
  );
}
