import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    // Even if the user doesn't exist, we return success
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, we sent a password reset link.',
      });
    }

    // TODO: In production, you would:
    // 1. Generate a password reset token
    // 2. Save it to the database with expiration
    // 3. Send an email with the reset link
    // For now, we'll just return success
    // Example: await sendPasswordResetEmail(user.email, resetToken);

    console.log(`Password reset requested for user: ${user.email}`);

    return NextResponse.json({
      message: 'If an account with that email exists, we sent a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
