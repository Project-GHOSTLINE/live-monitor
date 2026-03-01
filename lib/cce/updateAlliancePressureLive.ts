/**
 * CCE v2 Alliance Pressure Propagation
 *
 * Calculates alliance-level pressure from member conflicts.
 *
 * Algorithm:
 * 1. For each alliance in alliance_core:
 *    - Get all conflicts involving alliance members
 *    - Calculate aggregate pressure (weighted by alliance strength)
 *    - Identify top conflicts (max 5)
 *    - Identify members under pressure (pressure ≥0.5)
 * 2. Update alliance_pressure_live
 */

import { getDB } from '../db/adapter';

interface Alliance {
  id: string;
  name: string;
  members: string;  // JSON array
  strength: number;
}

interface ConflictState {
  conflict_id: string;
  pressure: number;
  tension: number;
}

interface ConflictCore {
  id: string;
  actor_a: string;
  actor_b: string;
}

/**
 * Update alliance pressure for a specific alliance
 */
async function updateAlliancePressure(alliance: Alliance, currentTime: number): Promise<void> {
  const db = getDB();

  // Parse alliance members
  const members = JSON.parse(alliance.members) as string[];

  if (members.length === 0) {
    console.log(`[updateAlliancePressure] Alliance ${alliance.id} has no members, skipping`);
    return;
  }

  // Get all conflicts involving alliance members
  const placeholders = members.map(() => '?').join(',');
  const conflicts = await db.query(
    `SELECT
       cc.id as conflict_id, cc.actor_a, cc.actor_b,
       csl.pressure, csl.tension
     FROM conflicts_core cc
     INNER JOIN conflict_state_live csl ON cc.id = csl.conflict_id
     WHERE (cc.actor_a IN (${placeholders}) OR cc.actor_b IN (${placeholders}))
       AND csl.pressure > 0.1
     ORDER BY csl.pressure DESC`,
    [...members, ...members]
  ) as (ConflictCore & ConflictState)[];

  if (conflicts.length === 0) {
    // Alliance has no active conflicts
    await db.exec(
      `INSERT OR REPLACE INTO alliance_pressure_live
       (alliance_name, pressure, top_conflicts, affected_members, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [alliance.name, 0.0, '[]', '[]', currentTime]
    );
    return;
  }

  // Calculate alliance pressure (weighted by alliance strength)
  const pressures = conflicts.map(c => c.pressure);
  const avgPressure = pressures.reduce((sum, p) => sum + p, 0) / pressures.length;
  const maxPressure = Math.max(...pressures);

  // Alliance pressure = weighted combination of avg and max, scaled by strength
  const alliancePressure = Math.min(1.0,
    (avgPressure * 0.4 + maxPressure * 0.6) * alliance.strength
  );

  // Get top conflicts (max 5)
  const topConflicts = conflicts.slice(0, 5).map(c => ({
    conflict_id: c.conflict_id,
    tension: c.tension,
    actors: `${c.actor_a}-${c.actor_b}`
  }));

  // Identify affected members (members involved in high-pressure conflicts)
  const affectedMembers = new Set<string>();
  for (const conflict of conflicts) {
    if (conflict.pressure >= 0.5) {  // High-pressure threshold
      if (members.includes(conflict.actor_a)) affectedMembers.add(conflict.actor_a);
      if (members.includes(conflict.actor_b)) affectedMembers.add(conflict.actor_b);
    }
  }

  // Update alliance_pressure_live
  await db.exec(
    `INSERT OR REPLACE INTO alliance_pressure_live
     (alliance_name, pressure, top_conflicts, affected_members, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      alliance.name,
      alliancePressure,
      JSON.stringify(topConflicts),
      JSON.stringify([...affectedMembers]),
      currentTime
    ]
  );

  console.log(
    `[updateAlliancePressure] ${alliance.name}: pressure=${alliancePressure.toFixed(2)}, ` +
    `${conflicts.length} conflicts, ${affectedMembers.size} members affected`
  );
}

/**
 * Update all alliance pressures
 *
 * @returns Number of alliances updated
 */
export async function updateAlliancePressureLive(): Promise<{ updated: number }> {
  const db = getDB();
  const currentTime = Math.floor(Date.now() / 1000);

  console.log(`[updateAlliancePressureLive] Starting alliance pressure update at ${currentTime}`);

  // Get all alliances
  const alliances = await db.all('alliance_core') as Alliance[];

  if (alliances.length === 0) {
    console.log(`[updateAlliancePressureLive] No alliances found, skipping`);
    return { updated: 0 };
  }

  let updated = 0;
  for (const alliance of alliances) {
    try {
      await updateAlliancePressure(alliance, currentTime);
      updated++;
    } catch (error) {
      console.error(`[updateAlliancePressureLive] Failed to update ${alliance.id}:`, error);
    }
  }

  console.log(`[updateAlliancePressureLive] Updated ${updated} alliances`);
  return { updated };
}
