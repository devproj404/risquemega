'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Search,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Actress {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  imageUrl: string | null;
  nationality: string | null;
  createdAt: string;
}

export default function ActressesManagementPage() {
  const [actresses, setActresses] = useState<Actress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingActress, setEditingActress] = useState<Actress | null>(null);

  // Create actress form state
  const [newActress, setNewActress] = useState({
    name: '',
    slug: '',
    bio: '',
    imageUrl: '',
    nationality: '',
  });

  // Edit actress form state
  const [editActress, setEditActress] = useState({
    name: '',
    slug: '',
    bio: '',
    imageUrl: '',
    nationality: '',
  });

  useEffect(() => {
    fetchActresses();
  }, [currentPage]);

  const fetchActresses = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/actresses?${params}`);

      if (!response.ok) {
        toast.error('Failed to fetch actresses');
        return;
      }

      const data = await response.json();
      setActresses(data.actresses);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch actresses:', error);
      toast.error('An error occurred while fetching actresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchActresses();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateActress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newActress.name.trim() || !newActress.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/actresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newActress.name.trim(),
          slug: newActress.slug.trim(),
          bio: newActress.bio.trim() || undefined,
          imageUrl: newActress.imageUrl.trim() || undefined,
          nationality: newActress.nationality.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create actress');
        return;
      }

      toast.success('Actress created successfully');
      setIsCreateDialogOpen(false);
      setNewActress({ name: '', slug: '', bio: '', imageUrl: '', nationality: '' });
      fetchActresses();
    } catch (error) {
      console.error('Create actress error:', error);
      toast.error('An error occurred while creating actress');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateActress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingActress) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/actresses/${editingActress.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editActress.name.trim(),
          slug: editActress.slug.trim(),
          bio: editActress.bio.trim() || null,
          imageUrl: editActress.imageUrl.trim() || null,
          nationality: editActress.nationality.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update actress');
        return;
      }

      toast.success('Actress updated successfully');
      setIsEditDialogOpen(false);
      setEditingActress(null);
      fetchActresses();
    } catch (error) {
      console.error('Update actress error:', error);
      toast.error('An error occurred while updating actress');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteActress = async (actressId: string, actressName: string) => {
    if (!confirm(`Are you sure you want to delete "${actressName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/actresses/${actressId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete actress');
        return;
      }

      toast.success('Actress deleted successfully');
      fetchActresses();
    } catch (error) {
      console.error('Delete actress error:', error);
      toast.error('An error occurred while deleting actress');
    }
  };

  const openEditDialog = (actress: Actress) => {
    setEditingActress(actress);
    setEditActress({
      name: actress.name,
      slug: actress.slug,
      bio: actress.bio || '',
      imageUrl: actress.imageUrl || '',
      nationality: actress.nationality || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Actresses Management</h1>
          <p className="text-gray-400 mt-1">Manage actress profiles</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Actress
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Actress</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateActress} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Name *</label>
                  <Input
                    value={newActress.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewActress({
                        ...newActress,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    placeholder="Enter actress name"
                    className="bg-gray-800/50 border-gray-700 text-white"
                    disabled={isCreating}
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Slug *</label>
                  <Input
                    value={newActress.slug}
                    onChange={(e) => setNewActress({ ...newActress, slug: e.target.value })}
                    placeholder="actress-slug"
                    className="bg-gray-800/50 border-gray-700 text-white"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Bio</label>
                <textarea
                  value={newActress.bio}
                  onChange={(e) => setNewActress({ ...newActress, bio: e.target.value })}
                  placeholder="Enter biography"
                  className="w-full min-h-[80px] px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-500"
                  disabled={isCreating}
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Image URL</label>
                <Input
                  value={newActress.imageUrl}
                  onChange={(e) => setNewActress({ ...newActress, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={isCreating}
                />
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Nationality</label>
                <Input
                  value={newActress.nationality}
                  onChange={(e) => setNewActress({ ...newActress, nationality: e.target.value })}
                  placeholder="e.g. American"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={isCreating}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Actress
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search actresses..."
            className="pl-11 bg-gray-800/50 border-gray-700/50 text-white"
          />
        </div>
      </div>

      {/* Actresses Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading actresses...</p>
            </div>
          </div>
        ) : actresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <User className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No actresses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Actress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Nationality
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {actresses.map((actress) => (
                  <tr key={actress.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {actress.imageUrl ? (
                            <img
                              src={actress.imageUrl}
                              alt={actress.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{actress.name}</p>
                          <p className="text-gray-500 text-sm">/{actress.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">{actress.nationality || '-'}</span>
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
                            onClick={() => openEditDialog(actress)}
                            className="text-gray-300 hover:text-white hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteActress(actress.id, actress.name)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Actress</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateActress} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Name *</label>
                <Input
                  value={editActress.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditActress({
                      ...editActress,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  placeholder="Enter actress name"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={isUpdating}
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Slug *</label>
                <Input
                  value={editActress.slug}
                  onChange={(e) => setEditActress({ ...editActress, slug: e.target.value })}
                  placeholder="actress-slug"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={isUpdating}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Bio</label>
              <textarea
                value={editActress.bio}
                onChange={(e) => setEditActress({ ...editActress, bio: e.target.value })}
                placeholder="Enter biography"
                className="w-full min-h-[80px] px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-500"
                disabled={isUpdating}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Image URL</label>
              <Input
                value={editActress.imageUrl}
                onChange={(e) => setEditActress({ ...editActress, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="bg-gray-800/50 border-gray-700 text-white"
                disabled={isUpdating}
              />
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Nationality</label>
              <Input
                value={editActress.nationality}
                onChange={(e) => setEditActress({ ...editActress, nationality: e.target.value })}
                placeholder="e.g. American"
                className="bg-gray-800/50 border-gray-700 text-white"
                disabled={isUpdating}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Actress'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
                className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
