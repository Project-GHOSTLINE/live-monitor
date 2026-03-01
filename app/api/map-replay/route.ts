/**
 * GET /api/map-replay
 *
 * Historical event playback from event_frames table
 *
 * Allows replaying tactical map events from a specific time period
 * with adjustable playback speed for analysis and review
 *
 * Query params:
 * - start: Unix timestamp in seconds (required)
 * - end: Unix timestamp in seconds (required)
 * - speed: Playback speed multiplier (1, 2, 4, 8, 16) (default: 1)
 * - event_type: EventType filter (optional, comma-separated)
 * - min_severity: 1-10 (optional, minimum severity)
 * - min_confidence: 0.0-1.0 (optional, minimum confidence)
 * - verified_only: boolean (optional, only verified events)
 * - limit: number (default: 1000, max: 5000)
 *
 * Response:
 * {
 *   actions: MapAction[],
 *   total: number,
 *   playback_duration_seconds: number,
 *   speed_multiplier: number,
 *   time_range: { start: number, end: number }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';
import {
  eventFrameToMapAction,
  calculateGameplayScore,
  mapDatabaseSeverity,
} from '@/lib/map/eventMapper';
import type { EventFrame, EventType, LocationPrecision } from '@/types/map/EventFrame';
import type { MapAction } from '@/types/map/MapAction';

/**
 * Valid event types for filtering
 */
const VALID_EVENT_TYPES: EventType[] = [
  'missile_strike',
  'drone_strike',
  'airstrike',
  'artillery_shelling',
  'naval_strike',
  'ground_assault',
  'rocket_attack',
  'air_defense',
  'protest',
  'sanction',
  'cyberattack',
  'diplomatic_action',
  'intelligence_ops',
  'information_warfare',
  'explosion',
  'accident',
  'sabotage',
  'unknown',
];

/**
 * Valid playback speed multipliers
 */
const VALID_SPEEDS = [1, 2, 4, 8, 16];

/**
 * Convert database row to EventFrame
 */
function dbRowToEventFrame(row: any): EventFrame {
  // Parse JSON fields
  let actors = undefined;
  try {
    actors = row.actors ? JSON.parse(row.actors) : undefined;
  } catch (e) {
    console.warn(`Failed to parse actors for event ${row.id}`);
  }

  let location = { lat: 0, lng: 0, precision: 'unknown' as LocationPrecision, display_name: 'Unknown' };
  try {
    location = row.location ? JSON.parse(row.location) : location;
  } catch (e) {
    console.warn(`Failed to parse location for event ${row.id}`);
  }

  let casualties = undefined;
  try {
    casualties = row.casualties ? JSON.parse(row.casualties) : undefined;
  } catch (e) {
    console.warn(`Failed to parse casualties for event ${row.id}`);
  }

  let tags: string[] = [];
  try {
    tags = row.tags ? JSON.parse(row.tags) : [];
  } catch (e) {
    console.warn(`Failed to parse tags for event ${row.id}`);
  }

  // Map database severity (1-10) to EventSeverity enum
  const severity = mapDatabaseSeverity(row.severity);

  return {
    id: `event-${row.id}`,
    feed_item_id: row.feed_item_id,
    event_type: row.event_type as EventType,
    severity,
    occurred_at: row.occurred_at,
    reported_at: row.reported_at,
    location,
    description: row.evidence,
    actors,
    casualties,
    weapon_system: row.weapon_system || undefined,
    target_type: row.target_type || undefined,
    confidence: row.confidence,
    verified: row.verified === 1 || row.verified === true,
    source_reliability: row.source_reliability,
    tags,
    cluster_id: row.cluster_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at || undefined,
  };
}

/**
 * GET handler
 */
