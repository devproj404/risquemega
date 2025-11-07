'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  imageUrls: string[];
  views: number;
  categories: string[];
}

interface HotCarouselProps {
  posts: Post[];
  isLoading?: boolean;
}

export const HotCarousel: React.FC<HotCarouselProps> = ({ posts, isLoading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const rotationDuration = 5000; // 5 seconds per post
  const intervalStep = 50; // Update every 50ms

  // Auto-rotate through posts with progress bar
  useEffect(() => {
    if (posts.length <= 1) return;

    let progressTimer: NodeJS.Timeout | null = null;
    let rotateTimer: NodeJS.Timeout;

    const startProgress = () => {
      // Clear any existing progress timer first
      if (progressTimer) {
        clearInterval(progressTimer);
      }

      setProgress(0);
      let elapsed = 0;

      progressTimer = setInterval(() => {
        elapsed += intervalStep;
        const newProgress = (elapsed / rotationDuration) * 100;

        if (newProgress >= 100) {
          setProgress(100);
          if (progressTimer) clearInterval(progressTimer);
        } else {
          setProgress(newProgress);
        }
      }, intervalStep);
    };

    const rotate = () => {
      // Trigger slide animation
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
        setIsAnimating(false);
        // Restart progress after rotation completes
        startProgress();
      }, 500);
    };

    // Start initial progress
    startProgress();

    // Set rotation timer
    rotateTimer = setInterval(() => {
      rotate();
    }, rotationDuration);

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      clearInterval(rotateTimer);
    };
  }, [posts.length]);

  // Show skeleton loader when loading
  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)]">
        <div className="relative">
          {/* Progress Bar Skeleton */}
          <div className="w-full h-1.5 bg-gray-800/50 overflow-hidden animate-pulse" />

          {/* Header */}
          <div className="px-3 pt-2 pb-2 bg-black/40 backdrop-blur-sm border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">HOT</h3>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                <span>Trending</span>
              </div>
            </div>
          </div>

          {/* Skeleton Content */}
          <div className="p-3 animate-pulse">
            <div className="w-full aspect-[3/4] bg-gray-800 rounded-2xl"></div>
          </div>

          {/* Indicators Skeleton */}
          <div className="flex justify-center gap-1.5 py-3 px-3 bg-black/20">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)]">
      {/* Content */}
      <div className="relative">
        {/* Progress Bar - Top Position */}
        <div className="w-full h-1.5 bg-gray-800/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 transition-all duration-100 ease-linear shadow-lg shadow-yellow-500/80"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-3 pt-2 pb-2 bg-black/40 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">HOT</h3>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
              <span>Trending</span>
            </div>
          </div>
        </div>

        {/* Slider Container */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {posts.map((post, index) => {
              const imageUrl = post.thumbnailUrl || post.imageUrls[0];
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block p-3 min-w-full"
                >
                  {/* Image Container with Rounded Corners */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-black shadow-2xl">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-2xl">
                        <span className="text-gray-600 text-xs">No image</span>
                      </div>
                    )}

                    {/* Category Badge */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-yellow-600 text-black text-[10px] px-2 py-1 rounded-full font-bold uppercase shadow-xl backdrop-blur-sm">
                          {post.categories[0]}
                        </div>
                      </div>
                    )}

                    {/* Dark Gradient Overlay - Stronger */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent rounded-2xl" />

                    {/* Post Info Overlay - Inside Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 pb-3">
                      <h4 className="text-white font-bold text-xs mb-1.5 line-clamp-2 hover:text-yellow-400 transition drop-shadow-lg">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-white/90 text-[10px]">
                        <Eye className="w-3 h-3" />
                        <span className="font-semibold">
                          {post.views >= 1000
                            ? `${(post.views / 1000).toFixed(1)}K`
                            : post.views}{' '}
                          VIEWS
                        </span>
                      </div>
                    </div>

                    {/* Yellow Border Accent on Hover */}
                    <div className="absolute inset-0 ring-2 ring-transparent hover:ring-yellow-500 transition-all pointer-events-none rounded-2xl" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Indicators */}
        {posts.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3 px-3 bg-black/20">
            {posts.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setProgress(0);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-lg shadow-yellow-500/50'
                    : 'w-1.5 bg-gray-700 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
