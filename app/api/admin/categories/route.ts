import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export async function GET(request: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [categories, total, allPosts] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.category.count(),
      prisma.post.findMany({
        select: {
          categories: true,
        },
      }),
    ]);

    // Count posts for each category (since categories is now an array in posts)
    const categoryCounts = new Map<string, number>();
    allPosts.forEach((post) => {
      post.categories.forEach((category) => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
    });

    // Add post count to each category
    const categoriesWithCount = categories.map((category) => ({
      ...category,
      _count: {
        posts: categoryCounts.get(category.name) || 0,
      },
    }));

    return NextResponse.json({
      categories: categoriesWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, slug, description, imageUrl } = validation.data;

    // Check if category with same name or slug already exists
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'POST_CREATE',
        userId: admin.id,
        username: admin.username,
        entityType: 'category',
        entityId: category.id,
        details: {
          categoryName: name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category API error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
