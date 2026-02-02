import { NextResponse } from 'next/server';

/**
 * Check if Hardcover API is configured on the server
 */
export async function GET() {
  const rawToken = process.env.HARDCOVER_API_TOKEN;
  const token = rawToken?.replace(/^Bearer\s+/i, '');
  const isConfigured = token && token !== 'your_token_here';

  return NextResponse.json({ configured: isConfigured });
}
