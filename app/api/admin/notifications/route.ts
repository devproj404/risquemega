import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Get admin notifications
 */
export async function GET(request: Request) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {};

    // Admin can see their own notifications or global notifications (adminId = null)
    where.OR = [
      { adminId: admin.id },
      { adminId: null }, // Global notifications
    ];

    if (unreadOnly) {
      where.read = false;
    }

    // Fetch notifications
    const notifications = await prisma.adminNotification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Count unread notifications
    const unreadCount = await prisma.adminNotification.count({
      where: {
        OR: [
          { adminId: admin.id },
          { adminId: null },
        ],
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Fetch admin notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * Mark notification as read
 */
export async function PATCH(request: Request) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.adminNotification.updateMany({
        where: {
          OR: [
            { adminId: admin.id },
            { adminId: null },
          ],
          read: false,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({
        message: 'All notifications marked as read'
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    // Mark specific notification as read
    const notification = await prisma.adminNotification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
