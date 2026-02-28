import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';
import { itemsQuerySchema } from '@/lib/utils/validation';
import { FeedItem } from '@/types/feed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse and validate query parameters
    const params = itemsQuerySchema.parse({
      offset: searchParams.get('offset'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      source_type: searchParams.get('source_type'),
      reliability: searchParams.get('reliability'),
      tags: searchParams.get('tags'),
      time_range: searchParams.get('time_range'),
    });

    const db = getDB();

    // Build query
    let whereClauses: string[] = ['is_duplicate = 0'];
    const queryParams: any[] = [];

    // Search filter
    if (params.search) {
      whereClauses.push('(title_en LIKE ? OR title_original LIKE ?)');
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Source type filter
    if (params.source_type) {
      whereClauses.push('source_id IN (SELECT id FROM sources WHERE source_type = ?)');
      queryParams.push(params.source_type);
    }

    // Reliability filter
    if (params.reliability) {
      whereClauses.push('reliability >= ?');
      queryParams.push(params.reliability);
    }

    // Tags filter
    if (params.tags) {
      whereClauses.push('tags LIKE ?');
      queryParams.push(`%${params.tags}%`);
    }

    // Time range filter
    if (params.time_range && params.time_range !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      const ranges: Record<string, number> = {
        '1h': 3600,
        '6h': 6 * 3600,
        '24h': 24 * 3600,
        '7d': 7 * 24 * 3600,
      };

      const seconds = ranges[params.time_range];
      if (seconds) {
        whereClauses.push('published_at >= ?');
        queryParams.push(now - seconds);
      }
    }

    const whereClause = whereClauses.join(' AND ');

    // Get total count
    const total = await db.count('feed_items', whereClause, queryParams);

    // Get items with database adapter
    const items = await db.all(
      'feed_items',
      `${whereClause} ORDER BY published_at DESC LIMIT ${params.limit} OFFSET ${params.offset}`,
      queryParams
    );

    // Parse JSON fields
    const parsedItems: FeedItem[] = items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      entity_places: item.entity_places ? JSON.parse(item.entity_places) : [],
      entity_orgs: item.entity_orgs ? JSON.parse(item.entity_orgs) : [],
      is_duplicate: Boolean(item.is_duplicate),
    }));

    return NextResponse.json({
      items: parsedItems,
      total,
      hasMore: params.offset + params.limit < total,
    });
  } catch (error) {
    console.error('Items API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch items',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
