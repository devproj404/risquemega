'use client';

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Eye, Image as ImageIcon, Video } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
  categories: string[];
  views: number;
  createdAt: string;
  isVip?: boolean;
  _count: {
    likes: number;
    saves: number;
  };
}

// Storyboard Card Component with hover preview
const StoryboardCard = memo(function StoryboardCard({ post }: { post: Post }) {
  const [isHovering, setIsHovering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const allImages = useMemo(() =>
    post.thumbnailUrl
      ? [post.thumbnailUrl, ...post.imageUrls]
      : post.imageUrls,
    [post.thumbnailUrl, post.imageUrls]
  );

  const hasMultipleImages = useMemo(() => allImages.length > 1, [allImages.length]);
  const displayImage = useMemo(() => allImages[currentImageIndex] || allImages[0], [allImages, currentImageIndex]);

  const DURATION_PER_IMAGE = 1000;

  useEffect(() => {
    if (hasMultipleImages) {
      allImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [allImages, hasMultipleImages]);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  useEffect(() => {
    if (isHovering && hasMultipleImages) {
      setCurrentImageIndex(0);
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => {
          if (prev >= allImages.length - 1) return 0;
          return prev + 1;
        });
      }, DURATION_PER_IMAGE);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovering, hasMultipleImages, allImages.length]);

  return (
    <Link
      href={`/post/${post.id}`}
      className="group cursor-pointer flex-shrink-0 w-40"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden mb-2">
        {displayImage ? (
          <img
            src={displayImage}
            alt={post.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-8 h-8 text-gray-600" />
          </div>
        )}

        {/* VIP Badge - top left */}
        {post.isVip && (
          <div className="absolute top-2 left-2">
            <div className="bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 backdrop-blur-sm text-black text-xs px-1.5 py-0.5 rounded font-bold">
              VIP
            </div>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
          {post.imageUrls?.length > 0 && (
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
              <ImageIcon className="w-3 h-3" />
              <span>{post.imageUrls.length}</span>
            </div>
          )}
          {post.videoUrls?.length > 0 && (
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
              <Video className="w-3 h-3" />
              <span>{post.videoUrls.length}</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
            <Eye className="w-3 h-3" />
            <span>{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 group-hover:text-pink-400 transition">
          {post.title}
        </h3>
      </div>
    </Link>
  );
});

export function SuggestedContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedContent();
  }, []);

  const fetchSuggestedContent = async () => {
    try {
      const response = await fetch('/api/posts/suggested');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch suggested content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 mb-12">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-medium text-white">Suggested content</h2>
      </div>

      {/* Horizontal Scrollable Post List */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {posts.map((post) => (
            <StoryboardCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
