import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { oxapay } from '@/lib/oxapay';

// Test mode: Use $1 for testing the full payment flow
// Production mode: Use $50 for real payments
const PRODUCTION_VIP_PRICE = 50;
const TEST_VIP_PRICE = 1;
const IS_TEST_MODE = process.env.PAYMENT_TEST_MODE === 'true';
const VIP_PRICE = IS_TEST_MODE ? TEST_VIP_PRICE : PRODUCTION_VIP_PRICE;

// Production safety checks
function validateProductionConfig(): { valid: boolean; error?: string } {
  if (IS_TEST_MODE) {
    return { valid: true }; // Test mode, no strict validation
  }

  // In production mode, validate critical configuration
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const apiKey = process.env.OXAPAY_API_KEY;

  if (!apiKey || apiKey === 'your-api-key-here') {
    return { valid: false, error: 'OXAPAY_API_KEY not configured for production' };
  }

  if (!baseUrl || baseUrl.includes('localhost')) {
    return { valid: false, error: 'NEXT_PUBLIC_BASE_URL must be set to production URL (not localhost)' };
  }

  if (VIP_PRICE !== PRODUCTION_VIP_PRICE) {
    return { valid: false, error: 'VIP price validation failed' };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    // Validate production configuration
    const configValidation = validateProductionConfig();
    if (!configValidation.valid) {
      console.error('Production config validation failed:', configValidation.error);
      return NextResponse.json(
        { error: configValidation.error },
        { status: 500 }
      );
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is already VIP
    if (currentUser.isVip) {
      return NextResponse.json(
        { error: 'You are already a VIP member' },
        { status: 400 }
      );
    }

    // Get request body for payment currency selection
    const body = await request.json();
    const payCurrency = body.payCurrency || 'USDT'; // Default to USDT

    // Map crypto to default network
    const networkMap: Record<string, string> = {
      'USDT': 'tron',  // TRC20 is most popular for USDT
      'BTC': 'btc',
      'ETH': 'eth',
      'LTC': 'ltc',
      'TRX': 'tron',
    };

    const network = body.network || networkMap[payCurrency] || 'tron';

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: currentUser.id,
        amount: VIP_PRICE,
        currency: 'USD',
        status: 'PENDING',
        paymentMethod: 'oxapay_whitelabel',
        description: IS_TEST_MODE
          ? 'VIP Membership - TEST MODE ($1)'
          : 'VIP Membership - Lifetime Access',
        metadata: {
          userEmail: currentUser.email,
          username: currentUser.username,
          paymentType: 'VIP_UPGRADE',
          testMode: IS_TEST_MODE,
          payCurrency,
          network,
        },
      },
    });

    // Log production payment attempt
    if (!IS_TEST_MODE) {
      console.log('=== PRODUCTION VIP PAYMENT INITIATED (WHITE-LABEL) ===');
      console.log('User ID:', currentUser.id);
      console.log('Username:', currentUser.username);
      console.log('Email:', currentUser.email);
      console.log('Amount:', VIP_PRICE, 'USD');
      console.log('Pay Currency:', payCurrency);
      console.log('Payment ID:', payment.id);
      console.log('Timestamp:', new Date().toISOString());
      console.log('======================================================');
    }

    // Create OxaPay white-label payment
    try {
      const whiteLabelPayment = await oxapay.createWhiteLabelPayment({
        amount: VIP_PRICE,
        currency: 'USD',
        payCurrency,
        network,
        orderId: payment.id,
        email: currentUser.email,
        description: IS_TEST_MODE
          ? 'VIP Membership - TEST MODE ($1)'
          : 'VIP Membership - Lifetime Access',
        callbackUrl: `${baseUrl}/api/payment/vip-webhook`,
        feePaidByPayer: 0, // Merchant pays fees
        underPaidCover: IS_TEST_MODE ? 10 : 1, // Allow more underpayment in test mode
        lifetime: 60, // 60 minutes expiration
      });

      const paymentData = whiteLabelPayment.data;

      // Update payment with transaction ID and payment details
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: paymentData.track_id.toString(),
          metadata: {
            userEmail: currentUser.email,
            username: currentUser.username,
            paymentType: 'VIP_UPGRADE',
            trackId: paymentData.track_id,
            address: paymentData.address,
            payAmount: paymentData.pay_amount,
            payCurrency: paymentData.pay_currency,
            network: paymentData.network,
            qrCode: paymentData.qr_code,
            expiredAt: paymentData.expired_at,
            rate: paymentData.rate,
            testMode: IS_TEST_MODE,
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
            amount: VIP_PRICE,
            currency: 'USD',
            payCurrency: paymentData.pay_currency,
            trackId: paymentData.track_id,
            type: 'VIP_UPGRADE_WHITELABEL',
            network: paymentData.network,
          },
        },
      });

      return NextResponse.json({
        message: 'VIP payment created successfully',
        paymentId: payment.id,
        payment: {
          id: payment.id,
          amount: VIP_PRICE,
          currency: 'USD',
          status: 'PENDING',
          trackId: paymentData.track_id,
          address: paymentData.address,
          payAmount: paymentData.pay_amount,
          payCurrency: paymentData.pay_currency,
          network: paymentData.network,
          qrCode: paymentData.qr_code,
          expiredAt: paymentData.expired_at,
          rate: paymentData.rate,
        },
        testMode: IS_TEST_MODE,
      });
    } catch (oxapayError) {
      console.error('OxaPay white-label error:', oxapayError);

      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            userEmail: currentUser.email,
            username: currentUser.username,
            paymentType: 'VIP_UPGRADE',
            error: String(oxapayError),
          },
        },
      });

      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create VIP white-label payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create VIP payment' },
      { status: 500 }
    );
  }
}
