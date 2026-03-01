import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cce/conflicts/top?limit=20
 *
 * Returns top conflicts ranked by pressure/momentum/tension.
 *
 * Query parameters:
 * - limit: Max conflicts to return (default: 20, max: 100)
 * - metric: Sort metric (pressure|momentum|tension|instability, default: pressure)
 *
 * Feature flags: CCE_V2_ENABLED
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check feature flag
    const cceV2Enabled = process.env.CCE_V2_ENABLED === 'true';
    if (!cceV2Enabled) {
      return NextResponse.json(
        {
          error: 'CCE v2 disabled',
          message: 'Set CCE_V2_ENABLED=true to access top conflicts',
        },
        { status: 503 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const metric = searchParams.get('metric') || 'pressure';

    // Validate metric
    if (!['pressure', 'momentum', 'tension', 'instability'].includes(metric)) {
      return NextResponse.json(
        {
          error: 'Invalid metric parameter',
          valid_values: ['pressure', 'momentum', 'tension', 'instability'],
        },
        { status: 400 }
      );
    }

    // Fetch top conflicts
    const db = getDB();
    const conflicts = await db.query(
      `SELECT
         cc.id as conflict_id,
         cc.actor_a,
         cc.actor_b,
         cc.theatre,
         cc.importance,
         csl.tension,
         csl.heat,
         csl.velocity,
         csl.momentum,
         csl.pressure,
         csl.instability,
         csl.theatre_rank,
         csl.last_event_at,
         csl.top_drivers,
         csl.updated_at
       FROM conflicts_core cc
       INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
       ORDER BY csl.${metric} DESC
       LIMIT ?`,
      [limit]
    );

    // Parse JSON fields
    const parsed = conflicts.map((c: any) => ({
      ...c,
      top_drivers: JSON.parse(c.top_drivers || '[]'),
    }));

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      conflicts: parsed,
      total: parsed.length,
      sort_metric: metric,
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('[GET /api/cce/conflicts/top] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
