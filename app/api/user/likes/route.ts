import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all likes with post data
    const likes = await prisma.like.findMany({
      where: { userId: user.id },
      include: {
        post: {
          include: {
            _count: {
              select: {
                likes: true,
                saves: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract posts from likes
    const posts = likes.map((like) => like.post);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked posts' },
      { status: 500 }
    );
  }
}
