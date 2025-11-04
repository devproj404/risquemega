import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatContent } from '@/components/chat-content';

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <ChatContent />;
}
