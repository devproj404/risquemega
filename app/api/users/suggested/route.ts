import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    // Get users to exclude (current user + already following)
    const excludeUserIds: string[] = [];

    if (currentUser) {
      excludeUserIds.push(currentUser.id);

      // Get users that current user is already following
      const following = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });

      excludeUserIds.push(...following.map(f => f.followingId));
    }

    // Fetch suggested users (prioritize verified and popular users not followed yet)
    let suggestedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: excludeUserIds,
        },
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            posts: true,
          },
        },
      },
      orderBy: [
        { isVerified: 'desc' },
        { followers: { _count: 'desc' } },
      ],
      take: 20,
    });

    // If no suggested users found, fetch recent users instead
    if (suggestedUsers.length === 0) {
      suggestedUsers = await prisma.user.findMany({
        where: {
          id: {
            notIn: excludeUserIds.length > 0 ? excludeUserIds : undefined,
          },
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });
    }

    return NextResponse.json({
      users: suggestedUsers.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified,
      })),
    });
  } catch (error) {
    console.error('Fetch suggested users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggested users' },
      { status: 500 }
    );
  }
}
