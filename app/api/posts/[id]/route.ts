import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    // Get current user to check VIP status
    const currentUser = await getCurrentUser();
    const isUserVip = currentUser?.isVip || false;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
            isVip: true,
          },
        },
        _count: {
          select: {
            likes: true,
            saves: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Allow everyone to view posts (VIP status is checked on frontend for Access button)
    // Non-VIP users can see blurred previews of VIP content
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
