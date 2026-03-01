/**
 * Compute Country Readiness Breakdown
 *
 * Calculates military, economic, political, diplomatic, and cyber readiness scores
 * based on event frames and signal activations.
 *
 * Scoring methodology:
 * - Each component starts at 50 (neutral baseline)
 * - Events and signals modify scores based on severity and confidence
 * - Final scores clamped to 0-100 range
 */

import { getDB } from '@/lib/db/adapter';
import type { ReadinessBreakdown, ReadinessWeights } from '@/types/state';

interface EventFrame {
  id: number;
  event_type: string;
  severity: number;
  confidence: number;
  occurred_at: number;
  actors_attacker?: string;
  actors_target?: string;
}

interface SignalActivation {
  signal_code: string;
  signal_category: string;
  confidence: number;
  activated_at: number;
  is_active: boolean;
}

/**
 * Default component weights (sum to 1.0)
 */
const DEFAULT_WEIGHTS: ReadinessWeights = {
  military: 0.30,
  economic: 0.25,
  political: 0.20,
  diplomatic: 0.15,
  cyber: 0.10,
};

/**
 * Signal category to readiness component mapping
 */
const SIGNAL_CATEGORY_MAP: Record<string, keyof ReadinessBreakdown> = {
  military: 'military',
  economic: 'economic',
  political: 'political',
  diplomatic: 'diplomatic',
  cyber: 'cyber',
  humanitarian: 'political',  // Humanitarian signals affect political stability
  infrastructure: 'economic',  // Infrastructure signals affect economic component
};

/**
 * Event type to readiness component mapping
 */
const EVENT_TYPE_MAP: Record<string, keyof ReadinessBreakdown> = {
  // Kinetic events → military
  missile_strike: 'military',
  drone_strike: 'military',
  airstrike: 'military',
  artillery_shelling: 'military',
  naval_strike: 'military',
  ground_assault: 'military',
  rocket_attack: 'military',
  air_defense: 'military',

  // Cyber → cyber
  cyberattack: 'cyber',

  // Economic/diplomatic
  sanction: 'economic',
  diplomatic_action: 'diplomatic',

  // Political/social
  protest: 'political',

  // Other
  information_warfare: 'political',
  intelligence_ops: 'military',
  explosion: 'military',
  accident: 'economic',
  sabotage: 'military',
};

/**
 * Compute readiness breakdown for a specific country
 */
export async function computeReadinessBreakdown(
  countryCode: string,
  options: {
    windowHours?: number;
    minConfidence?: number;
    weights?: ReadinessWeights;
  } = {}
): Promise<ReadinessBreakdown> {
  const {
    windowHours = 24,
    minConfidence = 0.3,
    weights = DEFAULT_WEIGHTS,
  } = options;

  try {
    const db = getDB();
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (windowHours * 3600);

    // Initialize scores at neutral baseline (50)
    const scores: ReadinessBreakdown = {
      military: 50,
      economic: 50,
      political: 50,
      diplomatic: 50,
      cyber: 50,
      overall: 50,
    };

    // Fetch recent events involving this country
    // Note: actors is JSON column, extract via json_extract
    const events = await db.query(
      `SELECT id, event_type, severity, confidence, occurred_at,
              json_extract(actors, '$.attacker') as actors_attacker,
              json_extract(actors, '$.target') as actors_target
       FROM event_frames
       WHERE occurred_at >= ?
         AND confidence >= ?
         AND (json_extract(actors, '$.attacker') = ? OR json_extract(actors, '$.target') = ?)
       ORDER BY occurred_at DESC`,
      [windowStart, minConfidence, countryCode, countryCode]
    ) as EventFrame[];

    // Fetch active signals involving this country
    // Join with event_frames to get country involvement
    const signals = await db.query(
      `SELECT s.code as signal_code, s.category as signal_category, sa.confidence, sa.activated_at, sa.is_active
       FROM signal_activations sa
       JOIN signals s ON sa.signal_id = s.id
       JOIN event_frames ef ON sa.event_frame_id = ef.id
       WHERE sa.activated_at >= ?
         AND sa.is_active = 1
         AND sa.confidence >= ?
         AND (json_extract(ef.actors, '$.attacker') = ? OR json_extract(ef.actors, '$.target') = ?)
       ORDER BY sa.activated_at DESC`,
      [windowStart, minConfidence, countryCode, countryCode]
    ) as SignalActivation[];

    // Process events to adjust readiness scores
    for (const event of events) {
      const component = EVENT_TYPE_MAP[event.event_type];
      if (!component || component === 'overall') continue;

      // Event impact: severity (1-10) × confidence (0-1) × role multiplier
      const isTarget = event.actors_target === countryCode;
      const roleMultiplier = isTarget ? 1.5 : 1.0;  // Being targeted increases impact
      const impact = (event.severity / 10) * event.confidence * roleMultiplier;

      // Negative events decrease readiness
      scores[component] = Math.max(0, scores[component] - (impact * 10));
    }

    // Process signals to adjust readiness scores
    for (const signal of signals) {
      const component = SIGNAL_CATEGORY_MAP[signal.signal_category];
      if (!component || component === 'overall') continue;

      // Signal impact: confidence × category weight
      const impact = signal.confidence * 5;  // Signals have moderate impact

      // Most signals indicate increased readiness/activity (positive adjustment)
      // Exception: humanitarian/crisis signals reduce political stability
      const isNegativeSignal = signal.signal_category === 'humanitarian';
      if (isNegativeSignal) {
        scores[component] = Math.max(0, scores[component] - impact);
      } else {
        scores[component] = Math.min(100, scores[component] + impact);
      }
    }

    // Clamp all component scores to 0-100
    for (const key of Object.keys(scores) as Array<keyof ReadinessBreakdown>) {
      if (key !== 'overall') {
        scores[key] = Math.max(0, Math.min(100, Math.round(scores[key])));
      }
    }

    // Calculate weighted overall score
    scores.overall = Math.round(
      scores.military * weights.military +
      scores.economic * weights.economic +
      scores.political * weights.political +
      scores.diplomatic * weights.diplomatic +
      scores.cyber * weights.cyber
    );

    return scores;
  } catch (error) {
    console.error('[computeReadinessBreakdown] Error:', error);

    // Return neutral scores on error
    return {
      military: 50,
      economic: 50,
      political: 50,
      diplomatic: 50,
      cyber: 50,
      overall: 50,
    };
  }
}

/**
 * Batch compute readiness for multiple countries
 */
export async function computeMultipleReadiness(
  countryCodes: string[],
  options: {
    windowHours?: number;
    minConfidence?: number;
    weights?: ReadinessWeights;
  } = {}
): Promise<Record<string, ReadinessBreakdown>> {
  const results: Record<string, ReadinessBreakdown> = {};

  for (const code of countryCodes) {
    results[code] = await computeReadinessBreakdown(code, options);
  }

  return results;
}
