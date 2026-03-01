import { NextRequest, NextResponse } from 'next/server';
import { updateWorldStateLive } from '@/lib/state/updateWorldStateLive';
import { updateRelationEdges } from '@/lib/state/updateRelationEdges';

/**
 * POST /api/cron/state-live
 *
 * Vercel Cron job to update live world state and relation edges.
 * Runs every 15 minutes to keep state calculations fresh.
 *
 * SECURITY: Protected by CRON_SECRET environment variable
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[POST /api/cron/state-live] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      console.error('[POST /api/cron/state-live] Invalid authorization');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check feature flag
    const stateEnabled = process.env.STATE_ENABLED === 'true';
    if (!stateEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'State engine disabled (STATE_ENABLED=false)',
        },
        { status: 200 }
      );
    }

    console.log('[POST /api/cron/state-live] Starting state update job');

    // Update world state live
    const worldState = await updateWorldStateLive();

    // Update relation edges (last 24 hours)
    const relationStats = await updateRelationEdges({
      windowHours: 24,
      minConfidence: 0.4,
      minSeverity: 4,
    });

    const duration = Date.now() - startTime;

    console.log(
      `[POST /api/cron/state-live] Completed: tension=${worldState.global_tension_score.toFixed(2)}, ` +
      `alert=${worldState.alert_level}, relations=${relationStats.processed}, duration=${duration}ms`
    );

    return NextResponse.json({
      success: true,
      world_state: {
        tension: worldState.global_tension_score,
        alert_level: worldState.alert_level,
        active_events: worldState.active_event_count,
        version: worldState.version,
      },
      relation_edges: relationStats,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[POST /api/cron/state-live] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
