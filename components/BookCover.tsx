'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCachedCover } from '@/hooks/useHardcover';

interface BookCoverProps {
  title: string;
  author?: string;
  coverUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** If true, attempt to fetch cover from Hardcover API when no coverUrl provided */
  autoFetch?: boolean;
  /** Called when a cover is fetched via autoFetch (useful for persisting to database) */
  onCoverFetched?: (coverUrl: string) => void;
}

const sizeClasses = {
  sm: 'w-16 h-24',
  md: 'w-32 h-44',
  lg: 'w-48 h-64',
};

// Generate a consistent color based on title
function getTitleColor(title: string): string {
  const colors = [
    'from-violet-600 to-purple-800',
    'from-blue-600 to-indigo-800',
    'from-emerald-600 to-teal-800',
    'from-amber-600 to-orange-800',
    'from-rose-600 to-pink-800',
    'from-cyan-600 to-blue-800',
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Extract book number from title (e.g., "Mage Tank 2" -> "2")
function getBookNumber(title: string): string | null {
  const match = title.match(/(\d+)$/);
  return match ? match[1] : null;
}

export function BookCover({
  title,
  author,
  coverUrl,
  size = 'md',
  className = '',
  autoFetch = false,
  onCoverFetched,
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const colorClass = getTitleColor(title);
  const bookNumber = getBookNumber(title);

  // Track client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only fetch from Hardcover if autoFetch is enabled and no coverUrl provided
  const shouldFetch = autoFetch && !coverUrl;
  const { coverUrl: fetchedCoverUrl, loading } = useCachedCover(
    shouldFetch ? title : '',
    shouldFetch ? author : undefined
  );

  const effectiveCoverUrl = coverUrl || fetchedCoverUrl;

  // Debug logging
  console.log(`[BookCover] "${title}"`, {
    coverUrl: coverUrl ? '✓ from prop' : '✗ no prop',
    fetchedCoverUrl: fetchedCoverUrl ? '✓ fetched' : '✗ not fetched',
    shouldFetch,
    autoFetch,
    loading,
    hasCallback: !!onCoverFetched,
  });

  // Reset image loaded state when URL changes
  useEffect(() => {
    setImageLoaded(false);
  }, [effectiveCoverUrl]);

  // Notify parent when a cover is fetched (for persisting to database)
  useEffect(() => {
    console.log(`[BookCover] "${title}" backfill check:`, {
      fetchedCoverUrl: !!fetchedCoverUrl,
      coverUrl: !!coverUrl,
      onCoverFetched: !!onCoverFetched,
      willBackfill: !!(fetchedCoverUrl && !coverUrl && onCoverFetched),
    });
    if (fetchedCoverUrl && !coverUrl && onCoverFetched) {
      console.log(`[BookCover] "${title}" CALLING onCoverFetched with:`, fetchedCoverUrl);
      onCoverFetched(fetchedCoverUrl);
    }
  }, [fetchedCoverUrl, coverUrl, onCoverFetched, title]);

  // Show image immediately if coverUrl prop is provided (no hydration mismatch possible)
  // Only wait for mount when using fetched/cached URL (to avoid hydration mismatch with sessionStorage)
  const hasImage = coverUrl
    ? (effectiveCoverUrl && !imageError)
    : (mounted && effectiveCoverUrl && !imageError);

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-lg overflow-hidden shadow-md shrink-0`}>
      {/* Always render placeholder as background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} flex flex-col items-center justify-center p-2`}>
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

        {/* Loading indicator - show when fetching or when image is loading */}
        {(loading || (hasImage && !imageLoaded)) && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}

        {/* Book number or icon */}
        {bookNumber ? (
          <div className="text-white/90 font-bold text-4xl mb-1">
            {bookNumber}
          </div>
        ) : (
          <div className="text-white/80 text-3xl mb-2">
            📖
          </div>
        )}

        {/* Title */}
        <div className="text-white/90 text-xs font-medium text-center leading-tight line-clamp-3 px-1">
          {title.replace(/\s*\d+$/, '')}
        </div>

        {/* Decorative spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/20" />
      </div>

      {/* Image overlays placeholder and fades in when loaded */}
      {hasImage && effectiveCoverUrl && (
        <Image
          src={effectiveCoverUrl}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          unoptimized // External images from Hardcover
        />
      )}
    </div>
  );
}
