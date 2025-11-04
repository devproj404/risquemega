import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Create share record
    await prisma.share.create({
      data: {
        userId: user.id,
        postId,
      },
    });

    // Get total share count
    const shareCount = await prisma.share.count({
      where: { postId },
    });

    return NextResponse.json({ success: true, shareCount });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to share' },
      { status: 500 }
    );
  }
}

// Get share count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const shareCount = await prisma.share.count({
      where: { postId },
    });

    return NextResponse.json({ shareCount });
  } catch (error) {
    console.error('Error getting share count:', error);
    return NextResponse.json({ shareCount: 0 });
  }
}
