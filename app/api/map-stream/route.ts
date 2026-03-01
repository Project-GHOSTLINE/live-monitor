/**
 * GET /api/map-stream
 *
 * SSE Streaming endpoint for real-time map events from event_frames table
 *
 * Architecture:
 * - Server-Sent Events (SSE) for one-way server-to-client streaming
 * - Ping every 30s for connection keep-alive
 * - Poll event_frames table every 5s for new events
 * - Graceful reconnection handling
 * - Memory-efficient stream processing
 *
 * Query params:
 * - since: Unix timestamp in seconds (default: now)
 * - event_type: EventType filter (optional, comma-separated)
 * - min_severity: 1-10 (optional, minimum severity)
 * - min_confidence: 0.0-1.0 (optional, minimum confidence)
 *
 * SSE Message Format:
 * event: connected
 * data: {"timestamp": 1234567890, "since": 1234567890}
 *
 * event: ping
 * data: {"timestamp": 1234567890}
 *
 * event: map-action
 * data: {"id": "evt_123", "action_type": "PULSE_STRIKE", ...}
 *
 * event: error
 * data: {"error": "Database connection lost", "timestamp": 1234567890}
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';
import {
  eventFrameToMapAction,
  calculateGameplayScore,
  mapDatabaseSeverity,
} from '@/lib/map/eventMapper';
import type { EventFrame, EventType, LocationPrecision } from '@/types/map/EventFrame';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get('since');

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

  // Track last processed timestamp (in seconds)
  let lastProcessedTimestamp = sinceParam
    ? parseInt(sinceParam)
    : Math.floor(Date.now() / 1000);

  // SSE Response Headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let pingInterval: NodeJS.Timeout | null = null;
      let pollInterval: NodeJS.Timeout | null = null;

      // Helper to send SSE message
      const sendEvent = (event: string, data: any) => {
        if (closed) return;

        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('SSE send error:', error);
        }
      };

      // Poll event_frames table for new events
      const pollEvents = async () => {
        if (closed) return;

        try {
          const db = getDB();

          // Build WHERE clause
          const whereConditions: string[] = [];
          whereConditions.push(`created_at > ${lastProcessedTimestamp}`);

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

          const whereClause = whereConditions.join(' AND ');

          // Query for new event_frames since last check
          const newRows = await db.query(
            `SELECT * FROM event_frames WHERE ${whereClause} ORDER BY created_at ASC LIMIT 50`,
            []
          );

          if (newRows.length === 0) {
            return; // No new events
          }

          // Convert to EventFrames
          const eventFrames = newRows.map(dbRowToEventFrame);

          // Convert to MapActions and stream each event
          for (const eventFrame of eventFrames) {
            const mapAction = eventFrameToMapAction(eventFrame, {
              estimateOrigin: true,
              expirationMinutes: 60, // 1 hour default expiration
            });

            const gameplayScore = calculateGameplayScore(
              eventFrame.severity,
              eventFrame.confidence,
              mapAction.action_type
            );

            sendEvent('map-action', {
              ...mapAction,
              gameplay_score: gameplayScore,
            });

            // Small delay to prevent overwhelming client
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Update last processed timestamp to the newest event
          const newestRow = newRows[newRows.length - 1];
          lastProcessedTimestamp = newestRow.created_at;
        } catch (error) {
          console.error('Poll error:', error);
          sendEvent('error', {
            error: 'Event polling failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Math.floor(Date.now() / 1000),
          });
        }
      };

      // Send initial connection success
      sendEvent('connected', {
        timestamp: Math.floor(Date.now() / 1000),
        since: lastProcessedTimestamp,
        filters: {
          event_types: eventTypes || [],
          min_severity: minSeverity,
          min_confidence: minConfidence,
        },
      });

      // Setup ping interval (every 30 seconds)
      pingInterval = setInterval(() => {
        sendEvent('ping', {
          timestamp: Math.floor(Date.now() / 1000),
        });
      }, 30000);

      // Setup poll interval (every 5 seconds)
      pollInterval = setInterval(pollEvents, 5000);

      // Initial poll
      pollEvents().catch((error) => {
        console.error('Initial poll error:', error);
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        closed = true;

        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }

        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }

        try {
          controller.close();
        } catch (error) {
          console.error('Controller close error:', error);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
