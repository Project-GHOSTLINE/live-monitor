import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/adapter';
import { detectSignals } from '@/lib/workers/signalDetector';
import { extractMapEvents } from '@/lib/workers/mapEventsExtractor';
import { MapEvent } from '@/lib/signals/signalTypes';

/**
 * GET /api/map-events
 *
 * Returns geolocated military events for theater map visualization
 *
 * Query params:
 * - scope: 'middle-east' | 'global' (default: middle-east)
 * - limit: number (default: 50, max: 200)
 * - hours: number (default: 24, filter events from last N hours)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'middle-east';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const hours = parseInt(searchParams.get('hours') || '24');

    let items: Array<{
      id: number;
      title_en: string;
      summary_en?: string;
      published_at: number;
      source_name: string;
      url?: string;
      tags?: any;
    }> = [];

    try {
      const db = getDB();

      // Calculate timestamp threshold
      const thresholdTimestamp = Math.floor(Date.now() / 1000) - hours * 3600;

      // Fetch recent feed items using adapter
      items = await db.all(
        'feed_items',
        `published_at >= ${thresholdTimestamp} ORDER BY published_at DESC LIMIT ${limit}`,
        []
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return empty array if DB fails (graceful degradation)
      items = [];
    }

    // Parse tags safely (handle both SQLite strings and Supabase JSONB)
    const parsedItems = items.map(item => {
      let tags: string[] = [];
      try {
        tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []);
      } catch (parseError) {
        console.error('Tag parse error for item', item.id, parseError);
        tags = [];
      }
      return {
        ...item,
        tags,
      };
    });

    let mapEvents: MapEvent[] = [];

    // Only process if we have items
    if (parsedItems.length > 0) {
      try {
        // Detect signals for each item
        const itemsWithSignals = parsedItems.map(item => ({
          ...item,
          signals: detectSignals({
            id: item.id,
            title_en: item.title_en,
            summary_en: item.summary_en,
            published_at: item.published_at,
            tags: item.tags,
          }),
        }));

        // Filter items that have signals
        const itemsWithDetectedSignals = itemsWithSignals.filter(
          item => item.signals.length > 0
        );

        // Extract map events
        mapEvents = extractMapEvents(itemsWithDetectedSignals);

        // Sort by severity and recency
        mapEvents.sort((a, b) => {
          const severityDiff = b.severity - a.severity;
          if (severityDiff !== 0) return severityDiff;

          // Sort by time (newer first)
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        });
      } catch (processingError) {
        console.error('Event processing error:', processingError);
        // Continue with empty events
        mapEvents = [];
      }
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      events: mapEvents,
      total: mapEvents.length,
      scope,
      hours,
      items_analyzed: parsedItems.length,
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('Map events error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch map events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
