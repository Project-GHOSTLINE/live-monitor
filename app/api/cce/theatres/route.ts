import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cce/theatres
 *
 * Returns all theatres with their live state metrics.
 *
 * Query parameters:
 * - min_tension: Filter by minimum tension (default: 0.0)
 * - sort: Sort order (tension|momentum|heat, default: tension)
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
          message: 'Set CCE_V2_ENABLED=true to enable theatre state',
        },
        { status: 503 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const minTension = parseFloat(searchParams.get('min_tension') || '0.0');
    const sortBy = searchParams.get('sort') || 'tension';

    // Validate sort parameter
    if (!['tension', 'momentum', 'heat', 'velocity'].includes(sortBy)) {
      return NextResponse.json(
        {
          error: 'Invalid sort parameter',
          valid_values: ['tension', 'momentum', 'heat', 'velocity'],
        },
        { status: 400 }
      );
    }

    // Fetch theatres
    const db = getDB();
    const theatres = await db.query(
      `SELECT * FROM theatre_state_live
       WHERE tension >= ?
       ORDER BY ${sortBy} DESC`,
      [minTension]
    );

    // Parse JSON fields
    const parsed = theatres.map((t: any) => ({
      ...t,
      dominant_actors: JSON.parse(t.dominant_actors || '[]'),
      active_fronts: JSON.parse(t.active_fronts || '[]'),
    }));

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      theatres: parsed,
      total: parsed.length,
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('[GET /api/cce/theatres] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
