import { prisma } from './prisma';
import { notifyChatMessage } from './notifications';

/**
 * Create or get existing chat between two users
 * If users haven't chatted before, creates a chat request
 */
export async function createOrGetChat(userId1: string, userId2: string) {
  try {
    // Check if chat already exists between these users
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { members: { some: { id: userId1 } } },
          { members: { some: { id: userId2 } } },
        ],
      },
      include: {
        request: true,
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new chat with request
    const chat = await prisma.chat.create({
      data: {
        members: {
          connect: [{ id: userId1 }, { id: userId2 }],
        },
        request: {
          create: {
            senderId: userId1,
            receiverId: userId2,
          },
        },
      },
      include: {
        request: true,
      },
    });

    return chat;
  } catch (error) {
    console.error('Create or get chat error:', error);
    return null;
  }
}

/**
 * Send a message in a chat
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string
) {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: true,
      },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Check if sender is a member of the chat
    const isMember = chat.members.some(member => member.id === senderId);
    if (!isMember) {
      throw new Error('Not a member of this chat');
    }

    // Check if chat is accepted
    if (!chat.isAccepted) {
      throw new Error('Chat request not accepted yet');
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
    });

    // Update chat's updatedAt and last message info
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        lastMessageText: content.substring(0, 100), // Store first 100 chars
      },
    });

    // Send notification to other member(s)
    const otherMembers = chat.members.filter(member => member.id !== senderId);
    for (const member of otherMembers) {
      await notifyChatMessage(member.id, senderId, chatId);
    }

    return message;
  } catch (error) {
    console.error('Send message error:', error);
    return null;
  }
}

/**
 * Get messages for a chat
 */
export async function getChatMessages(chatId: string, userId: string) {
  try {
    // Verify user is a member of the chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  } catch (error) {
    console.error('Get chat messages error:', error);
    return [];
  }
}

/**
 * Check if user can send messages in a chat
 */
export async function canSendMessage(chatId: string, userId: string) {
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        isAccepted: true,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    return !!chat;
  } catch (error) {
    console.error('Can send message error:', error);
    return false;
  }
}
