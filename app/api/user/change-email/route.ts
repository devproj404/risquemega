import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const changeEmailSchema = z.object({
  newEmail: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = changeEmailSchema.parse(body);

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.newEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Update email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: validatedData.newEmail,
        isVerified: false, // Reset verification status
      },
    });

    return NextResponse.json({
      message: 'Email changed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Change email error:', error);
    return NextResponse.json(
      { error: 'Failed to change email' },
      { status: 500 }
    );
  }
}
