import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const hideSchema = z.object({
  userId: z.string(),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validation = hideSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // Check if user exists
    const hiddenUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!hiddenUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In a real app, you would save this to a hidden_users table
    // For now, we'll just log it and return success
    console.log(`User ${currentUser.username} hid user ${hiddenUser.username}`);

    // TODO: Store hidden user relationship in database
    // await prisma.hiddenUser.create({
    //   data: {
    //     userId: currentUser.id,
    //     hiddenUserId: userId,
    //   },
    // });

    return NextResponse.json({ message: 'User hidden successfully' });
  } catch (error) {
    console.error('Hide user error:', error);
    return NextResponse.json({ error: 'Failed to hide user' }, { status: 500 });
  }
}
