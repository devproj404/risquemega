import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * TEST ONLY - Instantly upgrade user to VIP without payment
 * Remove this endpoint in production
 */
export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is already VIP
    if (currentUser.isVip) {
      return NextResponse.json(
        { error: 'You are already a VIP member' },
        { status: 400 }
      );
    }

    // Instantly upgrade to VIP
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        isVip: true,
        vipUntil: null, // null means lifetime
      },
    });

    // Create a test payment record
    await prisma.payment.create({
      data: {
        userId: currentUser.id,
        amount: 0,
        currency: 'USD',
        status: 'COMPLETED',
        paymentMethod: 'test',
        description: 'VIP Membership - TEST MODE',
        metadata: {
          userEmail: currentUser.email,
          username: currentUser.username,
          paymentType: 'VIP_UPGRADE',
          testMode: true,
        },
      },
    });

    // Log the VIP upgrade
    await prisma.activityLog.create({
      data: {
        action: 'PAYMENT_COMPLETE',
        entityType: 'VIPUpgrade',
        entityId: currentUser.id,
        userId: currentUser.id,
        username: currentUser.username,
        details: {
          amount: 0,
          currency: 'USD',
          testMode: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'VIP activated successfully (TEST MODE)',
      user: {
        id: currentUser.id,
        isVip: true,
      },
    });
  } catch (error) {
    console.error('Test VIP upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade to VIP' },
      { status: 500 }
    );
  }
}
