'use client';

import { Crown, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VIPUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VIPUpgradeModal({ isOpen, onClose }: VIPUpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/vip');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5" />
            VIP Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
              <Crown className="w-10 h-10 text-gray-600" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white">
              This is VIP Exclusive Content
            </h3>
            <p className="text-gray-400">
              Upgrade to VIP to unlock this post and get access to all premium content
            </p>
          </div>

          {/* Features */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-300">VIP Benefits:</p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Access to all VIP-exclusive content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Premium VIP badge on your profile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white mt-0.5">✓</span>
                <span>Lifetime access - one-time payment of $50</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Upgrade to VIP
            </button>
            <button
              onClick={onClose}
              className="w-full bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700 font-medium py-3 px-4 rounded-lg transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
