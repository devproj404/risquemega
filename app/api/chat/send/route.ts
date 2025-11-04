import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendMessage } from '@/lib/chat';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, content } = body;

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'Chat ID and content required' },
        { status: 400 }
      );
    }

    const message = await sendMessage(chatId, user.id, content);

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
