'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import Link from 'next/link';

interface Creator {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  bio: string | null;
}

export function SuggestedCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedCreators();
  }, []);

  const fetchSuggestedCreators = async () => {
    try {
      const response = await fetch('/api/actresses/suggested');
      if (response.ok) {
        const data = await response.json();
        setCreators(data.actresses);
      }
    } catch (error) {
      console.error('Error fetching suggested creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Suggested Creators</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-24">
              <div className="w-24 h-24 bg-gray-800 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-800 rounded mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (creators.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-white">Suggested Creators</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creator/${creator.slug}`}
            className="flex-shrink-0 w-24 group"
          >
            {/* Circle Avatar */}
            <div className="relative w-24 h-24 mb-2">
              {creator.imageUrl ? (
                <img
                  src={creator.imageUrl}
                  alt={creator.name}
                  className="w-full h-full object-contain rounded-full border-2 border-gray-800 group-hover:border-pink-500 transition bg-gray-900"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-full border-2 border-gray-700 group-hover:border-pink-500 transition">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>

            {/* Name */}
            <p className="text-white text-sm font-medium text-center line-clamp-2 group-hover:text-pink-400 transition">
              {creator.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
