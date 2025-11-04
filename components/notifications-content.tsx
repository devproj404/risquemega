'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  actor: {
    username: string;
    avatar: string | null;
  } | null;
}

export function NotificationsContent() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
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
          <Bell className="w-6 h-6 text-gray-300" />
          <h1 className="text-2xl font-semibold text-white">{t('notifications')}</h1>
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
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-6 h-6 text-gray-300" />
          <h1 className="text-2xl font-semibold text-white">{t('notifications')}</h1>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">{t('noNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
                className={`flex items-start gap-4 p-4 rounded-lg transition cursor-pointer ${
                  notification.read
                    ? 'bg-gray-900 hover:bg-gray-850'
                    : 'bg-gray-800 hover:bg-gray-750'
                }`}
              >
                {/* Actor Avatar */}
                <div className="flex-shrink-0">
                  {notification.actor?.avatar ? (
                    <img
                      src={notification.actor.avatar}
                      alt={notification.actor.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-300">
                        {notification.actor ? getInitial(notification.actor.username) : '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm mb-1">
                    {notification.message}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {getTimeAgo(notification.createdAt)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
