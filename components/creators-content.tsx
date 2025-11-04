'use client';

import { useState, useEffect, memo, useCallback, useRef, useMemo } from 'react';
import { Users, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

interface Creator {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  imageUrl: string | null;
  nationality: string | null;
}

interface Post {
  id: string;
  thumbnailUrl: string | null;
  imageUrls: string[];
}

// Bento Grid Creator Card Component with Storyboard
const CreatorCard = memo(function CreatorCard({
  creator,
  size = 'normal'
}: {
  creator: Creator;
  size?: 'normal' | 'wide' | 'tall' | 'large';
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [creatorPosts, setCreatorPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRef = useRef(false);

  const DURATION_PER_IMAGE = 1000;

  // Get all available images from posts
  const allImages = useMemo(() => {
    const images: string[] = [];

    // Add creator imageUrl as first image if available
    if (creator.imageUrl) {
      images.push(creator.imageUrl);
    }

    // Add images from posts
    creatorPosts.forEach(post => {
      if (post.thumbnailUrl) {
        images.push(post.thumbnailUrl);
      } else if (post.imageUrls.length > 0) {
        images.push(post.imageUrls[0]);
      }
    });

    return images;
  }, [creator.imageUrl, creatorPosts]);

  const hasMultipleImages = useMemo(() => allImages.length > 1, [allImages.length]);
  const displayImage = useMemo(() =>
    allImages[currentImageIndex] || allImages[0] || creator.imageUrl,
    [allImages, currentImageIndex, creator.imageUrl]
  );

  // Fetch posts for this creator on first hover
  const fetchCreatorPosts = useCallback(async () => {
    if (hasFetchedRef.current || isLoadingPosts) return;

    try {
      hasFetchedRef.current = true;
      setIsLoadingPosts(true);

      const response = await fetch(`/api/posts?limit=10&sort=hot`);
      if (response.ok) {
        const data = await response.json();
        // Filter posts that include this creator
        const filtered = data.posts.filter((post: any) =>
          post.actressIds?.includes(creator.id)
        );
        setCreatorPosts(filtered || []);
      }
    } catch (error) {
      console.error('Failed to fetch creator posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [creator.id, isLoadingPosts]);

  // Preload images
  useEffect(() => {
    if (hasMultipleImages && creatorPosts.length > 0) {
      allImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [allImages, hasMultipleImages, creatorPosts.length]);

  // Memoize event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    fetchCreatorPosts();
  }, [fetchCreatorPosts]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Storyboard cycling effect
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

  // Determine aspect ratio based on size
  const getAspectClass = () => {
    switch (size) {
      case 'wide':
        return 'aspect-[2/1]'; // Wide card
      case 'tall':
        return 'aspect-[2/3]'; // Tall card
      case 'large':
        return 'aspect-[4/3]'; // Large card
      default:
        return 'aspect-square'; // Normal square
    }
  };

  return (
    <Link
      href={`/creator/${creator.slug}`}
      className="group cursor-pointer block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Creator Card Container */}
      <div className={`relative ${getAspectClass()} bg-gray-900 rounded-lg overflow-hidden mb-2`}>
        {displayImage ? (
          <>
            {/* Blurred Background */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110"
              style={{ backgroundImage: `url(${displayImage})` }}
            />
            {/* Main Image */}
            <img
              src={displayImage}
              alt={creator.name}
              className="relative w-full h-full object-contain transition-opacity duration-300"
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Creator Info Overlay - Bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-white text-lg font-bold mb-1 group-hover:text-pink-400 transition line-clamp-2">
            {creator.name}
          </h3>
          {creator.nationality && (
            <p className="text-gray-300 text-xs">
              {creator.nationality}
            </p>
          )}
        </div>

        {/* Post Count Badge - Top Right */}
        {creatorPosts.length > 0 && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              <ImageIcon className="w-3 h-3" />
              <span>{creatorPosts.length}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
});

export function CreatorsContent() {
  const { t } = useTranslation();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch creators
  const fetchCreators = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/actresses?page=${page}&limit=30`);
      if (response.ok) {
        const data = await response.json();
        setCreators(data.actresses);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  // Bento Grid Pattern Algorithm
  // Pattern repeats every 6 items: [large, normal, wide, tall, normal, normal]
  const getBentoSize = (index: number): 'normal' | 'wide' | 'tall' | 'large' => {
    const pattern = index % 6;
    switch (pattern) {
      case 0:
        return 'large'; // Every 6th item (0, 6, 12...)
      case 2:
        return 'wide'; // Pattern position 2 (2, 8, 14...)
      case 3:
        return 'tall'; // Pattern position 3 (3, 9, 15...)
      default:
        return 'normal'; // 1, 4, 5, 7, 10, 11...
    }
  };

  // Pagination handlers
  const handlePreviousPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <Users className="w-6 h-6 text-gray-300" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Creators</h1>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No creators found</p>
          </div>
        ) : (
          <>
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
              {creators.map((creator, index) => {
                const size = getBentoSize(index);

                // Grid span classes based on size
                const gridClass =
                  size === 'large' ? 'col-span-2 row-span-2' :
                  size === 'wide' ? 'col-span-2' :
                  size === 'tall' ? 'row-span-2' :
                  '';

                return (
                  <div key={creator.id} className={gridClass}>
                    <CreatorCard creator={creator} size={size} />
                  </div>
                );
              })}
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

                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>Page {page} of {totalPages}</span>
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
          </>
        )}
      </div>
    </main>
  );
}
