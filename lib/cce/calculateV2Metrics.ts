/**
 * CCE v2 Metrics Calculator
 *
 * Calculates new v2 metrics for conflict_state_live:
 * - Momentum: Wave feeling (velocity + tension derivative + heat)
 * - Pressure: Strategic weight (tension * importance + heat)
 * - Instability: Chaos/volatility (variance + entropy + velocity)
 *
 * All metrics:
 * - Normalize to 0..1 range
 * - Use exponential decay where applicable
 * - Store in seconds (not milliseconds)
 * - Follow CCE v1 patterns
 */

import { getDB } from '../db/adapter';

const ONE_HOUR = 3600; // seconds
const SIX_HOURS = 6 * ONE_HOUR;
const ONE_DAY = 24 * ONE_HOUR;

interface ConflictEvent {
  id: string;
  window_start: number;
  severity: number;
  impact_score: number;
  event_type: string;
}

interface ConflictState {
  tension: number;
  heat: number;
  velocity: number;
}

interface ConflictCore {
  importance: number;
  base_tension: number;
}

/**
 * Calculate momentum (wave feeling)
 *
 * Formula: momentum = clamp(
 *   0.55 * velocity +
 *   0.35 * dTension_dt +
 *   0.10 * heat,
 *   0, 1
 * )
 *
 * where dTension_dt = (tension_now - tension_6h_ago) / 0.25, mapped to [0,1]
 */
export async function calculateMomentum(
  conflictId: string,
  currentState: ConflictState,
  currentTime: number
): Promise<number> {
  const db = getDB();

  try {
    // Get events from 6-12 hours ago to estimate past tension
    const sixHoursAgo = currentTime - SIX_HOURS;
    const twelveHoursAgo = currentTime - (12 * ONE_HOUR);

    // Fetch historical events
    const recentEvents = await db.query(
      `SELECT window_start, severity, impact_score
       FROM conflict_events
       WHERE conflict_id = ?
         AND window_start >= ?
         AND window_start < ?
       ORDER BY window_start ASC`,
      [conflictId, twelveHoursAgo, sixHoursAgo]
    ) as ConflictEvent[];

    // Estimate past tension from event intensity
    let pastTension = currentState.tension;
    if (recentEvents.length > 0) {
      const avgImpact = recentEvents.reduce((sum, e) => sum + e.impact_score, 0) / recentEvents.length;
      // Conservative estimate: tension was lower by impact delta
      pastTension = Math.max(0.0, currentState.tension - (avgImpact * 0.3));
    }

    // Calculate tension derivative
    const dTension = currentState.tension - pastTension;
    const dTensionDt = dTension / 0.25;  // Normalize by 0.25 baseline

    // Map dTensionDt from [-1,1] to [0,1]
    const dTensionNormalized = Math.max(0.0, Math.min(1.0, (dTensionDt + 1) / 2));

    // Momentum formula: weighted combination
    const momentum = Math.max(0.0, Math.min(1.0,
      0.55 * currentState.velocity +
      0.35 * dTensionNormalized +
      0.10 * currentState.heat
    ));

    return momentum;
  } catch (error) {
    console.error('[calculateMomentum] Error:', error);
    return 0.0;  // Graceful degradation
  }
}

/**
 * Calculate pressure (strategic weight)
 *
 * Formula: pressure = clamp(
 *   tension * (0.6 + 0.4 * importance) +
 *   0.2 * heat,
 *   0, 1
 * )
 *
 * Pressure represents long-term strategic significance.
 */
export function calculatePressure(
  currentState: ConflictState,
  conflictCore: ConflictCore
): number {
  // Importance weight: conflicts with higher global importance matter more
  const importanceWeight = 0.6 + (0.4 * conflictCore.importance);

  const pressure = Math.max(0.0, Math.min(1.0,
    currentState.tension * importanceWeight +
    0.2 * currentState.heat
  ));

  return pressure;
}

/**
 * Calculate instability (chaos/volatility)
 *
 * Formula: instability = clamp(
 *   0.5 * variance_of_impact_last_24h +
 *   0.3 * event_type_entropy_last_24h +
 *   0.2 * abs(velocity),
 *   0, 1
 * )
 *
 * Instability represents unpredictability and systemic chaos.
 */
export async function calculateInstability(
  conflictId: string,
  currentState: ConflictState,
  currentTime: number
): Promise<number> {
  const db = getDB();

  try {
    const last24h = currentTime - ONE_DAY;

    // Fetch events from last 24h
    const events = await db.query(
      `SELECT impact_score, event_type
       FROM conflict_events
       WHERE conflict_id = ?
         AND window_start >= ?
       ORDER BY window_start DESC`,
      [conflictId, last24h]
    ) as ConflictEvent[];

    if (events.length === 0) {
      // No recent events = low instability
      return 0.0;
    }

    // 1. Variance of impact scores
    const impacts = events.map(e => e.impact_score);
    const avgImpact = impacts.reduce((sum, val) => sum + val, 0) / impacts.length;
    const variance = impacts.reduce((sum, val) => sum + Math.pow(val - avgImpact, 2), 0) / impacts.length;

    // Normalize variance to 0-1 (scale by 4 to make typical variance fit in range)
    const normalizedVariance = Math.min(1.0, variance * 4);

    // 2. Event type entropy (Shannon entropy)
    const typeFrequencies = new Map<string, number>();
    for (const event of events) {
      typeFrequencies.set(event.event_type, (typeFrequencies.get(event.event_type) || 0) + 1);
    }

    let entropy = 0.0;
    const totalEvents = events.length;
    for (const count of typeFrequencies.values()) {
      const p = count / totalEvents;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    // Normalize entropy to 0-1 (max entropy for 12 event types ≈ 3.58)
    const normalizedEntropy = Math.min(1.0, entropy / 3.58);

    // 3. Instability formula: weighted combination
    const instability = Math.max(0.0, Math.min(1.0,
      0.5 * normalizedVariance +
      0.3 * normalizedEntropy +
      0.2 * Math.abs(currentState.velocity)  // Absolute value = volatility
    ));

    return instability;
  } catch (error) {
    console.error('[calculateInstability] Error:', error);
    return 0.0;  // Graceful degradation
  }
}

/**
 * Calculate all v2 metrics for a conflict
 *
 * @param conflictId - Conflict ID
 * @param currentState - Current v1 state (tension, heat, velocity)
 * @param conflictCore - Core conflict properties (importance, base_tension)
 * @param currentTime - Current Unix timestamp in seconds
 * @returns Object with momentum, pressure, instability
 */
export async function calculateAllV2Metrics(
  conflictId: string,
  currentState: ConflictState,
  conflictCore: ConflictCore,
  currentTime: number
): Promise<{
  momentum: number;
  pressure: number;
  instability: number;
}> {
  // Calculate all three metrics
  const momentum = await calculateMomentum(conflictId, currentState, currentTime);
  const pressure = calculatePressure(currentState, conflictCore);
  const instability = await calculateInstability(conflictId, currentState, currentTime);

  return { momentum, pressure, instability };
}
