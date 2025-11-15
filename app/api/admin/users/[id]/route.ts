import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  isVerified: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  isVip: z.boolean().optional(),
  vipUntil: z.string().optional().nullable(),
});

// GET single user
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        website: true,
        isVerified: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            likes: true,
            saves: true,
            payments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Fetch user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH update user
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
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (validation.data.isVerified !== undefined) {
      updateData.isVerified = validation.data.isVerified;
    }
    if (validation.data.isBanned !== undefined) {
      updateData.isBanned = validation.data.isBanned;
    }
    if (validation.data.isVip !== undefined) {
      updateData.isVip = validation.data.isVip;
      // VIP is lifetime, set vipUntil to null
      updateData.vipUntil = null;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        isBanned: true,
        isVip: true,
        vipUntil: true,
      },
    });

    // Log activity
    if (validation.data.isBanned !== undefined) {
      await prisma.activityLog.create({
        data: {
          action: validation.data.isBanned ? 'USER_BAN' : 'USER_UNBAN',
          entityType: 'User',
          entityId: user.id,
          userId: admin.id,
          username: admin.username,
          details: {
            targetUser: user.username,
            targetEmail: user.email,
          },
        },
      });
    }

    if (validation.data.isVerified !== undefined) {
      await prisma.activityLog.create({
        data: {
          action: 'USER_UPDATE',
          entityType: 'User',
          entityId: user.id,
          userId: admin.id,
          username: admin.username,
          details: {
            targetUser: user.username,
            changes: { isVerified: validation.data.isVerified },
          },
        },
      });
    }

    if (validation.data.isVip !== undefined) {
      await prisma.activityLog.create({
        data: {
          action: validation.data.isVip ? 'USER_VIP_GRANT' : 'USER_VIP_REVOKE',
          entityType: 'User',
          entityId: user.id,
          userId: admin.id,
          username: admin.username,
          details: {
            targetUser: user.username,
            targetEmail: user.email,
            lifetime: true,
          },
        },
      });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete users
    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_DELETE',
        entityType: 'User',
        entityId: user.id,
        userId: admin.id,
        username: admin.username,
        details: {
          deletedUser: user.username,
          deletedEmail: user.email,
        },
      },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
