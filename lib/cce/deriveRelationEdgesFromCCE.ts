/**
 * Derive Relation Edges from CCE
 *
 * Converts CCE conflict_state_live data into relation_edges table format
 * for backward compatibility with existing UI and APIs.
 *
 * Mapping:
 * - conflict_state_live.tension + conflicts_core.base_hostility → relation_strength
 * - All CCE conflicts are mapped to 'hostile' relation_type
 * - top_drivers (conflict_events) → evidence_event_frame_ids
 * - Maintains existing relation_edges API contract
 */

import { getDB } from '@/lib/db/adapter';

interface ConflictState {
  conflict_id: string;
  tension: number;
  heat: number;
  velocity: number;
  last_event_at: number | null;
  top_drivers: string;  // JSON array of conflict_event IDs
  updated_at: number;
}

interface ConflictCore {
  id: string;
  actor_a: string;
  actor_b: string;
  base_hostility: number;
  base_tension: number;
  importance: number;
}

interface ConflictEvent {
  id: string;
  evidence_urls: string;  // JSON array of URLs
}

/**
 * Tension + Hostility → Relation Score
 *
 * Maps CCE metrics to relation_edges.relation_strength (0-1 scale)
 *
 * Logic:
 * - Base: base_hostility (historical baseline)
 * - Add: tension (current state with decay)
 * - Weight by importance
 * - Clamp to [0, 1]
 */
function calculateRelationStrength(
  tension: number,
  baseHostility: number,
  importance: number
): number {
  // Weighted combination: 60% current tension, 40% base hostility
  const weighted = (tension * 0.6) + (baseHostility * 0.4);

  // Scale by importance (critical conflicts get boosted)
  const scaled = weighted * (0.5 + (importance * 0.5));

  // Clamp to valid range
  return Math.min(1.0, Math.max(0.0, scaled));
}

/**
 * Map relation strength to relation status
 *
 * Same thresholds as existing state engine:
 * - 0.8+: critical
 * - 0.6-0.79: high
 * - 0.4-0.59: elevated
 * - 0.2-0.39: watchful
 * - <0.2: normal
 */
function getRelationStatus(strength: number): string {
  if (strength >= 0.8) return 'critical';
  if (strength >= 0.6) return 'high';
  if (strength >= 0.4) return 'elevated';
  if (strength >= 0.2) return 'watchful';
  return 'normal';
}

/**
 * Extract evidence URLs from top conflict events
 *
 * Gets up to 10 most recent evidence URLs from top_drivers
 */
async function getEvidenceUrls(topDrivers: string[]): Promise<string[]> {
  if (!topDrivers || topDrivers.length === 0) return [];

  const db = getDB();

  try {
    const placeholders = topDrivers.map(() => '?').join(',');
    const events = await db.query(
      `SELECT id, evidence_urls FROM conflict_events
       WHERE id IN (${placeholders})
       ORDER BY created_at DESC
       LIMIT 10`,
      topDrivers
    ) as ConflictEvent[];

    // Flatten all evidence URLs
    const urls: string[] = [];
    for (const event of events) {
      try {
        const eventUrls = JSON.parse(event.evidence_urls || '[]');
        urls.push(...eventUrls);
      } catch (e) {
        console.error('[getEvidenceUrls] Failed to parse evidence_urls:', e);
      }
    }

    // Return unique URLs, max 10
    return [...new Set(urls)].slice(0, 10);
  } catch (error) {
    console.error('[getEvidenceUrls] Error:', error);
    return [];
  }
}

/**
 * Derive relation edges from CCE conflict data
 *
 * Upserts relation_edges table with data derived from:
 * - conflict_state_live (current tension/heat/velocity)
 * - conflicts_core (base metrics and actor pairs)
 * - conflict_events (evidence URLs)
 *
 * Returns stats on operations performed.
 */
