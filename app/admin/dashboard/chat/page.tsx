'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatItem {
  id: string;
  members: {
    id: string;
    username: string;
    avatar: string | null;
  }[];
  lastMessageAt: string | null;
  lastMessageText: string | null;
  updatedAt: string;
}

export default function AdminChatPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      // Get all chats that involve the support user
      const response = await fetch('/api/admin/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const filteredChats = chats.filter(chat => {
    const otherMember = chat.members.find(m => m.username !== 'Support');
    return otherMember?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Support Chat</h1>
            <p className="text-gray-400 mt-1">Chat with users who need assistance</p>
          </div>
        </div>
        <div className="text-center py-16">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Chat</h1>
          <p className="text-gray-400 mt-1">Chat with users who need assistance</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-11 bg-gray-800/50 border-gray-700/50 text-white"
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">
              {searchQuery ? 'No chats found' : 'No support chats yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredChats.map((chat) => {
              const otherMember = chat.members.find(m => m.username !== 'Support');
              if (!otherMember) return null;

              return (
                <div
                  key={chat.id}
                  onClick={() => (window.location.href = `/admin/dashboard/chat/${chat.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-800/30 transition cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {otherMember.avatar ? (
                      <img
                        src={otherMember.avatar}
                        alt={otherMember.username}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xl font-semibold text-gray-300">
                          {getInitial(otherMember.username)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium mb-1">
                      {otherMember.username}
                    </h3>
                    {chat.lastMessageText && (
                      <p className="text-gray-400 text-sm truncate">
                        {chat.lastMessageText}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  {chat.lastMessageAt && (
                    <div className="flex-shrink-0 text-gray-500 text-xs">
                      {getTimeAgo(chat.lastMessageAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
