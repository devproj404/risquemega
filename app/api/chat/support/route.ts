import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find or create support user
    let supportUser = await prisma.user.findFirst({
      where: { email: 'support@leakybabes.com' },
    });

    if (!supportUser) {
      // Create support user if it doesn't exist
      supportUser = await prisma.user.create({
        data: {
          email: 'support@leakybabes.com',
          username: 'Support',
          name: 'Customer Support',
          password: 'not-used',
          isVerified: true,
        },
      });
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { members: { some: { id: currentUser.id } } },
          { members: { some: { id: supportUser.id } } },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat.id });
    }

    // Create new support chat
    const newChat = await prisma.chat.create({
      data: {
        isAccepted: true, // Support chats are auto-accepted
        members: {
          connect: [{ id: currentUser.id }, { id: supportUser.id }],
        },
      },
    });

    // Send welcome message
    await prisma.message.create({
      data: {
        chatId: newChat.id,
        senderId: supportUser.id,
        content: 'Hello! How can we help you today?',
      },
    });

    // Update last message info
    await prisma.chat.update({
      where: { id: newChat.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: 'Hello! How can we help you today?',
      },
    });

    return NextResponse.json({ chatId: newChat.id });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json(
      { error: 'Failed to create support chat' },
      { status: 500 }
    );
  }
}
