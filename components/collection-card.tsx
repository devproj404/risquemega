'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';

interface Creator {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface CollectionCardProps {
  creators?: Creator[];
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  creators = [],
}) => {
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Rotate through creators every 1 second with fade effect
  useEffect(() => {
    if (creators.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // After fade out, change creator
      setTimeout(() => {
        setCurrentCreatorIndex((prev) => (prev + 1) % creators.length);
        setIsVisible(true);
      }, 200);
    }, 1000);

    return () => clearInterval(interval);
  }, [creators.length]);

  const currentCreator = creators[currentCreatorIndex];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900/95 border-2 border-gray-800 shadow-[20px_20px_60px_#0a0a0a,-20px_-20px_60px_#1a1a1a]">
      {/* Content */}
      <div className="relative p-3">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Collections Text (links to first creator) */}
          {creators.length > 0 && creators[0] ? (
            <Link
              href={`/creator/${creators[0].slug}`}
              className="flex items-center gap-1.5 text-white transition hover:text-pink-400"
            >
              <div className="bg-gray-800 p-1 rounded-full">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Collections</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-white">
              <div className="bg-gray-800 p-1 rounded-full">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Collections</span>
            </div>
          )}

          {/* Creator Display with rotation */}
          {creators.length > 0 && currentCreator && (
            <Link
              href={`/creator/${currentCreator.slug}`}
              className={`flex items-center gap-1.5 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              {currentCreator.imageUrl ? (
                <img
                  src={currentCreator.imageUrl}
                  alt={currentCreator.name}
                  className="w-6 h-6 rounded-full object-cover bg-gray-800 border-2 border-gray-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {currentCreator.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-white text-xs font-medium hover:text-pink-400 transition">
                {currentCreator.name}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
