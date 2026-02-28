import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 15; // Cache for 15 seconds (matches refetchInterval)

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const db = getDB();

    // Get total count of non-duplicate items
    const total = await db.count('feed_items', 'is_duplicate = 0', []);

    // Get recent items (non-duplicates only, ordered by most recent)
    const items = await db.all(
      'feed_items',
      `is_duplicate = 0 ORDER BY published_at DESC LIMIT ${limit}`,
      []
    );

    // Parse JSON fields and format for Command Center
    const parsedItems = items.map(item => ({
      id: item.id,
      title_en: item.title_en || item.title_original || 'Untitled',
      source_name: item.source_name || 'Unknown Source',
      published_at: item.published_at,
      tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []),
      reliability: item.reliability || 3,
    }));

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      items: parsedItems,
      total,
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('Feed API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch feed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
