'use client';

import { useState, useEffect, useCallback } from 'react';
import { QrCode, Copy, Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentData {
  id: string;
  trackId: number;
  address: string;
  payAmount: number;
  payCurrency: string;
  network: string;
  qrCode: string;
  expiredAt: number;
  rate: number;
}

interface WhiteLabelPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentData | null;
  onPaymentComplete?: () => void;
}

export function WhiteLabelPaymentModal({
  isOpen,
  onClose,
  payment,
  onPaymentComplete,
}: WhiteLabelPaymentModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [status, setStatus] = useState<'waiting' | 'checking' | 'paid' | 'expired'>('waiting');

  // Calculate time left
  useEffect(() => {
    if (!payment) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = payment.expiredAt - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        setStatus('expired');
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  // Check payment status periodically
  const checkPaymentStatus = useCallback(async () => {
    if (!payment || status === 'paid' || status === 'expired') return;

    try {
      const response = await fetch(`/api/payment/status/${payment.id}`);
      if (response.ok) {
        const data = await response.json();

        if (data.status === 'COMPLETED') {
          setStatus('paid');
          toast.success('Payment confirmed! Your VIP access is now active.');
          if (onPaymentComplete) {
            onPaymentComplete();
          }
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  }, [payment, status, onPaymentComplete]);

  useEffect(() => {
    if (!isOpen || !payment) return;

    // Check status every 10 seconds
    const interval = setInterval(checkPaymentStatus, 10000);

    // Also check immediately
    checkPaymentStatus();

    return () => clearInterval(interval);
  }, [isOpen, payment, checkPaymentStatus]);

  const copyToClipboard = async (text: string, type: 'address' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            Complete Your Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Status Banner */}
          {status === 'expired' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-500">Payment Expired</p>
                <p className="text-[10px] sm:text-xs text-gray-400">Please create a new payment</p>
              </div>
            </div>
          )}

          {status === 'paid' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-500">Payment Confirmed!</p>
                <p className="text-[10px] sm:text-xs text-gray-400">Activating your VIP access...</p>
              </div>
            </div>
          )}

          {/* Timer */}
          {status === 'waiting' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 sm:p-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-300">Time remaining:</span>
              </div>
              <span className="text-base sm:text-lg font-mono font-bold text-white">{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-3 sm:p-4 rounded-lg">
              <img
                src={payment.qrCode}
                alt="Payment QR Code"
                className="w-48 h-48 sm:w-64 sm:h-64"
                loading="eager"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-2 sm:space-y-3">
            {/* Amount */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-400">Amount to Send</span>
                <button
                  onClick={() => copyToClipboard(payment.payAmount.toString(), 'amount')}
                  className="text-gray-400 hover:text-white transition"
                >
                  {copiedAmount ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
              <p className="text-base sm:text-lg font-mono font-bold text-white">
                {payment.payAmount} {payment.payCurrency}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                Network: {payment.network}
              </p>
            </div>

            {/* Address */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-400">Send to Address</span>
                <button
                  onClick={() => copyToClipboard(payment.address, 'address')}
                  className="text-gray-400 hover:text-white transition"
                >
                  {copiedAddress ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm font-mono break-all text-white">
                {payment.address}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-400 font-medium mb-2">Instructions:</p>
            <ol className="text-[10px] sm:text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>Scan the QR code or copy the address above</li>
              <li>Send exactly {payment.payAmount} {payment.payCurrency} to the address</li>
              <li>Wait for payment confirmation (usually 5-10 minutes)</li>
              <li>Your VIP status will be activated automatically</li>
            </ol>
          </div>

          {/* Checking Status Indicator */}
          {status === 'waiting' && (
            <div className="text-center text-xs sm:text-sm text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              <span>Monitoring blockchain for payment...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
