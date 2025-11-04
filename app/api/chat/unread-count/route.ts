import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Count pending chat requests
    const requestCount = await prisma.chatRequest.count({
      where: {
        receiverId: user.id,
        status: 'PENDING',
      },
    });

    // Count unread messages in user's chats
    const unreadMessagesCount = await prisma.message.count({
      where: {
        read: false,
        senderId: {
          not: user.id, // Only count messages from others
        },
        chat: {
          members: {
            some: {
              id: user.id, // User is a member of the chat
            },
          },
        },
      },
    });

    // Total unread count = pending requests + unread messages
    const count = requestCount + unreadMessagesCount;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Get unread chat count error:', error);
    return NextResponse.json(
      { error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
}
