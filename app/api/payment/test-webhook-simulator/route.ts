import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * WEBHOOK SIMULATOR - Test VIP webhook flow
 *
 * This simulates an OxaPay webhook callback to test the upgrade logic
 * Admin-only for security
 */
export async function POST(request: NextRequest) {
  try {
    // Only admins can use this
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, status = 'Paid' } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   WEBHOOK SIMULATOR - MANUAL TEST                    ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('Admin:', admin.username);
    console.log('Payment ID:', paymentId);
    console.log('Simulated Status:', status);

    // Get the payment to extract metadata
    const { prisma } = require('@/lib/prisma');
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const metadata = payment.metadata as any;

    // Construct webhook payload like OxaPay would send
    const webhookPayload = {
      trackId: metadata.trackId || payment.transactionId,
      orderId: paymentId,
      status: status, // 'Paid', 'Waiting', 'Confirming', 'Failed', 'Expired'
      amount: payment.amount,
      currency: payment.currency,
      payAmount: metadata.payAmount || payment.amount,
      payCurrency: metadata.payCurrency || 'USDT',
      txID: `SIMULATED-TX-${Date.now()}`,
      network: metadata.network || 'Tron Network',
    };

    console.log('\nSimulated Webhook Payload:');
    console.log(JSON.stringify(webhookPayload, null, 2));

    // Call the actual webhook endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/payment/vip-webhook`;

    console.log('\nSending to:', webhookUrl);

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseText = await webhookResponse.text();

    console.log('\nWebhook Response:');
    console.log('Status:', webhookResponse.status);
    console.log('Body:', responseText);

    // Check if user was upgraded
    const updatedUser = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: {
        username: true,
        email: true,
        isVip: true,
        vipUntil: true,
      },
    });

    const wasUpgraded = updatedUser?.isVip && !payment.user.isVip;

    console.log('\n--- RESULT ---');
    console.log('User:', updatedUser?.username);
    console.log('Was VIP Before:', payment.user.isVip);
    console.log('Is VIP Now:', updatedUser?.isVip);
    console.log('Upgrade Success:', wasUpgraded ? '✅ YES' : '❌ NO');
    console.log('═'.repeat(56) + '\n');

    return NextResponse.json({
      success: true,
      message: 'Webhook simulation completed',
      webhookResponse: {
        status: webhookResponse.status,
        body: responseText,
      },
      payment: {
        id: payment.id,
        status: payment.status,
      },
      user: {
        username: updatedUser?.username,
        email: updatedUser?.email,
        wasVipBefore: payment.user.isVip,
        isVipNow: updatedUser?.isVip,
        upgradeSuccess: wasUpgraded,
      },
    });
  } catch (error) {
    console.error('Webhook simulator error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - Show how to use this endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook Simulator - Test VIP Upgrade Flow',
    description: 'This endpoint simulates an OxaPay webhook to test the VIP upgrade logic',
    adminOnly: true,
    usage: {
      method: 'POST',
      endpoint: '/api/payment/test-webhook-simulator',
      body: {
        paymentId: 'payment-id-here',
        status: 'Paid', // or 'Waiting', 'Confirming', 'Failed', 'Expired'
      },
      example: `
curl -X POST https://risquemega.net/api/payment/test-webhook-simulator \\
  -H "Content-Type: application/json" \\
  -H "Cookie: admin-session=YOUR_ADMIN_SESSION" \\
  -d '{"paymentId": "f336b3a3-e368-4da8-83b4-0fdd29b2780d", "status": "Paid"}'
      `.trim(),
    },
  });
}
