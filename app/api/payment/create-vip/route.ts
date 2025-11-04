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
  const merchantId = process.env.OXAPAY_MERCHANT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const apiKey = process.env.OXAPAY_API_KEY;

  if (!apiKey || apiKey === 'your-api-key-here') {
    return { valid: false, error: 'OXAPAY_API_KEY not configured for production' };
  }

  if (!merchantId || merchantId === 'sandbox') {
    return { valid: false, error: 'OXAPAY_MERCHANT_ID must be set to production merchant ID (not sandbox)' };
  }

  if (!baseUrl || baseUrl.includes('localhost')) {
    return { valid: false, error: 'NEXT_PUBLIC_BASE_URL must be set to production URL (not localhost)' };
  }

  if (VIP_PRICE !== PRODUCTION_VIP_PRICE) {
    return { valid: false, error: 'VIP price validation failed' };
  }

  return { valid: true };
}

export async function POST() {
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

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: currentUser.id,
        amount: VIP_PRICE,
        currency: 'USD',
        status: 'PENDING',
        paymentMethod: 'oxapay',
        description: IS_TEST_MODE
          ? 'VIP Membership - TEST MODE ($1)'
          : 'VIP Membership - Lifetime Access',
        metadata: {
          userEmail: currentUser.email,
          username: currentUser.username,
          paymentType: 'VIP_UPGRADE',
          testMode: IS_TEST_MODE,
        },
      },
    });

    // Log production payment attempt
    if (!IS_TEST_MODE) {
      console.log('=== PRODUCTION VIP PAYMENT INITIATED ===');
      console.log('User ID:', currentUser.id);
      console.log('Username:', currentUser.username);
      console.log('Email:', currentUser.email);
      console.log('Amount:', VIP_PRICE, 'USD');
      console.log('Payment ID:', payment.id);
      console.log('Timestamp:', new Date().toISOString());
      console.log('=======================================');
    }

    // Create OxaPay invoice
    try {
      const invoice = await oxapay.createInvoice({
        amount: VIP_PRICE,
        currency: 'USD',
        orderId: payment.id,
        email: currentUser.email,
        description: IS_TEST_MODE
          ? 'VIP Membership - TEST MODE ($1)'
          : 'VIP Membership - Lifetime Access',
        callbackUrl: `${baseUrl}/api/payment/vip-webhook`,
        returnUrl: `${baseUrl}/payment/success?type=vip&orderId=${payment.id}`,
        feePaidByPayer: 0, // Merchant pays fees
        underPaidCover: IS_TEST_MODE ? 10 : 1, // Allow more underpayment in test mode
      });

      // Update payment with transaction ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: invoice.trackId.toString(),
          metadata: {
            userEmail: currentUser.email,
            username: currentUser.username,
            paymentType: 'VIP_UPGRADE',
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
            amount: VIP_PRICE,
            currency: 'USD',
            trackId: invoice.trackId,
            type: 'VIP_UPGRADE',
          },
        },
      });

      return NextResponse.json({
        message: 'VIP payment created successfully',
        paymentId: payment.id,
        paymentUrl: invoice.payLink,
        payment: {
          id: payment.id,
          amount: VIP_PRICE,
          currency: 'USD',
          status: 'PENDING',
        },
        trackId: invoice.trackId,
        testMode: IS_TEST_MODE,
      });
    } catch (oxapayError) {
      console.error('OxaPay error:', oxapayError);

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
        { error: 'Failed to create payment invoice' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create VIP payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create VIP payment' },
      { status: 500 }
    );
  }
}
