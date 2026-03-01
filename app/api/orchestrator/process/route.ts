/**
 * Orchestrator Process API
 *
 * Manual trigger endpoint for processing existing feed items through orchestrator pipeline.
 * Protected endpoint for testing and manual processing.
 *
 * POST /api/orchestrator/process
 * - Process specific feed_item_id through pipeline
 * - Or reprocess all unprocessed items
 */

import { NextRequest, NextResponse } from 'next/server';
import { processFeedItem, calculatePipelineStats, isOrchestratorEnabled } from '@/lib/orchestrator/pipeline';
import { DatabaseAdapter } from '@/lib/db/adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Rate limiting (in-memory, simple implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Check if orchestrator is enabled
  if (!isOrchestratorEnabled()) {
    return NextResponse.json(
      {
        error: 'Orchestrator not enabled',
        message: 'Set ORCH_ENABLED=true to enable orchestrator pipeline',
      },
      { status: 501 }
    );
  }

  // Check authorization
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET || process.env.API_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', message: 'Maximum 10 requests per minute' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { feed_item_id, batch_size = 10 } = body;

    const db = new DatabaseAdapter();

    if (feed_item_id) {
      // Process single item
      const feedItem = await db.get('feed_items', feed_item_id);

      if (!feedItem) {
        return NextResponse.json({ error: 'Feed item not found' }, { status: 404 });
      }

      const result = await processFeedItem({
        feedItem: {
          source_id: feedItem.source_id,
          source_name: feedItem.source_name,
          source_url: feedItem.source_url,
          canonical_url: feedItem.canonical_url,
          published_at: feedItem.published_at,
          title_original: feedItem.title_original,
          content_original: feedItem.content_original,
          lang: feedItem.lang,
          reliability: feedItem.reliability,
          entity_places: feedItem.entity_places,
          entity_orgs: feedItem.entity_orgs,
          tags: feedItem.tags,
        },
      });

      return NextResponse.json({
        success: result.success,
        result,
        response_time_ms: Date.now() - startTime,
      });
    }

    // Process batch of unprocessed items
    // Find feed items without event frames
    const unprocessedItems = await db.query(
      `SELECT fi.*
       FROM feed_items fi
       LEFT JOIN event_frames ef ON fi.id = ef.feed_item_id
       WHERE ef.id IS NULL
       ORDER BY fi.published_at DESC
       LIMIT ?`,
      [Math.min(batch_size, 100)] // Cap at 100 for safety
    );

    if (!unprocessedItems || unprocessedItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed items found',
        processed: 0,
        response_time_ms: Date.now() - startTime,
      });
    }

    // Process each item
    const results = [];
    for (const item of unprocessedItems) {
      const result = await processFeedItem({
        feedItem: {
          source_id: item.source_id,
          source_name: item.source_name,
          source_url: item.source_url,
          canonical_url: item.canonical_url,
          published_at: item.published_at,
          title_original: item.title_original,
          content_original: item.content_original,
          lang: item.lang,
          reliability: item.reliability,
          entity_places: item.entity_places ? JSON.parse(item.entity_places) : [],
          entity_orgs: item.entity_orgs ? JSON.parse(item.entity_orgs) : [],
          tags: item.tags ? JSON.parse(item.tags) : [],
        },
      });
      results.push(result);
    }

    const stats = calculatePipelineStats(results);

    return NextResponse.json({
      success: true,
      processed: results.length,
      stats,
      response_time_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Orchestrator process failed:', error);
    return NextResponse.json(
      {
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for status check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    orchestrator_enabled: isOrchestratorEnabled(),
    endpoint: '/api/orchestrator/process',
    methods: ['POST'],
    auth_required: true,
    rate_limit: `${RATE_LIMIT} requests per ${RATE_WINDOW / 1000} seconds`,
  });
}
