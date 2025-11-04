import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsContent } from '@/components/settings-content';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <SettingsContent user={user} />;
}
