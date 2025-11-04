'use client';

import { useState, useEffect } from 'react';
import { Crown, Check, ChevronDown, ChevronUp, Sparkles, Lock, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import { WhiteLabelPaymentModal } from '@/components/white-label-payment-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface User {
  id: string;
  isVip: boolean;
  vipUntil: string | null;
}

interface PaymentConfig {
  testMode: boolean;
  sandbox: boolean;
  pricing: {
    vip: {
      production: number;
      test: number;
      current: number;
    };
  };
}

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'What is VIP membership?',
    answer: 'VIP membership gives you lifetime access to exclusive content, premium features, and a special badge that shows your VIP status across the platform.',
  },
  {
    question: 'Is the payment really lifetime?',
    answer: 'Yes! Pay once and get lifetime VIP access. No recurring charges, no hidden fees.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept cryptocurrency payments including Bitcoin, Ethereum, USDT, and many other cryptocurrencies.',
  },
  {
    question: 'How long does it take to activate VIP?',
    answer: 'Your VIP status will be activated automatically within a few minutes after your payment is confirmed.',
  },
];

const features = [
  { name: 'Access to VIP-only content', icon: Lock, free: false, vip: true },
  { name: 'Premium VIP badge', icon: Crown, free: false, vip: true },
  { name: 'Ad-free experience', icon: Zap, free: false, vip: true },
  { name: 'Early access to new features', icon: Sparkles, free: false, vip: true },
  { name: 'Priority support', icon: Check, free: false, vip: true },
  { name: 'Exclusive VIP chat room', icon: Check, free: false, vip: true },
];