export async function deriveRelationEdgesFromCCE(options: {
  minTension?: number;
  maxAge?: number;  // Max age in seconds for conflict updates
} = {}): Promise<{
  processed: number;
  created: number;
  updated: number;
  skipped: number;
}> {
  const {
    minTension = 0.1,  // Skip very low tensions
    maxAge = 86400 * 7,  // 7 days default
  } = options;

  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const minTimestamp = now - maxAge;

  let processed = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    // Get all active conflicts with live state
    const conflicts = await db.query(
      `SELECT
         cc.id as conflict_id,
         cc.actor_a,
         cc.actor_b,
         cc.base_hostility,
         cc.base_tension,
         cc.importance,
         csl.tension,
         csl.heat,
         csl.velocity,
         csl.last_event_at,
         csl.top_drivers,
         csl.updated_at
       FROM conflicts_core cc
       INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
       WHERE csl.tension >= ?
         AND csl.updated_at >= ?
       ORDER BY csl.tension DESC`,
      [minTension, minTimestamp]
    ) as (ConflictCore & ConflictState)[];

    console.log(`[deriveRelationEdgesFromCCE] Processing ${conflicts.length} conflicts`);

    for (const conflict of conflicts) {
      processed++;

      // Calculate relation strength
      const relationStrength = calculateRelationStrength(
        conflict.tension,
        conflict.base_hostility,
        conflict.importance
      );

      // Skip if strength is too low after calculation
      if (relationStrength < minTension) {
        skipped++;
        continue;
      }

      // Parse top_drivers to get evidence
      // Note: top_drivers is an array of signal objects with evidence_urls embedded
      let evidenceUrls: string[] = [];
      try {
        const topDrivers = JSON.parse(conflict.top_drivers || '[]');
        // Extract evidence_urls from each driver signal
        for (const driver of topDrivers) {
          if (driver.evidence_urls && Array.isArray(driver.evidence_urls)) {
            evidenceUrls.push(...driver.evidence_urls);
          }
        }
        // Keep unique URLs, max 10
        evidenceUrls = [...new Set(evidenceUrls)].slice(0, 10);
      } catch (e) {
        console.error('[deriveRelationEdgesFromCCE] Failed to parse top_drivers:', e);
      }

      // Normalize entity order (alphabetical) for consistency
      const [entityA, entityB] = [conflict.actor_a, conflict.actor_b].sort();

      // Check if relation exists
      const existing = await db.query(
        `SELECT id, evidence_count FROM relation_edges
         WHERE entity_a = ? AND entity_b = ? AND relation_type = 'hostile'
         LIMIT 1`,
        [entityA, entityB]
      );

      if (existing.length > 0) {
        // Update existing relation
        const edge = existing[0] as any;

        await db.exec(
          `UPDATE relation_edges
           SET relation_strength = ?,
               last_updated_at = ?,
               last_event_at = ?,
               confidence = ?,
               evidence_count = ?,
               source = ?
           WHERE id = ?`,
          [
            relationStrength,
            conflict.updated_at,
            conflict.last_event_at || conflict.updated_at,
            Math.min(1.0, 0.7 + (conflict.heat * 0.3)),  // Confidence based on heat
            evidenceUrls.length,
            'cce_derived',
            edge.id,
          ]
        );

        updated++;
      } else {
        // Create new relation
        await db.exec(
          `INSERT INTO relation_edges
           (entity_a, entity_b, relation_type, relation_strength, is_mutual,
            evidence_event_frame_ids, evidence_count, first_observed_at,
            last_updated_at, last_event_at, confidence, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entityA,
            entityB,
            'hostile',
            relationStrength,
            0,  // Hostile relations are directional (not mutual)
            JSON.stringify(evidenceUrls.slice(0, 5)),  // Store up to 5 evidence URLs
            evidenceUrls.length,
            conflict.updated_at,
            conflict.updated_at,
            conflict.last_event_at || conflict.updated_at,
            Math.min(1.0, 0.7 + (conflict.heat * 0.3)),
            'cce_derived',
          ]
        );

        created++;
      }
    }

    console.log(
      `[deriveRelationEdgesFromCCE] Complete: ${processed} processed, ` +
      `${created} created, ${updated} updated, ${skipped} skipped`
    );

    return { processed, created, updated, skipped };
  } catch (error) {
    console.error('[deriveRelationEdgesFromCCE] Error:', error);
    throw error;
  }
}

/**
 * Get CCE-derived relations for a specific country
 *
 * Returns hostile relations derived from CCE for backward compatibility
 */
export async function getCCERelationsForCountry(
  countryCode: string,
  minStrength: number = 0.0
): Promise<any[]> {
  const db = getDB();

  try {
    const edges = await db.query(
      `SELECT * FROM relation_edges
       WHERE (entity_a = ? OR entity_b = ?)
         AND relation_type = 'hostile'
         AND relation_strength >= ?
         AND source = 'cce_derived'
       ORDER BY relation_strength DESC, last_updated_at DESC`,
      [countryCode, countryCode, minStrength]
    ) as any[];

    return edges.map(edge => ({
      ...edge,
      is_mutual: edge.is_mutual === 1,
      evidence_event_frame_ids: JSON.parse(edge.evidence_event_frame_ids || '[]'),
      status: getRelationStatus(edge.relation_strength),
    }));
  } catch (error) {
    console.error('[getCCERelationsForCountry] Error:', error);
    return [];
  }
}

/**
 * Get summary statistics for CCE-derived relations
 */
export async function getCCERelationStats(): Promise<{
  total: number;
  by_strength: Record<string, number>;
  by_actor: Record<string, number>;
  avg_strength: number;
  last_updated: number | null;
}> {
  const db = getDB();

  try {
    // Get all CCE-derived relations
    const edges = await db.query(
      `SELECT entity_a, entity_b, relation_strength, last_updated_at
       FROM relation_edges
       WHERE source = 'cce_derived'
       ORDER BY relation_strength DESC`
    ) as any[];

    // Calculate statistics
    const byStrength: Record<string, number> = {
      critical: 0,
      high: 0,
      elevated: 0,
      watchful: 0,
      normal: 0,
    };

    const byActor: Record<string, number> = {};
    let totalStrength = 0;
    let lastUpdated: number | null = null;

    for (const edge of edges) {
      // Strength distribution
      const status = getRelationStatus(edge.relation_strength);
      byStrength[status] = (byStrength[status] || 0) + 1;

      // Actor participation
      byActor[edge.entity_a] = (byActor[edge.entity_a] || 0) + 1;
      byActor[edge.entity_b] = (byActor[edge.entity_b] || 0) + 1;

      // Average strength
      totalStrength += edge.relation_strength;

      // Latest update
      if (!lastUpdated || edge.last_updated_at > lastUpdated) {
        lastUpdated = edge.last_updated_at;
      }
    }

    return {
      total: edges.length,
      by_strength: byStrength,
      by_actor: byActor,
      avg_strength: edges.length > 0 ? totalStrength / edges.length : 0,
      last_updated: lastUpdated,
    };
  } catch (error) {
    console.error('[getCCERelationStats] Error:', error);
    return {
      total: 0,
      by_strength: {},
      by_actor: {},
      avg_strength: 0,
      last_updated: null,
    };
  }
}
