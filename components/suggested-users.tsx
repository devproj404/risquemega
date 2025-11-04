'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SuggestedUser {
  id: string;
  username: string;
  avatar: string | null;
  isVerified: boolean;
}

export function SuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const response = await fetch('/api/users/suggested');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch suggested users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  if (isLoading || users.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 mb-12">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-medium text-gray-300">Suggested users</h2>
      </div>

      {/* Horizontal Scrollable User List */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/${user.username}`}
              className="flex-shrink-0 group"
            >
              <div className="flex flex-col items-center gap-2 w-24">
                {/* Avatar */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-800 ring-2 ring-gray-700 group-hover:ring-pink-500 transition-all">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-semibold text-gray-400">
                        {getInitial(user.username)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Username */}
                <div className="flex items-center gap-1">
                  <span className="text-sm text-pink-500 truncate max-w-[80px] group-hover:text-pink-400 transition">
                    {user.username}
                  </span>
                  {user.isVerified && (
                    <Image
                      src="/images/verify.svg"
                      alt="Verified"
                      width={14}
                      height={14}
                      className="w-3.5 h-3.5 flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            </Link>
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
