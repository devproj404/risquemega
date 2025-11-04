'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, Receipt, LogOut, UserCircle } from 'lucide-react';
import { VIPBadge } from '@/components/vip-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserNavProps {
  user: {
    id: string;
    username: string;
    email: string;
    name: string | null;
    avatar: string | null;
    isVip?: boolean;
  };
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative text-gray-400 hover:text-white transition focus:outline-none">
          <User className="w-6 h-6" />
          {user.isVip && (
            <div className="absolute -top-1 -right-1">
              <VIPBadge size="sm" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
        <DropdownMenuLabel className="text-gray-400">
          <div className="flex flex-col">
            <span className="text-white font-semibold flex items-center gap-2">
              {user.username}
              {user.isVip && <VIPBadge size="sm" />}
            </span>
            <span className="text-xs text-gray-500 font-normal">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />

        <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
          <Link href="/profile" className="flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
          <Link href="/transactions" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Transactions
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-800" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 hover:bg-gray-800 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
