import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cce/fronts?theatre=MiddleEast
 *
 * Returns front lines with their live state.
 *
 * Query parameters:
 * - theatre: Filter by theatre (optional)
 * - min_intensity: Filter by minimum intensity (default: 0.0)
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
          message: 'Set CCE_V2_ENABLED=true to enable front state',
        },
        { status: 503 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const theatre = searchParams.get('theatre');
    const minIntensity = parseFloat(searchParams.get('min_intensity') || '0.0');

    // Build query
    const db = getDB();
    let query = `
      SELECT
        fl.id, fl.theatre, fl.name, fl.actors, fl.base_control,
        fsl.control, fsl.intensity, fsl.last_event_at, fsl.updated_at
      FROM front_lines fl
      LEFT JOIN front_state_live fsl ON fl.id = fsl.front_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (theatre) {
      query += ' AND fl.theatre = ?';
      params.push(theatre);
    }

    if (minIntensity > 0) {
      query += ' AND (fsl.intensity IS NULL OR fsl.intensity >= ?)';
      params.push(minIntensity);
    }

    query += ' ORDER BY fsl.intensity DESC NULLS LAST';

    const fronts = await db.query(query, params);

    // Parse JSON fields
    const parsed = fronts.map((f: any) => ({
      id: f.id,
      theatre: f.theatre,
      name: f.name,
      actors: JSON.parse(f.actors || '[]'),
      base_control: JSON.parse(f.base_control || '{}'),
      state: {
        control: JSON.parse(f.control || '{}'),
        intensity: f.intensity || 0.0,
        last_event_at: f.last_event_at,
        updated_at: f.updated_at,
      },
    }));

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      fronts: parsed,
      total: parsed.length,
      theatre_filter: theatre || null,
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('[GET /api/cce/fronts] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
