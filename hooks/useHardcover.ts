'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface HardcoverBook {
  hardcoverId: number;
  title: string;
  author: string | null;
  series: string | null;
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

// Cache for cover URLs to avoid repeated lookups
const coverCache = new Map<string, string | null>();

/**
 * Hook for getting a book cover with caching
 */
export function useCachedCover(title: string, author?: string) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!title) return;

    const cacheKey = `${title}|${author || ''}`;

    // Check cache first
    if (coverCache.has(cacheKey)) {
      setCoverUrl(coverCache.get(cacheKey) || null);
      return;
    }

    // Prevent duplicate fetches in strict mode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);

    const params = new URLSearchParams({ title });
    if (author) params.set('author', author);

    fetch(`/api/hardcover/lookup?${params}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const url = data?.book?.coverUrl || null;
        coverCache.set(cacheKey, url);
        setCoverUrl(url);
      })
      .catch(() => {
        coverCache.set(cacheKey, null);
        setCoverUrl(null);
      })
      .finally(() => setLoading(false));
  }, [title, author]);

  return { coverUrl, loading };
}
