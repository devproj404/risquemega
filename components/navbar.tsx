import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { UserNav } from './user-nav';
import { ChatIcon } from './chat-icon';
import { NotificationIcon } from './notification-icon';
import { NavbarClient } from './navbar-client';
import { MobileMenu } from './mobile-menu';

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/explorer" className="flex items-center gap-2 hover:opacity-80 transition">

              <span className="text-base font-bold">
                <span className="text-white">RISQUE</span>{" "}
                <span className="text-yellow-400">MEGA</span>
              </span>
            </Link>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/explorer"
                className="text-gray-300 hover:text-white transition text-sm font-medium"
              >
                EXPLORE
              </Link>
              <Link
                href="/categories"
                className="text-gray-300 hover:text-white transition text-sm font-medium"
              >
                CATEGORIES
              </Link>
              <Link
                href="/creators"
                className="text-gray-300 hover:text-white transition text-sm font-medium"
              >
                CREATORS
              </Link>
              <Link
                href="/vip"
                className="text-gray-300 hover:text-white transition text-sm font-medium"
              >
                VIP
              </Link>
            </div>
          </div>

          {/* Right Side - Icons & Auth */}
          <div className="flex items-center gap-5">
            {/* Desktop Icons */}
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-5">
                  <NavbarClient hasUser={true} />
                  <ChatIcon />
                  <NotificationIcon />
                  <UserNav user={user} />
                  <Link
                    href="https://t.me/risquemegastatus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition"
                  >
                    <img
                      src="/images/telegram.svg"
                      alt="Telegram"
                      className="w-5 h-5"
                    />
                  </Link>
                </div>
                {/* Mobile Menu */}
                <div className="md:hidden">
                  <MobileMenu user={user} />
                </div>
              </>
            ) : (
              <>
                {/* Desktop Sign In */}
                <div className="hidden md:flex items-center gap-5">
                  <Link
                    href="/login"
                    className="text-white text-base font-medium px-4 py-2 hover:text-pink-400 transition relative z-50 inline-block"
                  >
                    SIGN IN
                  </Link>
                  <Link
                    href="https://t.me/risquemegastatus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition"
                  >
                    <img
                      src="/images/telegram.svg"
                      alt="Telegram"
                      className="w-5 h-5"
                    />
                  </Link>
                </div>
                {/* Mobile Menu */}
                <div className="md:hidden">
                  <MobileMenu user={null} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
