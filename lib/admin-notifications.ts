import { prisma } from './prisma';
import { AdminNotificationType } from '@prisma/client';

interface CreateAdminNotificationParams {
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
  adminId?: string | null; // null = broadcast to all admins
  metadata?: any;
}

/**
 * Create an admin notification
 * If adminId is null, it will be a global notification visible to all admins
 */
export async function createAdminNotification({
  type,
  title,
  message,
  link,
  adminId = null,
  metadata,
}: CreateAdminNotificationParams) {
  try {
    const notification = await prisma.adminNotification.create({
      data: {
        type,
        title,
        message,
        link,
        adminId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create admin notification:', error);
    throw error;
  }
}

/**
 * Create notification for new payment
 */
export async function notifyPaymentCreated(paymentId: string, userId: string, amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true },
    });

    await createAdminNotification({
      type: 'PAYMENT_CREATED',
      title: 'New Payment Created',
      message: `${user?.username || 'User'} initiated a payment of $${amount.toFixed(2)}`,
      link: `/admin/dashboard/payments?id=${paymentId}`,
      metadata: {
        paymentId,
        userId,
        amount,
        username: user?.username,
      },
    });
  } catch (error) {
    console.error('Failed to create payment notification:', error);
  }
}

/**
 * Create notification for completed payment
 */
export async function notifyPaymentCompleted(paymentId: string, userId: string, amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true },
    });

    await createAdminNotification({
      type: 'PAYMENT_COMPLETED',
      title: 'Payment Completed',
      message: `${user?.username || 'User'} completed payment of $${amount.toFixed(2)}`,
      link: `/admin/dashboard/payments?id=${paymentId}`,
      metadata: {
        paymentId,
        userId,
        amount,
        username: user?.username,
      },
    });
  } catch (error) {
    console.error('Failed to create payment completion notification:', error);
  }
}

/**
 * Create notification for failed payment
 */
export async function notifyPaymentFailed(paymentId: string, userId: string, amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true },
    });

    await createAdminNotification({
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Payment of $${amount.toFixed(2)} by ${user?.username || 'User'} failed`,
      link: `/admin/dashboard/payments?id=${paymentId}`,
      metadata: {
        paymentId,
        userId,
        amount,
        username: user?.username,
      },
    });
  } catch (error) {
    console.error('Failed to create payment failure notification:', error);
  }
}
