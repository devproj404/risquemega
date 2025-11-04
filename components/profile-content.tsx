'use client';

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { MoreHorizontal, Share2, X, Eye, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
  };
}

interface ProfileContentProps {
  user: {
    id: string;
    username: string;
    email: string;
    name: string | null;
    avatar: string | null;
    bio: string | null;
    website: string | null;
    isVerified: boolean;
  };
}

// Storyboard Card Component with hover preview - Memoized for performance
const StoryboardCard = memo(function StoryboardCard({
  post
}: {
  post: Post;
}) {
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
    <div className="group">
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
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {post.isVip && (
          <div className="absolute top-2 left-2">
            <div className="bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 backdrop-blur-sm text-black text-xs px-2 py-1 rounded font-bold">
              VIP
            </div>
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
      </Link>

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

export function ProfileContent({ user }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'likes' | 'saved'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLikedPosts();
    fetchSavedPosts();
  }, []);

  const fetchLikedPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/likes');
      if (response.ok) {
        const data = await response.json();
        setLikedPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch liked posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await fetch('/api/user/saves');
      if (response.ok) {
        const data = await response.json();
        setSavedPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch saved posts:', error);
    }
  };

  const getInitial = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    return user.username.charAt(0).toUpperCase();
  };

  const handleShare = () => {
    setIsMenuOpen(false);
    setIsShareOpen(true);
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/${user.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!', {
      description: 'Share this profile with others.',
    });
  };

  const getDisplayPosts = () => {
    switch (activeTab) {
      case 'likes':
        return likedPosts;
      case 'saved':
        return savedPosts;
      case 'all':
      default:
        // Combine both and deduplicate
        const allPosts = [...likedPosts, ...savedPosts];
        const uniquePosts = allPosts.filter((post, index, self) =>
          index === self.findIndex((p) => p.id === post.id)
        );
        return uniquePosts;
    }
  };

  const displayPosts = getDisplayPosts();

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="w-full">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
        {/* Avatar */}
        <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-5xl font-semibold text-gray-300">
              {getInitial()}
            </span>
          )}
        </div>

        {/* Username */}
        <h1 className="text-2xl font-semibold text-pink-500 mb-2">
          {user.username}
        </h1>

        {/* Bio */}
        {user.bio && (
          <p className="text-gray-300 text-sm text-center max-w-md mb-2">
            {user.bio}
          </p>
        )}

        {/* Website */}
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 hover:text-pink-400 text-sm mb-3 transition"
          >
            {user.website}
          </a>
        )}

        {/* Menu Button */}
        <div className="relative mb-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="border border-gray-700 rounded px-4 py-1 hover:border-gray-600 transition"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-gray-900 rounded-lg shadow-lg border border-gray-800 z-50">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 transition rounded-lg"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">SHARE</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
       
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
            All
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`pb-3 text-sm font-medium transition relative ${
              activeTab === 'likes'
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {likedPosts.length} Likes
            {activeTab === 'likes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 text-sm font-medium transition relative ${
              activeTab === 'saved'
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {savedPosts.length} Saved
            {activeTab === 'saved' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">
              {activeTab === 'likes' ? 'No liked posts yet' :
               activeTab === 'saved' ? 'No saved posts yet' :
               'No posts yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {displayPosts.map((post) => (
              <StoryboardCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div>
                <h2 className="text-xl font-semibold text-white">Share Profile</h2>
                <p className="text-sm text-gray-400 mt-1">Share {user.username}'s profile</p>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-pink-500/10 rounded-lg p-2">
                    <Share2 className="w-5 h-5 text-pink-500" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Profile Link</p>
                </div>
                <p className="text-white text-sm break-all bg-gray-900/50 rounded-lg p-3 font-mono">
                  {typeof window !== 'undefined' && `${window.location.origin}/${user.username}`}
                </p>
              </div>
              <Button
                onClick={copyProfileLink}
                className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-pink-500/20"
              >
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
