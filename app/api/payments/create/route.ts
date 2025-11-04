import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { oxapay } from '@/lib/oxapay';
import { z } from 'zod';
import { notifyPaymentCreated } from '@/lib/admin-notifications';

const createPaymentSchema = z.object({
  amount: z.number().positive().min(1),
  currency: z.string().default('USD'),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { amount, currency, description } = validation.data;

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: currentUser.id,
        amount,
        currency,
        status: 'PENDING',
        paymentMethod: 'oxapay',
        description: description || 'Premium subscription',
        metadata: {
          userEmail: currentUser.email,
          username: currentUser.username,
        },
      },
    });

    // Create OxaPay invoice
    try {
      const invoice = await oxapay.createInvoice({
        amount,
        currency,
        orderId: payment.id,
        email: currentUser.email,
        description: description || 'Premium subscription',
        callbackUrl: `${baseUrl}/api/payments/webhook`,
        returnUrl: `${baseUrl}/payment/success?orderId=${payment.id}`,
        feePaidByPayer: 0, // Merchant pays fees
        underPaidCover: 2, // Allow 2% underpayment
      });

      // Update payment with transaction ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: invoice.trackId.toString(),
          metadata: {
            ...payment.metadata,
            payLink: invoice.payLink,
            trackId: invoice.trackId,
          },
        },
      });

      // Log payment creation
      await prisma.activityLog.create({
        data: {
          action: 'PAYMENT_CREATE',
          entityType: 'Payment',
          entityId: payment.id,
          userId: currentUser.id,
          username: currentUser.username,
          details: {
            amount,
            currency,
            trackId: invoice.trackId,
          },
        },
      });

      // Notify admins about new payment
      await notifyPaymentCreated(payment.id, currentUser.id, amount).catch((error) => {
        console.error('Failed to create payment notification:', error);
        // Don't fail the request if notification fails
      });

      return NextResponse.json({
        message: 'Payment created successfully',
        payment: {
          id: payment.id,
          amount,
          currency,
          status: 'PENDING',
        },
        paymentUrl: invoice.payLink,
        trackId: invoice.trackId,
      });
    } catch (oxapayError) {
      console.error('OxaPay error:', oxapayError);

      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...payment.metadata,
            error: String(oxapayError),
          },
        },
      });

      return NextResponse.json(
        { error: 'Failed to create payment invoice' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
