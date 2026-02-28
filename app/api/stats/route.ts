import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 120; // Cache for 2 minutes

export async function GET() {
  try {
    const db = getDatabase();

    // Total items
    const totalResult = db
      .prepare('SELECT COUNT(*) as count FROM feed_items WHERE is_duplicate = 0')
      .get() as { count: number };

    // Items by source type
    const bySourceType = db
      .prepare(
        `SELECT s.source_type, COUNT(*) as count
         FROM feed_items fi
         JOIN sources s ON fi.source_id = s.id
         WHERE fi.is_duplicate = 0
         GROUP BY s.source_type`
      )
      .all() as { source_type: string; count: number }[];

    const itemsBySourceType = bySourceType.reduce(
      (acc, row) => {
        acc[row.source_type] = row.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Recent logs
    const recentLogs = db
      .prepare(
        `SELECT il.*, s.name as source_name
         FROM ingestion_logs il
         JOIN sources s ON il.source_id = s.id
         ORDER BY il.created_at DESC
         LIMIT 10`
      )
      .all();

    return NextResponse.json({
      total_items: totalResult.count,
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
