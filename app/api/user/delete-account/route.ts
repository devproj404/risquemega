import { NextResponse } from 'next/server';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Delete user (this will cascade delete sessions and posts due to Prisma schema)
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
