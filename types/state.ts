/**
 * State Engine Types
 * Defines types for world state, country readiness, and relation edges
 */

/**
 * Country readiness breakdown (0-100 scale for each component)
 */
export interface ReadinessBreakdown {
  military: number;      // Military preparedness (0-100)
  economic: number;      // Economic resilience (0-100)
  political: number;     // Political stability (0-100)
  diplomatic: number;    // Diplomatic positioning (0-100)
  cyber: number;         // Cyber defense capability (0-100)
  overall: number;       // Weighted average (0-100)
}

/**
 * Country state with readiness scores
 */
export interface CountryState {
  country_code: string;
  country_name: string;
  readiness: ReadinessBreakdown;
  alert_status: 'normal' | 'heightened' | 'elevated' | 'critical';
  active_signals: string[];  // Signal codes (e.g., 'SIG_TROOPS_MOBILIZED')
  active_events: number[];   // Event frame IDs
  last_updated_at: number;   // Unix timestamp (seconds)
  confidence: number;        // 0-1 confidence in state assessment
}

/**
 * Relation edge between two entities
 */
export interface RelationEdge {
  id: number;
  entity_a: string;
  entity_b: string;
  relation_type: 'allied' | 'hostile' | 'neutral' | 'trade_partner' | 'adversary' | 'treaty_member' | 'sanctioned';
  relation_strength: number;  // 0-1 scale
  is_mutual: boolean;
  evidence_event_frame_ids: number[];
  evidence_count: number;
  first_observed_at: number;
  last_updated_at: number;
  last_event_at?: number;
  confidence: number;
  source: string;
}

/**
 * Global world state (live)
 */
export interface WorldStateLive {
  id: 1;  // Singleton
  last_updated_at: number;
  global_tension_score: number;  // 0-1 scale
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  active_event_count: number;
  active_scenario_count: number;
  active_event_frames: number[];
  scenario_scores: Record<string, number>;  // {"SCENARIO_NATO_RUSSIA": 0.45}
  country_statuses: Record<string, string>;  // {"USA": "heightened"}
  calculation_method: string;
  data_quality: number;
  version: number;
}

/**
 * Daily snapshot of world state
 */
export interface WorldStateDaily {
  id: number;
  date: number;  // YYYYMMDD format (e.g., 20260228)
  global_tension_score: number;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  total_events: number;
  event_counts_by_type: Record<string, number>;
  event_counts_by_severity: Record<string, number>;
  active_scenarios: string[];
  scenario_scores: Record<string, number>;
  country_power_snapshot: Record<string, number>;
  active_conflicts: Array<{
    countries: string[];
    intensity: number;
  }>;
  calculated_at: number;
  snapshot_source: string;
  data_quality: number;
}

/**
 * Signal activation (from orchestrator)
 */
export interface SignalActivation {
  id: number;
  signal_code: string;
  signal_category: string;
  event_frame_id: number;
  confidence: number;
  activated_at: number;
  expires_at: number;
  is_active: boolean;
  evidence_text?: string;
  countries_involved?: string[];
}

/**
 * Readiness component weights
 */
export interface ReadinessWeights {
  military: number;
  economic: number;
  political: number;
  diplomatic: number;
  cyber: number;
}

/**
 * State calculation context
 */
export interface StateCalculationContext {
  window_hours: number;  // Time window to consider (e.g., 24)
  min_confidence: number;  // Minimum signal confidence (0-1)
  weights: ReadinessWeights;  // Component weights
}
