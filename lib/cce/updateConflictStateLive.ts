/**
 * CCE State Calculator
 *
 * Calculates real-time conflict state (tension, heat, velocity) with decay.
 *
 * Algorithm:
 * 1. For each conflict in conflicts_core:
 *    - Fetch recent conflict_events (last 7 days)
 *    - Calculate tension (baseline + recent activity)
 *    - Calculate heat (activity intensity with exponential decay)
 *    - Calculate velocity (rate of change)
 * 2. Update conflict_state_live table
 *
 * Metrics:
 * - Tension: Base hostility + recent escalation (0.0 to 1.0)
 * - Heat: Recent activity intensity with decay (0.0 to 1.0)
 * - Velocity: Rate of change in last 24h vs previous 24h (0.0 to 1.0)
 *
 * Decay Functions:
 * - Heat: Exponential decay, half-life = 48 hours
 * - Tension: Slower decay from peaks, half-life = 7 days
 */

import { getDB } from '../db/adapter';

const ONE_DAY = 24 * 60 * 60; // 24 hours in seconds
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

interface ConflictState {
  conflict_id: string;
  tension: number;
  heat: number;
  velocity: number;
  last_event_at: number | null;
  top_drivers: string; // JSON array
  updated_at: number;
}

/**
 * Calculate exponential decay factor
 * decay = 0.5^(time_elapsed / half_life)
 */
function decayFactor(timeElapsed: number, halfLife: number): number {
  return Math.pow(0.5, timeElapsed / halfLife);
}

/**
 * Calculate heat from recent events with exponential decay
 */
function calculateHeat(events: ConflictEvent[], currentTime: number): number {
  if (events.length === 0) return 0.0;

  let totalHeat = 0.0;

  for (const event of events) {
    const timeElapsed = currentTime - event.window_start;
    const decay = decayFactor(timeElapsed, HEAT_HALF_LIFE);

    // Heat contribution = impact_score * severity_weight * decay
    const severityWeight = event.severity / 5.0; // Normalize to 0-1
    const heatContribution = event.impact_score * severityWeight * decay;

    totalHeat += heatContribution;
  }

  // Normalize to 0-1 range (cap at 1.0)
  return Math.min(1.0, totalHeat);
}

/**
 * Calculate tension from base + recent escalation with decay
 */
function calculateTension(
  baseHostility: number,
  baseTension: number,
  events: ConflictEvent[],
  currentTime: number
): number {
  if (events.length === 0) {
    // No recent activity, return base tension
    return baseTension;
  }

  // Find highest severity event in last 7 days
  const recentEvents = events.filter(e => currentTime - e.window_start <= SEVEN_DAYS);

  if (recentEvents.length === 0) {
    return baseTension;
  }

  const maxSeverity = Math.max(...recentEvents.map(e => e.severity));
  const maxImpact = Math.max(...recentEvents.map(e => e.impact_score));
  const lastEventTime = Math.max(...recentEvents.map(e => e.window_start));

  // Escalation factor from recent activity
  const escalationFactor = (maxSeverity / 5.0) * maxImpact;

  // Apply decay to escalation
  const timeElapsed = currentTime - lastEventTime;
  const decay = decayFactor(timeElapsed, TENSION_HALF_LIFE);

  // Tension = base + (escalation * decay), weighted by base hostility
  const escalation = escalationFactor * decay * baseHostility;
  const tension = Math.min(1.0, baseTension + escalation * 0.5); // 0.5 weight to prevent over-scaling

  return tension;
}

/**
 * Calculate velocity (rate of change)
 * Compares activity in last 24h vs previous 24h
 */
