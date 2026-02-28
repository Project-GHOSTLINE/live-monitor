import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';
import { RateLimiter } from '@/lib/rss/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDB();

    const sources = await db.all('sources');

    // Add next fetch time for each source
    const sourcesWithStatus = sources.map(source => ({
      ...source,
      is_active: Boolean(source.is_active),
      can_fetch_now: RateLimiter.canFetch(source.id),
      next_fetch_time: RateLimiter.getNextFetchTime(source.id),
    }));

    return NextResponse.json({ sources: sourcesWithStatus });
  } catch (error) {
    console.error('Sources API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch sources',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
