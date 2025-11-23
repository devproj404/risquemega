import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { oxapay } from '@/lib/oxapay';

export async function POST(request: NextRequest) {
  try {
    // Log ALL webhook requests for debugging
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   VIP WEBHOOK RECEIVED                               ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(Object.fromEntries(request.headers), null, 2));
    console.log('URL:', request.url);
    console.log('Method:', request.method);

    const body = await request.json();

    const isTestMode = process.env.PAYMENT_TEST_MODE === 'true';

    console.log('Mode:', isTestMode ? 'TEST' : 'PRODUCTION');
    console.log('Webhook Body:', JSON.stringify(body, null, 2));
    console.log('═'.repeat(56));

    const {
      trackId,
      orderId,
      status,
      amount,
      currency,
      payAmount,
      payCurrency,
      txID,
      network,
    } = body;

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!payment) {
      console.error('Payment not found:', orderId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify this is a VIP payment
    const metadata = payment.metadata as any;
    if (metadata?.paymentType !== 'VIP_UPGRADE') {
      console.error('Not a VIP payment:', orderId);
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    // Convert OxaPay status to our payment status
    const paymentStatus = oxapay.getPaymentStatus(status);

    // Update payment record
    await prisma.payment.update({
      where: { id: orderId },
      data: {
        status: paymentStatus,
        metadata: {
          ...metadata,
          payAmount,
          payCurrency,
          txID,
          network,
          webhookStatus: status,
          webhookReceivedAt: new Date().toISOString(),
        },
      },
    });

    // If payment is completed, upgrade user to VIP
    console.log('Checking upgrade conditions:');
    console.log('  - status:', status);
    console.log('  - paymentStatus:', paymentStatus);
    console.log('  - Will upgrade?', status === 'Paid' && paymentStatus === 'COMPLETED');

    if (status === 'Paid' && paymentStatus === 'COMPLETED') {
      console.log('\n🎉 UPGRADING USER TO VIP 🎉\n');

      // Set VIP status to lifetime (no expiration)
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          isVip: true,
          vipUntil: null, // null means lifetime
        },
      });

      // Log the VIP upgrade
      await prisma.activityLog.create({
        data: {
          action: 'PAYMENT_COMPLETE',
          entityType: 'VIPUpgrade',
          entityId: payment.id,
          userId: payment.userId,
          username: payment.user.username,
          details: {
            amount,
            currency,
            payAmount,
            payCurrency,
            txID,
            network,
            trackId,
            testMode: isTestMode,
          },
        },
      });

      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║   VIP UPGRADE SUCCESSFUL ✓                           ║');
      console.log('╚══════════════════════════════════════════════════════╝');
      console.log('User ID:', payment.userId);
      console.log('Username:', payment.user.username);
      console.log('Email:', payment.user.email);
      console.log('Amount Paid:', payAmount, payCurrency);
      console.log('Transaction ID:', txID);
      console.log('Network:', network);
      console.log('Payment ID:', payment.id);
      console.log('Mode:', isTestMode ? 'TEST' : 'PRODUCTION');
      console.log('Timestamp:', new Date().toISOString());
      console.log('═'.repeat(56) + '\n');
    } else if (status === 'Failed' || status === 'Expired') {
      console.log('❌ Payment failed or expired:', status);
      // Log failed payment
      await prisma.activityLog.create({
        data: {
          action: 'PAYMENT_FAIL',
          entityType: 'VIPUpgrade',
          entityId: payment.id,
          userId: payment.userId,
          username: payment.user.username,
          details: {
            amount,
            currency,
            status,
            trackId,
          },
        },
      });

      console.log(`VIP payment failed for user ${payment.userId}:`, status);
    }

    return NextResponse.json({ success: true, status: paymentStatus });
  } catch (error) {
    console.error('VIP webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET - Test endpoint to verify webhook is accessible
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'VIP Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'GET',
    note: 'This endpoint receives POST requests from OxaPay. If you can see this, the webhook URL is accessible from the internet.',
  });
}
