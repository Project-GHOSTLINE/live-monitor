/**
 * Get World State from CCE
 *
 * Calculates global state metrics from CCE conflict data
 * as an alternative to the event-frame-based state engine.
 *
 * This provides a conflict-centric view of global tension
 * aggregated from all active conflicts in conflict_state_live.
 */

import { getDB } from '@/lib/db/adapter';

interface ConflictState {
  conflict_id: string;
  tension: number;
  heat: number;
  velocity: number;
  last_event_at: number | null;
  updated_at: number;
}

interface ConflictCore {
  id: string;
  actor_a: string;
  actor_b: string;
  theatre: string;
  importance: number;
}

/**
 * Calculate global tension from all active conflicts
 *
 * Weighted by conflict importance and theatre scope
 */
async function calculateGlobalTensionFromCCE(): Promise<number> {
  const db = getDB();

  try {
    // Get all conflicts with their live state
    const conflicts = await db.query(
      `SELECT
         cc.importance,
         cc.theatre,
         csl.tension,
         csl.heat
       FROM conflicts_core cc
       INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
       WHERE csl.tension > 0.0
       ORDER BY csl.tension DESC`
    ) as (ConflictCore & ConflictState)[];

    if (conflicts.length === 0) {
      return 0.0;
    }

    // Theatre weights (global conflicts matter more)
    const theatreWeights: Record<string, number> = {
      Global: 1.0,
      MiddleEast: 0.8,
      EuropeEast: 0.9,
      IndoPacific: 0.85,
      SouthAsia: 0.7,
      Africa: 0.6,
      LatinAmerica: 0.5,
    };

    // Calculate weighted tension
    let totalWeightedTension = 0;
    let totalWeight = 0;

    for (const conflict of conflicts) {
      const theatreWeight = theatreWeights[conflict.theatre] || 0.5;
      const weight = conflict.importance * theatreWeight;

      // Combine tension and heat for global metric
      const conflictTension = (conflict.tension * 0.7) + (conflict.heat * 0.3);

      totalWeightedTension += conflictTension * weight;
      totalWeight += weight;
    }

    // Normalize to 0-1 scale
    const globalTension = totalWeight > 0 ? totalWeightedTension / totalWeight : 0.0;

    // Apply amplification for high-importance conflicts
    // If multiple high-tension conflicts exist, boost global tension
    const highTensionCount = conflicts.filter(c => c.tension >= 0.7).length;
    const amplification = 1.0 + (Math.min(highTensionCount, 5) * 0.05);  // +5% per high-tension conflict, max +25%

    return Math.min(1.0, Math.max(0.0, globalTension * amplification));
  } catch (error) {
    console.error('[calculateGlobalTensionFromCCE] Error:', error);
    return 0.0;
  }
}

/**
 * Determine alert level from tension score
 */
function getAlertLevel(tension: number): 'low' | 'medium' | 'high' | 'critical' {
  if (tension >= 0.75) return 'critical';
  if (tension >= 0.50) return 'high';
  if (tension >= 0.25) return 'medium';
  return 'low';
}

/**
 * Get country statuses from CCE conflict participation
 *
 * Countries involved in high-tension conflicts get elevated status
 */
async function getCountryStatusesFromCCE(): Promise<Record<string, string>> {
  const db = getDB();

  try {
    const conflicts = await db.query(
      `SELECT
         cc.actor_a,
         cc.actor_b,
         csl.tension
       FROM conflicts_core cc
       INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
       WHERE csl.tension > 0.2
       ORDER BY csl.tension DESC`
    ) as (ConflictCore & Pick<ConflictState, 'tension'>)[];

    const countryStatus: Record<string, number> = {};

    // Aggregate tension per country (max tension of all conflicts)
    for (const conflict of conflicts) {
      const actorA = conflict.actor_a;
      const actorB = conflict.actor_b;

      countryStatus[actorA] = Math.max(
        countryStatus[actorA] || 0,
        conflict.tension
      );

      countryStatus[actorB] = Math.max(
        countryStatus[actorB] || 0,
        conflict.tension
      );
    }

    // Map tension to status labels
    const statuses: Record<string, string> = {};
    for (const [country, tension] of Object.entries(countryStatus)) {
      if (tension >= 0.8) statuses[country] = 'critical';
      else if (tension >= 0.6) statuses[country] = 'heightened';
      else if (tension >= 0.4) statuses[country] = 'elevated';
      else if (tension >= 0.2) statuses[country] = 'watchful';
      else statuses[country] = 'normal';
    }

    return statuses;
  } catch (error) {
    console.error('[getCountryStatusesFromCCE] Error:', error);
    return {};
  }
}

/**
 * Get top conflict scenarios with probabilities
 *
 * Maps high-tension conflicts to scenario-like format
 */
