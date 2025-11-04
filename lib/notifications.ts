import { prisma } from './prisma';

export type NotificationType = 'LIKE' | 'SAVE' | 'SHARE' | 'CHAT' | 'COMMENT';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actorId?: string;
}

/**
 * Create a notification for a user (with anti-flood protection)
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  actorId,
}: CreateNotificationParams) {
  try {
    // Don't create notification if actor is the same as the user
    if (actorId && actorId === userId) {
      return null;
    }

    // Anti-flood: Check if similar notification exists from same actor today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        actorId,
        createdAt: {
          gte: today,
        },
      },
    });

    // If notification already exists today from same actor with same type, don't create
    if (existingNotification) {
      return existingNotification;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        actorId,
      },
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

/**
 * Create notification when someone likes a post
 */
export async function notifyPostLike(
  postAuthorId: string,
  actorId: string,
  postId: string,
  postTitle: string
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { username: true },
  });

  if (!actor) return null;

  return createNotification({
    userId: postAuthorId,
    type: 'LIKE',
    title: 'New Like',
    message: `${actor.username} liked your album "${postTitle}"`,
    link: `/post/${postId}`,
    actorId,
  });
}

/**
 * Create notification when someone saves a post
 */
export async function notifyPostSave(
  postAuthorId: string,
  actorId: string,
  postId: string,
  postTitle: string
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { username: true },
  });

  if (!actor) return null;

  return createNotification({
    userId: postAuthorId,
    type: 'SAVE',
    title: 'Album Saved',
    message: `${actor.username} saved your album "${postTitle}"`,
    link: `/post/${postId}`,
    actorId,
  });
}

/**
 * Create notification when someone shares a post
 */
export async function notifyPostShare(
  postAuthorId: string,
  actorId: string,
  postId: string,
  postTitle: string
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { username: true },
  });

  if (!actor) return null;

  return createNotification({
    userId: postAuthorId,
    type: 'SHARE',
    title: 'Album Shared',
    message: `${actor.username} shared your album "${postTitle}"`,
    link: `/post/${postId}`,
    actorId,
  });
}

/**
 * Create notification when someone sends a chat message
 * Anti-flood: Only one notification per sender per day
 */
export async function notifyChatMessage(
  recipientId: string,
  senderId: string,
  chatId: string
) {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { username: true },
  });

  if (!sender) return null;

  // Anti-flood is already handled in createNotification
  // This will only create one CHAT notification per sender per day
  return createNotification({
    userId: recipientId,
    type: 'CHAT',
    title: 'New Message',
    message: `${sender.username} sent you a message`,
    link: `/chat/${chatId}`,
    actorId: senderId,
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return true;
  } catch (error) {
    console.error('Mark all as read error:', error);
    return false;
  }
}
