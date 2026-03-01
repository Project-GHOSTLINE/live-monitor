/**
 * CCE v2 Theatre Aggregation
 *
 * Aggregates conflict metrics by theatre and updates theatre_state_live.
 *
 * Calculates:
 * - Theatre-level tension/momentum/heat/velocity (weighted by importance)
 * - Dominant actors (top 5 by involvement)
 * - Active fronts (front_lines in that theatre)
 * - Conflict count
 * - Theatre rank for each conflict (sorted by pressure)
 */

import { getDB } from '../db/adapter';

interface ConflictState {
  conflict_id: string;
  tension: number;
  heat: number;
  velocity: number;
  momentum: number;
  pressure: number;
}

interface ConflictCore {
  id: string;
  actor_a: string;
  actor_b: string;
  theatre: string;
  importance: number;
}

/**
 * Calculate weighted average for theatre metric
 */
function weightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length === 0) return 0.0;

  let totalWeighted = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i++) {
    totalWeighted += values[i] * weights[i];
    totalWeight += weights[i];
  }

  return totalWeight > 0 ? totalWeighted / totalWeight : 0.0;
}

/**
 * Get dominant actors for theatre
 */
function getDominantActors(conflicts: ConflictCore[]): string[] {
  const actorCount = new Map<string, number>();

  for (const conflict of conflicts) {
    actorCount.set(conflict.actor_a, (actorCount.get(conflict.actor_a) || 0) + 1);
    actorCount.set(conflict.actor_b, (actorCount.get(conflict.actor_b) || 0) + 1);
  }

  // Sort by involvement count, return top 5
  return [...actorCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([actor]) => actor);
}

/**
 * Update theatre state for a specific theatre
 */
async function updateTheatreState(theatre: string, currentTime: number): Promise<void> {
  const db = getDB();

  // Fetch all conflicts in this theatre with their live state
  const conflicts = await db.query(
    `SELECT
       cc.id, cc.actor_a, cc.actor_b, cc.theatre, cc.importance,
       csl.tension, csl.heat, csl.velocity, csl.momentum, csl.pressure
     FROM conflicts_core cc
     INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
     WHERE cc.theatre = ?
     ORDER BY csl.pressure DESC`,
    [theatre]
  ) as (ConflictCore & ConflictState)[];

  if (conflicts.length === 0) {
    console.log(`[updateTheatreState] No active conflicts in ${theatre}, skipping`);
    return;
  }

  // Calculate weighted theatre metrics
  const importances = conflicts.map(c => c.importance);
  const tensions = conflicts.map(c => c.tension);
  const heats = conflicts.map(c => c.heat);
  const velocities = conflicts.map(c => c.velocity);
  const momentums = conflicts.map(c => c.momentum);

  const theatreTension = weightedAverage(tensions, importances);
  const theatreHeat = weightedAverage(heats, importances);
  const theatreVelocity = weightedAverage(velocities, importances);
  const theatreMomentum = weightedAverage(momentums, importances);

  // Get dominant actors
  const dominantActors = getDominantActors(conflicts);

  // Get active fronts in this theatre
  const fronts = await db.query(
    `SELECT id FROM front_lines WHERE theatre = ?`,
    [theatre]
  );
  const activeFronts = fronts.map((f: any) => f.id);

  // Update theatre_state_live
  const existing = await db.query(
    `SELECT theatre FROM theatre_state_live WHERE theatre = ?`,
    [theatre]
  );

  if (existing && existing.length > 0) {
    await db.exec(
      `UPDATE theatre_state_live
       SET tension = ?, momentum = ?, heat = ?, velocity = ?,
           dominant_actors = ?, active_fronts = ?,
           conflict_count = ?, updated_at = ?
       WHERE theatre = ?`,
      [
        theatreTension, theatreMomentum, theatreHeat, theatreVelocity,
        JSON.stringify(dominantActors), JSON.stringify(activeFronts),
        conflicts.length, currentTime,
        theatre
      ]
    );
  } else {
    await db.insert('theatre_state_live', {
      theatre,
      tension: theatreTension,
      momentum: theatreMomentum,
      heat: theatreHeat,
      velocity: theatreVelocity,
      dominant_actors: JSON.stringify(dominantActors),
      active_fronts: JSON.stringify(activeFronts),
      conflict_count: conflicts.length,
      updated_at: currentTime
    });
  }

  // Update theatre_rank for each conflict in this theatre (1-indexed)
  for (let i = 0; i < conflicts.length; i++) {
    await db.exec(
      `UPDATE conflict_state_live
       SET theatre_rank = ?
       WHERE conflict_id = ?`,
      [i + 1, conflicts[i].id]
    );
  }

  console.log(
    `[updateTheatreState] ${theatre}: tension=${theatreTension.toFixed(2)}, ` +
    `momentum=${theatreMomentum.toFixed(2)}, ${conflicts.length} conflicts`
  );
}

/**
 * Update all theatre states
 *
 * @returns Number of theatres updated
 */
export async function updateTheatreStateLive(): Promise<{ updated: number }> {
  const db = getDB();
  const currentTime = Math.floor(Date.now() / 1000);

  console.log(`[updateTheatreStateLive] Starting theatre aggregation at ${currentTime}`);

  // Get unique theatres from conflicts_core
  const theatres = await db.query(
    `SELECT DISTINCT theatre FROM conflicts_core
     WHERE theatre IS NOT NULL
     ORDER BY theatre ASC`
  );

  let updated = 0;
  for (const row of theatres as any[]) {
    try {
      await updateTheatreState(row.theatre, currentTime);
      updated++;
    } catch (error) {
      console.error(`[updateTheatreStateLive] Failed to update ${row.theatre}:`, error);
    }
  }

  console.log(`[updateTheatreStateLive] Updated ${updated} theatres`);
  return { updated };
}
