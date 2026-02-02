'use client';

import { useState, useCallback, useEffect } from 'react';

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

const HARDCOVER_TOKEN_KEY = 'squabble_hardcover_token';

/**
 * Hook for managing Hardcover API token
 */
export function useHardcoverToken() {
  const [token, setTokenState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(HARDCOVER_TOKEN_KEY);
    setTokenState(stored);
    setLoaded(true);
  }, []);

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem(HARDCOVER_TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(HARDCOVER_TOKEN_KEY);
    }
    setTokenState(newToken);
  }, []);

  return {
    token,
    setToken,
    hasToken: !!token,
    loaded,
  };
}

/**
 * Hook for searching Hardcover
 */
export function useHardcoverSearch() {
  const { token, hasToken } = useHardcoverToken();
  const [results, setResults] = useState<HardcoverBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (!token) {
      setError('Hardcover API token not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hardcover/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'x-hardcover-token': token,
        },
      });

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
  }, [token]);

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
  const { token } = useHardcoverToken();

  const lookupCover = useCallback(async (title: string, author?: string): Promise<string | null> => {
    if (!token) return null;

    try {
      const params = new URLSearchParams({ title });
      if (author) params.set('author', author);

      const response = await fetch(`/api/hardcover/lookup?${params}`, {
        headers: {
          'x-hardcover-token': token,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.book?.coverUrl || null;
    } catch {
      return null;
    }
  }, [token]);

  return { lookupCover };
}

// Cache for cover URLs to avoid repeated lookups
const coverCache = new Map<string, string | null>();

/**
 * Hook for getting a book cover with caching
 */
export function useCachedCover(title: string, author?: string) {
  const { token } = useHardcoverToken();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !title) return;

    const cacheKey = `${title}|${author || ''}`;

    // Check cache first
    if (coverCache.has(cacheKey)) {
      setCoverUrl(coverCache.get(cacheKey) || null);
      return;
    }

    setLoading(true);

    const params = new URLSearchParams({ title });
    if (author) params.set('author', author);

    fetch(`/api/hardcover/lookup?${params}`, {
      headers: {
        'x-hardcover-token': token,
      },
    })
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
  }, [token, title, author]);

  return { coverUrl, loading };
}
