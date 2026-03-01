import { NextRequest, NextResponse } from 'next/server';
import { createDailySnapshot, cleanupOldSnapshots } from '@/lib/state/dailySnapshotJob';

/**
 * POST /api/cron/state-daily
 *
 * Vercel Cron job to create daily world state snapshots.
 * Runs once per day at midnight UTC.
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
      console.error('[POST /api/cron/state-daily] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      console.error('[POST /api/cron/state-daily] Invalid authorization');
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

    console.log('[POST /api/cron/state-daily] Starting daily snapshot job');

    // Create daily snapshot
    const snapshot = await createDailySnapshot();

    // Cleanup old snapshots (keep last 90 days)
    const deletedCount = await cleanupOldSnapshots(90);

    const duration = Date.now() - startTime;

    console.log(
      `[POST /api/cron/state-daily] Completed: date=${snapshot.date}, ` +
      `events=${snapshot.total_events}, tension=${snapshot.global_tension_score.toFixed(2)}, ` +
      `cleaned=${deletedCount}, duration=${duration}ms`
    );

    return NextResponse.json({
      success: true,
      snapshot: {
        date: snapshot.date,
        total_events: snapshot.total_events,
        global_tension_score: snapshot.global_tension_score,
        alert_level: snapshot.alert_level,
        active_scenarios: snapshot.active_scenarios.length,
      },
      cleanup: {
        deleted_snapshots: deletedCount,
      },
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[POST /api/cron/state-daily] Error:', error);
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
