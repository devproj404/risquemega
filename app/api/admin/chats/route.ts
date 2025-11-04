import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the support user
    const supportUser = await prisma.user.findFirst({
      where: { email: 'support@leakybabes.com' },
    });

    if (!supportUser) {
      return NextResponse.json({ chats: [] });
    }

    // Get all chats involving the support user
    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: { id: supportUser.id },
        },
        isAccepted: true,
      },
      include: {
        members: {
          where: {
            id: { not: supportUser.id },
          },
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Fetch admin chats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
