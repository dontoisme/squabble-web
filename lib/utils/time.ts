import { Book, Chapter } from '@/lib/books/types';

/**
 * Convert chapter index + offset to absolute seconds from book start
 */
export function chapterToSeconds(
  book: Book,
  chapterIndex: number,
  offsetSeconds: number
): number {
  const chapter = book.chapters[chapterIndex];
  if (!chapter) return 0;
  return chapter.startSeconds + Math.min(offsetSeconds, chapter.durationSeconds);
}

/**
 * Convert absolute seconds to chapter index + offset within that chapter
 */
export function secondsToChapter(
  book: Book,
  totalSeconds: number
): { chapter: Chapter; offsetSeconds: number } {
  // Find the chapter that contains this timestamp
  for (let i = book.chapters.length - 1; i >= 0; i--) {
    const chapter = book.chapters[i];
    if (totalSeconds >= chapter.startSeconds) {
      return {
        chapter,
        offsetSeconds: totalSeconds - chapter.startSeconds,
      };
    }
  }
  // Default to first chapter
  return {
    chapter: book.chapters[0],
    offsetSeconds: 0,
  };
}

/**
 * Format seconds as "HH:MM:SS" or "MM:SS" (matches Comment.formattedTimestamp in iOS)
 */
export function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Parse a time string like "1:23:45" or "23:45" into seconds
 */
export function parseTimestamp(timeString: string): number {
  const parts = timeString.split(':').map(Number);

  if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + seconds;
  } else if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = parts;
    return (minutes * 60) + seconds;
  }

  return 0;
}

/**
 * Format chapter position for display (e.g., "Chapter 5 @ 12:34")
 */
export function formatChapterPosition(
  book: Book,
  chapterIndex: number,
  offsetSeconds: number
): string {
  const chapter = book.chapters[chapterIndex];
  if (!chapter) return '';
  return `${chapter.title} @ ${formatTimestamp(offsetSeconds)}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercent(
  currentSeconds: number,
  totalSeconds: number
): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, (currentSeconds / totalSeconds) * 100));
}

/**
 * Format duration for display (e.g., "17h 45m")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
