import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { invalidatePattern } from '@/lib/cache';

const updatePostSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable().or(z.literal('')),
  imageUrls: z.array(z.string().url()).max(50).optional(),
  videoUrls: z.array(z.string().url()).max(50).optional(),
  categories: z.array(z.string()).max(10).optional(),
  actressIds: z.array(z.string()).max(20).optional(),
  tags: z.array(z.string()).max(20).optional(),
  published: z.boolean().optional(),
  isVip: z.boolean().optional(),
  sourceUrl: z.string().url().optional().nullable().or(z.literal('')),
});

// GET single post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            isVerified: true,
            isBanned: true,
          },
        },
        _count: {
          select: {
            likes: true,
            saves: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Fetch post error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH update post
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const post = await prisma.post.update({
      where: { id },
      data: validation.data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'POST_UPDATE',
        entityType: 'Post',
        entityId: post.id,
        userId: admin.id,
        username: admin.username,
        details: {
          postTitle: post.title,
          changes: validation.data,
        },
      },
    });

    // Invalidate posts cache
    invalidatePattern('^posts:');

    return NextResponse.json({
      message: 'Post updated successfully',
      post,
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        authorId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'POST_DELETE',
        entityType: 'Post',
        entityId: post.id,
        userId: admin.id,
        username: admin.username,
        details: {
          postTitle: post.title,
          authorId: post.authorId,
        },
      },
    });

    // Invalidate posts cache
    invalidatePattern('^posts:');

    return NextResponse.json({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
