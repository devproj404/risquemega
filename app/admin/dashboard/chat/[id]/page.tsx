import { getAdminSession } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { ChatConversation } from '@/components/chat-conversation';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function AdminChatConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect('/admin/login');
  }

  // Find the support user
  const supportUser = await prisma.user.findFirst({
    where: { email: 'support@leakybabes.com' },
  });

  if (!supportUser) {
    notFound();
  }

  // Get chat details
  const chat = await prisma.chat.findFirst({
    where: {
      id: params.id,
      members: {
        some: {
          id: supportUser.id,
        },
      },
    },
    include: {
      members: {
        where: {
          id: {
            not: supportUser.id,
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

  // Convert messages to match expected format
  const formattedMessages = messages.map(msg => ({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
  }));

  const otherMember = chat.members[0];
  const isAccepted = chat.isAccepted;

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatConversation
        chatId={chat.id}
        currentUserId={supportUser.id}
        otherMember={otherMember}
        initialMessages={formattedMessages}
        isAccepted={isAccepted}
        backUrl="/admin/dashboard/chat"
      />
    </div>
  );
}
