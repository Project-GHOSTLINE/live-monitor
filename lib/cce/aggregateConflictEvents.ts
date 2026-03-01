/**
 * CCE Event Aggregation
 *
 * Aggregates event_frames into conflict_events with 6-hour time buckets.
 *
 * Algorithm:
 * 1. Fetch unprocessed event_frames (or time range)
 * 2. Group by conflict_id + 6-hour window
 * 3. Cluster events by type and calculate severity/impact
 * 4. Preserve evidence URLs (max 5 per conflict_event)
 * 5. Insert conflict_events with zero hallucination
 *
 * Zero Hallucination Principle:
 * - Every conflict_event MUST have evidence_urls from source event_frames
 * - If no matching conflict found in conflicts_core, skip the event
 * - Never infer or guess conflict relationships
 */

import { getDB } from '../db/adapter';
import { randomUUID } from 'crypto';

const SIX_HOURS = 6 * 60 * 60; // 6 hours in seconds

interface EventFrame {
  id: number;
  feed_item_id: number;
  event_type: string;
  actors: string; // JSON string
  location: string; // JSON string
  severity: number;
  confidence: number;
  impact_level: number;
  summary: string;
  created_at: number; // Unix timestamp (seconds)
}

interface ConflictEvent {
  id: string;
  conflict_id: string;
  window_start: number;
  window_end: number;
  event_type: string;
  severity: number;
  impact_score: number;
  evidence_urls: string; // JSON array
  created_at: number;
}

interface ActorPair {
  actor_a: string;
  actor_b: string;
}

/**
 * Extract actor codes from event frame actors JSON
 */
function extractActorCodes(actorsJson: string): string[] {
  try {
    const parsed = JSON.parse(actorsJson);
    const actors: string[] = [];

    if (parsed.attacker) actors.push(parsed.attacker);
    if (parsed.defender) actors.push(parsed.defender);
    if (parsed.source) actors.push(parsed.source);
    if (parsed.target) actors.push(parsed.target);

    return [...new Set(actors)]; // Deduplicate
  } catch (error) {
    console.error('[extractActorCodes] Failed to parse actors:', actorsJson);
    return [];
  }
}

/**
 * Match event frame actors to known conflicts
 * Returns conflict_id if found, null otherwise
 */
async function matchConflict(actorCodes: string[]): Promise<string | null> {
  if (actorCodes.length < 2) return null;

  const db = getDB();

  // Try all actor pairs (order-agnostic)
  for (let i = 0; i < actorCodes.length; i++) {
    for (let j = i + 1; j < actorCodes.length; j++) {
      const a = actorCodes[i];
      const b = actorCodes[j];

      // Check both (a,b) and (b,a) ordering
      const conflicts = await db.query(
        `SELECT id FROM conflicts_core
         WHERE (actor_a = ? AND actor_b = ?) OR (actor_a = ? AND actor_b = ?)`,
        [a, b, b, a]
      );

      if (conflicts && conflicts.length > 0) {
        return conflicts[0].id;
      }
    }
  }

  return null;
}

/**
 * Calculate 6-hour bucket start time
 */
function getBucketStart(timestamp: number): number {
  return Math.floor(timestamp / SIX_HOURS) * SIX_HOURS;
}

/**
 * Get feed_item canonical URL from feed_item_id
 */
async function getFeedItemUrl(feedItemId: number): Promise<string | null> {
  const db = getDB();
  try {
    const item = await db.get('feed_items', feedItemId);
    return item?.canonical_url || item?.source_url || null;
  } catch (error) {
    console.error('[getFeedItemUrl] Error:', error);
    return null;
  }
}

/**
 * Aggregate event frames into conflict events
 *
 * @param options.since - Start timestamp (seconds). If null, process all unprocessed events
 * @param options.until - End timestamp (seconds). If null, use current time
 * @returns Number of conflict_events created
 */
