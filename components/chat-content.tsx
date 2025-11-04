'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Check, X, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';

interface ChatItem {
  id: string;
  members: {
    id: string;
    username: string;
    avatar: string | null;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  updatedAt: string;
}

interface ChatRequest {
  id: string;
  chatId: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

type TabType = 'messages' | 'requests';

export function ChatContent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingStaffChat, setIsCreatingStaffChat] = useState(false);

  useEffect(() => {
    fetchChats();
    fetchRequests();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chat');
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

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/chat/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, chatId: string) => {
    try {
      const response = await fetch(`/api/chat/requests/${requestId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        fetchChats(); // Refresh chats
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/chat/requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleChatWithStaff = async () => {
    try {
      setIsCreatingStaffChat(true);
      const response = await fetch('/api/chat/support');

      if (response.ok) {
        const data = await response.json();
        // Redirect to the staff chat
        window.location.href = `/chat/${data.chatId}`;
      } else {
        toast.error('Failed to start chat with staff');
      }
    } catch (error) {
      console.error('Failed to create staff chat:', error);
      toast.error('An error occurred');
    } finally {
      setIsCreatingStaffChat(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
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

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="w-full">
          <div className="flex items-center gap-3 mb-8">
            <MessageCircle className="w-6 h-6 text-gray-300" />
            <h1 className="text-2xl font-semibold text-white">{t('chat')}</h1>
          </div>
          <div className="text-center py-16">
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-gray-300" />
            <h1 className="text-2xl font-semibold text-white">{t('chat')}</h1>
          </div>
          <Button
            onClick={handleChatWithStaff}
            disabled={isCreatingStaffChat}
            className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2"
          >
            <Headphones className="w-4 h-4" />
            {isCreatingStaffChat ? 'Opening...' : 'Chat with Staff'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-800 mb-8">
          <button
            onClick={() => setActiveTab('messages')}
            className={`pb-3 text-sm font-medium transition relative ${
              activeTab === 'messages'
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('messages')}
            {activeTab === 'messages' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-medium transition relative ${
              activeTab === 'requests'
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('requests')}
            {requests.length > 0 && (
              <span className="ml-2 bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'messages' ? (
          // Messages Tab
          chats.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">{t('noMessagesYet')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => {
                const otherMember = chat.members[0]; // Assuming 1-on-1 chat
                return (
                  <div
                    key={chat.id}
                    onClick={() => (window.location.href = `/chat/${chat.id}`)}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-900 hover:bg-gray-850 transition cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {otherMember?.avatar ? (
                        <img
                          src={otherMember.avatar}
                          alt={otherMember.username}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-xl font-semibold text-gray-300">
                            {otherMember ? getInitial(otherMember.username) : '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium mb-1">
                        {otherMember?.username || 'Unknown User'}
                      </h3>
                      {chat.lastMessage && (
                        <p className="text-gray-400 text-sm truncate">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    {chat.lastMessage && (
                      <div className="flex-shrink-0 text-gray-500 text-xs">
                        {getTimeAgo(chat.lastMessage.createdAt)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // Requests Tab
          requests.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">{t('noChatRequests')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-900"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {request.sender.avatar ? (
                      <img
                        src={request.sender.avatar}
                        alt={request.sender.username}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xl font-semibold text-gray-300">
                          {getInitial(request.sender.username)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium mb-1">
                      {request.sender.username}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {t('wantsToMessage')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(request.id, request.chatId)}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-4"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request.id)}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 px-4"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
