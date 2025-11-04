'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

interface ChatConversationProps {
  chatId: string;
  currentUserId: string;
  otherMember: {
    id: string;
    username: string;
    avatar: string | null;
  };
  initialMessages: Message[];
  isAccepted: boolean;
  backUrl?: string;
}

export function ChatConversation({
  chatId,
  currentUserId,
  otherMember,
  initialMessages,
  isAccepted,
  backUrl = '/chat',
}: ChatConversationProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when component mounts
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch(`/api/chat/${chatId}/mark-read`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    };

    markAsRead();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Create optimistic message (show immediately in UI)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      createdAt: new Date().toISOString(),
      senderId: currentUserId,
      sender: {
        id: currentUserId,
        username: 'You',
        avatar: null,
      },
    };

    // Add message to UI immediately
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one from server
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? data.message : msg
          )
        );
      } else {
        // Remove optimistic message on error and restore input
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error and restore input
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center gap-4 py-6 border-b border-gray-800 sticky top-[56px] bg-black z-10">
          <button
            onClick={() => router.push(backUrl)}
            className="text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Other member info */}
          <div className="flex items-center gap-4 flex-1">
            {otherMember.avatar ? (
              <img
                src={otherMember.avatar}
                alt={otherMember.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-300">
                  {getInitial(otherMember.username)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-white font-semibold text-lg">{otherMember.username}</h2>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="h-[calc(100vh-240px)] overflow-y-auto py-6 pr-2 scrollbar-thin">
          {!isAccepted && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-2">
                This chat request is pending approval
              </p>
              <p className="text-gray-600 text-xs">
                Once accepted, you can send messages
              </p>
            </div>
          )}

          {messages.length === 0 && isAccepted && (
            <div className="text-center py-16">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}

          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 mb-6 ${
                  isOwn ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                {!isOwn && (
                  <div className="flex-shrink-0">
                    {message.sender.avatar ? (
                      <img
                        src={message.sender.avatar}
                        alt={message.sender.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-base font-semibold text-gray-300">
                          {getInitial(message.sender.username)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`max-w-md lg:max-w-lg ${
                    isOwn ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-5 py-3 ${
                      isOwn
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <p className="text-base break-words leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 px-2">
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isAccepted ? (
          <form onSubmit={handleSendMessage} className="flex items-center gap-4 py-4 border-t border-gray-800 bg-black sticky bottom-0">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-12 text-base rounded-xl"
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-pink-600 hover:bg-pink-700 text-white h-12 px-8 rounded-xl"
            >
              {isSending ? (
                <span className="text-sm">Sending...</span>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        ) : (
          <div className="py-6 border-t border-gray-800 text-center bg-black sticky bottom-0">
            <p className="text-gray-500 text-sm">
              You can send messages once the chat request is accepted
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
