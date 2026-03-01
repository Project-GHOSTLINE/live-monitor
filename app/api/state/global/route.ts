import { NextRequest, NextResponse } from 'next/server';
import { getWorldStateLive } from '@/lib/state/updateWorldStateLive';
import { getDailySnapshots } from '@/lib/state/dailySnapshotJob';

/**
 * GET /api/state/global?include_history=true
 *
 * Returns global world state (live + optional historical snapshots)
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

    // Get live world state
    const liveState = await getWorldStateLive();

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

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      live_state: liveState,
      history,
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
