'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Image as ImageIcon, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface SearchResult {
  posts: any[];
  actresses: any[];
}

export function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    posts: [],
    actresses: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ posts: [], actresses: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all`);
        if (response.ok) {
          const data = await response.json();
          setResults({
            posts: data.posts.slice(0, 3),
            actresses: data.actresses.slice(0, 3),
          });
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  const getTotalResults = () => {
    return results.posts.length + results.actresses.length;
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white transition"
      >
        <Search className="w-6 h-6" />
      </button>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[400px] bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts, creators..."
                className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Results */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">Searching...</p>
              </div>
            ) : query.trim().length < 2 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Type to search</p>
              </div>
            ) : getTotalResults() === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No results found</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Posts Results */}
                {results.posts.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase">
                      Posts
                    </div>
                    {results.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/post/${post.id}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition"
                      >
                        {post.thumbnailUrl || post.imageUrls[0] ? (
                          <img
                            src={post.thumbnailUrl || post.imageUrls[0]}
                            alt={post.title}
                            className="w-12 h-12 object-cover rounded bg-gray-800"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{post.title}</p>
                          <p className="text-gray-500 text-xs truncate">
                            {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views} views
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Creators Results */}
                {results.actresses.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase">
                      Creators
                    </div>
                    {results.actresses.map((creator) => (
                      <Link
                        key={creator.id}
                        href={`/creator/${creator.slug}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition"
                      >
                        {creator.imageUrl ? (
                          <img
                            src={creator.imageUrl}
                            alt={creator.name}
                            className="w-10 h-10 rounded-full object-contain bg-gray-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{creator.name}</p>
                          {creator.nationality && (
                            <p className="text-gray-500 text-xs truncate">{creator.nationality}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* View All Results Link */}
                {getTotalResults() > 0 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={handleResultClick}
                    className="block px-4 py-3 text-center text-sm text-pink-500 hover:text-pink-400 border-t border-gray-800 font-medium"
                  >
                    View all results
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
