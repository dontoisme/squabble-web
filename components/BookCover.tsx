'use client';

import { useState } from 'react';
import Image from 'next/image';

interface BookCoverProps {
  title: string;
  coverUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
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

export function BookCover({ title, coverUrl, size = 'md', className = '' }: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const colorClass = getTitleColor(title);
  const bookNumber = getBookNumber(title);

  const showPlaceholder = !coverUrl || imageError;

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-lg overflow-hidden shadow-md shrink-0`}>
      {showPlaceholder ? (
        <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex flex-col items-center justify-center p-2`}>
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

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
      ) : (
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
