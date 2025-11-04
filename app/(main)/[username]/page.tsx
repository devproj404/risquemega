import { getCurrentUser } from '@/lib/auth';
import { UserProfileContent } from '@/components/user-profile-content';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const currentUser = await getCurrentUser();

  // Find user by username
  const profileUser = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!profileUser) {
    notFound();
  }

  // Check if current user follows this profile
  let isFollowing = false;
  if (currentUser) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: profileUser.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <UserProfileContent
      user={profileUser}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
      isLoggedIn={!!currentUser}
    />
  );
}
