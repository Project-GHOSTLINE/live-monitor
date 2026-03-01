import { NextRequest, NextResponse } from 'next/server';
import { computeReadinessBreakdown } from '@/lib/state/computeReadinessBreakdown';
import { getCountryRelations } from '@/lib/state/updateRelationEdges';
import { getDB } from '@/lib/db/adapter';
import type { CountryState } from '@/types/state';

/**
 * GET /api/state/country?code=US
 *
 * Returns state information for a specific country including:
 * - Readiness breakdown (military, economic, political, diplomatic, cyber)
 * - Alert status
 * - Active signals and events
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
    const countryCode = searchParams.get('code');
    const windowHours = parseInt(searchParams.get('window') || '24', 10);
    const minConfidence = parseFloat(searchParams.get('min_confidence') || '0.3');

    if (!countryCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: code' },
        { status: 400 }
      );
    }

    // Validate country code (2-3 uppercase letters)
    if (!/^[A-Z]{2,3}$/.test(countryCode)) {
      return NextResponse.json(
        { error: 'Invalid country code format (expected 2-3 uppercase letters)' },
        { status: 400 }
      );
    }

    const db = getDB();
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (windowHours * 3600);

    // Compute readiness breakdown
    const readiness = await computeReadinessBreakdown(countryCode, {
      windowHours,
      minConfidence,
    });

    // Determine alert status based on readiness
    let alertStatus: 'normal' | 'heightened' | 'elevated' | 'critical' = 'normal';
    if (readiness.overall >= 80) {
      alertStatus = 'critical';
    } else if (readiness.overall >= 65) {
      alertStatus = 'elevated';
    } else if (readiness.overall >= 55) {
      alertStatus = 'heightened';
    }

    // Get active signals for this country
    // Join with event_frames to get country involvement
    const activeSignalsData = await db.query(
      `SELECT s.code as signal_code
       FROM signal_activations sa
       JOIN signals s ON sa.signal_id = s.id
       JOIN event_frames ef ON sa.event_frame_id = ef.id
       WHERE sa.is_active = 1
         AND sa.activated_at >= ?
         AND (json_extract(ef.actors, '$.attacker') = ? OR json_extract(ef.actors, '$.target') = ?)
       ORDER BY sa.activated_at DESC`,
      [windowStart, countryCode, countryCode]
    );
    const activeSignals = activeSignalsData.map((row: any) => row.signal_code);

    // Get active events involving this country
    const activeEventsData = await db.query(
      `SELECT id FROM event_frames
       WHERE occurred_at >= ?
         AND (json_extract(actors, '$.attacker') = ? OR json_extract(actors, '$.target') = ?)
       ORDER BY occurred_at DESC`,
      [windowStart, countryCode, countryCode]
    );
    const activeEvents = activeEventsData.map((row: any) => row.id);

    // Calculate confidence based on data availability
    const confidence = Math.min(
      1.0,
      0.5 + (activeEvents.length * 0.05) + (activeSignals.length * 0.03)
    );

    // Get country name (simplified - in production would use a lookup table)
    const countryNames: Record<string, string> = {
      USA: 'United States',
      RUS: 'Russia',
      CHN: 'China',
      ISR: 'Israel',
      IRN: 'Iran',
      UKR: 'Ukraine',
      SAU: 'Saudi Arabia',
      TUR: 'Turkey',
      GBR: 'United Kingdom',
      FRA: 'France',
      DEU: 'Germany',
    };

    const countryState: CountryState = {
      country_code: countryCode,
      country_name: countryNames[countryCode] || countryCode,
      readiness,
      alert_status: alertStatus,
      active_signals: activeSignals,
      active_events: activeEvents,
      last_updated_at: now,
      confidence,
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      country: countryState,
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('[GET /api/state/country] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
