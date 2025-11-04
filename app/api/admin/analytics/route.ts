import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get total posts count
    const totalPosts = await prisma.post.count();

    // Get total payments and revenue
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        amount: true,
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPayments = payments.length;

    // Get pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get user growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get post growth (last 30 days)
    const newPosts = await prisma.post.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get banned users count
    const bannedUsers = await prisma.user.count({
      where: {
        isBanned: true,
      },
    });

    // Get verified users count
    const verifiedUsers = await prisma.user.count({
      where: {
        isVerified: true,
      },
    });

    // Get posts by category
    const allPosts = await prisma.post.findMany({
      select: {
        categories: true,
      },
    });

    // Count posts by category (since categories is now an array)
    const categoryCounts = new Map<string, number>();
    allPosts.forEach((post) => {
      post.categories.forEach((category) => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
    });

    const postsByCategory = Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      _count: { id: count },
    }));

    // Get recent activity logs (last 10)
    const recentActivity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get daily revenue (last 30 days)
    const thirtyDaysAgoForRevenue = new Date();
    thirtyDaysAgoForRevenue.setDate(thirtyDaysAgoForRevenue.getDate() - 30);

    const dailyPayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: thirtyDaysAgoForRevenue,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group payments by date
    const revenueByDate = new Map<string, number>();

    // Initialize all dates with 0 revenue
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueByDate.set(dateStr, 0);
    }

    // Sum up revenue for each date
    dailyPayments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      const current = revenueByDate.get(dateStr) || 0;
      revenueByDate.set(dateStr, current + payment.amount);
    });

    // Convert to array format for chart
    const dailyRevenue = Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
    }));

    return NextResponse.json({
      overview: {
        totalUsers,
        totalPosts,
        totalRevenue,
        totalPayments,
        pendingPayments,
        newUsers,
        newPosts,
        bannedUsers,
        verifiedUsers,
      },
      postsByCategory: postsByCategory.map((item) => ({
        category: item.category,
        count: item._count.id,
      })),
      recentActivity,
      dailyRevenue,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
