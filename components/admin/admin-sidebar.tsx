'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  ScrollText,
  Settings,
  LogOut,
  Image as ImageIcon,
  FolderOpen,
  User,
  Flag,
} from 'lucide-react';
import { AdminUser } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  admin: AdminUser;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Posts', href: '/admin/dashboard/posts', icon: FileText },
  { name: 'Categories', href: '/admin/dashboard/categories', icon: FolderOpen },
  { name: 'Creators', href: '/admin/dashboard/actresses', icon: User },
  { name: 'Users', href: '/admin/dashboard/users', icon: Users },
  { name: 'Reports', href: '/admin/dashboard/reports', icon: Flag },
  { name: 'Activity Logs', href: '/admin/dashboard/logs', icon: ScrollText },
  { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings },
];

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Logged out successfully');
        router.push('/admin/login');
        router.refresh();
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 border-r border-gray-800 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-2">
            
            <div>
              <h1 className="text-white font-bold text-lg">Admin Panel</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition',
                            isActive
                              ? 'bg-pink-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Admin Info & Logout */}
              <li className="mt-auto">
                {/* Admin Profile */}
                

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="group flex w-full gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar - We'll add this later if needed */}
    </>
  );
}
