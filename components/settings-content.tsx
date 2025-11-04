'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';

interface SettingsContentProps {
  user: {
    id: string;
    username: string;
    email: string;
    name: string | null;
    avatar: string | null;
    bio: string | null;
    website: string | null;
    isVerified: boolean;
  };
}

export function SettingsContent({ user }: SettingsContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Modal states
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Loading and error states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitial = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    return user.username.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    setIsUpdatingProfile(true);

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update profile');
        return;
      }

      setSuccess('Profile updated successfully');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: password,
          confirmPassword: confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update password');
        return;
      }

      setSuccess('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to change email');
        return;
      }

      setSuccess('Email changed successfully');
      setShowChangeEmailModal(false);
      setNewEmail('');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
      });

      if (!response.ok) {
        setError('Failed to delete account');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please upload a JPG or PNG image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setSuccess('');
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to upload avatar');
        return;
      }

      setSuccess('Avatar updated successfully');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="w-full">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg text-sm mb-6">
            {success}
          </div>
        )}

        {/* Profile Header */}
        <div className="flex flex-col items-center mb-12">
        {/* Avatar with Edit Icon */}
        <div className="relative w-32 h-32 mb-4">
          <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-5xl font-semibold text-gray-300">
                {getInitial()}
              </span>
            )}
          </div>
          <button
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 bg-pink-600 rounded-full p-2 hover:bg-pink-700 transition disabled:opacity-50"
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Username */}
        <h1 className="text-2xl font-semibold text-pink-500 mb-3">
          {user.username}
        </h1>

        {/* Get Verified Button */}
        {!user.isVerified && (
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded transition">
            <Image
              src="/images/verify.svg"
              alt="Verify"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            {t('getVerified')}
          </button>
        )}
        </div>

        {/* Username Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-300 text-sm">{t('username')}</label>
            <button
              onClick={handleLogout}
              className="text-pink-500 hover:text-pink-400 text-sm transition"
            >
              Logout
            </button>
          </div>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white mb-3"
          />
          <Button
            onClick={handleUpdateProfile}
            disabled={isUpdatingProfile}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6"
          >
            {isUpdatingProfile ? 'Updating...' : t('save')}
          </Button>
        </div>

        {/* Password Section */}
        <div className="mb-8">
          <label className="text-gray-300 text-sm mb-2 block">{t('password')}</label>
          <Input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white mb-3"
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white mb-3"
          />
          <Button
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6"
          >
            {isUpdatingPassword ? 'Updating...' : t('save')}
          </Button>
        </div>

        {/* Email Section */}
        <div className="mb-8">
          <label className="text-gray-300 text-sm mb-2 block">Email</label>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{user.email}</span>
            <button
              onClick={() => setShowChangeEmailModal(true)}
              className="text-pink-500 hover:text-pink-400 text-sm transition"
            >
              Change email
            </button>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="mb-12">
          <label className="text-gray-300 text-sm mb-2 block">{t('deleteAccount')}</label>
          <p className="text-gray-400 text-sm">
            To permanently delete your account{' '}
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="text-pink-500 hover:text-pink-400 transition"
            >
              click here
            </button>
            .
          </p>
        </div>
      </div>

      {/* Change Email Modal */}
      <Dialog open={showChangeEmailModal} onOpenChange={setShowChangeEmailModal}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Change Email</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your new email address below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeEmailModal(false);
                setNewEmail('');
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleChangeEmail}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Change Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-500">Delete Account</DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. Type "DELETE" to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAccountModal(false);
                setDeleteConfirmation('');
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {t('deleteAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
