'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrUsername.trim() || !password.trim()) {
      toast.error('All fields are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: emailOrUsername.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      toast.success('Welcome back!', {
        description: `Logged in as ${data.admin.name || data.admin.username}`,
      });

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Glassmorphism Container */}
        <div
          className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            {/* Logo */}


            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-400 text-sm text-center">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="Enter email or username"
                  className="pl-11 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-pink-500/50 focus:ring-pink-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-11 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-pink-500/50 focus:ring-pink-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !emailOrUsername.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-medium shadow-lg shadow-pink-500/20 disabled:opacity-50 h-11"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <p className="text-gray-500 text-xs text-center">
              This is a restricted area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-700/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
