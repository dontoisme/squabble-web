import { NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load shared env file from parent directory
config({ path: resolve(process.cwd(), '../.env.shared') });

/**
 * Check if Hardcover API is configured on the server
 */
export async function GET() {
  const token = process.env.HARDCOVER_API_TOKEN;
  const isConfigured = token && token !== 'your_token_here';

  return NextResponse.json({ configured: isConfigured });
}
