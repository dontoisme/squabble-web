import { NextRequest, NextResponse } from 'next/server';

const HARDCOVER_API = 'https://api.hardcover.app/v1/graphql';

interface HardcoverSearchResult {
  id: string;
  title: string;
  author_names?: string[];
  series_names?: string[];
  image?: { url: string };
  audio_seconds?: number;
  users_read_count?: number;
  has_audiobook?: boolean;
  featured_series?: {
    position: number;
    series: {
      name: string;
      books_count: number;
      primary_books_count: number;
    };
  };
}

interface MappedBook {
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

const SEARCH_QUERY = `
  query SearchBooks($query: String!) {
    search(
      query: $query,
      query_type: "books",
      per_page: 20,
      page: 1,
      sort: "activities_count:desc"
    ) {
      results
    }
  }
`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  // Use server-side env var (no client token needed)
  // Strip "Bearer " prefix if present (we add it ourselves)
  const rawToken = process.env.HARDCOVER_API_TOKEN;
  const token = rawToken?.replace(/^Bearer\s+/i, '');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  if (!token || token === 'your_token_here') {
    return NextResponse.json({ error: 'Hardcover API token not configured on server' }, { status: 401 });
  }

  try {
    const response = await fetch(HARDCOVER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { query },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Hardcover API error:', response.status, text);
      return NextResponse.json(
        { error: 'Hardcover API error' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Hardcover GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL error', details: data.errors },
        { status: 400 }
      );
    }

    // Parse the results - they come as { hits: [{ document: {...} }] }
    const searchResults = data.data?.search?.results;
    const hits = searchResults?.hits || [];

    // Filter to audiobooks only and map to our format
    const books = hits
      .map((hit: { document: HardcoverSearchResult }) => hit.document)
      .filter((book: HardcoverSearchResult) => book.has_audiobook === true)
      .map((book: HardcoverSearchResult) => ({
        hardcoverId: parseInt(book.id, 10),
        title: book.title,
        author: book.author_names?.[0] || null,
        series: book.featured_series?.series?.name || book.series_names?.[0] || null,
        seriesPosition: book.featured_series?.position || null,
        seriesBooksCount: book.featured_series?.series?.primary_books_count || book.featured_series?.series?.books_count || null,
        coverUrl: book.image?.url || null,
        audioDurationSeconds: book.audio_seconds || null,
        popularity: book.users_read_count || 0,
        hasAudiobook: true,
      }));

    // Sort: Book 1s first within same series, then by original relevance
    books.sort((a: MappedBook, b: MappedBook) => {
      // If same series, sort by position
      if (a.series && b.series && a.series === b.series) {
        return (a.seriesPosition || 999) - (b.seriesPosition || 999);
      }
      // Otherwise, prioritize Book 1s
      const aIsFirst = a.seriesPosition === 1;
      const bIsFirst = b.seriesPosition === 1;
      if (aIsFirst && !bIsFirst) return -1;
      if (bIsFirst && !aIsFirst) return 1;
      return 0; // Keep original order
    });

    return NextResponse.json({ books: books.slice(0, 12) });
  } catch (error) {
    console.error('Hardcover search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Hardcover' },
      { status: 500 }
    );
  }
}
