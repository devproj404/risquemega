'use client';

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Eye, Image as ImageIcon, Home, Video, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { SuggestedCreators } from './suggested-creators';
import { ExplorerSkeleton, ThumbnailSkeleton } from './skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  author?: {
    id: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
  _count: {
    likes: number;
  };
}

type TabType = 'hot' | 'new';

// Storyboard Card Component with hover preview - Memoized for performance
const StoryboardCard = memo(function StoryboardCard({
  post
}: {
  post: Post;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize computed values to avoid recalculation
  const allImages = useMemo(() =>
    post.thumbnailUrl
      ? [post.thumbnailUrl, ...post.imageUrls]
      : post.imageUrls,
    [post.thumbnailUrl, post.imageUrls]
  );

  const hasMultipleImages = useMemo(() => allImages.length > 1, [allImages.length]);
  const displayImage = useMemo(() => allImages[currentImageIndex] || allImages[0], [allImages, currentImageIndex]);

  const DURATION_PER_IMAGE = 1000; // 1 second per image

  // Only preload images when hovering starts (lazy preload)
  useEffect(() => {
    if (isHovering && hasMultipleImages) {
      // Preload only when user shows interest by hovering
      allImages.slice(1, 4).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [isHovering, hasMultipleImages, allImages]);

  // Memoize event handlers to prevent recreation
  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  useEffect(() => {
    if (isHovering && hasMultipleImages) {
      // Reset to first image when starting hover
      setCurrentImageIndex(0);

      // Image cycling - starts immediately
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => {
          if (prev >= allImages.length - 1) return 0;
          return prev + 1;
        });
      }, DURATION_PER_IMAGE);
    } else {
      // Cleanup interval
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
    <div className="group">
      {/* Thumbnail Container - Clickable with Glassmorphism */}
      <Link
        href={`/post/${post.id}`}
        className="block relative aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden mb-3 cursor-pointer shadow-lg transition-all duration-300 ring-2 ring-gray-800/50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Skeleton Loader */}
        {!imageLoaded && <ThumbnailSkeleton />}

        {displayImage ? (
          <img
            src={displayImage}
            alt={post.title}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              setImageLoaded(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* VIP Badge - top left with enhanced glassmorphism */}
        {post.isVip && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs px-2.5 py-1 rounded-full font-bold shadow-lg backdrop-blur-sm">
              VIP
            </div>
          </div>
        )}

        {/* Media count indicators - bottom right with enhanced glassmorphism */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 items-end z-10">
          {post.imageUrls?.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-900/70 backdrop-blur-md border border-gray-700/50 text-white text-xs px-2.5 py-1 rounded-full shadow-lg">
              <ImageIcon className="w-3 h-3" />
              <span className="font-medium">{post.imageUrls.length}</span>
            </div>
          )}
          {post.videoUrls?.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-900/70 backdrop-blur-md border border-gray-700/50 text-white text-xs px-2.5 py-1 rounded-full shadow-lg">
              <Video className="w-3 h-3" />
              <span className="font-medium">{post.videoUrls.length}</span>
            </div>
          )}
        </div>

        {/* View count - bottom left with enhanced glassmorphism */}
        <div className="absolute bottom-3 left-3 z-10">
          <div className="flex items-center gap-1.5 bg-gray-900/70 backdrop-blur-md border border-gray-700/50 text-white text-xs px-2.5 py-1 rounded-full shadow-lg">
            <Eye className="w-3 h-3" />
            <span className="font-medium">{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}</span>
          </div>
        </div>
      </Link>

      {/* Post Info */}
      <div>
        <Link href={`/post/${post.id}`}>
          <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 group-hover:text-pink-400 transition cursor-pointer">
            {post.title}
          </h3>
        </Link>
        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.categories.slice(0, 2).map((category) => (
              <Link
                key={category}
                href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-white text-xs px-2.5 py-1 bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-full font-medium hover:bg-gray-800/80 hover:border-gray-600/50 transition shadow-md"
              >
                {category}
              </Link>
            ))}
            {post.categories.length > 2 && (
              <span className="text-gray-400 text-xs px-2 py-1 bg-gray-900/50 backdrop-blur-md border border-gray-800/50 rounded-full font-medium shadow-sm">
                +{post.categories.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

type SortType = 'all' | 'vip' | 'free' | 'views' | 'likes';

// Cache duration constant - outside component to prevent recreation
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function HomeContent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('hot');
  const [sortFilter, setSortFilter] = useState<SortType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Store data separately for each tab/filter/page combination
  const [dataCache, setDataCache] = useState<Map<string, { posts: Post[]; totalPages: number; timestamp: number }>>(new Map());

  // Memoize cache key to avoid recalculation
  const cacheKey = useMemo(() => `${activeTab}-${sortFilter}-${page}`, [activeTab, sortFilter, page]);

  // Get current cached data for active key
  const currentCache = useMemo(() => {
    const cached = dataCache.get(cacheKey);
    if (!cached) return null;

    const isExpired = (Date.now() - cached.timestamp) >= CACHE_DURATION;
    return isExpired ? null : cached;
  }, [dataCache, cacheKey]);

  // Current posts and totalPages derived from cache
  const posts = useMemo(() => currentCache?.posts || [], [currentCache]);
  const totalPages = useMemo(() => currentCache?.totalPages || 1, [currentCache]);

  // Memoize fetchPosts to avoid recreation on every render
  const fetchPosts = useCallback(async () => {
    // If we have valid cached data, don't fetch
    if (currentCache) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch fresh data
      const params = new URLSearchParams({
        sort: activeTab,
        page: page.toString(),
        limit: '30',
      });

      // Add sort filter if not 'all'
      if (sortFilter !== 'all') {
        params.append('filter', sortFilter);
      }

      const response = await fetch(`/api/posts?${params}`);
      if (response.ok) {
        const data = await response.json();

        // Store in cache using functional update to avoid stale closures
        setDataCache((prevCache) => {
          const newCache = new Map(prevCache);
          newCache.set(cacheKey, {
            posts: data.posts,
            totalPages: data.pagination.totalPages,
            timestamp: Date.now(),
          });
          return newCache;
        });
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, sortFilter, cacheKey, currentCache]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Memoize tab change handlers
  const handleHotTab = useCallback(() => {
    setActiveTab('hot');
    setPage(1);
  }, []);

  const handleNewTab = useCallback(() => {
    setActiveTab('new');
    setPage(1);
  }, []);

  // Memoize pagination handlers
  const handlePreviousPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const handlePageClick = useCallback((pageNum: number) => {
    setPage(pageNum);
  }, []);

  const handleSortChange = useCallback((value: SortType) => {
    setSortFilter(value);
    setPage(1);
  }, []);

  // Memoize page numbers calculation
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [page, totalPages]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="w-full">
        {/* Explore Header */}
        <div className="flex items-center gap-3 mb-6">
          <Home className="w-6 h-6 text-gray-300" />
          <h1 className="text-2xl font-semibold text-white">{t('explore')}</h1>
        </div>

        {/* Tabs and Sort - Glassmorphism */}
        <div className="flex items-center justify-between mb-6">
          {/* Tab Buttons with Glassmorphism */}
          <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-md border border-gray-800/50 rounded-full p-1.5 shadow-lg">
            <button
              onClick={handleHotTab}
              className={`px-6 py-2 text-sm font-semibold transition-all rounded-full uppercase ${
                activeTab === 'hot'
                  ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/50'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              {t('hot')}
            </button>
            <button
              onClick={handleNewTab}
              className={`px-6 py-2 text-sm font-semibold transition-all rounded-full uppercase ${
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              {t('new')}
            </button>
          </div>

          {/* Sort Filter with Glassmorphism */}
          <div className="flex items-center gap-2">
            <Select value={sortFilter} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[150px] bg-gray-900/50 backdrop-blur-md border border-gray-800/50 text-white h-10 rounded-lg shadow-lg hover:bg-gray-800/50 transition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/95 backdrop-blur-lg border-gray-800 shadow-2xl">
                <SelectItem value="all" className="text-gray-300 hover:text-white hover:bg-gray-800/80 cursor-pointer">
                  All Posts
                </SelectItem>
                <SelectItem value="vip" className="text-gray-300 hover:text-white hover:bg-gray-800/80 cursor-pointer">
                  VIP Only
                </SelectItem>
                <SelectItem value="free" className="text-gray-300 hover:text-white hover:bg-gray-800/80 cursor-pointer">
                  Free Only
                </SelectItem>
                <SelectItem value="views" className="text-gray-300 hover:text-white hover:bg-gray-800/80 cursor-pointer">
                  Most Views
                </SelectItem>
                <SelectItem value="likes" className="text-gray-300 hover:text-white hover:bg-gray-800/80 cursor-pointer">
                  Most Likes
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <ExplorerSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">{t('noPostsYet')}</p>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {posts.map((post) => (
                <StoryboardCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-1.5">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {t('previous')}
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="text-gray-500 px-1 text-xs">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => handlePageClick(pageNum as number)}
                        className={`w-8 h-8 rounded transition text-xs ${
                          page === pageNum
                            ? 'bg-pink-600 text-white font-medium'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {t('next')}
                </button>
              </div>
            )}

            {/* Suggested Creators */}
            <SuggestedCreators />
          </>
        )}
      </div>
    </main>
  );
}
