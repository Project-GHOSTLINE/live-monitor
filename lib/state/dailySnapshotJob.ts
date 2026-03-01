/**
 * Daily Snapshot Job
 *
 * Creates daily snapshots of world state for historical tracking.
 * Should be run once per day at midnight UTC via Vercel Cron.
 *
 * Features:
 * - Aggregates event counts by type and severity
 * - Captures scenario scores at end of day
 * - Records country power rankings
 * - Identifies active conflicts
 */

import { getDB } from '@/lib/db/adapter';
import { getWorldStateLive } from './updateWorldStateLive';
import { getHostileRelations } from './updateRelationEdges';
import { computeMultipleReadiness } from './computeReadinessBreakdown';
import type { WorldStateDaily } from '@/types/state';

/**
 * Get YYYYMMDD date integer for a given timestamp
 */
function getDateInteger(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`);
}

/**
 * Get major countries to track
 */
const TRACKED_COUNTRIES = [
  'USA', 'RUS', 'CHN', 'GBR', 'FRA', 'DEU', 'IRN', 'ISR',
  'SAU', 'TUR', 'UKR', 'IND', 'PAK', 'KOR', 'JPN'
];

/**
 * Create daily snapshot
 */
export async function createDailySnapshot(): Promise<WorldStateDaily> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const today = getDateInteger(now);
  const dayStart = now - (24 * 3600);  // 24 hours ago

  try {
    console.log(`[createDailySnapshot] Creating snapshot for date ${today}`);

    // Check if snapshot already exists
    const existing = await db.query(
      `SELECT id FROM world_state_daily WHERE date = ? LIMIT 1`,
      [today]
    );

    if (existing.length > 0) {
      console.log(`[createDailySnapshot] Snapshot already exists for ${today}`);
      return await db.get('world_state_daily', (existing[0] as any).id) as WorldStateDaily;
    }

    // Get current world state
    const worldState = await getWorldStateLive();
    if (!worldState) {
      throw new Error('World state not found');
    }

    // Count events in last 24h by type
    const eventsByType = await db.query(
      `SELECT event_type, COUNT(*) as count
       FROM event_frames
       WHERE occurred_at >= ?
       GROUP BY event_type`,
      [dayStart]
    ) as Array<{ event_type: string; count: number }>;

    const eventCountsByType: Record<string, number> = {};
    for (const row of eventsByType) {
      eventCountsByType[row.event_type] = row.count;
    }

    // Count events by severity level
    const eventsBySeverity = await db.query(
      `SELECT
         CASE
           WHEN severity >= 8 THEN 'critical'
           WHEN severity >= 6 THEN 'high'
           WHEN severity >= 4 THEN 'medium'
           ELSE 'low'
         END as severity_level,
         COUNT(*) as count
       FROM event_frames
       WHERE occurred_at >= ?
       GROUP BY severity_level`,
      [dayStart]
    ) as Array<{ severity_level: string; count: number }>;

    const eventCountsBySeverity: Record<string, number> = {};
    for (const row of eventsBySeverity) {
      eventCountsBySeverity[row.severity_level] = row.count;
    }

    // Get total event count
    const totalEvents = Object.values(eventCountsByType).reduce((sum, count) => sum + count, 0);

    // Get active scenarios
    let activeScenarios: string[] = [];
    let scenarioScores: Record<string, number> = {};

    try {
      const scenarios = await db.query(
        `SELECT code, probability FROM scenarios
         WHERE is_active = 1 AND probability >= 0.2
         ORDER BY probability DESC`
      ) as Array<{ code: string; probability: number }>;

      for (const scenario of scenarios) {
        activeScenarios.push(scenario.code);
        scenarioScores[scenario.code] = scenario.probability;
      }
    } catch (err) {
      console.log('[createDailySnapshot] No active scenarios');
    }

    // Calculate country power rankings (using readiness scores)
    const countryPowerSnapshot: Record<string, number> = {};
    const readiness = await computeMultipleReadiness(TRACKED_COUNTRIES, {
      windowHours: 24,
      minConfidence: 0.3,
    });

    for (const [country, scores] of Object.entries(readiness)) {
      // Normalize overall readiness to 0-1 scale
      countryPowerSnapshot[country] = scores.overall / 100;
    }

    // Identify active conflicts (hostile relations with high strength)
    const hostileRelations = await getHostileRelations(0.6);
    const activeConflicts = hostileRelations.map(edge => ({
      countries: [edge.entity_a, edge.entity_b],
      intensity: edge.relation_strength,
    }));

    // Prepare snapshot data
    const snapshotData: Omit<WorldStateDaily, 'id'> = {
      date: today,
      global_tension_score: worldState.global_tension_score,
      alert_level: worldState.alert_level,
      total_events: totalEvents,
      event_counts_by_type: eventCountsByType,
      event_counts_by_severity: eventCountsBySeverity,
      active_scenarios: activeScenarios,
      scenario_scores: scenarioScores,
      country_power_snapshot: countryPowerSnapshot,
      active_conflicts: activeConflicts,
      calculated_at: now,
      snapshot_source: 'daily_aggregation',
      data_quality: 0.9,
    };

    // Insert snapshot
    await db.exec(
      `INSERT INTO world_state_daily
       (date, global_tension_score, alert_level, total_events,
        event_counts_by_type, event_counts_by_severity, active_scenarios,
        scenario_scores, country_power_snapshot, active_conflicts,
        calculated_at, snapshot_source, data_quality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshotData.date,
        snapshotData.global_tension_score,
        snapshotData.alert_level,
        snapshotData.total_events,
        JSON.stringify(snapshotData.event_counts_by_type),
        JSON.stringify(snapshotData.event_counts_by_severity),
        JSON.stringify(snapshotData.active_scenarios),
        JSON.stringify(snapshotData.scenario_scores),
        JSON.stringify(snapshotData.country_power_snapshot),
        JSON.stringify(snapshotData.active_conflicts),
        snapshotData.calculated_at,
        snapshotData.snapshot_source,
        snapshotData.data_quality,
      ]
    );

    console.log(`[createDailySnapshot] Snapshot created: date=${today}, events=${totalEvents}, tension=${worldState.global_tension_score.toFixed(2)}`);

    // Fetch created snapshot
    const created = await db.query(
      `SELECT * FROM world_state_daily WHERE date = ? ORDER BY id DESC LIMIT 1`,
      [today]
    );

    const snapshot = created[0] as any;

    // Parse JSON fields
    return {
      ...snapshot,
      event_counts_by_type: JSON.parse(snapshot.event_counts_by_type || '{}'),
      event_counts_by_severity: JSON.parse(snapshot.event_counts_by_severity || '{}'),
      active_scenarios: JSON.parse(snapshot.active_scenarios || '[]'),
      scenario_scores: JSON.parse(snapshot.scenario_scores || '{}'),
      country_power_snapshot: JSON.parse(snapshot.country_power_snapshot || '{}'),
      active_conflicts: JSON.parse(snapshot.active_conflicts || '[]'),
    };
  } catch (error) {
    console.error('[createDailySnapshot] Error:', error);
    throw error;
  }
}

