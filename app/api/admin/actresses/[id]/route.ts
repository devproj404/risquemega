import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateActressSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  bio: z.string().optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  nationality: z.string().optional().nullable(),
});

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
    const validation = updateActressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If updating name or slug, check for conflicts
    if (data.name || data.slug) {
      const existing = await prisma.actress.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.slug ? [{ slug: data.slug }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Actress with this name or slug already exists' },
          { status: 400 }
        );
      }
    }

    const actress = await prisma.actress.update({
      where: { id },
      data,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'POST_UPDATE',
        userId: admin.id,
        username: admin.username,
        entityType: 'actress',
        entityId: actress.id,
        details: {
          actressName: actress.name,
          updates: data,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: 'Actress updated successfully',
      actress,
    });
  } catch (error) {
    console.error('Update actress API error:', error);
    return NextResponse.json(
      { error: 'Failed to update actress' },
      { status: 500 }
    );
  }
}

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

    const actress = await prisma.actress.findUnique({
      where: { id },
    });

    if (!actress) {
      return NextResponse.json(
        { error: 'Actress not found' },
        { status: 404 }
      );
    }

    await prisma.actress.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'POST_DELETE',
        userId: admin.id,
        username: admin.username,
        entityType: 'actress',
        entityId: id,
        details: {
          actressName: actress.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: 'Actress deleted successfully',
    });
  } catch (error) {
    console.error('Delete actress API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete actress' },
      { status: 500 }
    );
  }
}
