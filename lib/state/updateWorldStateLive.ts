/**
 * Update World State Live
 *
 * Updates the singleton world_state_live table with current global metrics.
 * Triggered by new signal activations or on-demand API calls.
 *
 * Performance target: <50ms execution time
 */

import { getDB } from '@/lib/db/adapter';
import type { WorldStateLive } from '@/types/state';

interface EventFrame {
  id: number;
  severity: number;
  occurred_at: number;
}

interface SignalActivation {
  signal_code: string;
  confidence: number;
}

interface Scenario {
  code: string;
  probability: number;
}

/**
 * Calculate global tension score from active events and signals
 */
async function calculateGlobalTension(windowHours: number = 24): Promise<number> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (windowHours * 3600);

  try {
    // Count high-severity events (severity >= 7)
    const highSeverityEvents = await db.query(
      `SELECT COUNT(*) as count FROM event_frames
       WHERE occurred_at >= ? AND severity >= 7`,
      [windowStart]
    );
    const criticalEventCount = (highSeverityEvents[0] as any)?.count || 0;

    // Count active signals
    const activeSignals = await db.query(
      `SELECT COUNT(*) as count FROM signal_activations
       WHERE is_active = 1 AND activated_at >= ?`,
      [windowStart]
    );
    const activeSignalCount = (activeSignals[0] as any)?.count || 0;

    // Tension formula: weighted combination of events and signals
    // Normalized to 0-1 scale
    const eventTension = Math.min(1.0, criticalEventCount / 20);  // 20+ critical events = max tension
    const signalTension = Math.min(1.0, activeSignalCount / 15);  // 15+ active signals = max tension

    const globalTension = (eventTension * 0.6) + (signalTension * 0.4);

    return Math.min(1.0, Math.max(0.0, globalTension));
  } catch (error) {
    console.error('[calculateGlobalTension] Error:', error);
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
 * Update world_state_live singleton
 */
export async function updateWorldStateLive(): Promise<WorldStateLive> {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const windowHours = 24;
  const windowStart = now - (windowHours * 3600);

  try {
    // Calculate global tension
    const globalTension = await calculateGlobalTension(windowHours);
    const alertLevel = getAlertLevel(globalTension);

    // Fetch active event frames (last 24h)
    const activeEvents = await db.query(
      `SELECT id, severity, occurred_at FROM event_frames
       WHERE occurred_at >= ?
       ORDER BY occurred_at DESC`,
      [windowStart]
    ) as EventFrame[];

    const activeEventFrameIds = activeEvents.map(e => e.id);
    const activeEventCount = activeEvents.length;

    // Fetch scenario scores (if scenarios table exists)
    let scenarioScores: Record<string, number> = {};
    let activeScenarioCount = 0;

    try {
      const scenarios = await db.query(
        `SELECT code, probability FROM scenarios
         WHERE is_active = 1
         ORDER BY probability DESC`
      ) as Scenario[];

      for (const scenario of scenarios) {
        scenarioScores[scenario.code] = scenario.probability;
        if (scenario.probability >= 0.3) {
          activeScenarioCount++;
        }
      }
    } catch (err) {
      // Scenarios table might not exist or be empty
      console.log('[updateWorldStateLive] No active scenarios');
    }

    // Fetch country statuses (simplified - just count events per country)
    const countryStatuses: Record<string, string> = {};
    try {
      const countryEvents = await db.query(
        `SELECT json_extract(actors, '$.target') as country, COUNT(*) as count, AVG(severity) as avg_severity
         FROM event_frames
         WHERE occurred_at >= ? AND json_extract(actors, '$.target') IS NOT NULL
         GROUP BY json_extract(actors, '$.target')
         HAVING count >= 2
         ORDER BY avg_severity DESC`,
        [windowStart]
      );

      for (const row of countryEvents as any[]) {
        if (!row.country) continue;
        const avgSeverity = row.avg_severity || 0;
        if (avgSeverity >= 7) {
          countryStatuses[row.country] = 'critical';
        } else if (avgSeverity >= 5) {
          countryStatuses[row.country] = 'heightened';
        } else {
          countryStatuses[row.country] = 'elevated';
        }
      }
    } catch (err) {
      console.log('[updateWorldStateLive] Error fetching country statuses:', err);
    }

    // Prepare update data
    const updateData = {
      last_updated_at: now,
      global_tension_score: globalTension,
      alert_level: alertLevel,
      active_event_count: activeEventCount,
      active_scenario_count: activeScenarioCount,
      active_event_frames: JSON.stringify(activeEventFrameIds),
      scenario_scores: JSON.stringify(scenarioScores),
      country_statuses: JSON.stringify(countryStatuses),
      version: 0,  // Will be incremented by SQL
    };

    // Update singleton (id = 1)
    // Use raw SQL to increment version atomically
    await db.exec(
      `UPDATE world_state_live
       SET last_updated_at = ?,
           global_tension_score = ?,
           alert_level = ?,
           active_event_count = ?,
           active_scenario_count = ?,
           active_event_frames = ?,
           scenario_scores = ?,
           country_statuses = ?,
           version = version + 1
       WHERE id = 1`,
      [
        updateData.last_updated_at,
        updateData.global_tension_score,
        updateData.alert_level,
        updateData.active_event_count,
        updateData.active_scenario_count,
        updateData.active_event_frames,
        updateData.scenario_scores,
        updateData.country_statuses,
      ]
    );

    // Fetch updated state
    const updatedState = await db.get('world_state_live', 1) as WorldStateLive;

    // Parse JSON fields
    if (typeof updatedState.active_event_frames === 'string') {
      updatedState.active_event_frames = JSON.parse(updatedState.active_event_frames);
    }
    if (typeof updatedState.scenario_scores === 'string') {
      updatedState.scenario_scores = JSON.parse(updatedState.scenario_scores);
    }
    if (typeof updatedState.country_statuses === 'string') {
      updatedState.country_statuses = JSON.parse(updatedState.country_statuses);
    }

    console.log(`[updateWorldStateLive] Updated: tension=${globalTension.toFixed(2)}, alert=${alertLevel}, events=${activeEventCount}`);

    return updatedState;
  } catch (error) {
    console.error('[updateWorldStateLive] Error:', error);
    throw error;
  }
}

/**
 * Get current world state (read-only)
 */
export async function getWorldStateLive(): Promise<WorldStateLive | null> {
  try {
    const db = getDB();
    const state = await db.get('world_state_live', 1) as WorldStateLive;

    if (!state) return null;

    // Parse JSON fields
    if (typeof state.active_event_frames === 'string') {
      state.active_event_frames = JSON.parse(state.active_event_frames);
    }
    if (typeof state.scenario_scores === 'string') {
      state.scenario_scores = JSON.parse(state.scenario_scores);
    }
    if (typeof state.country_statuses === 'string') {
      state.country_statuses = JSON.parse(state.country_statuses);
    }

    return state;
  } catch (error) {
    console.error('[getWorldStateLive] Error:', error);
    return null;
  }
}
