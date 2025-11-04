'use client';

import { useEffect, useState } from 'react';
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

interface Report {
  id: string;
  postId: string;
  userId: string | null;
  type: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  post: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    imageUrls: string[];
  };
  user: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;
}

interface Stats {
  pending: number;
  resolved: number;
  dismissed: number;
}

const STATUS_FILTERS = [
  { label: 'All Reports', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
];

const TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'Dead Link', value: 'dead_link' },
  { label: 'Inappropriate', value: 'inappropriate' },
  { label: 'Spam', value: 'spam' },
  { label: 'Copyright', value: 'copyright' },
  { label: 'Other', value: 'other' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, resolved: 0, dismissed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [currentPage, statusFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter,
        type: typeFilter,
      });

      const response = await fetch(`/api/admin/reports?${params}`);

      if (!response.ok) {
        toast.error('Failed to fetch reports');
        return;
      }

      const data = await response.json();
      setReports(data.reports);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('An error occurred while fetching reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to update report');
        return;
      }

      toast.success(`Report ${newStatus}`);
      fetchReports();
    } catch (error) {
      console.error('Failed to update report:', error);
      toast.error('An error occurred');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete report');
        return;
      }

      toast.success('Report deleted');
      fetchReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error('An error occurred');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      dead_link: 'Dead Link',
      inappropriate: 'Inappropriate',
      spam: 'Spam',
      copyright: 'Copyright',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      dead_link: 'bg-orange-500/20 text-orange-400',
      inappropriate: 'bg-red-500/20 text-red-400',
      spam: 'bg-yellow-500/20 text-yellow-400',
      copyright: 'bg-purple-500/20 text-purple-400',
      other: 'bg-gray-500/20 text-gray-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      resolved: 'bg-green-500/20 text-green-400',
      dismissed: 'bg-gray-500/20 text-gray-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Flag className="w-8 h-8" />
            Reports Management
          </h1>
          <p className="text-gray-400 mt-1">
            Review and manage user reports
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Resolved</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Dismissed</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.dismissed}</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === filter.value
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setTypeFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    typeFilter === filter.value
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-gray-900/50 rounded-lg p-12 text-center">
          <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition"
            >
              <div className="flex gap-4">
                {/* Post Thumbnail */}
                <Link
                  href={`/post/${report.post.id}`}
                  target="_blank"
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-800">
                    {report.post.thumbnailUrl || report.post.imageUrls[0] ? (
                      <Image
                        src={report.post.thumbnailUrl || report.post.imageUrls[0]}
                        alt={report.post.title}
                        fill
                        className="object-cover group-hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Flag className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                </Link>

                {/* Report Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <Link
                        href={`/post/${report.post.id}`}
                        target="_blank"
                        className="text-white font-medium hover:text-pink-400 transition line-clamp-1"
                      >
                        {report.post.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(report.type)}`}>
                          {getTypeLabel(report.type)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="text-sm text-gray-400 mb-2">
                    <span>Reported by: </span>
                    {report.user ? (
                      <Link
                        href={`/profile/${report.user.username}`}
                        target="_blank"
                        className="text-pink-400 hover:text-pink-300 transition"
                      >
                        @{report.user.username}
                      </Link>
                    ) : (
                      <span className="text-gray-500">Anonymous</span>
                    )}
                    <span className="mx-2">•</span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {report.description}
                    </p>
                  )}

                  {/* Resolved Info */}
                  {report.resolvedAt && report.resolvedBy && (
                    <div className="text-xs text-gray-500 mb-3">
                      Resolved by {report.resolvedBy} on {formatDate(report.resolvedAt)}
                    </div>
                  )}

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}

                  {report.status !== 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
