import { NextRequest, NextResponse } from 'next/server';

const HARDCOVER_API = 'https://api.hardcover.app/v1/graphql';

interface HardcoverSearchResult {
  id: number;
  title: string;
  author_names?: string[];
  image?: { url: string };
  audio_seconds?: number;
}

const SEARCH_QUERY = `
  query SearchBooks($query: String!) {
    search(
      query: $query,
      query_type: "books",
      per_page: 5,
      page: 1,
      sort: "activities_count:desc"
    ) {
      results
    }
  }
`;

/**
 * Lookup a book by title and author to get cover image
 * Used to enrich existing guild books with cover art
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get('title');
  const author = searchParams.get('author');

  // Use server-side env var (no client token needed)
  // Strip "Bearer " prefix if present (we add it ourselves)
  const rawToken = process.env.HARDCOVER_API_TOKEN;
  const token = rawToken?.replace(/^Bearer\s+/i, '');

  if (!title) {
    return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
  }

  if (!token || token === 'your_token_here') {
    return NextResponse.json({ error: 'Hardcover API token not configured on server' }, { status: 401 });
  }

  // Build search query - title + author if available
  const query = author ? `${title} ${author}` : title;

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
      return NextResponse.json(
        { error: 'Hardcover API error' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json(
        { error: 'GraphQL error' },
        { status: 400 }
      );
    }

    // Parse the results - they come as { hits: [{ document: {...} }] }
    const searchResults = data.data?.search?.results;
    const hits = searchResults?.hits || [];

    if (hits.length === 0) {
      return NextResponse.json({ book: null });
    }

    // Extract documents from hits
    const results: HardcoverSearchResult[] = hits.map((hit: { document: HardcoverSearchResult }) => hit.document);

    // Find best match - prefer audiobooks and title match
    const normalizedTitle = title.toLowerCase().trim();

    let bestMatch = results[0];
    for (const book of results) {
      const bookTitle = book.title.toLowerCase();
      // Exact or close title match with audiobook gets priority
      if (bookTitle.includes(normalizedTitle) || normalizedTitle.includes(bookTitle)) {
        if (book.audio_seconds && book.audio_seconds > 0) {
          bestMatch = book;
          break;
        }
        if (!bestMatch.audio_seconds) {
          bestMatch = book;
        }
      }
    }

    return NextResponse.json({
      book: {
        hardcoverId: parseInt(bestMatch.id as unknown as string, 10),
        title: bestMatch.title,
        author: bestMatch.author_names?.[0] || null,
        coverUrl: bestMatch.image?.url || null,
        audioDurationSeconds: bestMatch.audio_seconds || null,
      },
    });
  } catch (error) {
    console.error('Hardcover lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup book' },
      { status: 500 }
    );
  }
}
