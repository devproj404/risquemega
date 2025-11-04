/**
 * Test script to validate production configuration
 * Run with: npm run test:config
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Test production configuration validation
function testProductionConfig() {
  console.log('='.repeat(50));
  console.log('PRODUCTION CONFIGURATION TEST');
  console.log('='.repeat(50));
  console.log('');

  const testMode = process.env.PAYMENT_TEST_MODE === 'true';
  const merchantId = process.env.OXAPAY_MERCHANT_ID || '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const apiKey = process.env.OXAPAY_API_KEY || '';

  console.log('Current Configuration:');
  console.log('  PAYMENT_TEST_MODE:', testMode);
  console.log('  OXAPAY_MERCHANT_ID:', merchantId);
  console.log('  NEXT_PUBLIC_BASE_URL:', baseUrl);
  console.log('  OXAPAY_API_KEY:', apiKey ? '***' + apiKey.slice(-6) : 'NOT SET');
  console.log('');

  if (testMode) {
    console.log('✅ TEST MODE ACTIVE');
    console.log('   - Payments will be $1');
    console.log('   - Using sandbox merchant');
    console.log('   - No strict validation required');
    console.log('');
    return;
  }

  // Production mode validation
  console.log('⚠️  PRODUCTION MODE - Validating...');
  console.log('');

  let hasErrors = false;

  // Check API key
  if (!apiKey || apiKey === 'your-api-key-here') {
    console.log('❌ OXAPAY_API_KEY not configured');
    hasErrors = true;
  } else {
    console.log('✅ OXAPAY_API_KEY configured');
  }

  // Check merchant ID
  if (!merchantId || merchantId === 'sandbox') {
    console.log('❌ OXAPAY_MERCHANT_ID must be production ID (not sandbox)');
    hasErrors = true;
  } else {
    console.log('✅ OXAPAY_MERCHANT_ID set to production');
  }

  // Check base URL
  if (!baseUrl || baseUrl.includes('localhost')) {
    console.log('❌ NEXT_PUBLIC_BASE_URL must be production URL (not localhost)');
    hasErrors = true;
  } else if (!baseUrl.startsWith('https://')) {
    console.log('❌ NEXT_PUBLIC_BASE_URL must use HTTPS');
    hasErrors = true;
  } else {
    console.log('✅ NEXT_PUBLIC_BASE_URL configured correctly');
  }

  console.log('');
  console.log('='.repeat(50));

  if (hasErrors) {
    console.log('❌ PRODUCTION CONFIG INVALID');
    console.log('   Payment creation will be blocked');
    console.log('   Please fix the errors above');
    process.exit(1);
  } else {
    console.log('✅ PRODUCTION CONFIG VALID');
    console.log('   System ready for $50 real payments');
    console.log('   All safety checks passed');
  }

  console.log('='.repeat(50));
}

testProductionConfig();