function calculateVelocity(events: ConflictEvent[], currentTime: number): number {
  const last24h = events.filter(
    e => currentTime - e.window_start <= ONE_DAY
  );
  const prev24h = events.filter(
    e => currentTime - e.window_start > ONE_DAY && currentTime - e.window_start <= 2 * ONE_DAY
  );

  // Calculate activity scores
  const last24hActivity = last24h.reduce((sum, e) => sum + e.impact_score, 0);
  const prev24hActivity = prev24h.reduce((sum, e) => sum + e.impact_score, 0);

  if (prev24hActivity === 0) {
    // No previous activity to compare
    return last24hActivity > 0 ? 0.5 : 0.0; // Baseline velocity if new activity
  }

  // Velocity = (current - previous) / previous, normalized to 0-1
  const change = last24hActivity - prev24hActivity;
  const velocity = change / prev24hActivity;

  // Map to 0-1 range (positive change = higher velocity)
  // velocity > 0 means acceleration, < 0 means deceleration
  const normalized = Math.max(0.0, Math.min(1.0, 0.5 + velocity * 0.5));

  return normalized;
}

/**
 * Get top event drivers (most impactful events)
 */
function getTopDrivers(events: ConflictEvent[], limit: number = 3): any[] {
  // Sort by impact_score descending
  const sorted = [...events].sort((a, b) => b.impact_score - a.impact_score);

  return sorted.slice(0, limit).map(e => ({
    signal: e.event_type,
    evidence_urls: JSON.parse(e.evidence_urls),
    impact: e.impact_score,
    timestamp: e.window_start,
  }));
}

/**
 * Update conflict state for a single conflict
 */
async function updateConflictState(conflict: Conflict, currentTime: number): Promise<void> {
  const db = getDB();

  // Fetch recent conflict_events (last 7 days)
  const lookbackTime = currentTime - SEVEN_DAYS;
  const events = await db.query(
    `SELECT * FROM conflict_events
     WHERE conflict_id = ? AND window_start >= ?
     ORDER BY window_start DESC`,
    [conflict.id, lookbackTime]
  ) as ConflictEvent[];

  // Calculate metrics
  const tension = calculateTension(
    conflict.base_hostility,
    conflict.base_tension,
    events,
    currentTime
  );
  const heat = calculateHeat(events, currentTime);
  const velocity = calculateVelocity(events, currentTime);

  // Get last event timestamp
  const lastEventAt = events.length > 0 ? Math.max(...events.map(e => e.window_start)) : null;

  // Get top drivers
  const topDrivers = getTopDrivers(events);

  // Create state object
  const state: ConflictState = {
    conflict_id: conflict.id,
    tension,
    heat,
    velocity,
    last_event_at: lastEventAt,
    top_drivers: JSON.stringify(topDrivers),
    updated_at: currentTime,
  };

  // Upsert into conflict_state_live
  const existing = await db.query(
    `SELECT conflict_id FROM conflict_state_live WHERE conflict_id = ?`,
    [conflict.id]
  );

  if (existing && existing.length > 0) {
    // Update existing
    await db.exec(
      `UPDATE conflict_state_live
       SET tension = ?, heat = ?, velocity = ?, last_event_at = ?,
           top_drivers = ?, updated_at = ?
       WHERE conflict_id = ?`,
      [tension, heat, velocity, lastEventAt, state.top_drivers, currentTime, conflict.id]
    );
  } else {
    // Insert new
    await db.insert('conflict_state_live', state);
  }

  console.log(`[updateConflictState] ${conflict.id}: tension=${tension.toFixed(2)}, heat=${heat.toFixed(2)}, velocity=${velocity.toFixed(2)}`);
}

/**
 * Update all conflict states
 *
 * @returns Number of conflicts updated
 */
export async function updateConflictStateLive(): Promise<{ updated: number }> {
  const db = getDB();
  const currentTime = Math.floor(Date.now() / 1000);

  console.log(`[updateConflictStateLive] Starting state update at ${currentTime}`);

  // Fetch all conflicts
  const conflicts = await db.all('conflicts_core') as Conflict[];

  console.log(`[updateConflictStateLive] Found ${conflicts.length} conflicts`);

  let updated = 0;

  for (const conflict of conflicts) {
    try {
      await updateConflictState(conflict, currentTime);
      updated++;
    } catch (error) {
      console.error(`[updateConflictStateLive] Failed to update ${conflict.id}:`, error);
    }
  }

  console.log(`[updateConflictStateLive] Updated ${updated} conflict states`);

  return { updated };
}
