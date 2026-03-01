/**
 * Signal Mapping Module
 *
 * Maps EventFrames to Signal activations based on pattern matching.
 * Fourth stage of the orchestrator pipeline.
 *
 * Pipeline: event_frames → mapSignals → signal_activations table
 */

import { DatabaseAdapter } from '@/lib/db/adapter';
import type { EventType } from '@/types/map/EventFrame';

export interface Signal {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'military' | 'diplomatic' | 'economic' | 'cyber' | 'humanitarian' | 'infrastructure';
  weight: number; // 0-1
  decay_rate: number; // 0-1
  half_life_hours: number;
  scope: 'local' | 'regional' | 'global';
  requires_verification: number; // 0 or 1
  is_active: number; // 0 or 1
}

export interface SignalActivation {
  signal_id: number;
  event_frame_id: number;
  confidence: number; // 0-1
  activated_at: number; // Unix timestamp SECONDS
  expires_at: number; // Unix timestamp SECONDS
  is_active: number; // 0 or 1
  is_verified: number; // 0 or 1
}

export interface SignalMappingResult {
  success: boolean;
  activations?: SignalActivation[];
  activation_ids?: number[];
  error?: string;
  skipped?: boolean;
}

/**
 * Signal matching rules
 * Maps event characteristics to signal codes
 */
interface SignalMatchRule {
  signal_code: string;
  event_types?: EventType[];
  keywords?: RegExp[];
  min_severity?: number;
  location_scope?: string[];
  confidence_boost?: number;
}

const SIGNAL_MATCH_RULES: SignalMatchRule[] = [
  // Military Signals
  {
    signal_code: 'SIG_AIRSPACE_CLOSED',
    keywords: [/airspace.*closed/i, /no-fly.*zone/i, /flight.*suspended/i],
    min_severity: 6,
    confidence_boost: 0.2,
  },
  {
    signal_code: 'SIG_TROOPS_MOBILIZED',
    keywords: [/mobiliz/i, /deploy.*troops/i, /military.*buildup/i, /forces.*amass/i],
    min_severity: 5,
    confidence_boost: 0.15,
  },
  {
    signal_code: 'SIG_NAVAL_DEPLOYMENT',
    event_types: ['naval_strike'],
    keywords: [/naval.*deploy/i, /carrier.*group/i, /fleet.*move/i],
    min_severity: 5,
  },
  {
    signal_code: 'SIG_AIR_DEFENSE_ACTIVE',
    event_types: ['air_defense'],
    min_severity: 4,
    confidence_boost: 0.2,
  },
  {
    signal_code: 'SIG_MILITARY_EXERCISE',
    keywords: [/military.*exercise/i, /drill/i, /training.*operation/i],
    min_severity: 3,
  },

  // Diplomatic Signals
  {
    signal_code: 'SIG_EMBASSY_CLOSURE',
    keywords: [/embassy.*clos/i, /diplomatic.*mission.*evacuat/i, /consulate.*shut/i],
    min_severity: 6,
    confidence_boost: 0.25,
  },
  {
    signal_code: 'SIG_AMBASSADOR_RECALLED',
    keywords: [/ambassador.*recall/i, /diplomat.*withdraw/i, /envoy.*return/i],
    min_severity: 5,
  },
  {
    signal_code: 'SIG_DIPLOMATIC_BREAKDOWN',
    event_types: ['diplomatic_action'],
    keywords: [/diplomatic.*ties.*sever/i, /relations.*suspend/i, /talks.*collapse/i],
    min_severity: 7,
  },
  {
    signal_code: 'SIG_ALLIANCE_INVOKED',
    keywords: [/article\s+5/i, /NATO.*invok/i, /collective.*defense/i, /mutual.*defense/i],
    min_severity: 9,
    confidence_boost: 0.3,
  },

  // Economic Signals
  {
    signal_code: 'SIG_SANCTIONS_IMPOSED',
    event_types: ['sanction'],
    keywords: [/sanction/i, /embargo/i, /trade.*restriction/i],
    min_severity: 4,
  },
  {
    signal_code: 'SIG_ENERGY_DISRUPTION',
    keywords: [
      /pipeline.*attack/i,
      /energy.*infrastructure/i,
      /power.*grid/i,
      /oil.*facility/i,
      /gas.*supply/i,
    ],
    min_severity: 6,
  },
  {
    signal_code: 'SIG_FINANCIAL_RESTRICTIONS',
    keywords: [/bank.*sanction/i, /asset.*freez/i, /SWIFT.*ban/i, /financial.*restriction/i],
    min_severity: 5,
  },

  // Cyber Signals
  {
    signal_code: 'SIG_CYBER_ATTACK_MAJOR',
    event_types: ['cyberattack'],
    keywords: [/cyber.*attack/i, /hack/i, /ransomware/i],
    min_severity: 6,
  },
  {
    signal_code: 'SIG_COMM_DISRUPTION',
    keywords: [/internet.*down/i, /communication.*disrupted/i, /network.*attack/i],
    min_severity: 5,
  },

  // Infrastructure Signals
  {
    signal_code: 'SIG_BORDER_CLOSED',
    keywords: [/border.*clos/i, /crossing.*shut/i, /frontier.*seal/i],
    min_severity: 5,
  },
  {
    signal_code: 'SIG_TRANSPORT_DISRUPTION',
    keywords: [
      /transport.*halt/i,
      /rail.*attack/i,
      /road.*blocked/i,
      /bridge.*destroy/i,
    ],
    min_severity: 5,
  },

  // Humanitarian Signals
  {
    signal_code: 'SIG_MASS_EVACUATION',
    keywords: [/evacuat/i, /civilians.*flee/i, /exodus/i],
    min_severity: 6,
  },
  {
    signal_code: 'SIG_REFUGEE_CRISIS',
    keywords: [/refugee/i, /displaced/i, /asylum/i],
    min_severity: 5,
  },
  {
    signal_code: 'SIG_CIVILIAN_CASUALTIES',
    keywords: [/civilian.*killed/i, /civilian.*casualties/i, /non-combatant/i],
    min_severity: 6,
    confidence_boost: 0.15,
  },
];

