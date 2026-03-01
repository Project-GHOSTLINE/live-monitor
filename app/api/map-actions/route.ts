/**
 * GET /api/map-actions
 *
 * Returns tactical map actions from event_frames table
 *
 * Pipeline: event_frames → EventFrame → MapAction
 * 1. Query event_frames from database with filters
 * 2. Convert DB rows to EventFrame objects
 * 3. Transform to MapActions for visualization
 * 4. Apply sorting and pagination
 *
 * Query params:
 * - window: '10m' | '1h' | '6h' | '24h' | '7d' (default: '1h')
 * - limit: number (default: 200, max: 500)
 * - offset: number (default: 0, for pagination)
 * - event_type: EventType filter (optional, comma-separated)
 * - min_severity: 1-10 (optional, minimum severity)
 * - min_confidence: 0.0-1.0 (optional, minimum confidence)
 * - verified_only: boolean (optional, only verified events)
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
 * Time window configuration
 */
const TIME_WINDOWS = {
  '10m': 10 * 60,      // 600 seconds
  '1h': 60 * 60,       // 3600 seconds
  '6h': 6 * 60 * 60,   // 21600 seconds
  '24h': 24 * 60 * 60, // 86400 seconds
  '7d': 7 * 24 * 60 * 60, // 604800 seconds
} as const;

type TimeWindow = keyof typeof TIME_WINDOWS;

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
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const windowParam = (searchParams.get('window') || '1h') as TimeWindow;
    const window = TIME_WINDOWS[windowParam] || TIME_WINDOWS['1h'];

    const limitParam = parseInt(searchParams.get('limit') || '200');
    const limit = Math.min(Math.max(limitParam, 1), 500); // Clamp between 1-500

    const offsetParam = parseInt(searchParams.get('offset') || '0');
    const offset = Math.max(offsetParam, 0);

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

    // Calculate timestamp threshold (CRITICAL: use seconds not milliseconds!)
    const thresholdTimestamp = Math.floor(Date.now() / 1000) - window;

    // Build WHERE clause
    const whereConditions: string[] = [];
    whereConditions.push(`occurred_at >= ${thresholdTimestamp}`);

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
      // Get total count for pagination
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM event_frames WHERE ${whereClause}`,
        []
      );
      totalCount = countResult[0]?.total || 0;

      // Get paginated results
      eventFrameRows = await db.query(
        `SELECT * FROM event_frames WHERE ${whereClause} ORDER BY occurred_at DESC LIMIT ${limit} OFFSET ${offset}`,
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
    const mapActionsWithScores: Array<MapAction & { gameplay_score: number }> = eventFrames.map(
      (frame) => {
        const mapAction = eventFrameToMapAction(frame, {
          estimateOrigin: true,
          expirationMinutes: window / 60, // Convert seconds to minutes
        });

        const gameplayScore = calculateGameplayScore(
          frame.severity,
          frame.confidence,
          mapAction.action_type
        );

        return {
          ...mapAction,
          gameplay_score: gameplayScore,
        };
      }
    );

    // Sort by gameplay score (highest first), then by time (newest first)
    mapActionsWithScores.sort((a, b) => {
      if (b.gameplay_score !== a.gameplay_score) {
        return b.gameplay_score - a.gameplay_score;
      }

      // Then by time (newer first)
      const aTime = a.popup?.timestamp || a.created_at;
      const bTime = b.popup?.timestamp || b.created_at;
      return bTime - aTime;
    });

    // Extract MapActions (without gameplay_score in response, but keep for internal use)
    const mapActions: MapAction[] = mapActionsWithScores;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      actions: mapActions,
      total: totalCount,
      returned: mapActions.length,
      offset,
      limit,
      window: windowParam,
      filters: {
        event_types: eventTypes || [],
        min_severity: minSeverity,
        min_confidence: minConfidence,
        verified_only: verifiedOnly,
      },
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('Map actions error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate map actions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
