import { NextRequest, NextResponse } from 'next/server';

const HARDCOVER_API = 'https://api.hardcover.app/v1/graphql';

interface HardcoverSearchResult {
  id: number;
  title: string;
  author_names?: string[];
  series_names?: string[];
  image?: { url: string };
  audio_seconds?: number;
  users_read_count?: number;
}

const SEARCH_QUERY = `
  query SearchBooks($query: String!) {
    search(
      query: $query,
      query_type: "books",
      per_page: 12,
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

    const books = hits.map((hit: { document: HardcoverSearchResult }) => {
      const book = hit.document;
      return {
        hardcoverId: parseInt(book.id as unknown as string, 10),
        title: book.title,
        author: book.author_names?.[0] || null,
        series: book.series_names?.[0] || null,
        coverUrl: book.image?.url || null,
        audioDurationSeconds: book.audio_seconds || null,
        popularity: book.users_read_count || 0,
        hasAudiobook: (book.audio_seconds || 0) > 0,
      };
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Hardcover search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Hardcover' },
      { status: 500 }
    );
  }
}