export async function GET(request: NextRequest) {
  const startRequestTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Parse required time range parameters
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    if (!startParam || !endParam) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'Both "start" and "end" timestamp parameters are required',
        },
        { status: 400 }
      );
    }

    const startTimestamp = parseInt(startParam);
    const endTimestamp = parseInt(endParam);

    // Validate time range
    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          message: 'start and end must be valid Unix timestamps in seconds',
        },
        { status: 400 }
      );
    }

    if (startTimestamp >= endTimestamp) {
      return NextResponse.json(
        {
          error: 'Invalid time range',
          message: 'start must be before end',
        },
        { status: 400 }
      );
    }

    // Maximum 30 days replay window
    const maxWindowSeconds = 30 * 24 * 60 * 60; // 30 days
    if (endTimestamp - startTimestamp > maxWindowSeconds) {
      return NextResponse.json(
        {
          error: 'Time range too large',
          message: 'Maximum replay window is 30 days',
        },
        { status: 400 }
      );
    }

    // Parse speed multiplier
    const speedParam = searchParams.get('speed');
    const speed = speedParam ? parseInt(speedParam) : 1;
    const speedMultiplier = VALID_SPEEDS.includes(speed) ? speed : 1;

    // Parse limit
    const limitParam = parseInt(searchParams.get('limit') || '1000');
    const limit = Math.min(Math.max(limitParam, 1), 5000); // Clamp between 1-5000

    // Filter parameters
    const eventTypesParam = searchParams.get('event_type');
    const eventTypes = eventTypesParam
      ? eventTypesParam.split(',').filter((t) => VALID_EVENT_TYPES.includes(t as EventType))
      : null;

    const minSeverityParam = searchParams.get('min_severity');
    const minSeverity = minSeverityParam ? Math.max(1, Math.min(10, parseInt(minSeverityParam))) : null;

    const minConfidenceParam = searchParams.get('min_confidence');
    const minConfidence = minConfidenceParam
      ? Math.max(0, Math.min(1, parseFloat(minConfidenceParam)))
      : null;

    const verifiedOnly = searchParams.get('verified_only') === 'true';

    // Build WHERE clause
    const whereConditions: string[] = [];
    whereConditions.push(`occurred_at >= ${startTimestamp}`);
    whereConditions.push(`occurred_at <= ${endTimestamp}`);

    if (eventTypes && eventTypes.length > 0) {
      const typesString = eventTypes.map((t) => `'${t}'`).join(', ');
      whereConditions.push(`event_type IN (${typesString})`);
    }

    if (minSeverity !== null) {
      whereConditions.push(`severity >= ${minSeverity}`);
    }

    if (minConfidence !== null) {
      whereConditions.push(`confidence >= ${minConfidence}`);
    }

    if (verifiedOnly) {
      whereConditions.push(`verified = 1`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query event_frames from database
    const db = getDB();
    let eventFrameRows: any[] = [];
    let totalCount = 0;

    try {
      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM event_frames WHERE ${whereClause}`,
        []
      );
      totalCount = countResult[0]?.total || 0;

      // Get events ordered by occurrence time
      eventFrameRows = await db.query(
        `SELECT * FROM event_frames WHERE ${whereClause} ORDER BY occurred_at ASC LIMIT ${limit}`,
        []
      );
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        {
          error: 'Database query failed',
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Convert DB rows to EventFrames
    const eventFrames: EventFrame[] = eventFrameRows.map(dbRowToEventFrame);

    // Convert EventFrames to MapActions with gameplay scoring
    const mapActions: Array<MapAction & { gameplay_score: number; playback_delay_ms: number }> =
      eventFrames.map((frame, index) => {
        const mapAction = eventFrameToMapAction(frame, {
          estimateOrigin: true,
          expirationMinutes: 60, // 1 hour expiration during replay
        });

        const gameplayScore = calculateGameplayScore(
          frame.severity,
          frame.confidence,
          mapAction.action_type
        );

        // Calculate playback delay (time since replay start, adjusted by speed)
        const timeSinceStart = frame.occurred_at - startTimestamp;
        const playbackDelayMs = (timeSinceStart * 1000) / speedMultiplier;

        return {
          ...mapAction,
          gameplay_score: gameplayScore,
          playback_delay_ms: playbackDelayMs,
        };
      });

    const actualDuration = endTimestamp - startTimestamp;
    const playbackDuration = actualDuration / speedMultiplier;

    const responseTime = Date.now() - startRequestTime;

    return NextResponse.json({
      actions: mapActions,
      total: totalCount,
      returned: mapActions.length,
      time_range: {
        start: startTimestamp,
        end: endTimestamp,
        duration_seconds: actualDuration,
      },
      playback: {
        speed_multiplier: speedMultiplier,
        playback_duration_seconds: playbackDuration,
        playback_duration_readable: formatDuration(playbackDuration),
      },
      filters: {
        event_types: eventTypes || [],
        min_severity: minSeverity,
        min_confidence: minConfidence,
        verified_only: verifiedOnly,
      },
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('Map replay error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate replay',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Format duration in seconds to human-readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
