/**
 * Event Frames API
 *
 * Query event frames with filtering by time window, event type, severity, etc.
 *
 * GET /api/events?window=24h&type=missile_strike&severity=7
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdapter } from '@/lib/db/adapter';
import { isOrchestratorEnabled } from '@/lib/orchestrator/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check if orchestrator is enabled
  if (!isOrchestratorEnabled()) {
    return NextResponse.json(
      {
        events: [],
        total: 0,
        message: 'Event processing not enabled. Set ORCH_ENABLED=true',
      },
      { status: 200 }
    );
  }

  try {
    const { searchParams } = request.nextUrl;

    // Parse query parameters
    const window = searchParams.get('window') || '24h';
    const eventType = searchParams.get('type');
    const minSeverity = searchParams.get('severity');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 1000);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Parse time window
    const timeWindows: Record<string, number> = {
      '1h': 3600,
      '6h': 6 * 3600,
      '24h': 24 * 3600,
      '7d': 7 * 24 * 3600,
      '30d': 30 * 24 * 3600,
    };

    const windowSeconds = timeWindows[window] || timeWindows['24h'];
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - windowSeconds;

    // Build query
    const db = new DatabaseAdapter();
    const whereClauses: string[] = ['occurred_at >= ?'];
    const queryParams: any[] = [cutoff];

    if (eventType) {
      whereClauses.push('event_type = ?');
      queryParams.push(eventType);
    }

    if (minSeverity) {
      whereClauses.push('severity >= ?');
      queryParams.push(parseInt(minSeverity, 10));
    }

    const whereClause = whereClauses.join(' AND ');

    // Check if event_frames table exists
    try {
      await db.query('SELECT 1 FROM event_frames LIMIT 1', []);
    } catch (tableError) {
      return NextResponse.json(
        {
          events: [],
          total: 0,
          message: 'Event frames table not yet created. Run migrations first.',
        },
        { status: 200 }
      );
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM event_frames WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.count || 0;

    // Get events
    const events = await db.query(
      `SELECT
        ef.*,
        fi.title_en,
        fi.source_name,
        fi.source_url
       FROM event_frames ef
       LEFT JOIN feed_items fi ON ef.feed_item_id = fi.id
       WHERE ${whereClause}
       ORDER BY ef.occurred_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Parse JSON fields
    const parsedEvents = events.map((event: any) => ({
      ...event,
      location: event.location ? JSON.parse(event.location) : null,
      actors: event.actors ? JSON.parse(event.actors) : null,
      casualties: event.casualties ? JSON.parse(event.casualties) : null,
      tags: event.tags ? JSON.parse(event.tags) : [],
      verified: Boolean(event.verified),
    }));

    return NextResponse.json({
      events: parsedEvents,
      total,
      window,
      filters: {
        event_type: eventType,
        min_severity: minSeverity,
      },
      response_time_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
