import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get user's most recent pending payment
 * Returns the latest pending payment within the last 24 hours
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the most recent pending payment for this user within last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentPayment = await prisma.payment.findFirst({
      where: {
        userId: currentUser.id,
        status: 'PENDING',
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        createdAt: true,
        metadata: true,
      },
    });

    if (!recentPayment) {
      return NextResponse.json({ payment: null });
    }

    // Check if payment is expired (based on metadata)
    const metadata = recentPayment.metadata as any;
    if (metadata?.expiredAt) {
      const now = Math.floor(Date.now() / 1000);
      if (now > metadata.expiredAt) {
        // Payment expired, don't return it
        return NextResponse.json({ payment: null });
      }
    }

    return NextResponse.json({
      payment: {
        id: recentPayment.id,
        amount: recentPayment.amount,
        currency: recentPayment.currency,
        createdAt: recentPayment.createdAt,
        payCurrency: metadata?.payCurrency || 'USDT',
      },
    });
  } catch (error) {
    console.error('Failed to fetch recent payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent payment' },
      { status: 500 }
    );
  }
}
