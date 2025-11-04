'use client';

import Link from 'next/link';
import { Search, Rss, Heart, Bookmark, Upload, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SearchBar } from '@/components/search-bar';

interface NavbarClientProps {
  hasUser: boolean;
}

export function NavbarClient({ hasUser }: NavbarClientProps) {
  const { t } = useTranslation();

  if (!hasUser) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <SearchBar />

      {/* Feed Icon - Commented Out */}
      {/* <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/feed" className="text-gray-400 hover:text-white transition">
            <Rss className="w-6 h-6" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('feed')}</p>
        </TooltipContent>
      </Tooltip> */}

      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/likes" className="text-gray-400 hover:text-white transition">
            <Heart className="w-6 h-6" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('likes')}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/saved" className="text-gray-400 hover:text-white transition">
            <Bookmark className="w-6 h-6" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('saved')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
