import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const chatRequest = await prisma.chatRequest.findUnique({
      where: { id: params.id },
    });

    if (!chatRequest || chatRequest.receiverId !== user.id) {
      return NextResponse.json(
        { error: 'Chat request not found' },
        { status: 404 }
      );
    }

    // Update request status to ACCEPTED
    await prisma.chatRequest.update({
      where: { id: params.id },
      data: { status: 'ACCEPTED' },
    });

    // Mark chat as accepted
    await prisma.chat.update({
      where: { id: chatRequest.chatId },
      data: { isAccepted: true },
    });

    return NextResponse.json({ message: 'Chat request accepted' });
  } catch (error) {
    console.error('Accept chat request error:', error);
    return NextResponse.json(
      { error: 'Failed to accept chat request' },
      { status: 500 }
    );
  }
}
