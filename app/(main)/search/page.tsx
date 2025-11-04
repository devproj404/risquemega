'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Image as ImageIcon, User, Tag, Folder, Eye } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface SearchResults {
  posts: any[];
  actresses: any[];
  users: any[];
  categories: string[];
  tags: string[];
}

type TabType = 'all' | 'posts' | 'creators';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>({
    posts: [],
    actresses: [],
    users: [],
    categories: [],
    tags: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults({
        posts: [],
        actresses: [],
        users: [],
        categories: [],
        tags: [],
      });
      return;
    }

    setIsLoading(true);
    setQuery(searchQuery);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      performSearch(searchInput);
      // Update URL
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  const getTotalResults = () => {
    return (
      results.posts.length +
      results.actresses.length +
      results.users.length +
      results.categories.length +
      results.tags.length
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="w-full">
        {/* Header with Search */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-4">Search</h1>

          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for posts, creators, users, tags..."
                className="pl-12 bg-gray-900 border-gray-800 text-white h-12 text-base"
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-800 mb-6">
          {(['all', 'posts', 'creators'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (query) performSearch(query);
              }}
              className={`pb-3 text-sm font-medium transition relative capitalize ${
                activeTab === tab
                  ? 'text-pink-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Searching...</p>
          </div>
        ) : !query ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Enter a search query to find posts, creators, users, and more</p>
          </div>
        ) : getTotalResults() === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No results found for "{query}"</p>
            <p className="text-gray-600 text-sm mt-2">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Posts Results */}
            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Posts ({results.posts.length})</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {results.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden mb-2">
                        {post.thumbnailUrl || post.imageUrls[0] ? (
                          <img
                            src={post.thumbnailUrl || post.imageUrls[0]}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <ImageIcon className="w-12 h-12 text-gray-600" />
                          </div>
                        )}

                        {post.isVip && (
                          <div className="absolute top-2 left-2">
                            <div className="bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 backdrop-blur-sm text-black text-xs px-2 py-1 rounded font-bold">
                              VIP
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2">
                          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                            <Eye className="w-3 h-3" />
                            <span>{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}</span>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-pink-400 transition">
                        {post.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Creators Results */}
            {(activeTab === 'all' || activeTab === 'creators') && results.actresses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Creators ({results.actresses.length})</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.actresses.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.slug}`}
                      className="group"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-gray-900 overflow-hidden mb-3">
                          {creator.imageUrl ? (
                            <img
                              src={creator.imageUrl}
                              alt={creator.name}
                              className="w-full h-full object-contain bg-gray-900"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-10 h-10 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-white text-sm font-medium text-center group-hover:text-pink-400 transition">
                          {creator.name}
                        </h3>
                        {creator.nationality && (
                          <p className="text-gray-500 text-xs text-center mt-1">
                            {creator.nationality}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Results */}
            {activeTab === 'all' && results.categories.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Folder className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Categories ({results.categories.length})</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.categories.map((category) => (
                    <Link
                      key={category}
                      href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                      className="bg-pink-600 hover:bg-pink-700 text-white text-sm px-4 py-2 rounded transition"
                    >
                      #{category}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Results */}
            {activeTab === 'all' && results.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Tags ({results.tags.length})</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="w-full">
          <h1 className="text-2xl font-semibold text-white mb-4">Search</h1>
          <div className="text-center py-16">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <SearchContent />
    </Suspense>
  );
}
