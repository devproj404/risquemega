import { NextResponse } from 'next/server';

/**
 * Get payment configuration (test mode status, pricing, etc.)
 * This is a public endpoint to inform the frontend about payment settings
 */
export async function GET() {
  const isTestMode = process.env.PAYMENT_TEST_MODE === 'true';
  const isSandbox = process.env.OXAPAY_MERCHANT_ID === 'sandbox';

  return NextResponse.json({
    testMode: isTestMode,
    sandbox: isSandbox,
    pricing: {
      vip: {
        production: 50,
        test: 1,
        current: isTestMode ? 1 : 50,
      },
    },
  });
}
