import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileContent } from '@/components/profile-content';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <ProfileContent user={user} />;
}
