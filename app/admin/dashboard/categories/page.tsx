'use client';

import { useEffect, useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Image as ImageIcon,
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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  _count: {
    posts: number;
  };
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Create category form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
  });

  // Edit category form state
  const [editCategory, setEditCategory] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/categories');

      if (!response.ok) {
        toast.error('Failed to fetch categories');
        return;
      }

      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('An error occurred while fetching categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          slug: newCategory.slug.trim(),
          description: newCategory.description.trim() || undefined,
          imageUrl: newCategory.imageUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create category');
        return;
      }

      toast.success('Category created successfully');
      setIsCreateDialogOpen(false);
      setNewCategory({ name: '', slug: '', description: '', imageUrl: '' });
      fetchCategories();
    } catch (error) {
      console.error('Create category error:', error);
      toast.error('An error occurred while creating category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCategory.name.trim(),
          slug: editCategory.slug.trim(),
          description: editCategory.description.trim() || undefined,
          imageUrl: editCategory.imageUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update category');
        return;
      }

      toast.success('Category updated successfully');
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Update category error:', error);
      toast.error('An error occurred while updating category');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, postCount: number) => {
    if (postCount > 0) {
      toast.error(`Cannot delete category with ${postCount} posts`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete category');
        return;
      }

      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('An error occurred while deleting category');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditCategory({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    setIsEditDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Categories Management</h1>
          <p className="text-gray-400 mt-1">Manage post categories</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4 mt-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Name *</label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewCategory({
                      ...newCategory,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  placeholder="Enter category name"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={isCreating}
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Slug *</label>
                <Input
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  placeholder="category-slug"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500">URL-friendly identifier (auto-generated from name)</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Enter category description"
                  className="w-full min-h-[80px] px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-500"
                  disabled={isCreating}
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Image URL</label>
                <Input
                  value={newCategory.imageUrl}
                  onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
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
                      Create Category
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

      {/* Categories Grid */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading categories...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <FolderOpen className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No categories found</p>
            <p className="text-gray-500 text-sm mt-2">Create your first category to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-pink-600/50 transition"
              >
                {/* Image */}
                {category.imageUrl ? (
                  <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden mb-4">
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                    <ImageIcon className="w-12 h-12 text-gray-600" />
                  </div>
                )}

                {/* Content */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                    <p className="text-gray-500 text-sm">/{category.slug}</p>
                  </div>
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
                        onClick={() => openEditDialog(category)}
                        className="text-gray-300 hover:text-white hover:bg-gray-800"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCategory(category.id, category.name, category._count.posts)}
                        className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                {category.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-700">
                  <div className="text-sm">
                    <span className="text-gray-400">Posts: </span>
                    <span className="text-white font-medium">{category._count.posts}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Name *</label>
              <Input
                value={editCategory.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setEditCategory({
                    ...editCategory,
                    name,
                    slug: generateSlug(name),
                  });
                }}
                placeholder="Enter category name"
                className="bg-gray-800/50 border-gray-700 text-white"
                disabled={isUpdating}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Slug *</label>
              <Input
                value={editCategory.slug}
                onChange={(e) => setEditCategory({ ...editCategory, slug: e.target.value })}
                placeholder="category-slug"
                className="bg-gray-800/50 border-gray-700 text-white"
                disabled={isUpdating}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={editCategory.description}
                onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                placeholder="Enter category description"
                className="w-full min-h-[80px] px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-500"
                disabled={isUpdating}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Image URL</label>
              <Input
                value={editCategory.imageUrl}
                onChange={(e) => setEditCategory({ ...editCategory, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
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
                  'Update Category'
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
