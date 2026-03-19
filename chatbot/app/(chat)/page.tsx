import { ChatShell } from '@/components/chat-shell';
import { getCurrentViewer } from '@/lib/auth-state';

export default async function ChatPage() {
  const viewer = await getCurrentViewer();

  return <ChatShell initialViewer={viewer} />;
}
