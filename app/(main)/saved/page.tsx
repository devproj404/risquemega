'use client';

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Bookmark, Eye, Image as ImageIcon, Video } from 'lucide-react';
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
      className="group cursor-pointer"
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
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
          {post.imageUrls?.length > 0 && (
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              <ImageIcon className="w-3 h-3" />
              <span>{post.imageUrls.length}</span>
            </div>
          )}
          {post.videoUrls?.length > 0 && (
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              <Video className="w-3 h-3" />
              <span>{post.videoUrls.length}</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            <Eye className="w-3 h-3" />
            <span>{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 group-hover:text-pink-400 transition">
          {post.title}
        </h3>
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-gray-500 text-xs px-1.5 py-0.5 bg-gray-800/50 rounded"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
});

export default function SavedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/saves');
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('Failed to fetch saved posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <Bookmark className="w-6 h-6 text-blue-500 fill-current" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Saved</h1>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <Bookmark className="w-16 h-16 text-gray-700 mb-4" />
          <p className="text-gray-500 text-base mb-2">No saved posts yet</p>
          <p className="text-gray-600 text-sm">Posts you save will appear here</p>
        </div>
      ) : (
        /* Posts Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {posts.map((post) => (
            <StoryboardCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
