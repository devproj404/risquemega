import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidatePattern } from '@/lib/cache';

/**
 * Cron endpoint to publish scheduled posts
 *
 * This endpoint is called periodically (every 5 minutes) by Vercel Cron
 * to check for posts that are scheduled to be published and publish them.
 *
 * Security:
 * - Vercel Cron automatically authenticates with the deployment
 * - Additional CRON_SECRET check for manual testing/backup systems
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security (optional for Vercel Cron, required for manual calls)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check if this is a Vercel Cron request
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');

    // If not from Vercel Cron, require CRON_SECRET
    if (!isVercelCron) {
      if (!cronSecret) {
        console.error('[CRON] CRON_SECRET environment variable is not set');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[CRON] Unauthorized access attempt to publish-scheduled endpoint');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const now = new Date();

    // Find all posts that are scheduled to be published now or in the past
    // and are still unpublished
    const postsToPublish = await prisma.post.findMany({
      where: {
        published: false,
        scheduledFor: {
          lte: now, // Less than or equal to current time
        },
      },
      select: {
        id: true,
        title: true,
        scheduledFor: true,
      },
    });

    if (postsToPublish.length === 0) {
      console.log(`[CRON] No scheduled posts to publish at ${now.toISOString()}`);
      return NextResponse.json({
        message: 'No posts to publish',
        publishedCount: 0,
        timestamp: now.toISOString(),
      });
    }

    // Publish all scheduled posts
    const postIds = postsToPublish.map(p => p.id);

    const updateResult = await prisma.post.updateMany({
      where: {
        id: {
          in: postIds,
        },
      },
      data: {
        published: true,
      },
    });

    // Invalidate posts cache since new posts are now published
    invalidatePattern('^posts:');

    console.log(
      `[CRON] Published ${updateResult.count} scheduled posts:`,
      postsToPublish.map(p => ({
        id: p.id,
        title: p.title,
        scheduledFor: p.scheduledFor,
      }))
    );

    return NextResponse.json({
      message: 'Scheduled posts published successfully',
      publishedCount: updateResult.count,
      posts: postsToPublish.map(p => ({
        id: p.id,
        title: p.title,
        scheduledFor: p.scheduledFor,
      })),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error publishing scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to publish scheduled posts' },
      { status: 500 }
    );
  }
}

// Also support POST method for flexibility
export async function POST(request: Request) {
  return GET(request);
}
