import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [categories, allPosts] = await Promise.all([
      prisma.category.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      }),
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

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
