import { NextRequest, NextResponse } from 'next/server';
import { getWorldStateLive } from '@/lib/state/updateWorldStateLive';
import { getDailySnapshots } from '@/lib/state/dailySnapshotJob';
import { getWorldStateFromCCE } from '@/lib/cce/getWorldStateFromCCE';
import { getDB } from '@/lib/db/adapter';

/**
 * GET /api/state/global?include_history=true
 *
 * Returns global world state (live + optional historical snapshots)
 *
 * Feature Flags:
 * - CCE_ENABLED: Uses conflict-based state from CCE
 * - CCE_V2_ENABLED: Adds theatre aggregations, alliance pressure, fronts
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Check feature flag
    const stateEnabled = process.env.STATE_ENABLED === 'true';
    if (!stateEnabled) {
      return NextResponse.json(
        {
          error: 'State engine disabled',
          message: 'Set STATE_ENABLED=true to enable state calculations',
        },
        { status: 503 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const includeHistory = searchParams.get('include_history') === 'true';
    const historyDays = parseInt(searchParams.get('history_days') || '30', 10);

    // Check CCE feature flag
    const cceEnabled = process.env.CCE_ENABLED === 'true';

    // Get live world state (CCE or traditional)
    const liveState = cceEnabled
      ? await getWorldStateFromCCE()
      : await getWorldStateLive();

    if (!liveState) {
      return NextResponse.json(
        { error: 'World state not initialized' },
        { status: 404 }
      );
    }

    // Optionally include historical snapshots
    let history = undefined;
    if (includeHistory) {
      const snapshots = await getDailySnapshots({
        limit: historyDays,
      });
      history = snapshots;
    }

    // Include theatre state if CCE v2 is enabled
    let theatreState = undefined;
    const cceV2Enabled = process.env.CCE_V2_ENABLED === 'true';

    if (cceV2Enabled && cceEnabled) {
      try {
        const db = getDB();
        const theatres = await db.all('theatre_state_live');
        theatreState = theatres.map((t: any) => ({
          ...t,
          dominant_actors: JSON.parse(t.dominant_actors || '[]'),
          active_fronts: JSON.parse(t.active_fronts || '[]'),
        }));
      } catch (error) {
        console.error('[GET /api/state/global] Error fetching theatre state:', error);
        // Continue without theatre state rather than failing the whole request
      }
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      live_state: liveState,
      theatre_state: theatreState,
      history,
      cce_enabled: cceEnabled,
      cce_v2_enabled: cceV2Enabled,
      calculation_method: liveState?.calculation_method || 'unknown',
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('[GET /api/state/global] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
