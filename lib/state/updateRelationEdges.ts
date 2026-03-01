/**
 * Update Relation Edges
 *
 * Creates and updates bilateral relation edges between countries based on
 * event frames (attacks, cooperation, diplomatic actions).
 *
 * Relation types: allied, hostile, neutral, trade_partner, adversary, treaty_member, sanctioned
 */

import { getDB } from '@/lib/db/adapter';
import type { RelationEdge } from '@/types/state';

interface EventFrame {
  id: number;
  event_type: string;
  severity: number;
  confidence: number;
  occurred_at: number;
  actors_attacker?: string;
  actors_target?: string;
}

/**
 * Event type to relation type mapping
 */
const EVENT_TO_RELATION: Record<string, 'hostile' | 'adversary' | 'neutral' | 'allied'> = {
  // Kinetic events → hostile
  missile_strike: 'hostile',
  drone_strike: 'hostile',
  airstrike: 'hostile',
  artillery_shelling: 'hostile',
  naval_strike: 'hostile',
  ground_assault: 'hostile',
  rocket_attack: 'hostile',
  air_defense: 'hostile',
  explosion: 'hostile',
  sabotage: 'adversary',

  // Economic/diplomatic → adversary or neutral
  sanction: 'adversary',
  cyberattack: 'adversary',

  // Neutral events
  diplomatic_action: 'neutral',
  protest: 'neutral',
};

/**
 * Update or create relation edge between two entities
 */
