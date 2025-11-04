import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { oxapay } from '@/lib/oxapay';
import { notifyPaymentCompleted, notifyPaymentFailed } from '@/lib/admin-notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate callback data
    if (!body.trackId || !body.orderId || !body.status) {
      return NextResponse.json(
        { error: 'Invalid callback data' },
        { status: 400 }
      );
    }

    const {
      trackId,
      orderId,
      status,
      amount,
      currency,
      payAmount,
      payCurrency,
      network,
      address,
      txID,
      date,
    } = body;

    // Find payment by orderId
    const payment = await prisma.payment.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      console.error('Payment not found:', orderId);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify trackId matches
    if (payment.transactionId !== trackId.toString()) {
      console.error('TrackId mismatch:', { expected: payment.transactionId, received: trackId });
      return NextResponse.json(
        { error: 'Invalid trackId' },
        { status: 400 }
      );
    }

    // Get payment status
    const paymentStatus = oxapay.getPaymentStatus(status);

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: orderId },
      data: {
        status: paymentStatus,
        metadata: {
          ...payment.metadata,
          trackId,
          oxapayStatus: status,
          payAmount,
          payCurrency,
          network,
          address,
          txID,
          confirmedAt: status === 'Paid' ? date : null,
        },
      },
    });

    // Log payment status change
    const logAction = paymentStatus === 'COMPLETED' ? 'PAYMENT_COMPLETE'
                    : paymentStatus === 'FAILED' ? 'PAYMENT_FAIL'
                    : 'PAYMENT_CREATE';

    await prisma.activityLog.create({
      data: {
        action: logAction,
        entityType: 'Payment',
        entityId: payment.id,
        userId: payment.user.id,
        username: payment.user.username,
        details: {
          amount: payment.amount,
          currency: payment.currency,
          status: paymentStatus,
          trackId,
          txID,
          network,
          payCurrency,
        },
      },
    });

    // If payment is completed, grant premium access or credits
    if (paymentStatus === 'COMPLETED') {
      // TODO: Implement your business logic here
      // For example:
      // - Grant premium subscription
      // - Add credits to user account
      // - Unlock premium features
      console.log(`Payment completed for user ${payment.user.username}:`, {
        amount: payment.amount,
        currency: payment.currency,
      });

      // Notify admins about successful payment
      await notifyPaymentCompleted(payment.id, payment.user.id, payment.amount).catch((error) => {
        console.error('Failed to create payment completion notification:', error);
      });
    }

    // If payment failed, notify admins
    if (paymentStatus === 'FAILED') {
      await notifyPaymentFailed(payment.id, payment.user.id, payment.amount).catch((error) => {
        console.error('Failed to create payment failure notification:', error);
      });
    }

    return NextResponse.json({
      message: 'Webhook processed successfully',
      status: paymentStatus,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Allow POST requests without CSRF protection for webhooks
export const dynamic = 'force-dynamic';
