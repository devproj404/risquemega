'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const type = searchParams?.get('type');
  const orderId = searchParams?.get('orderId');

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/vip');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
          {/* Success Indicator */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full mx-auto flex items-center justify-center">
              <div className="text-4xl text-green-500">✓</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Payment Submitted
          </h1>

          {/* Message */}
          <p className="text-gray-400 mb-6">
            Your payment has been submitted successfully. You will receive VIP access once the payment is confirmed.
          </p>

          {/* Order ID */}
          {orderId && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">Order ID</p>
              <p className="text-sm text-gray-300 font-mono break-all">{orderId}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-800/30 rounded-lg p-4 mb-6 text-left">
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-gray-600">•</span>
                <span>Payment confirmation may take a few minutes</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-600">•</span>
                <span>Your VIP status will be activated automatically</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-600">•</span>
                <span>You will receive a notification once confirmed</span>
              </li>
            </ul>
          </div>

          {/* Countdown */}
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to VIP page in {countdown} seconds...
          </p>

          {/* Action Button */}
          <Link
            href="/vip"
            className="block w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Go to VIP Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
