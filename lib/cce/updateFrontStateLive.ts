/**
 * CCE v2 Front State Calculator
 *
 * Updates front_state_live based on recent conflict events in front zones.
 *
 * Calculates:
 * - Control distribution (actor → 0..1, sum = 1.0) [SIM STATE]
 * - Intensity (activity level)
 * - Last event timestamp
 *
 * NOTE: Control shifts are simulated state derived from event patterns,
 * not real tactical ground control. Always labeled as [SIM STATE] in UI.
 */

import { getDB } from '../db/adapter';

interface FrontLine {
  id: string;
  theatre: string;
  actors: string;  // JSON array
  base_control: string;  // JSON object
  zone_id: string | null;
}

interface ConflictEvent {
  window_start: number;
  severity: number;
  impact_score: number;
}

/**
 * Calculate control shift from events
 *
 * Events in last 24h shift control towards event initiators.
 * This is SIMULATED STATE, not real ground control.
 */
function calculateControlShift(
  baseControl: Record<string, number>,
  events: ConflictEvent[],
  actors: string[]
): Record<string, number> {
  if (events.length === 0) {
    return baseControl;
  }

  // Calculate total impact
  const totalImpact = events.reduce((sum, e) => sum + e.impact_score, 0);

  // Shift control proportionally (max 10% shift per update)
  const shiftFactor = Math.min(0.1, totalImpact * 0.05);

  // For simplicity, distribute shift evenly among actors
  // In production, this could use event initiator attribution
  const shiftedControl: Record<string, number> = { ...baseControl };

  // Apply small random-walk shifts (simulates activity impact)
  for (const actor of actors) {
    if (shiftedControl[actor] !== undefined) {
      // Slight perturbation based on activity
      const perturbation = (Math.random() - 0.5) * shiftFactor;
      shiftedControl[actor] = Math.max(0.0, Math.min(1.0, shiftedControl[actor] + perturbation));
    }
  }

  // Normalize to sum = 1.0
  const sum = Object.values(shiftedControl).reduce((s, v) => s + v, 0);
  if (sum > 0) {
    for (const actor of Object.keys(shiftedControl)) {
      shiftedControl[actor] /= sum;
    }
  }

  return shiftedControl;
}

/**
 * Calculate front intensity from recent events
 */
function calculateIntensity(events: ConflictEvent[]): number {
  if (events.length === 0) return 0.0;

  // Intensity = average impact * event density
  const avgImpact = events.reduce((sum, e) => sum + e.impact_score, 0) / events.length;
  const density = Math.min(1.0, events.length / 10);  // 10+ events = max density

  return Math.min(1.0, avgImpact * 0.7 + density * 0.3);
}

/**
 * Update front state for a specific front
 */
async function updateFrontState(front: FrontLine, currentTime: number): Promise<void> {
  const db = getDB();

  // Parse front data
  const actors = JSON.parse(front.actors) as string[];
  const baseControl = JSON.parse(front.base_control) as Record<string, number>;

  // Get recent conflict events in this front (last 24h)
  // Match by front actors in conflicts
  const last24h = currentTime - (24 * 3600);

  const placeholders = actors.map(() => '?').join(',');
  const events = await db.query(
    `SELECT ce.window_start, ce.severity, ce.impact_score
     FROM conflict_events ce
     INNER JOIN conflicts_core cc ON ce.conflict_id = cc.id
     WHERE (cc.actor_a IN (${placeholders}) OR cc.actor_b IN (${placeholders}))
       AND cc.theatre = ?
       AND ce.window_start >= ?
     ORDER BY ce.window_start DESC`,
    [...actors, ...actors, front.theatre, last24h]
  ) as ConflictEvent[];

  // Calculate metrics
  const control = calculateControlShift(baseControl, events, actors);
  const intensity = calculateIntensity(events);
  const lastEventAt = events.length > 0 ? Math.max(...events.map(e => e.window_start)) : null;

  // Update front_state_live
  await db.exec(
    `INSERT OR REPLACE INTO front_state_live
     (front_id, control, intensity, last_event_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      front.id,
      JSON.stringify(control),
      intensity,
      lastEventAt,
      currentTime
    ]
  );

  console.log(
    `[updateFrontState] ${front.id}: intensity=${intensity.toFixed(2)}, ` +
    `${events.length} events (24h)`
  );
}

/**
 * Update all front states
 *
 * @returns Number of fronts updated
 */
export async function updateFrontStateLive(): Promise<{ updated: number }> {
  const db = getDB();
  const currentTime = Math.floor(Date.now() / 1000);

  console.log(`[updateFrontStateLive] Starting front state update at ${currentTime}`);

  // Get all front lines
  const fronts = await db.all('front_lines') as FrontLine[];

  if (fronts.length === 0) {
    console.log(`[updateFrontStateLive] No front lines found, skipping`);
    return { updated: 0 };
  }

  let updated = 0;
  for (const front of fronts) {
    try {
      await updateFrontState(front, currentTime);
      updated++;
    } catch (error) {
      console.error(`[updateFrontStateLive] Failed to update ${front.id}:`, error);
    }
  }

  console.log(`[updateFrontStateLive] Updated ${updated} fronts`);
  return { updated };
}
