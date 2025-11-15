'use client';

import { useEffect, useState } from 'react';
import {
  Users as UsersIcon,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Shield,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Crown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
  avatar: string | null;
  isVerified: boolean;
  isBanned: boolean;
  isVip: boolean;
  vipUntil: string | null;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
    payments: number;
  };
}

const FILTERS = ['all'];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        filter: selectedFilter,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        toast.error('Failed to fetch users');
        return;
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('An error occurred while fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !currentStatus }),
      });

      if (!response.ok) {
        toast.error('Failed to update user');
        return;
      }

      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle verify error:', error);
      toast.error('An error occurred');
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !currentStatus }),
      });

      if (!response.ok) {
        toast.error('Failed to update user');
        return;
      }

      toast.success(`User ${!currentStatus ? 'banned' : 'unbanned'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle ban error:', error);
      toast.error('An error occurred');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete user');
        return;
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('An error occurred while deleting user');
    }
  };

  const handleToggleVip = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVip: !currentStatus }),
      });

      if (!response.ok) {
        toast.error('Failed to update VIP status');
        return;
      }

      toast.success(`VIP ${!currentStatus ? 'granted' : 'revoked'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle VIP error:', error);
      toast.error('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <p className="text-gray-400 mt-1">Manage and moderate all users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search users by username, email..."
              className="pl-11 bg-gray-800/50 border-gray-700/50 text-white"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter}
                onClick={() => {
                  setSelectedFilter(filter);
                  setCurrentPage(1);
                }}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                className={
                  selectedFilter === filter
                    ? 'bg-pink-600 hover:bg-pink-700 text-white capitalize'
                    : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 capitalize'
                }
                size="sm"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <UsersIcon className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium flex items-center gap-1">
                            {user.username}
                            {user.isVerified && (
                              <Shield className="w-4 h-4 text-blue-500" />
                            )}
                          </p>
                          {user.name && (
                            <p className="text-gray-500 text-sm">{user.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isVip
                          ? 'bg-yellow-600/20 text-yellow-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {user.isVip ? 'VIP' : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-900 border-gray-800">
                          <DropdownMenuItem
                            onClick={() => handleToggleVerify(user.id, user.isVerified)}
                            className="text-gray-300 hover:text-white hover:bg-gray-800"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {user.isVerified ? 'Unverify' : 'Verify'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleBan(user.id, user.isBanned)}
                            className="text-gray-300 hover:text-white hover:bg-gray-800"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {user.isBanned ? 'Unban' : 'Ban'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleVip(user.id, user.isVip)}
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-gray-800"
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            {user.isVip ? 'Revoke VIP' : 'Grant VIP'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
