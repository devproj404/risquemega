'use client';

import { useState, useEffect, memo, useCallback, useRef, useMemo } from 'react';
import { Grid, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count: {
    posts: number;
  };
}

interface Post {
  id: string;
  thumbnailUrl: string | null;
  imageUrls: string[];
}

// Category Card Component with Storyboard
const CategoryCard = memo(function CategoryCard({ category }: { category: Category }) {
  const [isHovering, setIsHovering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [categoryPosts, setCategoryPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRef = useRef(false);

  const DURATION_PER_IMAGE = 1000; // 1 second per image

  // Get all available images from posts
  const allImages = useMemo(() => {
    const images: string[] = [];

    // Add category imageUrl as first image if available
    if (category.imageUrl) {
      images.push(category.imageUrl);
    }

    // Add images from posts
    categoryPosts.forEach(post => {
      if (post.thumbnailUrl) {
        images.push(post.thumbnailUrl);
      } else if (post.imageUrls.length > 0) {
        images.push(post.imageUrls[0]);
      }
    });

    return images;
  }, [category.imageUrl, categoryPosts]);

  const hasMultipleImages = useMemo(() => allImages.length > 1, [allImages.length]);
  const displayImage = useMemo(() => allImages[currentImageIndex] || allImages[0] || category.imageUrl, [allImages, currentImageIndex, category.imageUrl]);

  // Fetch posts for this category on first hover
  const fetchCategoryPosts = useCallback(async () => {
    if (hasFetchedRef.current || isLoadingPosts) return;

    try {
      hasFetchedRef.current = true;
      setIsLoadingPosts(true);

      const response = await fetch(`/api/posts?category=${category.name}&limit=10&sort=hot`);
      if (response.ok) {
        const data = await response.json();
        setCategoryPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch category posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [category.name, isLoadingPosts]);

  // Preload images for smooth transitions
  useEffect(() => {
    if (hasMultipleImages && categoryPosts.length > 0) {
      allImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [allImages, hasMultipleImages, categoryPosts.length]);

  // Memoize event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    fetchCategoryPosts();
  }, [fetchCategoryPosts]);

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

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group cursor-pointer block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Square Thumbnail Container */}
      <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden mb-2">
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
              alt={category.name}
              className="relative w-full h-full object-contain transition-opacity duration-300"
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Post Count - Bottom Right */}
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            <Grid className="w-3 h-3" />
            <span>{category._count.posts.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Category Name Below Card */}
      <div className="px-1">
        <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-pink-400 transition">
          {category.name}
        </h3>
      </div>
    </Link>
  );
});

export function CategoriesContent() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <Grid className="w-6 h-6 text-gray-300" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Categories</h1>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No categories found</p>
          </div>
        ) : (
          /* Categories Grid - Square cards */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