async function getScenarioScoresFromCCE(): Promise<Record<string, number>> {
  const db = getDB();

  try {
    const conflicts = await db.query(
      `SELECT
         cc.id,
         cc.actor_a,
         cc.actor_b,
         cc.theatre,
         csl.tension,
         csl.heat,
         csl.velocity
       FROM conflicts_core cc
       INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
       WHERE csl.tension >= 0.3
       ORDER BY csl.tension DESC
       LIMIT 20`
    ) as (ConflictCore & ConflictState)[];

    const scenarios: Record<string, number> = {};

    for (const conflict of conflicts) {
      // Generate scenario code from conflict
      const scenarioCode = `CONFLICT_${conflict.actor_a}_${conflict.actor_b}`.toUpperCase();

      // Calculate probability from tension, heat, and velocity
      // Positive velocity (escalating) increases probability
      const velocityFactor = conflict.velocity > 0 ? 1.0 + (conflict.velocity * 0.2) : 1.0;
      const probability = Math.min(1.0, (conflict.tension * 0.6 + conflict.heat * 0.4) * velocityFactor);

      scenarios[scenarioCode] = probability;
    }

    return scenarios;
  } catch (error) {
    console.error('[getScenarioScoresFromCCE] Error:', error);
    return {};
  }
}

/**
 * Get world state from CCE data
 *
 * Returns world state metrics calculated from CCE conflicts
 * Compatible with world_state_live table format
 */
export async function getWorldStateFromCCE(): Promise<{
  id: number;
  last_updated_at: number;
  global_tension_score: number;
  alert_level: string;
  active_event_count: number;
  active_scenario_count: number;
  active_event_frames: number[];
  scenario_scores: Record<string, number>;
  country_statuses: Record<string, string>;
  calculation_method: string;
  data_quality: number;
  version: number;
} | null> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);

  try {
    // Calculate metrics from CCE
    const globalTension = await calculateGlobalTensionFromCCE();
    const alertLevel = getAlertLevel(globalTension);
    const countryStatuses = await getCountryStatusesFromCCE();
    const scenarioScores = await getScenarioScoresFromCCE();

    // Count active conflicts
    const activeConflicts = await db.query(
      `SELECT COUNT(*) as count FROM conflict_state_live
       WHERE tension > 0.2`
    );
    const activeScenarioCount = (activeConflicts[0] as any)?.count || 0;

    // Count recent conflict events (last 24h)
    const recentEvents = await db.query(
      `SELECT COUNT(*) as count FROM conflict_events
       WHERE created_at >= ?`,
      [now - 86400]
    );
    const activeEventCount = (recentEvents[0] as any)?.count || 0;

    // Get recent conflict event IDs (for compatibility)
    const eventIds = await db.query(
      `SELECT id FROM conflict_events
       WHERE created_at >= ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [now - 86400]
    );

    // Note: conflict_events.id is TEXT, but we'll return them as-is
    // The UI may expect numbers, but this maintains data integrity
    const activeEventFrames = eventIds.map((e: any) => e.id);

    // Assess data quality based on conflict coverage and update freshness
    const staleness = await db.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN updated_at >= ? THEN 1 ELSE 0 END) as fresh
       FROM conflict_state_live`,
      [now - 3600]  // Fresh = updated in last hour
    );

    const total = (staleness[0] as any)?.total || 0;
    const fresh = (staleness[0] as any)?.fresh || 0;
    const dataQuality = total > 0 ? Math.min(1.0, (fresh / total) * 1.2) : 0.8;

    return {
      id: 1,  // Singleton pattern
      last_updated_at: now,
      global_tension_score: globalTension,
      alert_level: alertLevel,
      active_event_count: activeEventCount,
      active_scenario_count: activeScenarioCount,
      active_event_frames: activeEventFrames,
      scenario_scores: scenarioScores,
      country_statuses: countryStatuses,
      calculation_method: 'cce_conflict_aggregation',
      data_quality: dataQuality,
      version: 2,  // Version 2 = CCE-based
    };
  } catch (error) {
    console.error('[getWorldStateFromCCE] Error:', error);
    return null;
  }
}

/**
 * Get CCE conflict summary for debugging/reporting
 */
export async function getCCEConflictSummary(): Promise<{
  total_conflicts: number;
  active_conflicts: number;
  high_tension_conflicts: number;
  recent_events_24h: number;
  top_tensions: Array<{
    conflict_id: string;
    actors: string;
    tension: number;
    heat: number;
    velocity: number;
  }>;
}> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);

  try {
    const total = await db.query(
      `SELECT COUNT(*) as count FROM conflicts_core`
    );

    const active = await db.query(
      `SELECT COUNT(*) as count FROM conflict_state_live WHERE tension > 0.2`
    );

    const highTension = await db.query(
      `SELECT COUNT(*) as count FROM conflict_state_live WHERE tension >= 0.7`
    );

    const recentEvents = await db.query(
      `SELECT COUNT(*) as count FROM conflict_events WHERE created_at >= ?`,
      [now - 86400]
    );

    const topConflicts = await db.query(
      `SELECT
         cc.id as conflict_id,
         cc.actor_a || ' ↔ ' || cc.actor_b as actors,
         csl.tension,
         csl.heat,
         csl.velocity
       FROM conflicts_core cc
       INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
       ORDER BY csl.tension DESC
       LIMIT 10`
    );

    return {
      total_conflicts: (total[0] as any)?.count || 0,
      active_conflicts: (active[0] as any)?.count || 0,
      high_tension_conflicts: (highTension[0] as any)?.count || 0,
      recent_events_24h: (recentEvents[0] as any)?.count || 0,
      top_tensions: topConflicts as any,
    };
  } catch (error) {
    console.error('[getCCEConflictSummary] Error:', error);
    return {
      total_conflicts: 0,
      active_conflicts: 0,
      high_tension_conflicts: 0,
      recent_events_24h: 0,
      top_tensions: [],
    };
  }
}
