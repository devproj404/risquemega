import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-neutral-800/50',
        className
      )}
    />
  );
}

export function ThumbnailSkeleton() {
  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
        <img
          src="/images/skeleton.png"
          alt="Loading"
          className="relative z-10 w-full h-full object-contain animate-bounce"
          style={{
            filter: 'brightness(2) saturate(1.5) drop-shadow(0 0 30px rgba(234, 179, 8, 1)) drop-shadow(0 0 15px rgba(234, 179, 8, 0.8))',
          }}
          onError={(e) => {
            console.error('Skeleton image failed to load');
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="relative group">
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-900">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="mt-2 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Media Section */}
          <div className="lg:col-span-2">
            <Skeleton className="w-full aspect-video rounded-xl" />

            {/* Thumbnails */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 flex-shrink-0 rounded" />
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-900/50">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExplorerSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(30)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
