'use client';

import { use, useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { User, Eye, Image as ImageIcon, Video } from 'lucide-react';
import Link from 'next/link';
import { SuggestedCreators } from '@/components/suggested-creators';

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

interface Creator {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  imageUrl: string | null;
  nationality: string | null;
}

type SortBy = 'hot' | 'new' | 'popular';

// Storyboard Card Component with hover preview - Memoized for performance
const StoryboardCard = memo(function StoryboardCard({
  post
}: {
  post: Post;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  // Preload images for smoother transitions
  useEffect(() => {
    if (hasMultipleImages) {
      allImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [allImages, hasMultipleImages]);

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
      {/* Thumbnail Container - Clickable */}
      <Link
        href={`/post/${post.id}`}
        className="block relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden mb-2 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={post.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* VIP Badge - top left */}
        {post.isVip && (
          <div className="absolute top-2 left-2">
            <div className="bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 backdrop-blur-sm text-black text-xs px-2 py-1 rounded font-bold">
              VIP
            </div>
          </div>
        )}

        {/* Media count indicators - bottom right */}
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

        {/* View count - bottom left */}
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            <Eye className="w-3 h-3" />
            <span>{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}</span>
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
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="text-gray-500 text-xs px-1.5 py-0.5 bg-gray-800/50 rounded"
              >
                {cat}
              </span>
            ))}
            {post.categories.length > 2 && (
              <span className="text-gray-500 text-xs">
                +{post.categories.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [posts, setPosts] = useState<Post[]>([]);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SortBy>('hot');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCreator();
  }, [slug]);

  useEffect(() => {
    if (creator) {
      fetchPosts();
    }
  }, [page, activeTab, creator]);

  const fetchCreator = async () => {
    try {
      const response = await fetch(`/api/actresses/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCreator(data.actress);
      }
    } catch (error) {
      console.error('Failed to fetch creator:', error);
    }
  };

  const fetchPosts = async () => {
    if (!creator) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/posts?actressId=${creator.id}&sort=${activeTab}&page=${page}&limit=30`
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = useCallback((tab: SortBy) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const handlePageClick = useCallback((pageNum: number) => {
    setPage(pageNum);
  }, []);

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages]);

  if (!creator && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Creator Not Found</h1>
          <p className="text-gray-400">The creator you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="w-full">
        {/* Creator Header */}
        <div className="flex items-center gap-3 mb-6">
          {creator.imageUrl ? (
            <img
              src={creator.imageUrl}
              alt={creator.name}
              className="w-10 h-10 rounded-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <User className="w-6 h-6 text-gray-300" />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              {creator.name}
            </h1>
            {creator.nationality && (
              <p className="text-gray-400 text-sm">{creator.nationality}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-800 mb-6">
          <button
            onClick={() => handleTabChange('hot')}
            className={`pb-3 text-base font-medium transition relative uppercase ${
              activeTab === 'hot'
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            HOT
            {activeTab === 'hot' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('new')}
            className={`pb-3 text-base font-medium transition relative uppercase ${
              activeTab === 'new'
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            NEW
            {activeTab === 'new' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('popular')}
            className={`pb-3 text-base font-medium transition relative uppercase ${
              activeTab === 'popular'
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            POPULAR
            {activeTab === 'popular' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No posts from this creator yet</p>
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
                  Previous
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
                  Next
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
