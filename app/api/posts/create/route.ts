import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable().or(z.literal('')),
  imageUrls: z.array(z.string().url()).max(50).default([]),
  videoUrls: z.array(z.string().url()).max(50).default([]),
  categories: z.array(z.string()).min(1, 'At least one category is required').max(10),
  actressIds: z.array(z.string()).max(20).default([]),
  tags: z.array(z.string()).max(20).default([]),
  isVip: z.boolean().default(false),
  sourceUrl: z.string().url().optional().nullable().or(z.literal('')),
  scheduledFor: z.string().datetime().optional().nullable(),
  published: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    // Only admins can create posts
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { title, description, thumbnailUrl, imageUrls, videoUrls, categories, actressIds, tags, isVip, sourceUrl, scheduledFor, published } = validation.data;

    // Validate that at least one media URL is provided
    if (imageUrls.length === 0 && videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one image or video URL must be provided' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future if provided
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
    }

    // Normalize tags (lowercase, trim, remove duplicates)
    const normalizedTags = [...new Set(
      tags.map(tag => tag.toLowerCase().trim()).filter(tag => tag.length > 0)
    )];

    // Find or create system user for posts
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@leakybabes.com' },
    });

    if (!systemUser) {
      // Create system user if it doesn't exist
      systemUser = await prisma.user.create({
        data: {
          email: 'system@leakybabes.com',
          username: 'LeakyBabes',
          name: 'Leaky Babes Official',
          password: 'not-used', // Won't be used for login
          isVerified: true,
        },
      });
    }

    // Create post with system user as author
    const post = await prisma.post.create({
      data: {
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        imageUrls,
        videoUrls,
        categories,
        actressIds,
        tags: normalizedTags,
        published,
        isVip,
        sourceUrl: sourceUrl || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        authorId: systemUser.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