export async function aggregateConflictEvents(options?: {
  since?: number;
  until?: number;
}): Promise<{ created: number; processed: number }> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);

  const since = options?.since || 0;
  const until = options?.until || now;

  console.log(`[aggregateConflictEvents] Processing events from ${since} to ${until}`);

  // Fetch event frames in time range
  const eventFrames = await db.query(
    `SELECT * FROM event_frames
     WHERE created_at >= ? AND created_at < ?
     ORDER BY created_at ASC`,
    [since, until]
  ) as EventFrame[];

  console.log(`[aggregateConflictEvents] Found ${eventFrames.length} event frames`);

  if (eventFrames.length === 0) {
    return { created: 0, processed: 0 };
  }

  // Group by conflict_id + time bucket
  interface BucketKey {
    conflict_id: string;
    bucket_start: number;
  }

  const buckets = new Map<string, {
    key: BucketKey;
    frames: EventFrame[];
    evidence_urls: Set<string>;
  }>();

  let processed = 0;
  let skipped = 0;

  // Phase 1: Match frames to conflicts and bucket them
  for (const frame of eventFrames) {
    processed++;

    const actorCodes = extractActorCodes(frame.actors);
    const conflictId = await matchConflict(actorCodes);

    if (!conflictId) {
      skipped++;
      continue; // Zero hallucination: skip if no conflict match
    }

    const bucketStart = getBucketStart(frame.created_at);
    const bucketKey = `${conflictId}:${bucketStart}`;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        key: { conflict_id: conflictId, bucket_start: bucketStart },
        frames: [],
        evidence_urls: new Set(),
      });
    }

    const bucket = buckets.get(bucketKey)!;
    bucket.frames.push(frame);

    // Add evidence URL
    const feedItemUrl = await getFeedItemUrl(frame.feed_item_id);
    if (feedItemUrl) {
      bucket.evidence_urls.add(feedItemUrl);
    }
  }

  console.log(`[aggregateConflictEvents] Matched ${buckets.size} buckets, skipped ${skipped} unmatched frames`);

  // Phase 2: Create conflict_events from buckets
  let created = 0;

  for (const bucket of buckets.values()) {
    const { conflict_id, bucket_start } = bucket.key;
    const frames = bucket.frames;

    // Calculate aggregated metrics
    const avgSeverity = frames.reduce((sum, f) => sum + f.severity, 0) / frames.length;
    const impactLevels = frames.map(f => f.impact_level).filter(x => !isNaN(x) && x !== null);
    const maxImpact = impactLevels.length > 0 ? Math.max(...impactLevels) : 3; // Default to medium
    const avgConfidence = frames.reduce((sum, f) => sum + f.confidence, 0) / frames.length;

    // Impact score = (max_impact * avg_confidence) normalized
    // Protect against NaN
    let impactScore = (maxImpact / 5) * avgConfidence;
    if (isNaN(impactScore) || impactScore === null || impactScore === undefined) {
      impactScore = 0.5; // Default to medium impact
    }
    impactScore = Math.min(1.0, impactScore);

    // Determine dominant event type
    const typeCount = new Map<string, number>();
    for (const frame of frames) {
      typeCount.set(frame.event_type, (typeCount.get(frame.event_type) || 0) + 1);
    }
    const dominantType = [...typeCount.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];

    // Evidence URLs (max 5)
    const evidenceUrls = Array.from(bucket.evidence_urls).slice(0, 5);

    if (evidenceUrls.length === 0) {
      console.warn(`[aggregateConflictEvents] Bucket ${conflict_id}:${bucket_start} has no evidence URLs, skipping`);
      continue;
    }

    // Create conflict_event
    const conflictEvent: ConflictEvent = {
      id: randomUUID(),
      conflict_id,
      window_start: bucket_start,
      window_end: bucket_start + SIX_HOURS,
      event_type: dominantType,
      severity: Math.round(avgSeverity),
      impact_score: impactScore,
      evidence_urls: JSON.stringify(evidenceUrls),
      created_at: now,
    };

    // Check if conflict_event already exists for this bucket
    const existing = await db.query(
      `SELECT id FROM conflict_events
       WHERE conflict_id = ? AND window_start = ?`,
      [conflict_id, bucket_start]
    );

    if (existing && existing.length > 0) {
      console.log(`[aggregateConflictEvents] Conflict event already exists for ${conflict_id} at ${bucket_start}, skipping`);
      continue;
    }

    // Insert
    try {
      await db.insert('conflict_events', conflictEvent);
      created++;
    } catch (error) {
      console.error(`[aggregateConflictEvents] Failed to insert conflict_event:`, error);
    }
  }

  console.log(`[aggregateConflictEvents] Created ${created} conflict events from ${processed} event frames`);

  return { created, processed };
}
