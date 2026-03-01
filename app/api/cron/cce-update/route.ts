/**
 * CCE Update Cron Endpoint
 *
 * Protected endpoint that triggers the CCE update cycle:
 * 1. Aggregate event_frames into conflict_events
 * 2. Update conflict_state_live with decay calculations (v1 or v2)
 * 3. Derive relation_edges from CCE
 * 4. [v2] Update theatre aggregations
 * 5. [v2] Calculate alliance pressures
 * 6. [v2] Update front-line states
 *
 * Auth: Requires CRON_SECRET in Authorization header
 * Schedule: Should be called every 15-30 minutes via cron job
 *
 * Usage:
 * curl -X POST https://domain.com/api/cron/cce-update \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { aggregateConflictEvents } from '@/lib/cce/aggregateConflictEvents';
import { updateConflictStateLive } from '@/lib/cce/updateConflictStateLive';
import { updateConflictStateLiveV2 } from '@/lib/cce/updateConflictStateLiveV2';
import { updateTheatreStateLive } from '@/lib/cce/updateTheatreStateLive';
import { updateAlliancePressureLive } from '@/lib/cce/updateAlliancePressureLive';
import { updateFrontStateLive } from '@/lib/cce/updateFrontStateLive';
import { deriveRelationEdgesFromCCE } from '@/lib/cce/deriveRelationEdgesFromCCE';

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

/**
 * Verify cron authentication
 */
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return false;
  }

  // Support both "Bearer TOKEN" and "TOKEN" formats
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return token === CRON_SECRET;
}

/**
 * POST /api/cron/cce-update
 *
 * Triggers CCE update cycle
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Verify authentication
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }

  console.log('[CCE Update] Starting CCE update cycle...');

  // Check feature flags
  const cceV2Enabled = process.env.CCE_V2_ENABLED === 'true';

  if (cceV2Enabled) {
    console.log('[CCE Update] CCE v2 ENABLED - Running extended update cycle');
  }

  try {
    // Phase 1: Aggregate event frames into conflict events
    console.log('[CCE Update] Phase 1: Aggregating event frames...');

    // Get time range for aggregation (last 24 hours)
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - (24 * 60 * 60);

    const aggregationResult = await aggregateConflictEvents({
      since: oneDayAgo,
      until: now,
    });

    console.log(
      `[CCE Update] Aggregation complete: ${aggregationResult.created} events created, ${aggregationResult.processed} frames processed`
    );

    // Phase 2: Update conflict state with decay (v1 or v2)
    console.log('[CCE Update] Phase 2: Updating conflict states...');

    let stateResult;
    if (cceV2Enabled) {
      console.log('[CCE Update] Phase 2 (v2): Using v2 state calculator with momentum/pressure/instability...');
      stateResult = await updateConflictStateLiveV2();
    } else {
      stateResult = await updateConflictStateLive();
    }

    console.log(`[CCE Update] State update complete: ${stateResult.updated} conflicts updated`);

    // Phase 3: Derive relation_edges from CCE (backward compatibility)
    console.log('[CCE Update] Phase 3: Deriving relation edges from CCE...');

    const deriveResult = await deriveRelationEdgesFromCCE({
      minTension: 0.1,
      maxAge: 86400 * 7,  // 7 days
    });

    console.log(
      `[CCE Update] Relation edges derived: ${deriveResult.created} created, ${deriveResult.updated} updated`
    );

    // Phase 4: Theatre aggregation (v2 only)
    let theatreResult = null;
    if (cceV2Enabled) {
      console.log('[CCE Update] Phase 4 (v2): Aggregating theatre states...');
      theatreResult = await updateTheatreStateLive();
      console.log(`[CCE Update] Theatre aggregation complete: ${theatreResult.updated} theatres updated`);
    }

    // Phase 5: Alliance pressure (v2 only)
    let allianceResult = null;
    if (cceV2Enabled) {
      console.log('[CCE Update] Phase 5 (v2): Calculating alliance pressures...');
      allianceResult = await updateAlliancePressureLive();
      console.log(`[CCE Update] Alliance pressure complete: ${allianceResult.updated} alliances updated`);
    }

    // Phase 6: Front state (v2 only)
    let frontResult = null;
    if (cceV2Enabled) {
      console.log('[CCE Update] Phase 6 (v2): Updating front states...');
      frontResult = await updateFrontStateLive();
      console.log(`[CCE Update] Front state complete: ${frontResult.updated} fronts updated`);
    }

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Success response
    return NextResponse.json(
      {
        success: true,
        cce_v2_enabled: cceV2Enabled,
        phases: {
          aggregation: {
            conflict_events_created: aggregationResult.created,
            event_frames_processed: aggregationResult.processed,
          },
          state_update: {
            conflicts_updated: stateResult.updated,
            version: cceV2Enabled ? 'v2' : 'v1',
          },
          relation_edges_derived: {
            created: deriveResult.created,
            updated: deriveResult.updated,
            skipped: deriveResult.skipped,
          },
          ...(cceV2Enabled && {
            theatre_aggregation: {
              theatres_updated: theatreResult?.updated || 0,
            },
            alliance_pressure: {
              alliances_updated: allianceResult?.updated || 0,
            },
            front_state: {
              fronts_updated: frontResult?.updated || 0,
            },
          }),
        },
        execution_time_ms: executionTime,
        timestamp: now,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CCE Update] Error during update cycle:', error);

    return NextResponse.json(
      {
        error: 'CCE Update Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Math.floor(Date.now() / 1000),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/cce-update
 *
 * Health check endpoint (no auth required)
 */
export async function GET() {
  return NextResponse.json(
    {
      endpoint: 'CCE Update Cron',
      status: 'online',
      auth_required: true,
      method: 'POST',
      description: 'Triggers CCE aggregation and state update cycle',
    },
    { status: 200 }
  );
}
