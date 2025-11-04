'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Home, Folder, Users, Crown, Search, MessageCircle, Bell, User, LogOut, Settings, Bookmark, Heart } from 'lucide-react';
import { VIPBadge } from './vip-badge';

interface MobileMenuProps {
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    isVerified: boolean;
    isVip: boolean;
  } | null;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="text-white hover:text-gray-300 transition p-2"
        aria-label="Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-80 bg-gray-900 border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* User Info */}
          {user ? (
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.username}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">{user.username}</p>
                    {user.isVip && <VIPBadge size="sm" />}
                  </div>
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Navigation Links */}
          <div className="flex-1 py-4">
            <div className="space-y-1 px-2">
              <Link
                href="/explorer"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Explore</span>
              </Link>

              <Link
                href="/categories"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
              >
                <Folder className="w-5 h-5" />
                <span className="font-medium">Categories</span>
              </Link>

              <Link
                href="/creators"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Creators</span>
              </Link>

              <Link
                href="/vip"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
              >
                <Crown className="w-5 h-5" />
                <span className="font-medium">VIP</span>
              </Link>

              {user && (
                <>
                  <div className="border-t border-gray-800 my-2" />

                  <Link
                    href="/search"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
                  >
                    <Search className="w-5 h-5" />
                    <span className="font-medium">Search</span>
                  </Link>

                  <Link
                    href="/chat"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">Messages</span>
                  </Link>

                  <Link
                    href="/notifications"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">Notifications</span>
                  </Link>

                  <div className="border-t border-gray-800 my-2" />

                  <Link
                    href={`/profile/${user.username}`}
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </Link>

                  <Link
                    href="/saved"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
                  >
                    <Bookmark className="w-5 h-5" />
                    <span className="font-medium">Saved</span>
                  </Link>

                  <Link
                    href="/liked"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
                  >
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">Liked</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-800">
            {user ? (
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-gray-800 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex items-center justify-center w-full px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
