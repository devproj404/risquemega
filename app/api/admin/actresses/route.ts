import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createActressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  bio: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  nationality: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { nationality: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [actresses, total] = await Promise.all([
      prisma.actress.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.actress.count({ where }),
    ]);

    return NextResponse.json({
      actresses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin actresses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actresses' },
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
    const validation = createActressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, slug, bio, imageUrl, nationality } = validation.data;

    // Check if actress with same name or slug already exists
    const existing = await prisma.actress.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Actress with this name or slug already exists' },
        { status: 400 }
      );
    }

    const actress = await prisma.actress.create({
      data: {
        name,
        slug,
        bio,
        imageUrl,
        nationality,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'POST_CREATE',
        userId: admin.id,
        username: admin.username,
        entityType: 'actress',
        entityId: actress.id,
        details: {
          actressName: name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: 'Actress created successfully',
      actress,
    });
  } catch (error) {
    console.error('Create actress API error:', error);
    return NextResponse.json(
      { error: 'Failed to create actress' },
      { status: 500 }
    );
  }
}