/**
 * Load signal by code
 */
async function loadSignalByCode(db: DatabaseAdapter, code: string): Promise<Signal | null> {
  try {
    const signals = await db.query('SELECT * FROM signals WHERE code = ? AND is_active = 1 LIMIT 1', [
      code,
    ]);

    if (signals && signals.length > 0) {
      return signals[0] as Signal;
    }

    return null;
  } catch (error) {
    console.error(`Failed to load signal ${code}:`, error);
    return null;
  }
}

/**
 * Check if event matches a signal rule
 */
function matchesRule(
  rule: SignalMatchRule,
  event: {
    event_type: EventType;
    severity: number;
    evidence: string;
    confidence: number;
  }
): { matches: boolean; confidence: number } {
  let matches = false;
  let confidence = event.confidence;

  // Check event type match
  if (rule.event_types && rule.event_types.length > 0) {
    if (!rule.event_types.includes(event.event_type)) {
      return { matches: false, confidence: 0 };
    }
    matches = true;
  }

  // Check keyword match
  if (rule.keywords && rule.keywords.length > 0) {
    const hasKeywordMatch = rule.keywords.some(pattern => pattern.test(event.evidence));
    if (!hasKeywordMatch) {
      return { matches: false, confidence: 0 };
    }
    matches = true;
  }

  // Check minimum severity
  if (rule.min_severity && event.severity < rule.min_severity) {
    return { matches: false, confidence: 0 };
  }

  // Apply confidence boost if rule matched
  if (matches && rule.confidence_boost) {
    confidence = Math.min(1.0, confidence + rule.confidence_boost);
  }

  return { matches, confidence };
}

/**
 * Calculate expiration time based on signal half-life
 */
function calculateExpiresAt(activatedAt: number, halfLifeHours: number): number {
  // Use 3x half-life as expiration (signal is effectively dead at 12.5% strength)
  const expirationHours = halfLifeHours * 3;
  return activatedAt + expirationHours * 3600; // Convert hours to seconds
}

/**
 * Map event frame to signal activations
 */
export async function mapSignals(event_frame_id: number): Promise<SignalMappingResult> {
  const db = new DatabaseAdapter();

  try {
    // Fetch event frame
    const eventFrames = await db.query('SELECT * FROM event_frames WHERE id = ? LIMIT 1', [
      event_frame_id,
    ]);

    if (!eventFrames || eventFrames.length === 0) {
      return {
        success: false,
        error: 'Event frame not found',
      };
    }

    const eventFrame = eventFrames[0];

    // Check for matches
    const activations: SignalActivation[] = [];
    const activation_ids: number[] = [];

    for (const rule of SIGNAL_MATCH_RULES) {
      const { matches, confidence } = matchesRule(rule, {
        event_type: eventFrame.event_type as EventType,
        severity: eventFrame.severity,
        evidence: eventFrame.evidence,
        confidence: eventFrame.confidence,
      });

      if (!matches) {
        continue;
      }

      // Load signal definition
      const signal = await loadSignalByCode(db, rule.signal_code);
      if (!signal) {
        console.warn(`Signal ${rule.signal_code} not found in database`);
        continue;
      }

      // Check if activation already exists
      const existing = await db.query(
        'SELECT id FROM signal_activations WHERE signal_id = ? AND event_frame_id = ? LIMIT 1',
        [signal.id, event_frame_id]
      );

      if (existing && existing.length > 0) {
        // Already activated, skip
        continue;
      }

      // Create activation
      const now = Math.floor(Date.now() / 1000);
      const activation: SignalActivation = {
        signal_id: signal.id,
        event_frame_id,
        confidence,
        activated_at: now,
        expires_at: calculateExpiresAt(now, signal.half_life_hours),
        is_active: 1,
        is_verified: signal.requires_verification ? 0 : 1, // Auto-verify if not required
      };

      // Insert activation
      try {
        const activation_id = await db.insert('signal_activations', activation);
        activation_ids.push(activation_id);
        activations.push(activation);
      } catch (insertError) {
        console.error(`Failed to insert activation for signal ${signal.code}:`, insertError);
      }
    }

    if (activations.length === 0) {
      return {
        success: true,
        skipped: true,
        activations: [],
        activation_ids: [],
      };
    }

    return {
      success: true,
      activations,
      activation_ids,
    };
  } catch (error) {
    console.error('Signal mapping failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch map signals for multiple event frames
 */
export async function mapSignalsBatch(event_frame_ids: number[]): Promise<SignalMappingResult[]> {
  const results: SignalMappingResult[] = [];

  for (const id of event_frame_ids) {
    const result = await mapSignals(id);
    results.push(result);
  }

  return results;
}

/**
 * Get active signals for a time window
 */
export async function getActiveSignals(windowSeconds: number = 86400): Promise<Signal[]> {
  const db = new DatabaseAdapter();

  try {
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - windowSeconds;

    const activeSignals = await db.query(
      `SELECT DISTINCT s.*
       FROM signals s
       INNER JOIN signal_activations sa ON s.id = sa.signal_id
       WHERE sa.is_active = 1
       AND sa.activated_at >= ?
       AND sa.expires_at > ?
       ORDER BY sa.activated_at DESC`,
      [cutoff, now]
    );

    return activeSignals as Signal[];
  } catch (error) {
    console.error('Failed to get active signals:', error);
    return [];
  }
}