/**
 * Get daily snapshots for a date range
 */
export async function getDailySnapshots(options: {
  startDate?: number;  // YYYYMMDD
  endDate?: number;    // YYYYMMDD
  limit?: number;
} = {}): Promise<WorldStateDaily[]> {
  const {
    limit = 30,
  } = options;

  const db = getDB();

  try {
    let query = `SELECT * FROM world_state_daily`;
    const params: any[] = [];

    if (options.startDate && options.endDate) {
      query += ` WHERE date >= ? AND date <= ?`;
      params.push(options.startDate, options.endDate);
    } else if (options.startDate) {
      query += ` WHERE date >= ?`;
      params.push(options.startDate);
    } else if (options.endDate) {
      query += ` WHERE date <= ?`;
      params.push(options.endDate);
    }

    query += ` ORDER BY date DESC LIMIT ?`;
    params.push(limit);

    const snapshots = await db.query(query, params) as any[];

    // Parse JSON fields
    return snapshots.map(snapshot => ({
      ...snapshot,
      event_counts_by_type: JSON.parse(snapshot.event_counts_by_type || '{}'),
      event_counts_by_severity: JSON.parse(snapshot.event_counts_by_severity || '{}'),
      active_scenarios: JSON.parse(snapshot.active_scenarios || '[]'),
      scenario_scores: JSON.parse(snapshot.scenario_scores || '{}'),
      country_power_snapshot: JSON.parse(snapshot.country_power_snapshot || '{}'),
      active_conflicts: JSON.parse(snapshot.active_conflicts || '[]'),
    }));
  } catch (error) {
    console.error('[getDailySnapshots] Error:', error);
    return [];
  }
}

/**
 * Clean up old snapshots (keep last N days)
 */
export async function cleanupOldSnapshots(keepDays: number = 90): Promise<number> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const cutoffDate = getDateInteger(now - (keepDays * 24 * 3600));

  try {
    await db.exec(
      `DELETE FROM world_state_daily WHERE date < ?`,
      [cutoffDate]
    );

    const deleted = await db.query(
      `SELECT COUNT(*) as count FROM world_state_daily WHERE date < ?`,
      [cutoffDate]
    );

    const deletedCount = (deleted[0] as any)?.count || 0;
    console.log(`[cleanupOldSnapshots] Deleted ${deletedCount} snapshots older than ${cutoffDate}`);

    return deletedCount;
  } catch (error) {
    console.error('[cleanupOldSnapshots] Error:', error);
    return 0;
  }
}
