import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * Get all reports with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    const admin = await getAdminSession(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (type !== 'all') {
      where.type = type;
    }

    // Get reports with post and user info
    const [reports, totalReports] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              imageUrls: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    // Get statistics
    const stats = await prisma.report.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts = {
      pending: 0,
      resolved: 0,
      dismissed: 0,
    };

    stats.forEach((stat) => {
      if (stat.status in statusCounts) {
        statusCounts[stat.status as keyof typeof statusCounts] = stat._count;
      }
    });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        totalReports,
        totalPages: Math.ceil(totalReports / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
