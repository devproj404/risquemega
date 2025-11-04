'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  description: string;
  transactionId: string | null;
  paymentType: string;
  testMode: boolean;
  trackId: number | null;
  payLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/history');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      } else if (response.status === 401) {
        toast.error('Please login to view transactions');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPaymentStatus = async (paymentId: string) => {
    try {
      setRefreshingId(paymentId);
      const response = await fetch(`/api/payment/status/${paymentId}`);
      if (response.ok) {
        const data = await response.json();

        // Update the payment in the list
        setPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? { ...p, status: data.status, updatedAt: new Date().toISOString() } : p))
        );

        toast.success('Payment status updated');
      } else {
        toast.error('Failed to refresh status');
      }
    } catch (error) {
      console.error('Error refreshing payment:', error);
      toast.error('Failed to refresh status');
    } finally {
      setRefreshingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'FAILED':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'PENDING':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
          <p className="text-gray-400">View and manage your payment transactions</p>
        </div>
        <Button
          onClick={fetchPayments}
          variant="outline"
          className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
          <p className="text-gray-400 mb-6">You haven't made any payments yet.</p>
          <Button
            onClick={() => window.location.href = '/vip'}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to VIP
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(payment.status)}
                    <h3 className="text-lg font-semibold text-white">{payment.description}</h3>
                    {payment.testMode && (
                      <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs rounded">
                        TEST
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Amount</p>
                      <p className="text-white font-semibold">
                        ${payment.amount} {payment.currency}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-sm font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Date</p>
                      <p className="text-white text-sm">
                        {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Payment ID</p>
                      <p className="text-white text-sm font-mono truncate">{payment.id}</p>
                    </div>
                  </div>

                  {payment.transactionId && (
                    <div className="mt-4">
                      <p className="text-gray-500 text-sm mb-1">Transaction ID</p>
                      <p className="text-gray-400 text-sm font-mono">{payment.transactionId}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {payment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => refreshPaymentStatus(payment.id)}
                        disabled={refreshingId === payment.id}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg transition flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingId === payment.id ? 'animate-spin' : ''}`} />
                        {refreshingId === payment.id ? 'Checking...' : 'Refresh'}
                      </button>

                      {payment.payLink && (
                        <a
                          href={payment.payLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition flex items-center gap-2 text-sm text-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Pay Now
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
