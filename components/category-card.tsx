'use client';

import React from 'react';
import Link from 'next/link';

interface CategoryCardProps {
  categories: string[];
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ categories }) => {
  // Show max 5 categories
  const displayCategories = categories.slice(0, 5);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900/95 border-2 border-gray-800 shadow-[20px_20px_60px_#0a0a0a,-20px_-20px_60px_#1a1a1a]">
      {/* Content */}
      <div className="relative p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm">Categories</h3>
          <Link href="/categories" className="text-pink-500 text-xs hover:text-pink-400 transition">
            View all
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayCategories.map((category) => (
            <Link
              key={category}
              href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2.5 py-1 rounded transition"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
