import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { cached } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'hot';
    const filter = searchParams.get('filter'); // vip, free, views, likes
    const category = searchParams.get('category');
    const actressId = searchParams.get('actressId');
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '30');
    const limit = Math.min(limitParam, 50); // Max 50 posts per page
    const skip = (page - 1) * limit;

    // Create cache key from query params
    const cacheKey = `posts:${sort}:${filter}:${category}:${actressId}:${page}:${limit}`;

    // Build where clause
    const where: any = {
      published: true,
      // Ensure scheduled posts only appear after their scheduled time
      OR: [
        { scheduledFor: null }, // Posts without schedule
        { scheduledFor: { lte: new Date() } }, // Scheduled posts whose time has passed
      ],
    };

    // Note: All users can see VIP posts in the list (with VIP badge)
    // Access control happens when clicking/viewing the post detail page

    // Add VIP/Free filter
    if (filter === 'vip') {
      where.isVip = true;
    } else if (filter === 'free') {
      where.isVip = false;
    }

    // Add category filter if specified (categories is an array in the schema)
    if (category) {
      where.categories = {
        has: category,
      };
    }

    // Add actress filter if specified (actressIds is an array in the schema)
    if (actressId) {
      where.actressIds = {
        has: actressId,
      };
    }

    // Determine ordering based on filter or sort type
    let orderBy: any;

    // Filter-based sorting takes priority
    if (filter === 'views') {
      // Sort by most views
      orderBy = {
        views: 'desc',
      };
    } else if (filter === 'likes') {
      // Sort by most likes
      orderBy = {
        likes: {
          _count: 'desc',
        },
      };
    } else if (sort === 'hot' || sort === 'trending') {
      // Hot/Trending: Most likes
      orderBy = {
        likes: {
          _count: 'desc',
        },
      };
    } else if (sort === 'popular') {
      // Popular: Most likes all time
      orderBy = {
        likes: {
          _count: 'desc',
        },
      };
    } else {
      // Latest: Most recent
      orderBy = {
        createdAt: 'desc',
      };
    }

    // Fetch posts with caching (5 minute TTL)
    const result = await cached(
      cacheKey,
      async () => {
        // Fetch published posts with author info
        const posts = await prisma.post.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            imageUrls: true,
            videoUrls: true,
            categories: true,
            tags: true,
            views: true,
            createdAt: true,
            isVip: true,
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isVerified: true,
                isVip: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy,
          take: limit,
          skip,
        });

        // Get total count for pagination
        const totalPosts = await prisma.post.count({
          where,
        });

        const totalPages = Math.ceil(totalPosts / limit);

        return {
          posts,
          pagination: {
            currentPage: page,
            totalPages,
            totalPosts,
            hasMore: page < totalPages,
          },
        };
      },
      300 // Cache for 5 minutes
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Failed to get posts' },
      { status: 500 }
    );
  }
}
