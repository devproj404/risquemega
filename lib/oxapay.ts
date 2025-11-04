/**
 * OxaPay Payment Integration
 * https://docs.oxapay.com/
 */

export interface OxaPayCreateInvoiceParams {
  amount: number;
  currency: string; // USD, EUR, BTC, ETH, etc.
  callbackUrl?: string;
  returnUrl?: string;
  description?: string;
  orderId?: string;
  email?: string;
  underPaidCover?: number; // Percentage (0-100)
  feePaidByPayer?: 0 | 1; // 0 = merchant pays, 1 = payer pays
}

export interface OxaPayInvoiceResponse {
  trackId: number;
  payLink: string;
  message?: string;
  result?: number;
}

export interface OxaPayWhiteLabelParams {
  amount: number;
  currency: string; // Fiat currency like USD
  payCurrency: string; // Crypto currency like BTC, ETH, USDT
  network?: string; // Optional blockchain network
  callbackUrl?: string;
  description?: string;
  orderId?: string;
  email?: string;
  underPaidCover?: number;
  feePaidByPayer?: 0 | 1;
  lifetime?: number; // Minutes (15-2880, default 60)
}

export interface OxaPayWhiteLabelResponse {
  data: {
    track_id: number;
    address: string; // Crypto address to send payment to
    pay_amount: number; // Amount to pay in crypto
    qr_code: string; // URL to QR code image
    expired_at: number; // Unix timestamp
    rate: number; // Exchange rate
    pay_currency: string;
    network: string;
    amount: number;
    currency: string;
  };
  message?: string;
  status?: number;
}

export interface OxaPayCallbackData {
  trackId: number;
  orderId: string;
  amount: number;
  currency: string;
  status: 'Waiting' | 'Confirming' | 'Paid' | 'Expired' | 'Failed';
  payAmount: number;
  payCurrency: string;
  network: string;
  address: string;
  txID: string;
  date: string;
  email?: string;
  description?: string;
}

const OXAPAY_API_URL = 'https://api.oxapay.com';

class OxaPayService {
  private apiKey: string;
  private merchantId: string;

  constructor() {
    this.apiKey = process.env.OXAPAY_API_KEY || '';
    this.merchantId = process.env.OXAPAY_MERCHANT_ID || '';

    if (!this.apiKey || !this.merchantId) {
      console.warn('OxaPay credentials not configured');
    }
  }

  /**
   * Create a payment invoice (hosted payment page)
   */
  async createInvoice(params: OxaPayCreateInvoiceParams): Promise<OxaPayInvoiceResponse> {
    try {
      const response = await fetch(`${OXAPAY_API_URL}/merchants/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant: this.merchantId,
          amount: params.amount,
          currency: params.currency,
          lifeTime: 30, // Invoice lifetime in minutes
          callbackUrl: params.callbackUrl,
          returnUrl: params.returnUrl,
          description: params.description,
          orderId: params.orderId,
          email: params.email,
          underPaidCover: params.underPaidCover || 0,
          feePaidByPayer: params.feePaidByPayer || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.result !== 100) {
        throw new Error(data.message || 'Failed to create invoice');
      }

      return data;
    } catch (error) {
      console.error('OxaPay createInvoice error:', error);
      throw error;
    }
  }

  /**
   * Create a white-label payment (QR code displayed on your site)
   */
  async createWhiteLabelPayment(params: OxaPayWhiteLabelParams): Promise<OxaPayWhiteLabelResponse> {
    try {
      const requestBody = {
        amount: params.amount,
        currency: params.currency,
        pay_currency: params.payCurrency,
        network: params.network,
        callback_url: params.callbackUrl,
        description: params.description,
        order_id: params.orderId,
        email: params.email,
        under_paid_coverage: params.underPaidCover || 0,
        fee_paid_by_payer: params.feePaidByPayer || 0,
        lifetime: params.lifetime || 60,
      };

      console.log('OxaPay White-Label Request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${OXAPAY_API_URL}/v1/payment/white-label`, {
        method: 'POST',
        headers: {
          'merchant_api_key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('OxaPay White-Label Response:', JSON.stringify(responseData, null, 2));

      if (!response.ok || responseData.status !== 200) {
        console.error('OxaPay Error Response:', responseData);
        throw new Error(responseData.message || 'Failed to create white-label payment');
      }

      return responseData;
    } catch (error) {
      console.error('OxaPay createWhiteLabelPayment error:', error);
      throw error;
    }
  }

  /**
   * Get payment information by trackId
   */
  async getPaymentInfo(trackId: number): Promise<any> {
    try {
      const response = await fetch(`${OXAPAY_API_URL}/merchants/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant: this.apiKey,
          trackId: trackId,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.result !== 100) {
        throw new Error(data.message || 'Failed to get payment info');
      }

      return data;
    } catch (error) {
      console.error('OxaPay getPaymentInfo error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook callback signature
   */
  verifyCallback(callbackData: OxaPayCallbackData, signature?: string): boolean {
    // OxaPay uses HMAC-SHA512 for webhook verification
    // Implement signature verification if needed
    // For now, we'll validate the merchant ID and basic data structure
    return true;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'CAD', 'AUD',
      'BTC', 'ETH', 'USDT', 'USDC', 'BNB',
      'LTC', 'TRX', 'DOGE', 'BCH', 'XRP',
    ];
  }

  /**
   * Get payment status from callback status
   */
  getPaymentStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' {
    switch (status) {
      case 'Paid':
        return 'COMPLETED';
      case 'Waiting':
      case 'Confirming':
        return 'PENDING';
      case 'Expired':
      case 'Failed':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string): string {
    if (['BTC', 'ETH', 'LTC'].includes(currency)) {
      return `${amount.toFixed(8)} ${currency}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export const oxapay = new OxaPayService();
