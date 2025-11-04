'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Trash2,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload as UploadIcon,
  X,
  Edit,
  Image as ImageIcon,
  Video,
  Clock,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { parseImages } from '@/lib/image-parser';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Post {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
  categories: string[];
  actressIds: string[];
  tags: string[];
  published: boolean;
  isVip: boolean;
  sourceUrl: string | null;
  scheduledFor: string | null;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
    isBanned: boolean;
  };
  _count: {
    likes: number;
    saves: number;
    shares: number;
  };
}

export default function PostsManagementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [creators, setCreators] = useState<{ id: string; name: string }[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Create post form state
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    sourceUrl: '',
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [bulkImageInput, setBulkImageInput] = useState('');
  const [editBulkImageInput, setEditBulkImageInput] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [creatorSearch, setCreatorSearch] = useState('');
  const [editCreatorSearch, setEditCreatorSearch] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isVipContent, setIsVipContent] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [editIsScheduled, setEditIsScheduled] = useState(false);

  // Get current date and time for defaults
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`; // HH:MM
  };

  const [scheduledDate, setScheduledDate] = useState(getCurrentDate());
  const [scheduledTime, setScheduledTime] = useState(getCurrentTime());
  const [editScheduledDate, setEditScheduledDate] = useState(getCurrentDate());
  const [editScheduledTime, setEditScheduledTime] = useState(getCurrentTime());

  // Check if scheduled datetime is in the past
  const isScheduledInPast = () => {
    if (!scheduledDate || !scheduledTime) return false;
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    return scheduledDateTime <= new Date();
  };

  const editIsScheduledInPast = () => {
    if (!editScheduledDate || !editScheduledTime) return false;
    const scheduledDateTime = new Date(`${editScheduledDate}T${editScheduledTime}:00`);
    return scheduledDateTime <= new Date();
  };

  // Edit post form state
  const [editPost, setEditPost] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    sourceUrl: '',
  });
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editVideoUrls, setEditVideoUrls] = useState<string[]>([]);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [editVideoUrlInput, setEditVideoUrlInput] = useState('');
  const [editSelectedCategories, setEditSelectedCategories] = useState<string[]>([]);
  const [editSelectedCreators, setEditSelectedCreators] = useState<string[]>([]);
  const [editCategorySearch, setEditCategorySearch] = useState('');
  const [editActressSearch, setEditActressSearch] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editIsVipContent, setEditIsVipContent] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCreators();
    fetchPosts();
  }, [currentPage]);

  const [isRefreshingCategories, setIsRefreshingCategories] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsRefreshingCategories(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories.map((c: any) => c.name));
        if (isRefreshingCategories) {
          toast.success('Categories refreshed');
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to refresh categories');
    } finally {
      setIsRefreshingCategories(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/actresses?limit=100');
      if (response.ok) {
        const data = await response.json();
        setCreators(data.actresses.map((a: any) => ({ id: a.id, name: a.name })));
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/posts?${params}`);

      if (!response.ok) {
        toast.error('Failed to fetch posts');
        return;
      }

      const data = await response.json();
      setPosts(data.posts);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('An error occurred while fetching posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts();
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 20) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        toast.error('Failed to delete post');
        return;
      }

      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('An error occurred while deleting post');
    }
  };

  const handleTogglePublish = async (postId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (!response.ok) {
        toast.error('Failed to update post');
        return;
      }

      toast.success(`Post ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      fetchPosts();
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast.error('An error occurred');
    }
  };

  const addImageUrl = () => {
    const trimmedUrl = imageUrlInput.trim();
    if (trimmedUrl && imageUrls.length < 50) {
      try {
        new URL(trimmedUrl); // Validate URL
        setImageUrls([...imageUrls, trimmedUrl]);
        setImageUrlInput('');
      } catch {
        toast.error('Invalid image URL');
      }
    }
  };

  const addBulkImages = () => {
    if (!bulkImageInput.trim()) {
      toast.error('Please enter image URLs or BBCode');
      return;
    }

    try {
      const parsedUrls = parseImages(bulkImageInput);

      if (parsedUrls.length === 0) {
        toast.error('No valid image URLs found');
        return;
      }

      // Limit to 50 total images
      const availableSlots = 50 - imageUrls.length;
      const urlsToAdd = parsedUrls.slice(0, availableSlots);

      setImageUrls([...imageUrls, ...urlsToAdd]);
      setBulkImageInput('');

      if (urlsToAdd.length < parsedUrls.length) {
        toast.success(`Added ${urlsToAdd.length} images (limit reached)`);
      } else {
        toast.success(`Added ${urlsToAdd.length} images`);
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('Failed to parse image URLs');
    }
  };

  const removeImageUrl = (url: string) => {
    setImageUrls(imageUrls.filter(u => u !== url));
  };

  const addEditBulkImages = () => {
    if (!editBulkImageInput.trim()) {
      toast.error('Please enter image URLs or BBCode');
      return;
    }

    try {
      const parsedUrls = parseImages(editBulkImageInput);

      if (parsedUrls.length === 0) {
        toast.error('No valid image URLs found');
        return;
      }

      // Limit to 50 total images
      const availableSlots = 50 - editImageUrls.length;
      const urlsToAdd = parsedUrls.slice(0, availableSlots);

      setEditImageUrls([...editImageUrls, ...urlsToAdd]);
      setEditBulkImageInput('');

      if (urlsToAdd.length < parsedUrls.length) {
        toast.success(`Added ${urlsToAdd.length} images (limit reached)`);
      } else {
        toast.success(`Added ${urlsToAdd.length} images`);
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('Failed to parse image URLs');
    }
  };

  const addVideoUrl = () => {
    const trimmedUrl = videoUrlInput.trim();
    if (trimmedUrl && videoUrls.length < 50) {
      try {
        new URL(trimmedUrl); // Validate URL
        setVideoUrls([...videoUrls, trimmedUrl]);
        setVideoUrlInput('');
      } catch {
        toast.error('Invalid video URL');
      }
    }
  };

  const removeVideoUrl = (url: string) => {
    setVideoUrls(videoUrls.filter(u => u !== url));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPost.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('At least one category is required');
      return;
    }

    if (imageUrls.length === 0 && videoUrls.length === 0) {
      toast.error('At least one image or video URL is required');
      return;
    }

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select both date and time for scheduled post');
      return;
    }

    if (isScheduled && isScheduledInPast()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    // Build scheduledFor datetime if scheduling is enabled
    let scheduledFor = null;
    if (isScheduled && scheduledDate && scheduledTime) {
      const dateTimeString = `${scheduledDate}T${scheduledTime}:00`;
      const scheduledDateTime = new Date(dateTimeString);
      scheduledFor = scheduledDateTime.toISOString();
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPost.title.trim(),
          description: newPost.description.trim() || null,
          thumbnailUrl: newPost.thumbnailUrl.trim() || imageUrls[0] || null, // Auto-use first image if no thumbnail specified
          imageUrls,
          videoUrls,
          categories: selectedCategories,
          actressIds: selectedCreators,
          tags: tags,
          isVip: isVipContent,
          sourceUrl: newPost.sourceUrl.trim() || null,
          scheduledFor: scheduledFor,
          published: !isScheduled, // If scheduled, post should be draft until schedule time
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to create post');
        return;
      }

      toast.success(isScheduled ? 'Post scheduled successfully' : 'Post created successfully');
      setIsCreateDialogOpen(false);
      setNewPost({
        title: '',
        description: '',
        thumbnailUrl: '',
        sourceUrl: '',
      });
      setImageUrls([]);
      setVideoUrls([]);
      setImageUrlInput('');
      setVideoUrlInput('');
      setSelectedCategories([]);
      setSelectedCreators([]);
      setCategorySearch('');
      setCreatorSearch('');
      setTags([]);
      setTagInput('');
      setIsVipContent(false);
      setIsScheduled(false);
      setScheduledDate(getCurrentDate());
      setScheduledTime(getCurrentTime());
      fetchPosts();
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('An error occurred while creating post');
    } finally {
      setIsCreating(false);
    }
  };

  // Edit tag management
  const addEditTag = () => {
    const trimmedTag = editTagInput.trim().toLowerCase();
    if (trimmedTag && !editTags.includes(trimmedTag) && editTags.length < 20) {
      setEditTags([...editTags, trimmedTag]);
      setEditTagInput('');
    }
  };

  const removeEditTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleEditTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEditTag();
    } else if (e.key === 'Backspace' && !editTagInput && editTags.length > 0) {
      setEditTags(editTags.slice(0, -1));
    }
  };

  const addEditImageUrl = () => {
    const trimmedUrl = editImageUrlInput.trim();
    if (trimmedUrl && editImageUrls.length < 50) {
      try {
        new URL(trimmedUrl); // Validate URL
        setEditImageUrls([...editImageUrls, trimmedUrl]);
        setEditImageUrlInput('');
      } catch {
        toast.error('Invalid image URL');
      }
    }
  };

  const removeEditImageUrl = (url: string) => {
    setEditImageUrls(editImageUrls.filter(u => u !== url));
  };

  const addEditVideoUrl = () => {
    const trimmedUrl = editVideoUrlInput.trim();
    if (trimmedUrl && editVideoUrls.length < 50) {
      try {
        new URL(trimmedUrl); // Validate URL
        setEditVideoUrls([...editVideoUrls, trimmedUrl]);
        setEditVideoUrlInput('');
      } catch {
        toast.error('Invalid video URL');
      }
    }
  };

  const removeEditVideoUrl = (url: string) => {
    setEditVideoUrls(editVideoUrls.filter(u => u !== url));
  };

  const openEditDialog = (post: Post) => {
    setEditingPost(post);
    setEditPost({
      title: post.title,
      description: post.description || '',
      thumbnailUrl: post.thumbnailUrl || '',
      sourceUrl: post.sourceUrl || '',
    });
    setEditImageUrls(post.imageUrls || []);
    setEditVideoUrls(post.videoUrls || []);
    setEditImageUrlInput('');
    setEditVideoUrlInput('');
    setEditIsVipContent(post.isVip || false);
    setEditSelectedCategories(post.categories || []);
    setEditSelectedCreators(post.actressIds || []);
    setEditTags(post.tags || []);
    setEditCategorySearch('');
    setEditActressSearch('');
    setEditTagInput('');

    // Handle scheduled post data
    if (post.scheduledFor) {
      setEditIsScheduled(true);
      const scheduledDate = new Date(post.scheduledFor);
      const year = scheduledDate.getFullYear();
      const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
      const day = String(scheduledDate.getDate()).padStart(2, '0');
      const hours = String(scheduledDate.getHours()).padStart(2, '0');
      const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
      setEditScheduledDate(`${year}-${month}-${day}`);
      setEditScheduledTime(`${hours}:${minutes}`);
    } else {
      setEditIsScheduled(false);
      setEditScheduledDate(getCurrentDate());
      setEditScheduledTime(getCurrentTime());
    }

    setIsEditDialogOpen(true);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPost) return;

    if (!editPost.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editSelectedCategories.length === 0) {
      toast.error('At least one category is required');
      return;
    }

    if (editImageUrls.length === 0 && editVideoUrls.length === 0) {
      toast.error('At least one image or video URL is required');
      return;
    }

    // Validate scheduled post
    if (editIsScheduled && (!editScheduledDate || !editScheduledTime)) {
      toast.error('Please provide both date and time for scheduled post');
      return;
    }

    if (editIsScheduled && editIsScheduledInPast()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    // Prepare scheduled datetime
    let scheduledFor = null;
    if (editIsScheduled && editScheduledDate && editScheduledTime) {
      scheduledFor = new Date(`${editScheduledDate}T${editScheduledTime}:00`).toISOString();
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPost.title.trim(),
          description: editPost.description.trim() || null,
          thumbnailUrl: editPost.thumbnailUrl.trim() || null,
          imageUrls: editImageUrls,
          videoUrls: editVideoUrls,
          categories: editSelectedCategories,
          actressIds: editSelectedCreators,
          tags: editTags,
          isVip: editIsVipContent,
          sourceUrl: editPost.sourceUrl.trim() || null,
          published: !editIsScheduled, // If scheduled, mark as unpublished
          scheduledFor: scheduledFor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update post');
        return;
      }

      toast.success('Post updated successfully');
      setIsEditDialogOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('An error occurred while updating post');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Posts Management</h1>
          <p className="text-gray-400 mt-1">Manage and moderate all posts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="mt-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Title *</label>
                    <Input
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Enter post title"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      disabled={isCreating}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      value={newPost.description}
                      onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                      placeholder="Enter post description"
                      className="w-full min-h-[120px] px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-500 resize-none"
                      disabled={isCreating}
                    />
                  </div>

                  {/* Thumbnail URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Thumbnail URL</label>
                    <Input
                      value={newPost.thumbnailUrl}
                      onChange={(e) => setNewPost({ ...newPost, thumbnailUrl: e.target.value })}
                      placeholder="https://example.com/thumbnail.jpg"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      disabled={isCreating}
                    />
                    <p className="text-xs text-gray-500">Optional thumbnail image for the post</p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Tags {tags.length > 0 && <span className="text-gray-500">({tags.length}/20)</span>}
                    </label>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2 min-h-[100px]">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              disabled={isCreating}
                              className="hover:bg-pink-600/30 rounded-full p-0.5 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        onBlur={addTag}
                        placeholder={tags.length === 0 ? "Type and press Enter to add tags..." : "Add more tags..."}
                        className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={isCreating || tags.length >= 20}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Press Enter or comma to add a tag</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Categories Multi-Select */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">
                        Categories * {selectedCategories.length > 0 && <span className="text-gray-500">({selectedCategories.length})</span>}
                      </label>
                      <button
                        type="button"
                        onClick={fetchCategories}
                        disabled={isRefreshingCategories || isCreating}
                        className="text-gray-400 hover:text-gray-300 transition disabled:opacity-50"
                        title="Refresh categories"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingCategories ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2">
                      {selectedCategories.length > 0 && (
                        <div className="max-h-24 overflow-y-auto mb-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedCategories.map((categoryName) => (
                              <span
                                key={categoryName}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-400 border border-green-600/30"
                              >
                                {categoryName}
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== categoryName))}
                                  disabled={isCreating}
                                  className="hover:bg-green-600/30 rounded-full p-0.5 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <Input
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories..."
                        className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0 mb-1"
                        disabled={isCreating}
                      />
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {categories
                          .filter(cat =>
                            !selectedCategories.includes(cat) &&
                            cat.toLowerCase().includes(categorySearch.toLowerCase())
                          )
                          .map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setSelectedCategories([...selectedCategories, category]);
                                setCategorySearch('');
                              }}
                              disabled={isCreating}
                              className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700/50 rounded transition"
                            >
                              {category}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Creators Multi-Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Creators {selectedCreators.length > 0 && <span className="text-gray-500">({selectedCreators.length})</span>}
                    </label>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2">
                      {selectedCreators.length > 0 && (
                        <div className="max-h-24 overflow-y-auto mb-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedCreators.map((creatorId) => {
                              const creator = creators.find(a => a.id === creatorId);
                              return creator ? (
                                <span
                                  key={creatorId}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30"
                                >
                                  {creator.name}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCreators(selectedCreators.filter(id => id !== creatorId))}
                                    disabled={isCreating}
                                    className="hover:bg-purple-600/30 rounded-full p-0.5 transition"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      <Input
                        value={creatorSearch}
                        onChange={(e) => setCreatorSearch(e.target.value)}
                        placeholder="Search creators..."
                        className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0 mb-1"
                        disabled={isCreating}
                      />
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {creators
                          .filter(creator =>
                            !selectedCreators.includes(creator.id) &&
                            creator.name.toLowerCase().includes(creatorSearch.toLowerCase())
                          )
                          .map((creator) => (
                            <button
                              key={creator.id}
                              type="button"
                              onClick={() => {
                                setSelectedCreators([...selectedCreators, creator.id]);
                                setCreatorSearch('');
                              }}
                              disabled={isCreating}
                              className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700/50 rounded transition"
                            >
                              {creator.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Image URLs */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Image URLs {imageUrls.length > 0 && <span className="text-gray-500">({imageUrls.length}/50)</span>}
                    </label>

                    {/* Bulk Import Section */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-md p-3 space-y-2">
                      <label className="text-xs font-medium text-gray-400">Bulk Import (BBCode or URLs)</label>
                      <Textarea
                        value={bulkImageInput}
                        onChange={(e) => setBulkImageInput(e.target.value)}
                        placeholder="BBCODE Format"
                        className="bg-gray-800/50 border-gray-700 text-white text-xs min-h-[100px] resize-y"
                        disabled={isCreating || imageUrls.length >= 50}
                      />
                      <Button
                        type="button"
                        onClick={addBulkImages}
                        disabled={isCreating || imageUrls.length >= 50 || !bulkImageInput.trim()}
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Import Images
                      </Button>
                      <p className="text-xs text-gray-500">Supports BBCode format (PixHost, ImgBox, etc.) and plain URLs</p>
                    </div>

                    {/* Single URL Input */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2 min-h-[80px]">
                      {imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {imageUrls.map((url, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30"
                            >
                              Image {index + 1}
                              <button
                                type="button"
                                onClick={() => removeImageUrl(url)}
                                disabled={isCreating}
                                className="hover:bg-blue-600/30 rounded-full p-0.5 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                          placeholder="https://example.com/image.jpg"
                          className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                          disabled={isCreating || imageUrls.length >= 50}
                        />
                        <Button
                          type="button"
                          onClick={addImageUrl}
                          disabled={isCreating || imageUrls.length >= 50 || !imageUrlInput.trim()}
                          size="sm"
                          className="h-7 px-2 bg-blue-600 hover:bg-blue-700"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Add single URL or use bulk import above</p>
                  </div>

                  {/* Video URLs */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Video URLs {videoUrls.length > 0 && <span className="text-gray-500">({videoUrls.length}/50)</span>}
                    </label>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2 min-h-[80px]">
                      {videoUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {videoUrls.map((url, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30"
                            >
                              Video {index + 1}
                              <button
                                type="button"
                                onClick={() => removeVideoUrl(url)}
                                disabled={isCreating}
                                className="hover:bg-red-600/30 rounded-full p-0.5 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVideoUrl())}
                          placeholder="https://example.com/video.mp4"
                          className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                          disabled={isCreating || videoUrls.length >= 50}
                        />
                        <Button
                          type="button"
                          onClick={addVideoUrl}
                          disabled={isCreating || videoUrls.length >= 50 || !videoUrlInput.trim()}
                          size="sm"
                          className="h-7 px-2 bg-red-600 hover:bg-red-700"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Press Enter or click Add to add video URLs</p>
                  </div>

                  <p className="text-xs text-gray-500 pt-1">* At least one media URL (image or video) is required</p>
                </div>
              </div>

              {/* Source Link (Mega.nz URL) */}
              <div className="space-y-2 border-t border-gray-800 pt-4">
                <label className="text-sm font-medium text-gray-300">Source Link (Mega.nz URL)</label>
                <Input
                  value={newPost.sourceUrl}
                  onChange={(e) => setNewPost({ ...newPost, sourceUrl: e.target.value })}
                  placeholder="https://mega.nz/..."
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500">Full content download link (e.g., Mega.nz link)</p>
              </div>

              {/* VIP Content Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="vip-toggle" className="text-sm font-medium text-gray-300">
                    VIP/Premium Content
                  </label>
                  <button
                    id="vip-toggle"
                    type="button"
                    onClick={() => setIsVipContent(!isVipContent)}
                    disabled={isCreating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isVipContent ? 'bg-pink-600' : 'bg-gray-700'
                    } ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isVipContent ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Only VIP members can view this post</p>
              </div>

              {/* Schedule Post */}
              <div className="space-y-3 border-t border-gray-800 pt-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="schedule-toggle" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    Schedule Post
                  </label>
                  <button
                    id="schedule-toggle"
                    type="button"
                    onClick={() => {
                      setIsScheduled(!isScheduled);
                      if (!isScheduled) {
                        // When enabling, set to current date/time
                        setScheduledDate(getCurrentDate());
                        setScheduledTime(getCurrentTime());
                      }
                    }}
                    disabled={isCreating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isScheduled ? 'bg-blue-600' : 'bg-gray-700'
                    } ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isScheduled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isScheduled && (
                  <div className={`grid grid-cols-2 gap-3 bg-gray-800/30 border rounded-lg p-3 ${
                    isScheduledInPast() ? 'border-red-600/50' : 'border-gray-700'
                  }`}>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Date
                      </label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`bg-gray-800/50 border-gray-700 text-white text-sm ${
                          isScheduledInPast() ? 'border-red-600/50' : ''
                        }`}
                        disabled={isCreating}
                        required={isScheduled}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Time
                      </label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className={`bg-gray-800/50 border-gray-700 text-white text-sm ${
                          isScheduledInPast() ? 'border-red-600/50' : ''
                        }`}
                        disabled={isCreating}
                        required={isScheduled}
                      />
                    </div>
                    <div className="col-span-2">
                      {isScheduledInPast() ? (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                          Scheduled time passed
                        </p>
                      ) : (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-green-400"></span>
                          Post will be published on {scheduledDate || 'selected date'} at {scheduledTime || 'selected time'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {isScheduled ? 'Post will be automatically published at the scheduled time' : 'Post will be published immediately'}
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isCreating || (isScheduled && isScheduledInPast())}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Create Post
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

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePost} className="mt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Title *</label>
                  <Input
                    value={editPost.title}
                    onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                    placeholder="Enter post title"
                    className="bg-gray-800/50 border-gray-700 text-white"
                    disabled={isUpdating}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    value={editPost.description}
                    onChange={(e) => setEditPost({ ...editPost, description: e.target.value })}
                    placeholder="Enter post description"
                    className="w-full min-h-[120px] px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder:text-gray-500 resize-none"
                    disabled={isUpdating}
                  />
                </div>

                {/* Thumbnail URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Thumbnail URL</label>
                  <Input
                    value={editPost.thumbnailUrl}
                    onChange={(e) => setEditPost({ ...editPost, thumbnailUrl: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="bg-gray-800/50 border-gray-700 text-white"
                    disabled={isUpdating}
                  />
                  <p className="text-xs text-gray-500">Optional thumbnail image for the post</p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Tags {editTags.length > 0 && <span className="text-gray-500">({editTags.length}/20)</span>}
                  </label>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2 min-h-[100px]">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeEditTag(tag)}
                            disabled={isUpdating}
                            className="hover:bg-pink-600/30 rounded-full p-0.5 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={handleEditTagInputKeyDown}
                      onBlur={addEditTag}
                      placeholder={editTags.length === 0 ? "Type and press Enter to add tags..." : "Add more tags..."}
                      className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={isUpdating || editTags.length >= 20}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Press Enter or comma to add a tag</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Categories Multi-Select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      Categories * {editSelectedCategories.length > 0 && <span className="text-gray-500">({editSelectedCategories.length})</span>}
                    </label>
                    <button
                      type="button"
                      onClick={fetchCategories}
                      disabled={isRefreshingCategories || isUpdating}
                      className="text-gray-400 hover:text-gray-300 transition disabled:opacity-50"
                      title="Refresh categories"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshingCategories ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2">
                    {editSelectedCategories.length > 0 && (
                      <div className="max-h-24 overflow-y-auto mb-2">
                        <div className="flex flex-wrap gap-2">
                          {editSelectedCategories.map((categoryName) => (
                            <span
                              key={categoryName}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-400 border border-green-600/30"
                            >
                              {categoryName}
                              <button
                                type="button"
                                onClick={() => setEditSelectedCategories(editSelectedCategories.filter(c => c !== categoryName))}
                                disabled={isUpdating}
                                className="hover:bg-green-600/30 rounded-full p-0.5 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <Input
                      value={editCategorySearch}
                      onChange={(e) => setEditCategorySearch(e.target.value)}
                      placeholder="Search categories..."
                      className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={isUpdating}
                    />
                    {editCategorySearch && (
                      <div className="mt-2 max-h-[120px] overflow-y-auto space-y-1">
                        {categories
                          .filter(cat =>
                            cat.toLowerCase().includes(editCategorySearch.toLowerCase()) &&
                            !editSelectedCategories.includes(cat)
                          )
                          .map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                if (editSelectedCategories.length < 10) {
                                  setEditSelectedCategories([...editSelectedCategories, category]);
                                  setEditCategorySearch('');
                                }
                              }}
                              disabled={isUpdating || editSelectedCategories.length >= 10}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition disabled:opacity-50"
                            >
                              {category}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Search and click to add (max 10)</p>
                </div>

                {/* Creators Multi-Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Creators {editSelectedCreators.length > 0 && <span className="text-gray-500">({editSelectedCreators.length})</span>}
                  </label>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2">
                    {editSelectedCreators.length > 0 && (
                      <div className="max-h-24 overflow-y-auto mb-2">
                        <div className="flex flex-wrap gap-2">
                          {editSelectedCreators.map((creatorId) => {
                            const creator = creators.find(a => a.id === creatorId);
                            return (
                              <span
                                key={creatorId}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30"
                              >
                                {creator?.name || creatorId}
                                <button
                                  type="button"
                                  onClick={() => setEditSelectedCreators(editSelectedCreators.filter(id => id !== creatorId))}
                                  disabled={isUpdating}
                                  className="hover:bg-purple-600/30 rounded-full p-0.5 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <Input
                      value={editCreatorSearch}
                      onChange={(e) => setEditCreatorSearch(e.target.value)}
                      placeholder="Search creators..."
                      className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={isUpdating}
                    />
                    {editCreatorSearch && (
                      <div className="mt-2 max-h-[120px] overflow-y-auto space-y-1">
                        {creators
                          .filter(creator =>
                            creator.name.toLowerCase().includes(editCreatorSearch.toLowerCase()) &&
                            !editSelectedCreators.includes(creator.id)
                          )
                          .map((creator) => (
                            <button
                              key={creator.id}
                              type="button"
                              onClick={() => {
                                if (editSelectedCreators.length < 20) {
                                  setEditSelectedCreators([...editSelectedCreators, creator.id]);
                                  setEditCreatorSearch('');
                                }
                              }}
                              disabled={isUpdating || editSelectedCreators.length >= 20}
                              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition disabled:opacity-50"
                            >
                              {creator.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Search and click to add (max 20)</p>
                </div>

                {/* Image URLs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Image URLs {editImageUrls.length > 0 && <span className="text-gray-500">({editImageUrls.length}/50)</span>}
                  </label>

                  {/* Bulk Import Section */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-md p-3 space-y-2">
                    <label className="text-xs font-medium text-gray-400">Bulk Import (BBCode or URLs)</label>
                    <Textarea
                      value={editBulkImageInput}
                      onChange={(e) => setEditBulkImageInput(e.target.value)}
                      placeholder="BBCODE Format"
                      className="bg-gray-800/50 border-gray-700 text-white text-xs min-h-[100px] resize-y"
                      disabled={isUpdating || editImageUrls.length >= 50}
                    />
                    <Button
                      type="button"
                      onClick={addEditBulkImages}
                      disabled={isUpdating || editImageUrls.length >= 50 || !editBulkImageInput.trim()}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Import Images
                    </Button>
                    <p className="text-xs text-gray-500">Supports BBCode format (PixHost, ImgBox, etc.) and plain URLs</p>
                  </div>

                  {/* Single URL Input */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2 min-h-[80px]">
                    {editImageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editImageUrls.map((url, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30"
                          >
                            Image {index + 1}
                            <button
                              type="button"
                              onClick={() => removeEditImageUrl(url)}
                              disabled={isUpdating}
                              className="hover:bg-blue-600/30 rounded-full p-0.5 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={editImageUrlInput}
                        onChange={(e) => setEditImageUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditImageUrl())}
                        placeholder="https://example.com/image.jpg"
                        className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                        disabled={isUpdating || editImageUrls.length >= 50}
                      />
                      <Button
                        type="button"
                        onClick={addEditImageUrl}
                        disabled={isUpdating || editImageUrls.length >= 50 || !editImageUrlInput.trim()}
                        size="sm"
                        className="h-7 px-2 bg-blue-600 hover:bg-blue-700"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Add single URL or use bulk import above</p>
                </div>

                {/* Video URLs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Video URLs {editVideoUrls.length > 0 && <span className="text-gray-500">({editVideoUrls.length}/50)</span>}
                  </label>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-md p-2 min-h-[80px]">
                    {editVideoUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editVideoUrls.map((url, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30"
                          >
                            Video {index + 1}
                            <button
                              type="button"
                              onClick={() => removeEditVideoUrl(url)}
                              disabled={isUpdating}
                              className="hover:bg-red-600/30 rounded-full p-0.5 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={editVideoUrlInput}
                        onChange={(e) => setEditVideoUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditVideoUrl())}
                        placeholder="https://example.com/video.mp4"
                        className="border-0 bg-transparent text-white p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                        disabled={isUpdating || editVideoUrls.length >= 50}
                      />
                      <Button
                        type="button"
                        onClick={addEditVideoUrl}
                        disabled={isUpdating || editVideoUrls.length >= 50 || !editVideoUrlInput.trim()}
                        size="sm"
                        className="h-7 px-2 bg-red-600 hover:bg-red-700"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Press Enter or click Add to add video URLs</p>
                </div>

                <p className="text-xs text-gray-500 pt-1">* At least one media URL (image or video) is required</p>
              </div>
            </div>

            {/* Source Link (Mega.nz URL) */}
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <label className="text-sm font-medium text-gray-300">Source Link (Mega.nz URL)</label>
              <Input
                value={editPost.sourceUrl}
                onChange={(e) => setEditPost({ ...editPost, sourceUrl: e.target.value })}
                placeholder="https://mega.nz/..."
                className="bg-gray-800/50 border-gray-700 text-white"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">Full content download link (e.g., Mega.nz link)</p>
            </div>

            {/* VIP Content Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="edit-vip-toggle" className="text-sm font-medium text-gray-300">
                  VIP/Premium Content
                </label>
                <button
                  id="edit-vip-toggle"
                  type="button"
                  onClick={() => setEditIsVipContent(!editIsVipContent)}
                  disabled={isUpdating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editIsVipContent ? 'bg-pink-600' : 'bg-gray-700'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editIsVipContent ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500">Only VIP members can view this post</p>
            </div>

            {/* Schedule Post */}
            <div className="space-y-3 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between">
                <label htmlFor="edit-schedule-toggle" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  Schedule Post
                </label>
                <button
                  id="edit-schedule-toggle"
                  type="button"
                  onClick={() => {
                    setEditIsScheduled(!editIsScheduled);
                    if (!editIsScheduled) {
                      // When enabling, set to current date/time
                      setEditScheduledDate(getCurrentDate());
                      setEditScheduledTime(getCurrentTime());
                    }
                  }}
                  disabled={isUpdating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editIsScheduled ? 'bg-blue-600' : 'bg-gray-700'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editIsScheduled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {editIsScheduled && (
                <div className={`grid grid-cols-2 gap-3 bg-gray-800/30 border rounded-lg p-3 ${
                  editIsScheduledInPast() ? 'border-red-600/50' : 'border-gray-700'
                }`}>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date
                    </label>
                    <Input
                      type="date"
                      value={editScheduledDate}
                      onChange={(e) => setEditScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`bg-gray-800/50 border-gray-700 text-white text-sm ${
                        editIsScheduledInPast() ? 'border-red-600/50' : ''
                      }`}
                      disabled={isUpdating}
                      required={editIsScheduled}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Time
                    </label>
                    <Input
                      type="time"
                      value={editScheduledTime}
                      onChange={(e) => setEditScheduledTime(e.target.value)}
                      className={`bg-gray-800/50 border-gray-700 text-white text-sm ${
                        editIsScheduledInPast() ? 'border-red-600/50' : ''
                      }`}
                      disabled={isUpdating}
                      required={editIsScheduled}
                    />
                  </div>
                  <div className="col-span-2">
                    {editIsScheduledInPast() ? (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                        Scheduled time passed
                      </p>
                    ) : (
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-green-400"></span>
                        Post will be published on {editScheduledDate || 'selected date'} at {editScheduledTime || 'selected time'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                {editIsScheduled ? 'Post will be automatically published at the scheduled time' : 'Post will be published immediately'}
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isUpdating || (editIsScheduled && editIsScheduledInPast())}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Post
                  </>
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

      {/* Filters */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search posts.."
            className="pl-11 bg-gray-800/50 border-gray-700/50 text-white"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <FileText className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No posts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Post
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {(post.imageUrls.length > 0 || post.videoUrls.length > 0) && (
                          <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {post.imageUrls.length > 0 ? (
                              <img
                                src={post.imageUrls[0]}
                                alt={post.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-600" />
                              </div>
                            )}

                            {/* Media count indicators - bottom right */}
                            <div className="absolute bottom-1 right-1 flex gap-0.5">
                              {post.imageUrls.length > 0 && (
                                <div className="flex items-center gap-0.5 text-white text-[10px]">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>{post.imageUrls.length}</span>
                                </div>
                              )}
                              {post.videoUrls.length > 0 && (
                                <div className="flex items-center gap-0.5 text-white text-[10px]">
                                  <Video className="w-2.5 h-2.5" />
                                  <span>{post.videoUrls.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{post.title}</p>
                          <p className="text-gray-500 text-sm truncate">
                            {post.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {post.categories.slice(0, 2).map((category) => (
                          <span key={category} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                            {category}
                          </span>
                        ))}
                        {post.categories.length > 2 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
                            +{post.categories.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        <div>{post._count.likes} likes</div>
                        <div>{post._count.saves} saves</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.published
                              ? 'bg-green-600/20 text-green-400'
                              : post.scheduledFor
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {post.published ? 'Published' : post.scheduledFor ? 'Scheduled' : 'Draft'}
                        </span>
                        {post.scheduledFor && (
                          <span className="text-xs text-gray-500">
                            {new Date(post.scheduledFor).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
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
                            onClick={() => openEditDialog(post)}
                            className="text-gray-300 hover:text-white hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTogglePublish(post.id, post.published)}
                            className="text-gray-300 hover:text-white hover:bg-gray-800"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {post.published ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
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
