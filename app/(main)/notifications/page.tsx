import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NotificationsContent } from '@/components/notifications-content';

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <NotificationsContent />;
}
