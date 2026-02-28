import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/client';
import { detectSignals } from '@/lib/workers/signalDetector';
import { extractMapEvents } from '@/lib/workers/mapEventsExtractor';

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

    const db = getDatabase();

    // Calculate timestamp threshold
    const thresholdTimestamp = Math.floor(Date.now() / 1000) - hours * 3600;

    // Fetch recent feed items
    const stmt = db.prepare(`
      SELECT
        id,
        title_en,
        summary_en,
        published_at,
        source_name,
        url,
        tags
      FROM feed_items
      WHERE published_at >= ?
      ORDER BY published_at DESC
      LIMIT ?
    `);

    const items = stmt.all(thresholdTimestamp, limit) as Array<{
      id: number;
      title_en: string;
      summary_en?: string;
      published_at: number;
      source_name: string;
      url?: string;
      tags?: string;
    }>;

    // Parse tags
    const parsedItems = items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
    }));

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
    const mapEvents = extractMapEvents(itemsWithDetectedSignals);

    // Sort by severity and recency
    mapEvents.sort((a, b) => {
      const severityDiff = b.severity - a.severity;
      if (severityDiff !== 0) return severityDiff;

      // Sort by time (newer first)
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      events: mapEvents,
      total: mapEvents.length,
      scope,
      hours,
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
