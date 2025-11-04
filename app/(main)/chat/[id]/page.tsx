import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatConversation } from '@/components/chat-conversation';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function ChatConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get chat details
  const chat = await prisma.chat.findFirst({
    where: {
      id: params.id,
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
            not: user.id,
          },
        },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      request: true,
    },
  });

  if (!chat) {
    notFound();
  }

  // Get messages
  const messages = await prisma.message.findMany({
    where: { chatId: params.id },
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

  const otherMember = chat.members[0];
  const isAccepted = chat.isAccepted;

  return (
    <ChatConversation
      chatId={chat.id}
      currentUserId={user.id}
      otherMember={otherMember}
      initialMessages={messages}
      isAccepted={isAccepted}
    />
  );
}
