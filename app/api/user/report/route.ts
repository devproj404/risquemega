import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reportSchema = z.object({
  userId: z.string(),
  reason: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, reason } = validation.data;

    // Check if user exists
    const reportedUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!reportedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In a real app, you would save this to a reports table
    // For now, we'll just log it
    console.log(`User ${currentUser.username} reported user ${reportedUser.username}: ${reason}`);

    // TODO: Store report in database
    // await prisma.report.create({
    //   data: {
    //     reporterId: currentUser.id,
    //     reportedUserId: userId,
    //     reason,
    //     type: 'USER',
    //   },
    // });

    return NextResponse.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Report user error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
