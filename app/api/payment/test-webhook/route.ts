import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Test endpoint to simulate OxaPay webhook callback
 * Only works when PAYMENT_TEST_MODE=true
 */
export async function POST(request: NextRequest) {
  // Only allow in test mode
  const isTestMode = process.env.PAYMENT_TEST_MODE === 'true';
  if (!isTestMode) {
    return NextResponse.json(
      { error: 'Test webhooks are only available in test mode' },
      { status: 403 }
    );
  }

  try {
    const { orderId, status = 'Paid' } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: orderId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Simulate the webhook payload
    const webhookPayload = {
      trackId: 123456,
      orderId,
      status, // 'Paid', 'Failed', etc.
      amount: payment.amount,
      currency: payment.currency,
      payAmount: payment.amount,
      payCurrency: 'BTC',
      txID: `test-tx-${Date.now()}`,
      network: 'Bitcoin',
    };

    // Call the actual VIP webhook endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookResponse = await fetch(`${baseUrl}/api/payment/vip-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const webhookResult = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent successfully',
      orderId,
      status,
      webhookResult,
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process test webhook' },
      { status: 500 }
    );
  }
}