export default function VIPPage() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [recentPayment, setRecentPayment] = useState<any>(null);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    fetchUserStatus();
    fetchPaymentConfig();
    checkRecentPayment();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const response = await fetch('/api/payment/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
    }
  };

  const handleUpgradeToVIP = async () => {
    if (!user) {
      toast.error('Please login to upgrade to VIP');
      return;
    }

    if (user.isVip) {
      toast.error('You are already a VIP member!');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/payment/create-vip-whitelabel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payCurrency: selectedCrypto,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Set payment data and open modal
        setPaymentData(data.payment);
        setPaymentModal(true);

        // Set recent payment immediately so UI updates without refresh
        setRecentPayment({
          id: data.payment.id,
          status: 'PENDING',
        });

        if (data.testMode) {
          toast.success('Payment created ($1 test)');
        } else {
          toast.success('Payment created successfully');
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkRecentPayment = async () => {
    try {
      const response = await fetch('/api/payment/recent-pending');
      if (response.ok) {
        const data = await response.json();
        if (data.payment) {
          setRecentPayment(data.payment);
        }
      }
    } catch (error) {
      console.error('Failed to check recent payment:', error);
    }
  };

  const handleViewRecentPayment = async () => {
    if (!recentPayment) return;

    setIsLoadingRecent(true);
    try {
      // Get full payment details
      const response = await fetch(`/api/payment/status/${recentPayment.id}`);
      if (response.ok) {
        const data = await response.json();

        // Check if payment is still pending and not expired
        if (data.status === 'PENDING' && data.metadata) {
          const paymentInfo = {
            id: data.id,
            trackId: data.metadata.trackId,
            address: data.metadata.address,
            payAmount: data.metadata.payAmount,
            payCurrency: data.metadata.payCurrency,
            network: data.metadata.network,
            qrCode: data.metadata.qrCode,
            expiredAt: data.metadata.expiredAt,
            rate: data.metadata.rate,
          };

          setPaymentData(paymentInfo);
          setPaymentModal(true);
        } else if (data.status === 'COMPLETED') {
          toast.success('This payment has already been completed!');
          setRecentPayment(null);
          fetchUserStatus();
        } else {
          toast.error('This payment has expired. Please create a new one.');
          setRecentPayment(null);
        }
      }
    } catch (error) {
      console.error('Failed to load payment:', error);
      toast.error('Failed to load payment details');
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handlePaymentComplete = () => {
    setPaymentModal(false);
    setRecentPayment(null);
    fetchUserStatus(); // Refresh user status
  };

  const handleCancelPayment = async () => {
    if (!recentPayment) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/payment/cancel/${recentPayment.id}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Clear all payment-related state immediately
        setRecentPayment(null);
        setPaymentModal(false);
        setShowCancelDialog(false);
        setPaymentData(null);

        // Show success message
        toast.success('Payment cancelled successfully. You can now create a new payment.');

        // Optional: Refresh recent payment check to ensure state is synced
        await checkRecentPayment();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to cancel payment');
      }
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      toast.error('An error occurred while cancelling payment');
    } finally {
      setIsCancelling(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Test Mode Banner */}
      {config?.testMode && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-500 font-semibold text-sm mb-1">Test Mode Active</h4>
              <p className="text-yellow-600/80 text-xs">
                Payment system is in test mode. You'll be charged ${config.pricing.vip.test} USD to test the full payment workflow with OxaPay.
                The payment will use sandbox/test cryptocurrency.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Status Banner (if VIP) */}
      {user?.isVip && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3">
            <Crown className="w-7 h-7 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">You are a VIP Member</h3>
              <p className="text-gray-500 text-sm">Lifetime access to all premium features</p>
            </div>
          </div>
        </div>
      )}

      {!user?.isVip && (
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Pricing Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div className="flex items-center gap-2 mb-6">
              <Crown className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">VIP Membership</h2>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                {config?.testMode ? (
                  <>
                    <span className="text-4xl font-bold text-white">${config.pricing.vip.test}</span>
                    <span className="text-gray-500 text-sm">test payment</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-white">${config?.pricing.vip.production || 50}</span>
                    <span className="text-gray-500 text-sm">one-time</span>
                  </>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                {config?.testMode ? 'Test the payment workflow' : 'Lifetime access'}
              </p>
            </div>

            {/* Cryptocurrency Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Payment Currency
              </label>
              <select
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/20"
                disabled={isProcessing}
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="LTC">Litecoin (LTC)</option>
                <option value="TRX">TRON (TRX)</option>
              </select>
            </div>

            {/* Recent Payment Button - Show if there's a pending payment */}
            {recentPayment ? (
              <div className="space-y-3">
                <button
                  onClick={handleViewRecentPayment}
                  disabled={isLoadingRecent || isCancelling}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  
                  {isLoadingRecent ? 'Loading...' : 'View Recent Payment'}
                </button>

                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isCancelling || isLoadingRecent}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Payment'}
                </button>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-500 text-xs text-center">
                    You have a pending payment. You can cancel it to choose a different cryptocurrency.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUpgradeToVIP}
                disabled={isProcessing}
                className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : config?.testMode ? 'Test Payment Flow' : 'Upgrade to VIP'}
              </button>
            )}

            <p className="text-gray-600 text-xs text-center mt-4">
              Secure payment  {config?.sandbox ? '' : ''}
            </p>
          </div>

          {/* White-Label Payment Modal */}
          <WhiteLabelPaymentModal
            isOpen={paymentModal}
            onClose={() => setPaymentModal(false)}
            payment={paymentData}
            onPaymentComplete={handlePaymentComplete}
          />

          {/* Features List */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h3 className="text-lg font-semibold text-white mb-6">What's included</h3>
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm">{feature.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
        <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>

        <div className="space-y-1">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-800 last:border-0">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-800/30 transition px-2 rounded"
              >
                <span className="text-white font-medium text-sm pr-4">{faq.question}</span>
                {expandedFAQ === index ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {expandedFAQ === index && (
                <div className="px-2 pb-4">
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Payment Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Payment?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to cancel this payment? You will need to create a new payment if you want to proceed with VIP upgrade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              No, keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelPayment}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, cancel payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
