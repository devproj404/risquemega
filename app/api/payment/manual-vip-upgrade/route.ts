import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * MANUAL VIP UPGRADE ENDPOINT
 * This endpoint allows admins to manually upgrade users to VIP
 * Use this for:
 * - Testing the upgrade logic
 * - Manually upgrading users whose payments succeeded but webhook failed
 * - Emergency VIP grants
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow admins to use this endpoint
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, paymentId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   MANUAL VIP UPGRADE                                 ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('Admin:', admin.username);
    console.log('User ID:', userId);
    console.log('Payment ID:', paymentId || 'N/A');
    console.log('Reason:', reason || 'Manual upgrade');
    console.log('═'.repeat(56));

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        isVip: true,
        vipUntil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isVip) {
      return NextResponse.json(
        {
          message: 'User is already VIP',
          user: {
            username: user.username,
            email: user.email,
            isVip: user.isVip,
            vipUntil: user.vipUntil,
          }
        },
        { status: 200 }
      );
    }

    // Upgrade user to VIP
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVip: true,
        vipUntil: null, // Lifetime VIP
      },
    });

    // Update payment status if provided
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          metadata: {
            manualUpgrade: true,
            upgradedBy: admin.username,
            upgradedAt: new Date().toISOString(),
            reason: reason || 'Manual upgrade by admin',
          },
        },
      });
    }

    // Log the manual upgrade
    await prisma.activityLog.create({
      data: {
        action: 'MANUAL_VIP_UPGRADE',
        entityType: 'User',
        entityId: userId,
        userId: admin.id,
        username: admin.username,
        details: {
          targetUser: user.username,
          targetEmail: user.email,
          paymentId: paymentId || null,
          reason: reason || 'Manual upgrade',
        },
      },
    });

    console.log('\n✅ VIP UPGRADE SUCCESSFUL');
    console.log('User:', user.username, `(${user.email})`);
    console.log('Upgraded by:', admin.username);
    console.log('Payment ID:', paymentId || 'N/A');
    console.log('═'.repeat(56) + '\n');

    return NextResponse.json({
      success: true,
      message: 'User upgraded to VIP successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isVip: updatedUser.isVip,
        vipUntil: updatedUser.vipUntil,
      },
    });
  } catch (error) {
    console.error('Manual VIP upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade user to VIP' },
      { status: 500 }
    );
  }
}

/**
 * GET - List all users with pending VIP payments
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Find all pending VIP payments with non-VIP users
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        metadata: {
          path: ['paymentType'],
          equals: 'VIP_UPGRADE',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            isVip: true,
            vipUntil: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usersNeedingUpgrade = pendingPayments
      .filter(payment => !payment.user.isVip)
      .map(payment => ({
        paymentId: payment.id,
        userId: payment.user.id,
        username: payment.user.username,
        email: payment.user.email,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
        transactionId: payment.transactionId,
        metadata: payment.metadata,
      }));

    return NextResponse.json({
      count: usersNeedingUpgrade.length,
      payments: usersNeedingUpgrade,
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}
