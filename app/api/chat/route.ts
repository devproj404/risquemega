import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all accepted chats for the current user
    const chats = await prisma.chat.findMany({
      where: {
        isAccepted: true,
        members: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        members: {
          where: {
            id: {
              not: user.id, // Get the other member(s)
            },
          },
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc', // Order by last message time
      },
    });

    const formattedChats = chats.map(chat => ({
      id: chat.id,
      members: chat.members,
      lastMessage: chat.lastMessageText ? {
        content: chat.lastMessageText,
        createdAt: chat.lastMessageAt?.toISOString() || chat.updatedAt.toISOString(),
        senderId: '', // We don't track senderId in the denormalized fields
      } : null,
      updatedAt: chat.updatedAt.toISOString(),
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Failed to get chats' },
      { status: 500 }
    );
  }
}
