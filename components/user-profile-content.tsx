'use client';

import { useState } from 'react';
import { MoreHorizontal, MessageCircle, Check, Search, Share2, Flag, EyeOff, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';

interface UserProfileContentProps {
  user: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
    bio: string | null;
    website: string | null;
    isVerified: boolean;
    _count: {
      posts: number;
      followers: number;
      following: number;
    };
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  isLoggedIn: boolean;
}

export function UserProfileContent({
  user,
  isOwnProfile,
  isFollowing: initialIsFollowing,
  isLoggedIn,
}: UserProfileContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'reposts'>('all');
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportReason, setReportReason] = useState('');

  const getInitial = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    return user.username.charAt(0).toUpperCase();
  };

  const handleFollow = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isFollowing ? '/api/user/unfollow' : '/api/user/follow';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        router.refresh();
        toast.success(
          isFollowing ? `Unfollowed @${user.username}` : `Following @${user.username}`,
          {
            description: isFollowing
              ? 'You will no longer see their posts in your feed.'
              : 'You will now see their posts in your feed.',
          }
        );
      } else {
        toast.error('Action failed', {
          description: 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      toast.error('Action failed', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    // Create or get chat with this user
    try {
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/chat/${data.chatId}`);
      } else {
        toast.error('Failed to create chat', {
          description: 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create chat', {
        description: 'An error occurred. Please try again.',
      });
    }
  };

  const handleSearch = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(true);
  };

  const handleShare = () => {
    setIsMenuOpen(false);
    setIsShareOpen(true);
  };

  const handleReport = () => {
    setIsMenuOpen(false);
    setIsReportOpen(true);
  };

  const handleHide = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setIsMenuOpen(false);
    try {
      const response = await fetch('/api/user/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        toast.success(`Hidden @${user.username}`, {
          description: 'You will no longer see content from this user.',
        });
        router.push('/');
        router.refresh();
      } else {
        toast.error('Failed to hide user', {
          description: 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Failed to hide user:', error);
      toast.error('Failed to hide user', {
        description: 'An error occurred. Please try again.',
      });
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          reason: reportReason,
        }),
      });

      if (response.ok) {
        setReportReason('');
        setIsReportOpen(false);
        toast.success('Report submitted successfully', {
          description: 'Thank you for helping keep our community safe.',
        });
      } else {
        toast.error('Failed to submit report', {
          description: 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/${user.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!', {
      description: 'Share this profile with others.',
    });
  };

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

          {/* Username with verification */}
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-2xl font-semibold text-pink-500">
              {user.username}
            </h1>
            {user.isVerified && (
              <Image
                src="/images/verify.svg"
                alt="Verified"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            )}
          </div>

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

          {/* Action Buttons */}
          {isOwnProfile ? (
            <button className="border border-gray-700 rounded px-4 py-1 mb-6 hover:border-gray-600 transition">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <div className="flex items-center gap-3 mb-6">
              <Button
                onClick={handleFollow}
                disabled={isLoading}
                className={`px-6 ${
                  isFollowing
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    FOLLOWING
                  </>
                ) : (
                  `+ ${t('follow')}`
                )}
              </Button>
              <Button
                onClick={handleMessage}
                variant="outline"
                className="border-pink-600 text-pink-500 hover:bg-pink-600 hover:text-white px-4"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="border border-gray-700 rounded px-4 py-2 hover:border-gray-600 transition"
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
                    <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-lg border border-gray-800 z-50">
                      <button
                        onClick={handleSearch}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 transition border-b border-gray-800 rounded-t-lg"
                      >
                        <Search className="w-5 h-5" />
                        <span className="text-sm font-medium">SEARCH</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 transition border-b border-gray-800"
                      >
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm font-medium">SHARE</span>
                      </button>
                      <button
                        onClick={handleReport}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 transition border-b border-gray-800"
                      >
                        <Flag className="w-5 h-5" />
                        <span className="text-sm font-medium">REPORT</span>
                      </button>
                      <button
                        onClick={handleHide}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 transition rounded-b-lg"
                      >
                        <EyeOff className="w-5 h-5" />
                        <span className="text-sm font-medium">HIDE</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Badges/Icons placeholder */}
          <div className="flex items-center gap-2 mb-6">
            {/* Add badges here if needed */}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 text-sm text-gray-400">
            <div>
              <span className="font-semibold">{user._count.posts}</span> {t('albums')}
            </div>
            <div>
              <span className="font-semibold">0</span> {t('views')}
            </div>
            <div>
              <span className="font-semibold">{user._count.followers}</span> {t('followers')}
            </div>
            <div>
              <span className="font-semibold">{user._count.following}</span> {t('following')}
            </div>
          </div>
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
            {t('all')}
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
            {user._count.posts} {t('posts')}
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
            0 {t('reposts')}
            {activeTab === 'reposts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
        </div>

        {/* Content Grid - will be populated with posts later */}
        <div className="text-center py-16">
          <p className="text-gray-500">{t('noPostsYet')}</p>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div>
                <h2 className="text-xl font-semibold text-white">Search Posts</h2>
                <p className="text-sm text-gray-400 mt-1">Find content in {user.username}'s posts</p>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in posts..."
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  autoFocus
                />
              </div>
              <Button
                onClick={() => {
                  // TODO: Implement search functionality
                  console.log('Searching for:', searchQuery);
                  setIsSearchOpen(false);
                }}
                className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-pink-500/20"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div>
                <h2 className="text-xl font-semibold text-white">Report User</h2>
                <p className="text-sm text-gray-400 mt-1">Help us keep the community safe</p>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Reporting @{user.username}</p>
                    <p className="text-gray-400 text-xs">
                      Please provide details about why you're reporting this user
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue (spam, harassment, inappropriate content, etc.)..."
                  rows={4}
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 resize-none transition-all"
                  autoFocus
                />
                <p className="text-gray-500 text-xs mt-2">
                  {reportReason.length}/500 characters
                </p>
              </div>
              <Button
                onClick={submitReport}
                disabled={!reportReason.trim() || isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
