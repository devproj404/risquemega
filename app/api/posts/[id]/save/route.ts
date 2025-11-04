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

    // Check if already saved
    const existingSave = await prisma.save.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingSave) {
      // Unsave - remove the save
      await prisma.save.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId,
          },
        },
      });

      return NextResponse.json({ saved: false, message: 'Unsaved' });
    } else {
      // Save - create new save
      await prisma.save.create({
        data: {
          userId: user.id,
          postId,
        },
      });

      return NextResponse.json({ saved: true, message: 'Saved' });
    }
  } catch (error) {
    console.error('Error toggling save:', error);
    return NextResponse.json(
      { error: 'Failed to toggle save' },
      { status: 500 }
    );
  }
}

// Get save status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ saved: false });
    }

    const { id: postId } = await params;

    const save = await prisma.save.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    return NextResponse.json({ saved: !!save });
  } catch (error) {
    console.error('Error getting save status:', error);
    return NextResponse.json({ saved: false });
  }
}
