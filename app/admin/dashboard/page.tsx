'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalRevenue: number;
    totalPayments: number;
    pendingPayments: number;
    newUsers: number;
    newPosts: number;
    bannedUsers: number;
    verifiedUsers: number;
  };
  postsByCategory: Array<{ category: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    username: string | null;
    createdAt: string;
  }>;
  dailyRevenue: Array<{ date: string; revenue: number }>;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');

      if (!response.ok) {
        toast.error('Failed to fetch analytics');
        return;
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('An error occurred while fetching analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Failed to load analytics data</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: analytics.overview.totalUsers.toLocaleString(),
      icon: Users,
      change: `+${analytics.overview.newUsers} this month`,
      changeType: 'positive',
      color: 'bg-blue-600',
    },
    {
      name: 'Total Posts',
      value: analytics.overview.totalPosts.toLocaleString(),
      icon: FileText,
      change: `+${analytics.overview.newPosts} this month`,
      changeType: 'positive',
      color: 'bg-purple-600',
    },
    {
      name: 'Total Revenue',
      value: `$${analytics.overview.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: `${analytics.overview.totalPayments} payments`,
      changeType: 'neutral',
      color: 'bg-green-600',
    },
    {
      name: 'Pending Payments',
      value: analytics.overview.pendingPayments.toLocaleString(),
      icon: Clock,
      change: 'Awaiting completion',
      changeType: 'neutral',
      color: 'bg-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Welcome back! Here's an overview of your platform.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-2">{stat.change}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold text-white">Daily Revenue (Last 30 Days)</h2>
        </div>
        <ChartContainer
          config={{
            revenue: {
              label: "Revenue",
              color: "hsl(142, 76%, 36%)",
            },
          }}
          className="h-[350px] w-full"
        >
          <LineChart data={analytics.dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-gray-800 border-gray-700"
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => [`$${value}`, "Revenue"]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Posts by Category */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Posts by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.postsByCategory.map((item) => (
            <div
              key={item.category}
              className="bg-gray-800/50 rounded-lg p-4 text-center"
            >
              <p className="text-gray-400 text-sm">{item.category}</p>
              <p className="text-2xl font-bold text-white mt-1">
                {item.count.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-pink-500" />
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {analytics.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            analytics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-white text-sm">
                    <span className="font-medium">{activity.username || 'Unknown'}</span>
                    {' - '}
                    <span className="text-gray-400">
                      {activity.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
