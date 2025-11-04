import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createOrGetChat } from '@/lib/chat';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Can't chat with yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot chat with yourself' },
        { status: 400 }
      );
    }

    // Create or get existing chat
    const chat = await createOrGetChat(user.id, userId);

    if (!chat) {
      return NextResponse.json(
        { error: 'Failed to create chat' },
        { status: 500 }
      );
    }

    return NextResponse.json({ chatId: chat.id });
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
