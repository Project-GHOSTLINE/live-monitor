import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 120; // Cache for 2 minutes

export async function GET() {
  try {
    const db = getDB();

    // Total items (non-duplicate)
    const total = await db.count('feed_items', 'is_duplicate = 0');

    // Get all items and sources to compute stats
    const items = await db.all('feed_items', 'is_duplicate = 0');
    const sources = await db.all('sources');

    // Create source lookup
    const sourceLookup = sources.reduce(
      (acc: Record<number, any>, source: any) => {
        acc[source.id] = source;
        return acc;
      },
      {}
    );

    // Count items by source type
    const itemsBySourceType: Record<string, number> = {};
    items.forEach((item: any) => {
      const source = sourceLookup[item.source_id];
      if (source) {
        const type = source.source_type;
        itemsBySourceType[type] = (itemsBySourceType[type] || 0) + 1;
      }
    });

    // Get recent logs (simplified - just get last 10)
    const logs = await db.all('ingestion_logs');
    const recentLogs = logs
      .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
      .slice(0, 10)
      .map((log: any) => ({
        ...log,
        source_name: sourceLookup[log.source_id]?.name || 'Unknown',
      }));

    return NextResponse.json({
      total_items: total,
      items_by_source_type: itemsBySourceType,
      recent_logs: recentLogs,
    });
  } catch (error) {
    console.error('Stats API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
