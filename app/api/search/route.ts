import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, posts, actresses, users

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        posts: [],
        actresses: [],
        users: [],
        categories: [],
        tags: [],
      });
    }

    const searchQuery = query.trim().toLowerCase();

    // Search results object
    const results: any = {
      posts: [],
      actresses: [],
      users: [],
      categories: [],
      tags: [],
    };

    // Search Posts
    if (type === 'all' || type === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { has: searchQuery } },
            { categories: { has: searchQuery } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          imageUrls: true,
          categories: true,
          tags: true,
          views: true,
          isVip: true,
          createdAt: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });
    }

    // Search Actresses
    if (type === 'all' || type === 'actresses') {
      results.actresses = await prisma.actress.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { bio: { contains: searchQuery, mode: 'insensitive' } },
            { nationality: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          nationality: true,
          bio: true,
        },
        orderBy: {
          name: 'asc',
        },
        take: 20,
      });
    }

    // User search disabled
    // if (type === 'all' || type === 'users') {
    //   results.users = await prisma.user.findMany({
    //     where: {
    //       OR: [
    //         { username: { contains: searchQuery, mode: 'insensitive' } },
    //         { name: { contains: searchQuery, mode: 'insensitive' } },
    //       ],
    //     },
    //     select: {
    //       id: true,
    //       username: true,
    //       name: true,
    //       avatar: true,
    //       isVerified: true,
    //       isVip: true,
    //     },
    //     orderBy: {
    //       username: 'asc',
    //     },
    //     take: 20,
    //   });
    // }

    // Search Categories (unique from posts)
    if (type === 'all' || type === 'categories') {
      const posts = await prisma.post.findMany({
        where: {
          published: true,
          categories: {
            hasSome: [searchQuery],
          },
        },
        select: {
          categories: true,
        },
        take: 100,
      });

      // Get unique categories that match the search
      const allCategories = posts.flatMap(p => p.categories);
      const uniqueCategories = [...new Set(allCategories)];
      results.categories = uniqueCategories
        .filter(cat => cat.toLowerCase().includes(searchQuery))
        .slice(0, 10);
    }

    // Search Tags (unique from posts)
    if (type === 'all' || type === 'tags') {
      const posts = await prisma.post.findMany({
        where: {
          published: true,
          tags: {
            hasSome: [searchQuery],
          },
        },
        select: {
          tags: true,
        },
        take: 100,
      });

      // Get unique tags that match the search
      const allTags = posts.flatMap(p => p.tags);
      const uniqueTags = [...new Set(allTags)];
      results.tags = uniqueTags
        .filter(tag => tag.toLowerCase().includes(searchQuery))
        .slice(0, 10);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
