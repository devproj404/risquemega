'use client';

import { useState } from 'react';
import { Crown, Check, Zap, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Ad-free experience',
      'HD video streaming',
      'Basic support',
      'Access to all categories',
    ],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Basic',
      '4K ultra HD streaming',
      'Download for offline viewing',
      'Priority support',
      'Exclusive content',
      'Early access to new features',
    ],
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 49.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Premium',
      'Unlimited downloads',
      'VIP badge',
      'Custom profile themes',
      'Direct creator messaging',
      '24/7 premium support',
      'Exclusive VIP events',
    ],
    popular: false,
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, amount: number, currency: string) => {
    setIsLoading(planId);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description: `${PLANS.find((p) => p.id === planId)?.name} Subscription`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create payment');
        return;
      }

      // Redirect to payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error('Payment URL not available');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-700 rounded-full px-4 py-2 mb-4">
          <Crown className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Premium Membership</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Upgrade to Premium
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Unlock exclusive features and enjoy an enhanced experience with our premium plans
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="bg-pink-600/20 rounded-lg p-3 w-fit mb-4">
            <Zap className="w-6 h-6 text-pink-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
          <p className="text-gray-400">
            Ultra-fast streaming with 4K quality and zero buffering
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="bg-blue-600/20 rounded-lg p-3 w-fit mb-4">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">100% Secure</h3>
          <p className="text-gray-400">
            Your privacy and security are our top priority with encrypted payments
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="bg-purple-600/20 rounded-lg p-3 w-fit mb-4">
            <Star className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Exclusive Content</h3>
          <p className="text-gray-400">
            Access premium content and exclusive features not available to free users
          </p>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-gray-900/50 backdrop-blur-sm border rounded-2xl p-8 ${
              plan.popular
                ? 'border-pink-500 shadow-xl shadow-pink-500/20'
                : 'border-gray-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-pink-600 to-pink-700 rounded-full px-4 py-1">
                  <span className="text-white text-sm font-semibold">Most Popular</span>
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-400">/{plan.interval}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSubscribe(plan.id, plan.price, plan.currency)}
              disabled={isLoading === plan.id}
              className={`w-full h-12 font-semibold ${
                plan.popular
                  ? 'bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
              }`}
            >
              {isLoading === plan.id ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Subscribe Now'
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mt-12 text-center">
        <p className="text-gray-400 mb-4">We accept cryptocurrency payments</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'LTC'].map((crypto) => (
            <div
              key={crypto}
              className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2"
            >
              <span className="text-gray-300 font-medium">{crypto}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-12 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">
          Secure & Anonymous Payments
        </h3>
        <p className="text-gray-400 text-center max-w-2xl mx-auto">
          All payments are processed securely. We accept multiple cryptocurrencies
          for your privacy and convenience. Your transaction is encrypted and your payment
          information is never stored on our servers.
        </p>
      </div>
    </div>
  );
}