async function upsertRelationEdge(
  entityA: string,
  entityB: string,
  relationType: string,
  strength: number,
  eventFrameId: number,
  confidence: number
): Promise<void> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);

  try {
    // Normalize entity order (alphabetical) for consistency
    const [entity1, entity2] = [entityA, entityB].sort();

    // Check if relation exists
    const existing = await db.query(
      `SELECT * FROM relation_edges
       WHERE entity_a = ? AND entity_b = ? AND relation_type = ?
       LIMIT 1`,
      [entity1, entity2, relationType]
    );

    if (existing.length > 0) {
      // Update existing relation
      const edge = existing[0] as any;
      const existingIds = JSON.parse(edge.evidence_event_frame_ids || '[]');
      const updatedIds = [...existingIds, eventFrameId].slice(-10);  // Keep last 10 events

      await db.exec(
        `UPDATE relation_edges
         SET relation_strength = ?,
             evidence_event_frame_ids = ?,
             evidence_count = ?,
             last_updated_at = ?,
             last_event_at = ?,
             confidence = ?
         WHERE id = ?`,
        [
          Math.min(1.0, strength),
          JSON.stringify(updatedIds),
          updatedIds.length,
          now,
          now,
          Math.min(1.0, (edge.confidence + confidence) / 2),  // Average confidence
          edge.id,
        ]
      );
    } else {
      // Create new relation
      await db.exec(
        `INSERT INTO relation_edges
         (entity_a, entity_b, relation_type, relation_strength, is_mutual,
          evidence_event_frame_ids, evidence_count, first_observed_at,
          last_updated_at, last_event_at, confidence, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entity1,
          entity2,
          relationType,
          Math.min(1.0, strength),
          relationType === 'hostile' || relationType === 'adversary' ? 0 : 1,  // Hostile is directional
          JSON.stringify([eventFrameId]),
          1,
          now,
          now,
          now,
          confidence,
          'event_analysis',
        ]
      );
    }
  } catch (error) {
    console.error('[upsertRelationEdge] Error:', error);
  }
}

/**
 * Process event frames to extract and update relation edges
 */
export async function updateRelationEdges(options: {
  windowHours?: number;
  minConfidence?: number;
  minSeverity?: number;
} = {}): Promise<{ processed: number; created: number; updated: number }> {
  const {
    windowHours = 24,
    minConfidence = 0.4,
    minSeverity = 4,
  } = options;

  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (windowHours * 3600);

  let processed = 0;
  let created = 0;
  let updated = 0;

  try {
    // Fetch events with both attacker and target
    // Note: actors is JSON column, extract via json_extract
    const events = await db.query(
      `SELECT id, event_type, severity, confidence, occurred_at,
              json_extract(actors, '$.attacker') as actors_attacker,
              json_extract(actors, '$.target') as actors_target
       FROM event_frames
       WHERE occurred_at >= ?
         AND confidence >= ?
         AND severity >= ?
         AND json_extract(actors, '$.attacker') IS NOT NULL
         AND json_extract(actors, '$.target') IS NOT NULL
         AND json_extract(actors, '$.attacker') != json_extract(actors, '$.target')
       ORDER BY occurred_at DESC`,
      [windowStart, minConfidence, minSeverity]
    ) as EventFrame[];

    console.log(`[updateRelationEdges] Processing ${events.length} events`);

    for (const event of events) {
      if (!event.actors_attacker || !event.actors_target) continue;

      const relationType = EVENT_TO_RELATION[event.event_type] || 'neutral';

      // Relation strength based on severity and confidence
      // Severity 8+ → strength 0.8+, severity 5 → strength 0.5
      const strength = (event.severity / 10) * event.confidence;

      // Check if edge already exists
      const [entity1, entity2] = [event.actors_attacker, event.actors_target].sort();
      const existing = await db.query(
        `SELECT id FROM relation_edges
         WHERE entity_a = ? AND entity_b = ? AND relation_type = ?
         LIMIT 1`,
        [entity1, entity2, relationType]
      );

      const isUpdate = existing.length > 0;

      await upsertRelationEdge(
        event.actors_attacker,
        event.actors_target,
        relationType,
        strength,
        event.id,
        event.confidence
      );

      processed++;
      if (isUpdate) {
        updated++;
      } else {
        created++;
      }
    }

    console.log(`[updateRelationEdges] Processed ${processed} events: ${created} created, ${updated} updated`);

    return { processed, created, updated };
  } catch (error) {
    console.error('[updateRelationEdges] Error:', error);
    return { processed, created, updated };
  }
}

/**
 * Get relation edges for a specific country
 */
export async function getCountryRelations(
  countryCode: string,
  options: {
    minStrength?: number;
    relationType?: string;
  } = {}
): Promise<RelationEdge[]> {
  const {
    minStrength = 0.0,
    relationType,
  } = options;

  const db = getDB();

  try {
    let query = `
      SELECT * FROM relation_edges
      WHERE (entity_a = ? OR entity_b = ?)
        AND relation_strength >= ?
    `;
    const params: any[] = [countryCode, countryCode, minStrength];

    if (relationType) {
      query += ` AND relation_type = ?`;
      params.push(relationType);
    }

    query += ` ORDER BY relation_strength DESC, last_updated_at DESC`;

    const edges = await db.query(query, params) as any[];

    // Parse JSON fields
    return edges.map(edge => ({
      ...edge,
      is_mutual: edge.is_mutual === 1,
      evidence_event_frame_ids: JSON.parse(edge.evidence_event_frame_ids || '[]'),
    }));
  } catch (error) {
    console.error('[getCountryRelations] Error:', error);
    return [];
  }
}

/**
 * Get all hostile relations (for conflict detection)
 */
export async function getHostileRelations(minStrength: number = 0.5): Promise<RelationEdge[]> {
  const db = getDB();

  try {
    const edges = await db.query(
      `SELECT * FROM relation_edges
       WHERE relation_type IN ('hostile', 'adversary')
         AND relation_strength >= ?
       ORDER BY relation_strength DESC`,
      [minStrength]
    ) as any[];

    return edges.map(edge => ({
      ...edge,
      is_mutual: edge.is_mutual === 1,
      evidence_event_frame_ids: JSON.parse(edge.evidence_event_frame_ids || '[]'),
    }));
  } catch (error) {
    console.error('[getHostileRelations] Error:', error);
    return [];
  }
}
