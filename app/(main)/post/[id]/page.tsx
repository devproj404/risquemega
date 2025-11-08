'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Image as ImageIcon, Video, ArrowLeft, ArrowRight, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import NProgress from 'nprogress';
import { VIPUpgradeModal } from '@/components/vip-upgrade-modal';
import { PostDetailSkeleton } from '@/components/skeleton';
import { CategoryCard } from '@/components/category-card';
import { CollectionCard } from '@/components/collection-card';
import { HotCarousel } from '@/components/hot-carousel';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface Post {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
  categories: string[];
  tags: string[];
  actressIds: string[];
  isVip?: boolean;
  sourceUrl: string | null;
  views: number;
  createdAt: string;
  _count: {
    likes: number;
    saves: number;
  };
}

interface Creator {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}


export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [creatorPosts, setCreatorPosts] = useState<Post[]>([]);
  const [previousPost, setPreviousPost] = useState<Post | null>(null);
  const [nextPost, setNextPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSecondary, setIsLoadingSecondary] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [showFullSizeMedia, setShowFullSizeMedia] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('dead_link');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isVipUpgradeModalOpen, setIsVipUpgradeModalOpen] = useState(false);
  const [userIsVip, setUserIsVip] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ posts: any[]; actresses: any[] }>({
    posts: [],
    actresses: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  // Calculate all media items - memoized for performance
  const allMedia = useMemo(() =>
    post ? [
      ...post.imageUrls.map(url => ({ type: 'image' as const, url })),
      ...post.videoUrls.map(url => ({ type: 'video' as const, url }))
    ] : []
  , [post]);

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        setIsLoadingSecondary(true);

        const response = await fetch(`/api/posts/${postId}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
          setLikesCount(data.post._count.likes);
          setSavesCount(data.post._count.saves);

          // Track view count (fire and forget)
          fetch(`/api/posts/${postId}/view`, {
            method: 'POST',
          }).catch(err => console.error('Failed to track view:', err));

          // Set initial selected media if available
          if (data.post.imageUrls.length > 0) {
            const initialMedia = { type: 'image' as const, url: data.post.imageUrls[0] };
            setSelectedMedia(initialMedia);
            setCurrentMediaIndex(0);
          } else if (data.post.videoUrls.length > 0) {
            const initialMedia = { type: 'video' as const, url: data.post.videoUrls[0] };
            setSelectedMedia(initialMedia);
            setCurrentMediaIndex(0);
          }

          // ✅ SHOW MAIN CONTENT IMMEDIATELY - Stop blocking here
          setIsLoading(false);
          NProgress.set(0.5); // 50% - Main content loaded

          // Smoothly animate from 50% to ~70% while loading secondary data
          setTimeout(() => NProgress.inc(0.1), 100);

          // 🔄 BACKGROUND FETCH: Load secondary data asynchronously (non-blocking)
          const [creatorsData, relatedData, , , userData] = await Promise.allSettled([
            // Fetch creators
            data.post.actressIds && data.post.actressIds.length > 0
              ? Promise.all(
                  data.post.actressIds.map((id: string) =>
                    fetch(`/api/actresses/by-id/${id}`).then(res => res.ok ? res.json() : null)
                  )
                )
              : Promise.resolve([]),
            // Fetch related posts
            data.post.categories && data.post.categories.length > 0
              ? fetch(`/api/posts?category=${data.post.categories[0]}&limit=12&sort=hot`).then(res => res.ok ? res.json() : null)
              : Promise.resolve(null),
            // Fetch like status
            fetch(`/api/posts/${postId}/like`).then(res => res.ok ? res.json() : null).then(d => d && setIsLiked(d.liked)),
            // Fetch save status
            fetch(`/api/posts/${postId}/save`).then(res => res.ok ? res.json() : null).then(d => d && setIsSaved(d.saved)),
            // Fetch user
            fetch('/api/user/me').then(res => res.ok ? res.json() : null)
          ]);

          // Process creators
          if (creatorsData.status === 'fulfilled' && creatorsData.value) {
            const fetchedCreators = creatorsData.value
              .filter(result => result !== null)
              .map(result => result.actress);
            setCreators(fetchedCreators);

            // Fetch only adjacent posts for prev/next navigation (lightweight)
            if (fetchedCreators.length > 0) {
              const firstCreator = fetchedCreators[0];

              // Fetch just a small window of posts around current one
              Promise.all([
                // Fetch newer posts (limit 3)
                fetch(`/api/posts?actressId=${firstCreator.id}&limit=3&sort=createdAt&order=desc`)
                  .then(res => res.ok ? res.json() : null),
                // Fetch older posts (limit 3)
                fetch(`/api/posts?actressId=${firstCreator.id}&limit=3&sort=createdAt&order=asc`)
                  .then(res => res.ok ? res.json() : null),
              ])
                .then(([newerPosts, olderPosts]) => {
                  // Find adjacent posts
                  if (newerPosts?.posts) {
                    const newer = newerPosts.posts.find((p: Post) =>
                      p.id !== postId && new Date(p.createdAt) > new Date(data.post.createdAt)
                    );
                    if (newer) setPreviousPost(newer);
                  }

                  if (olderPosts?.posts) {
                    const older = olderPosts.posts.find((p: Post) =>
                      p.id !== postId && new Date(p.createdAt) < new Date(data.post.createdAt)
                    );
                    if (older) setNextPost(older);
                  }
                })
                .catch(err => console.error('Failed to fetch creator posts:', err));
            }
          }

          // Process related posts
          if (relatedData.status === 'fulfilled' && relatedData.value) {
            const filtered = relatedData.value.posts.filter((p: Post) => p.id !== postId);
            setRelatedPosts(filtered.slice(0, 6));
          }

          // Process user data
          if (userData.status === 'fulfilled' && userData.value?.user) {
            setUserIsVip(userData.value.user.isVip || false);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }

          // ✅ Secondary data loaded
          setIsLoadingSecondary(false);
          NProgress.done(); // 100% - All content loaded
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
        setIsLoading(false);
        setIsLoadingSecondary(false);
        NProgress.done(); // Complete on error too
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleAccessClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // If user is not logged in, redirect to login with callback
    if (!isLoggedIn) {
      const currentUrl = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    // If user is logged in but post is VIP and user is not VIP
    if (post && post.isVip && !userIsVip) {
      setIsVipUpgradeModalOpen(true);
      return;
    }

    // If user has access, open source URL in new tab (like Mega.nz)
    if (post?.sourceUrl) {
      // Close dialog if open
      setShowFullSizeMedia(false);

      // Show toast notification
      toast.success('Redirecting to content...', {
        duration: 2000,
      });

      // Open in new tab after short delay (like Mega.nz)
      setTimeout(() => {
        if (post.sourceUrl) {
          window.open(post.sourceUrl, '_blank', 'noopener,noreferrer');
        }
      }, 500);
    }
  };

  const handleCloseDialog = () => {
    setShowFullSizeMedia(false);
  };

  const handleSubmitReport = async () => {
    if (!reportType || isSubmittingReport) return;

    setIsSubmittingReport(true);
    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          description: reportDescription,
        }),
      });

      if (response.ok) {
        toast.success('Report submitted successfully');
        setIsReportModalOpen(false);
        setReportDescription('');
        setReportType('dead_link');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleLike = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
        toast.success(data.liked ? 'Added to likes' : 'Removed from likes');
      } else if (response.status === 401) {
        toast.error('Login first to like posts', {
          action: {
            label: 'Login',
            onClick: () => router.push('/login?redirect=/post/' + postId),
          },
        });
      } else {
        toast.error('Failed to update like status');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.saved);
        setSavesCount(prev => data.saved ? prev + 1 : prev - 1);
        toast.success(data.saved ? 'Added to saved' : 'Removed from saved');
      } else if (response.status === 401) {
        toast.error('Login first to save posts', {
          action: {
            label: 'Login',
            onClick: () => router.push('/login?redirect=/post/' + postId),
          },
        });
      } else {
        toast.error('Failed to update save status');
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    try {
      // Copy link to clipboard instantly
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');

      // Track share in backend asynchronously (non-blocking)
      fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
      }).catch(err => console.error('Failed to track share:', err));
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleMediaClick = (index: number) => {
    if (!post) return;

    if (index >= 0 && index < allMedia.length && allMedia[index]) {
      setCurrentMediaIndex(index);
      setSelectedMedia(allMedia[index]);
      setShowFullSizeMedia(true);
    }
  };

  // Handle next/prev navigation in dialog
  const goToNextMedia = () => {
    if (!post || allMedia.length === 0) return;

    const nextIndex = (currentMediaIndex + 1) % allMedia.length;
    setCurrentMediaIndex(nextIndex);

    if (nextIndex >= 0 && nextIndex < allMedia.length && allMedia[nextIndex]) {
      setSelectedMedia(allMedia[nextIndex]);
    }
  };

  const goToPrevMedia = () => {
    if (!post || allMedia.length === 0) return;

    const prevIndex = (currentMediaIndex - 1 + allMedia.length) % allMedia.length;
    setCurrentMediaIndex(prevIndex);

    if (prevIndex >= 0 && prevIndex < allMedia.length && allMedia[prevIndex]) {
      setSelectedMedia(allMedia[prevIndex]);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullSizeMedia) return;

      if (e.key === 'ArrowRight') {
        goToNextMedia();
      } else if (e.key === 'ArrowLeft') {
        goToPrevMedia();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullSizeMedia, currentMediaIndex, allMedia]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ posts: [], actresses: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults({
            posts: data.posts.slice(0, 5),
            actresses: data.actresses.slice(0, 5),
          });
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-gray-500">Post not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Left Column - Preview Images (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Hero Banner */}
          {(post.thumbnailUrl || (allMedia.length > 0 && allMedia[0].type === 'image')) && (
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden group">
              {/* Blurred Background Image */}
              <div className="absolute inset-0">
                <img
                  src={post.thumbnailUrl || allMedia[0].url}
                  alt=""
                  className="w-full h-full object-cover scale-110 blur-2xl"
                  loading="eager"
                  decoding="async"
                />
                {/* Dark overlay for blur */}
                <div className="absolute inset-0 bg-black/50" />
              </div>

              {/* Main Full Image */}
              <img
                src={post.thumbnailUrl || allMedia[0].url}
                alt={post.title}
                className="relative w-full h-full object-contain z-10"
                loading="eager"
                decoding="async"
              />

              {/* Dark Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-3">
                  <Link href="/explorer" className="text-white/80 hover:text-white text-xs transition">
                    HOME
                  </Link>
                  <span className="text-white/60 text-xs">›</span>
                  {post.categories && post.categories.length > 0 && (
                    <Link
                      href={`/category/${post.categories[0].toLowerCase().replace(/\s+/g, '-')}`}
                      className="bg-pink-600 hover:bg-pink-700 text-white text-xs px-2.5 py-0.5 rounded-full transition uppercase"
                    >
                      {post.categories[0]}
                    </Link>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors duration-300 cursor-default">
                  {post.title}
                </h1>

                {/* Meta Info */}
                <div className="text-white/80 text-xs group-hover:text-white/90 transition-colors duration-300">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} • {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views} VIEWS
                </div>
              </div>
            </div>
          )}

          {/* Preview Images Label */}
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Preview Images</h2>

          {/* Image Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {allMedia.map((media, index) => (
              <button
                key={index}
                onClick={() => handleMediaClick(index)}
                className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-pink-500 transition group"
              >
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Video className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>

          {/* Full Content Section */}
          {post.sourceUrl && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-800 p-2.5 rounded-lg">
                    <img
                      src="/images/mega.svg"
                      alt="Mega.nz"
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Full Content</h3>
                    <p className="text-gray-400 text-sm">Download complete collection</p>
                  </div>
                </div>
                {post.isVip ? (
                  <button
                    onClick={handleAccessClick}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2.5 rounded-lg transition-all text-sm font-bold shadow-lg shadow-yellow-500/50 flex items-center gap-2"
                  >
                    <img
                      src="/images/crown.svg"
                      alt="VIP"
                      className="w-6 h-6"
                    />
                    VIP Access
                  </button>
                ) : (
                  <button
                    onClick={handleAccessClick}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2.5 rounded-lg transition-all text-sm font-bold shadow-lg shadow-green-500/50 flex items-center gap-2"
                  >
                    <img
                      src="/images/free.svg"
                      alt="Free"
                      className="w-8 h-8"
                    />
                    Free Access
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Previous/Next Post Navigation */}
          {(previousPost || nextPost) && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                {/* Previous Post */}
                {previousPost ? (
                  <Link
                    href={`/post/${previousPost.id}`}
                    className="flex items-center gap-2 flex-1 group"
                  >
                    <div className="relative w-16 h-16 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                      {previousPost.thumbnailUrl || previousPost.imageUrls[0] ? (
                        <img
                          src={previousPost.thumbnailUrl || previousPost.imageUrls[0]}
                          alt={previousPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <ImageIcon className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-0.5">Previous</p>
                      <h4 className="text-white text-sm font-medium line-clamp-1 group-hover:text-pink-400 transition">
                        {previousPost.title}
                      </h4>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 flex-1 opacity-50">
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <p className="text-gray-600 text-xs">—</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-500 text-xs">No previous</p>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="w-px h-16 bg-gray-700"></div>

                {/* Next Post */}
                {nextPost ? (
                  <Link
                    href={`/post/${nextPost.id}`}
                    className="flex items-center gap-2 flex-1 group"
                  >
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-gray-400 text-xs mb-0.5">Next</p>
                      <h4 className="text-white text-sm font-medium line-clamp-1 group-hover:text-pink-400 transition">
                        {nextPost.title}
                      </h4>
                    </div>
                    <div className="relative w-16 h-16 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                      {nextPost.thumbnailUrl || nextPost.imageUrls[0] ? (
                        <img
                          src={nextPost.thumbnailUrl || nextPost.imageUrls[0]}
                          alt={nextPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <ImageIcon className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 flex-1 opacity-50 justify-end">
                    <div className="flex-1 text-right">
                      <p className="text-gray-500 text-xs">No next</p>
                    </div>
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <p className="text-gray-600 text-xs">—</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar (1/3 width) */}
        <div className="space-y-8">
          {/* Search Box */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search here..."
                  autoComplete="off"
                  className="flex-1 bg-zinc-800 text-zinc-200 text-sm font-mono ring-1 ring-zinc-700 focus:ring-2 focus:ring-pink-500 outline-none duration-300 placeholder:text-zinc-500 placeholder:opacity-50 rounded-full px-3 py-1.5 shadow-md focus:shadow-lg focus:shadow-pink-500/50"
                />
                <button
                  type="submit"
                  className="rounded-full bg-zinc-800 text-zinc-600 ring-1 ring-zinc-700 focus:ring-2 focus:ring-pink-500 outline-none duration-300 p-1.5 shadow-md hover:shadow-lg hover:shadow-pink-500/50 cursor-pointer transition-all hover:ring-pink-500"
                >
                  <img
                    src="/images/happy.svg"
                    alt="Search"
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </form>

            {/* Search Results Dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div className="mt-3 bg-gray-800 rounded-lg border border-gray-700 max-h-[400px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-center">
                    <p className="text-gray-500 text-xs">Searching...</p>
                  </div>
                ) : searchResults.posts.length === 0 && searchResults.actresses.length === 0 ? (
                  <div className="p-3 text-center">
                    <p className="text-gray-500 text-xs">No results found</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* Posts Results */}
                    {searchResults.posts.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">
                          Posts
                        </div>
                        {searchResults.posts.map((searchPost) => (
                          <Link
                            key={searchPost.id}
                            href={`/post/${searchPost.id}`}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition"
                          >
                            {searchPost.thumbnailUrl || searchPost.imageUrls[0] ? (
                              <img
                                src={searchPost.thumbnailUrl || searchPost.imageUrls[0]}
                                alt={searchPost.title}
                                className="w-10 h-10 object-cover rounded bg-gray-900"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{searchPost.title}</p>
                              <p className="text-gray-500 text-[10px] truncate">
                                {searchPost.views >= 1000 ? `${(searchPost.views / 1000).toFixed(1)}K` : searchPost.views} views
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Creators Results */}
                    {searchResults.actresses.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">
                          Creators
                        </div>
                        {searchResults.actresses.map((creator) => (
                          <Link
                            key={creator.id}
                            href={`/creator/${creator.slug}`}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition"
                          >
                            {creator.imageUrl ? (
                              <img
                                src={creator.imageUrl}
                                alt={creator.name}
                                className="w-8 h-8 rounded-full object-cover bg-gray-900"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{creator.name}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* View All Link */}
                    {(searchResults.posts.length > 0 || searchResults.actresses.length > 0) && (
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery)}`}
                        className="block px-3 py-2 text-center text-xs text-pink-500 hover:text-pink-400 border-t border-gray-700 font-medium"
                      >
                        View all results
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <CategoryCard categories={post.categories} />
          )}

          {/* Collections */}
          <CollectionCard creators={creators} isLoading={isLoadingSecondary} />

          {/* Hot Carousel */}
          {(isLoadingSecondary || relatedPosts.length > 0) && (
            <HotCarousel posts={relatedPosts.slice(0, 6)} isLoading={isLoadingSecondary} />
          )}
        </div>
      </div>

      {/* Full-size Media Dialog */}
      <Dialog open={showFullSizeMedia} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="w-screen h-screen max-w-none p-0 bg-black border-none flex items-center justify-center overflow-hidden [&>button:first-of-type]:hidden">
          <DialogTitle className="sr-only">Full-size media viewer</DialogTitle>

          {/* Backdrop - Click to close */}
          <div
            className="absolute inset-0 bg-black/90 z-0"
            onClick={handleCloseDialog}
          />

          {/* Custom Close Button */}
          <button
            onClick={handleCloseDialog}
            className="absolute top-4 right-4 z-30 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Media Container */}
          <div className="relative z-10 flex items-center justify-center p-4 max-w-full max-h-full">
            {selectedMedia && selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt={post.title}
                className="w-auto h-auto object-contain max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
                loading="eager"
                decoding="async"
              />
            ) : selectedMedia && selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.url}
                controls
                className="w-auto h-auto object-contain max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
          </div>

          {/* Navigation Buttons */}
          {allMedia.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white hover:bg-black/70 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevMedia();
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white hover:bg-black/70 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextMedia();
                }}
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Media Counter */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-20">
            {currentMediaIndex + 1} / {allMedia.length}
          </div>
        </DialogContent>
      </Dialog>

      {/* More Posts - Bottom */}
      <div>
        <h3 className="text-white text-xl font-semibold mb-4">Most popular</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {isLoadingSecondary ? (
            // Skeleton loaders while fetching
            [...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="relative aspect-[3/4] bg-gray-800 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              </div>
            ))
          ) : relatedPosts.length > 0 ? (
            relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/post/${relatedPost.id}`}
                className="group"
              >
                <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden mb-2">
                  {relatedPost.thumbnailUrl || relatedPost.imageUrls[0] ? (
                    <img
                      src={relatedPost.thumbnailUrl || relatedPost.imageUrls[0]}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <ImageIcon className="w-12 h-12 text-gray-600" />
                    </div>
                  )}

                  {/* VIP Badge */}
                  {relatedPost.isVip && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 backdrop-blur-sm text-black text-xs px-2 py-1 rounded font-bold">
                        VIP
                      </div>
                    </div>
                  )}

                  {/* View count */}
                  <div className="absolute bottom-2 left-2">
                    <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                      <Eye className="w-3 h-3" />
                      <span>{relatedPost.views >= 1000 ? `${(relatedPost.views / 1000).toFixed(1)}K` : relatedPost.views}</span>
                    </div>
                  </div>
                </div>
                <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-pink-400 transition">
                  {relatedPost.title}
                </h4>
                <p className="text-gray-400 text-xs mt-1">
                  {relatedPost._count.likes} VIEWS
                </p>
              </Link>
            ))
          ) : null}
        </div>
      </div>

      {/* VIP Upgrade Modal */}
      <VIPUpgradeModal isOpen={isVipUpgradeModalOpen} onClose={() => setIsVipUpgradeModalOpen(false)} />

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-lg">Report Issue</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Help us maintain quality content by reporting any issues with this post.
            </p>

            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="dead_link">Dead Link / Broken Content</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="spam">Spam</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide more information about the issue..."
                  className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {reportDescription.length}/500
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmittingReport}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
