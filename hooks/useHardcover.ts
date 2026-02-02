'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface HardcoverBook {
  hardcoverId: number;
  title: string;
  author: string | null;
  series: string | null;
  seriesPosition: number | null;
  seriesBooksCount: number | null;
  coverUrl: string | null;
  audioDurationSeconds: number | null;
  popularity: number;
  hasAudiobook: boolean;
}

/**
 * Check if Hardcover API is configured on the server
 * Token is now stored in server-side .env.shared, not localStorage
 */
export function useHardcoverToken() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/hardcover/status')
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(data.configured);
        setLoaded(true);
      })
      .catch(() => {
        setIsConfigured(false);
        setLoaded(true);
      });
  }, []);

  return {
    hasToken: isConfigured,
    loaded,
    // Kept for API compatibility but no longer used
    token: null,
    setToken: () => {},
  };
}

/**
 * Hook for searching Hardcover
 */
export function useHardcoverSearch() {
  const { hasToken } = useHardcoverToken();
  const [results, setResults] = useState<HardcoverBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hardcover/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.books || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    search,
    results,
    loading,
    error,
    clearResults,
    hasToken,
  };
}

/**
 * Hook for looking up a single book's cover
 */
export function useBookCoverLookup() {
  const lookupCover = useCallback(async (title: string, author?: string): Promise<string | null> => {
    try {
      const params = new URLSearchParams({ title });
      if (author) params.set('author', author);

      const response = await fetch(`/api/hardcover/lookup?${params}`);

      if (!response.ok) return null;

      const data = await response.json();
      return data.book?.coverUrl || null;
    } catch {
      return null;
    }
  }, []);

  return { lookupCover };
}

// In-memory cache for cover URLs (fast access within same page)
const memoryCache = new Map<string, string | null>();
// Track in-flight fetches to prevent duplicates
const fetchingSet = new Set<string>();
// SessionStorage key prefix
const COVER_CACHE_PREFIX = 'squabble_cover_';

// Helper to get from persistent cache
function getFromCache(key: string): string | null | undefined {
  // Check memory first (fastest)
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  // Check sessionStorage (persists across navigation)
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(COVER_CACHE_PREFIX + key);
    if (stored !== null) {
      const value = stored === '' ? null : stored;
      memoryCache.set(key, value); // Populate memory cache
      return value;
    }
  }
  return undefined;
}

// Helper to save to persistent cache
function saveToCache(key: string, value: string | null): void {
  memoryCache.set(key, value);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(COVER_CACHE_PREFIX + key, value || '');
  }
}

/**
 * Hook for getting a book cover with caching
 * Uses sessionStorage to persist across page navigations
 */
export function useCachedCover(title: string, author?: string) {
  const cacheKey = title ? `${title}|${author || ''}` : '';

  // Initialize from cache synchronously to prevent flicker
  const [coverUrl, setCoverUrl] = useState<string | null>(() => {
    if (!cacheKey) return null;
    const cached = getFromCache(cacheKey);
    console.log(`[useCachedCover] "${title}" init from cache:`, cached !== undefined ? 'HIT' : 'MISS');
    return cached !== undefined ? cached : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title) {
      console.log('[useCachedCover] No title, skipping');
      return;
    }

    // Check cache again (might have been populated by another component)
    const cached = getFromCache(cacheKey);
    if (cached !== undefined) {
      console.log(`[useCachedCover] "${title}" cache HIT in effect:`, cached);
      setCoverUrl(cached);
      return;
    }

    // Already fetching this one
    if (fetchingSet.has(cacheKey)) {
      console.log(`[useCachedCover] "${title}" already fetching, skipping`);
      return;
    }

    console.log(`[useCachedCover] "${title}" FETCHING from API...`);
    fetchingSet.add(cacheKey);
    setLoading(true);

    const params = new URLSearchParams({ title });
    if (author) params.set('author', author);

    fetch(`/api/hardcover/lookup?${params}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const url = data?.book?.coverUrl || null;
        console.log(`[useCachedCover] "${title}" API response:`, url ? 'GOT URL' : 'NO URL', url);
        saveToCache(cacheKey, url);
        setCoverUrl(url);
      })
      .catch((err) => {
        console.error(`[useCachedCover] "${title}" API error:`, err);
        saveToCache(cacheKey, null);
        setCoverUrl(null);
      })
      .finally(() => {
        fetchingSet.delete(cacheKey);
        setLoading(false);
      });
  }, [title, author, cacheKey]);

  return { coverUrl, loading };
}
