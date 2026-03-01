/**
 * CCE v2 State Calculator
 *
 * Extends v1 state calculator with v2 metrics:
 * - momentum, pressure, instability
 * - theatre_rank (calculated by updateTheatreStateLive)
 * - last_major_change_at (timestamp detection)
 *
 * Algorithm:
 * 1. Calculate v1 metrics (tension, heat, velocity) using existing functions
 * 2. Calculate v2 metrics (momentum, pressure, instability)
 * 3. Detect major changes (tension delta >0.15 or heat delta >0.20)
 * 4. Upsert conflict_state_live with all 6 metrics atomically
 */

import { getDB } from '../db/adapter';
import { calculateAllV2Metrics } from './calculateV2Metrics';

const ONE_DAY = 24 * 60 * 60; // seconds
const SEVEN_DAYS = 7 * ONE_DAY;
const HEAT_HALF_LIFE = 2 * ONE_DAY; // 48 hours
const TENSION_HALF_LIFE = 7 * ONE_DAY; // 7 days

interface Conflict {
  id: string;
  actor_a: string;
  actor_b: string;
  theatre: string;
  base_hostility: number;
  base_tension: number;
  importance: number;
}

interface ConflictEvent {
  id: string;
  conflict_id: string;
  window_start: number;
  event_type: string;
  severity: number;
  impact_score: number;
  evidence_urls: string;
}

/**
 * Exponential decay factor
 */
function decayFactor(timeElapsed: number, halfLife: number): number {
  return Math.pow(0.5, timeElapsed / halfLife);
}

/**
 * Calculate heat from recent events with exponential decay (v1)
 */
function calculateHeat(events: ConflictEvent[], currentTime: number): number {
  if (events.length === 0) return 0.0;

  let totalHeat = 0.0;

  for (const event of events) {
    const timeElapsed = currentTime - event.window_start;
    const decay = decayFactor(timeElapsed, HEAT_HALF_LIFE);

    const severityWeight = event.severity / 5.0;
    const heatContribution = event.impact_score * severityWeight * decay;

    totalHeat += heatContribution;
  }

  return Math.min(1.0, totalHeat);
}

/**
 * Calculate tension from base + recent escalation with decay (v1)
 */
function calculateTension(
  baseHostility: number,
  baseTension: number,
  events: ConflictEvent[],
  currentTime: number
): number {
  if (events.length === 0) {
    return baseTension;
  }

  const recentEvents = events.filter(e => currentTime - e.window_start <= SEVEN_DAYS);

  if (recentEvents.length === 0) {
    return baseTension;
  }

  const maxSeverity = Math.max(...recentEvents.map(e => e.severity));
  const maxImpact = Math.max(...recentEvents.map(e => e.impact_score));
  const lastEventTime = Math.max(...recentEvents.map(e => e.window_start));

  const escalationFactor = (maxSeverity / 5.0) * maxImpact;

  const timeElapsed = currentTime - lastEventTime;
  const decay = decayFactor(timeElapsed, TENSION_HALF_LIFE);

  const escalation = escalationFactor * decay * baseHostility;
  const tension = Math.min(1.0, baseTension + escalation * 0.5);

  return tension;
}

/**
 * Calculate velocity (rate of change) (v1)
 */
function calculateVelocity(events: ConflictEvent[], currentTime: number): number {
  const last24h = events.filter(
    e => currentTime - e.window_start <= ONE_DAY
  );
  const prev24h = events.filter(
    e => currentTime - e.window_start > ONE_DAY && currentTime - e.window_start <= 2 * ONE_DAY
  );

  const last24hActivity = last24h.reduce((sum, e) => sum + e.impact_score, 0);
  const prev24hActivity = prev24h.reduce((sum, e) => sum + e.impact_score, 0);

  if (prev24hActivity === 0) {
    return last24hActivity > 0 ? 0.5 : 0.0;
  }

  const change = last24hActivity - prev24hActivity;
  const velocity = change / prev24hActivity;

  return Math.max(0.0, Math.min(1.0, 0.5 + velocity * 0.5));
}

/**
 * Get top event drivers (v1)
 */
function getTopDrivers(events: ConflictEvent[], limit: number = 3): any[] {
  const sorted = [...events].sort((a, b) => b.impact_score - a.impact_score);

  return sorted.slice(0, limit).map(e => ({
    signal: e.event_type,
    evidence_urls: JSON.parse(e.evidence_urls || '[]'),
    impact: e.impact_score,
    timestamp: e.window_start,
  }));
}

