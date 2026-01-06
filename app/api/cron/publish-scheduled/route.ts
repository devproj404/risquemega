import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidatePattern } from '@/lib/cache';

/**
 * Cron endpoint to publish scheduled posts
 *
 * This endpoint is called periodically (every 5 minutes) by Vercel Cron
 * to check for posts that are scheduled to be published and publish them.
 *
 * Vercel Hobby Plan Limits:
 * - 1 cron job allowed (we use this one)
 * - Max execution time: 10 seconds (Hobby) / 60 seconds (Pro)
 * - Runs every 5 minutes
 *
 * Security:
 * - Vercel Cron automatically authenticates with the deployment
 * - Additional CRON_SECRET check for manual testing/backup systems
 * - Checks for 'x-vercel-cron' header (Vercel's official header)
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security (optional for Vercel Cron, required for manual calls)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check if this is a Vercel Cron request (official header)
    const isVercelCron = request.headers.get('x-vercel-cron') === '1' ||
                        request.headers.get('user-agent')?.includes('vercel-cron');

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

    console.log(`[CRON] Started publish-scheduled job at ${new Date().toISOString()}`);
    console.log(`[CRON] Request source: ${isVercelCron ? 'Vercel Cron' : 'Manual'}`);


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
      const duration = Date.now() - startTime;
      console.log(`[CRON] No scheduled posts to publish at ${now.toISOString()} (${duration}ms)`);
      return NextResponse.json({
        success: true,
        message: 'No posts to publish',
        publishedCount: 0,
        timestamp: now.toISOString(),
        duration,
      });
    }

    console.log(`[CRON] Found ${postsToPublish.length} posts to publish`);

    // Batch process posts to avoid timeout (max 50 at a time for safety)
    const BATCH_SIZE = 50;
    const postIds = postsToPublish.map(p => p.id);
    let totalPublished = 0;
    const errors: any[] = [];

    for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
      const batch = postIds.slice(i, i + BATCH_SIZE);

      try {
        const updateResult = await prisma.post.updateMany({
          where: {
            id: {
              in: batch,
            },
          },
          data: {
            published: true,
          },
        });

        totalPublished += updateResult.count;
        console.log(`[CRON] Batch ${Math.floor(i / BATCH_SIZE) + 1}: Published ${updateResult.count} posts`);
      } catch (batchError) {
        console.error(`[CRON] Error publishing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batchError);
        errors.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: batchError instanceof Error ? batchError.message : 'Unknown error',
        });
      }
    }

    // Invalidate posts cache since new posts are now published
    try {
      invalidatePattern('^posts:');
      console.log('[CRON] Cache invalidated successfully');
    } catch (cacheError) {
      console.error('[CRON] Failed to invalidate cache:', cacheError);
      // Non-critical error, continue
    }

    const duration = Date.now() - startTime;
    const successRate = (totalPublished / postsToPublish.length * 100).toFixed(1);

    console.log(
      `[CRON] Published ${totalPublished}/${postsToPublish.length} scheduled posts (${successRate}%) in ${duration}ms:`,
      postsToPublish.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        scheduledFor: p.scheduledFor,
      }))
    );

    if (postsToPublish.length > 10) {
      console.log(`[CRON] ... and ${postsToPublish.length - 10} more posts`);
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? 'Scheduled posts published successfully'
        : `Published ${totalPublished}/${postsToPublish.length} posts with ${errors.length} errors`,
      publishedCount: totalPublished,
      totalFound: postsToPublish.length,
      successRate: `${successRate}%`,
      duration,
      errors: errors.length > 0 ? errors : undefined,
      posts: postsToPublish.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        scheduledFor: p.scheduledFor,
      })),
      hasMore: postsToPublish.length > 10,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Fatal error publishing scheduled posts:', error);
    console.error('[CRON] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish scheduled posts',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST method for flexibility
export async function POST(request: Request) {
  return GET(request);
}
