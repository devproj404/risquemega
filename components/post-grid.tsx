'use client';

import Link from 'next/link';
import { Eye, Heart, Image as ImageIcon } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  category?: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
  };
  _count: {
    likes: number;
  };
}

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="group cursor-pointer"
        >
          {/* Thumbnail Container */}
          <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden mb-2">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <ImageIcon className="w-12 h-12 text-gray-600" />
              </div>
            )}

            {/* Overlay with stats */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
              {/* View count */}
              <div className="flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                <Eye className="w-3 h-3" />
                <span>0</span>
              </div>

              {/* Media type indicator */}
              {post.videoUrl && (
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                  VIDEO
                </div>
              )}
            </div>

            {/* Bottom overlay with likes */}
            <div className="absolute bottom-2 left-2">
              <div className="flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                <Heart className="w-3 h-3" />
                <span>{formatCount(post._count.likes)}</span>
              </div>
            </div>
          </div>

          {/* Post Info */}
          <div className="flex items-start gap-2">
            {/* Author Avatar */}
            <div className="flex-shrink-0">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.username}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-gray-300">
                    {getInitial(post.author.username)}
                  </span>
                </div>
              )}
            </div>

            {/* Title and Username */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 group-hover:text-pink-400 transition">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm truncate">
                {post.author.username}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