/**
 * Determine if a change is "major" (threshold-based)
 */
function isMajorChange(
  oldTension: number,
  newTension: number,
  oldHeat: number,
  newHeat: number
): boolean {
  const tensionDelta = Math.abs(newTension - oldTension);
  const heatDelta = Math.abs(newHeat - oldHeat);

  // Major change = tension jump >0.15 OR heat jump >0.20
  return tensionDelta > 0.15 || heatDelta > 0.20;
}

/**
 * Update conflict state with v2 metrics
 */
async function updateConflictStateV2(conflict: Conflict, currentTime: number): Promise<void> {
  const db = getDB();
  const lookbackTime = currentTime - SEVEN_DAYS;

  // Fetch recent conflict_events (last 7 days)
  const events = await db.query(
    `SELECT * FROM conflict_events
     WHERE conflict_id = ? AND window_start >= ?
     ORDER BY window_start DESC`,
    [conflict.id, lookbackTime]
  ) as ConflictEvent[];

  // Calculate v1 metrics
  const tension = calculateTension(
    conflict.base_hostility,
    conflict.base_tension,
    events,
    currentTime
  );
  const heat = calculateHeat(events, currentTime);
  const velocity = calculateVelocity(events, currentTime);

  // Calculate v2 metrics
  const { momentum, pressure, instability } = await calculateAllV2Metrics(
    conflict.id,
    { tension, heat, velocity },
    { importance: conflict.importance, base_tension: conflict.base_tension },
    currentTime
  );

  // Get last event timestamp
  const lastEventAt = events.length > 0 ? Math.max(...events.map(e => e.window_start)) : null;

  // Get top drivers
  const topDrivers = getTopDrivers(events);

  // Check if this is a major change
  const existing = await db.query(
    `SELECT tension, heat, last_major_change_at FROM conflict_state_live
     WHERE conflict_id = ?`,
    [conflict.id]
  );

  let lastMajorChangeAt: number | null = null;
  if (existing && existing.length > 0) {
    const oldState = existing[0] as any;
    lastMajorChangeAt = oldState.last_major_change_at;

    if (isMajorChange(oldState.tension, tension, oldState.heat, heat)) {
      lastMajorChangeAt = currentTime;
    }
  }

  // Upsert conflict_state_live
  if (existing && existing.length > 0) {
    // Update existing
    await db.exec(
      `UPDATE conflict_state_live
       SET tension = ?, heat = ?, velocity = ?,
           momentum = ?, pressure = ?, instability = ?,
           last_event_at = ?, top_drivers = ?,
           last_major_change_at = ?, updated_at = ?
       WHERE conflict_id = ?`,
      [
        tension, heat, velocity,
        momentum, pressure, instability,
        lastEventAt, JSON.stringify(topDrivers),
        lastMajorChangeAt, currentTime,
        conflict.id
      ]
    );
  } else {
    // Insert new
    await db.insert('conflict_state_live', {
      conflict_id: conflict.id,
      tension,
      heat,
      velocity,
      momentum,
      pressure,
      instability,
      last_event_at: lastEventAt,
      top_drivers: JSON.stringify(topDrivers),
      theatre_rank: 0,  // Will be calculated in updateTheatreStateLive
      last_major_change_at: currentTime,
      updated_at: currentTime
    });
  }

  console.log(
    `[updateConflictStateV2] ${conflict.id}: ` +
    `tension=${tension.toFixed(2)}, momentum=${momentum.toFixed(2)}, ` +
    `pressure=${pressure.toFixed(2)}, instability=${instability.toFixed(2)}`
  );
}

/**
 * Update all conflict states with v2 metrics
 *
 * @returns Number of conflicts updated
 */
export async function updateConflictStateLiveV2(): Promise<{ updated: number }> {
  const db = getDB();
  const currentTime = Math.floor(Date.now() / 1000);

  console.log(`[updateConflictStateLiveV2] Starting v2 state update at ${currentTime}`);

  const conflicts = await db.all('conflicts_core') as Conflict[];
  console.log(`[updateConflictStateLiveV2] Found ${conflicts.length} conflicts`);

  let updated = 0;
  for (const conflict of conflicts) {
    try {
      await updateConflictStateV2(conflict, currentTime);
      updated++;
    } catch (error) {
      console.error(`[updateConflictStateLiveV2] Failed to update ${conflict.id}:`, error);
    }
  }

  console.log(`[updateConflictStateLiveV2] Updated ${updated} conflict states`);
  return { updated };
}
