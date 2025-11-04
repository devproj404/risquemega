import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all saves with post data
    const saves = await prisma.save.findMany({
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

    // Extract posts from saves
    const posts = saves.map((save) => save.post);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved posts' },
      { status: 500 }
    );
  }
}
