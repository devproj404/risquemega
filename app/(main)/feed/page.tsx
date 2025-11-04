'use client';

import { useState } from 'react';
import { Rss } from 'lucide-react';

type FeedTab = 'all' | 'posts' | 'reposts';

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('all');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <Rss className="w-6 h-6 text-gray-300" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Feed</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-medium transition relative ${
            activeTab === 'all'
              ? 'text-pink-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          ALL
          {activeTab === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 text-sm font-medium transition relative ${
            activeTab === 'posts'
              ? 'text-pink-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          POSTS
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reposts')}
          className={`pb-3 text-sm font-medium transition relative ${
            activeTab === 'reposts'
              ? 'text-pink-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          REPOSTS
          {activeTab === 'reposts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          )}
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-start py-8">
        <p className="text-gray-400 text-base">Empty, you're not following anyone yet.</p>
      </div>
    </div>
  );
}
