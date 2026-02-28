// Scenario Analysis Database Types
// Corresponds to database schema in lib/db/migrations/002_scenario_analysis.sql

// ============================================================
// EVENT FRAMES
// ============================================================

export type EventType =
  | 'military_mobilization'
  | 'airspace_closure'
  | 'diplomatic_action'
  | 'cyber_incident'
  | 'infrastructure_disruption'
  | 'economic_sanction'
  | 'humanitarian_crisis'
  | 'territorial_dispute'
  | 'alliance_activation'
  | 'nuclear_posture'
  | 'other';

export interface EventActor {
  name: string;
  role: 'aggressor' | 'defender' | 'mediator' | 'observer' | 'victim';
  country?: string;
  organization?: string;
}

export interface EventLocation {
  country: string;
  region?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface EventFrame {
  id?: number;
  feed_item_id: number;
  event_type: EventType;
  actors: EventActor[];
  location?: EventLocation;
  severity: number; // 1-10
  confidence: number; // 0.0-1.0
  source_reliability: number; // 1-5
  evidence: string;
  extracted_at?: number;
  created_at?: number;
}

// ============================================================
// SIGNALS
// ============================================================

export type SignalCategory =
  | 'military'
  | 'diplomatic'
  | 'economic'
  | 'cyber'
  | 'humanitarian'
  | 'infrastructure';

export type SignalScope = 'local' | 'regional' | 'global';

export interface Signal {
  id?: number;
  code: string; // e.g., 'SIG_AIRSPACE_CLOSED'
  name: string;
  description: string;
  category: SignalCategory;
  weight: number; // 0.0-1.0
  decay_rate: number; // 0.0-1.0
  half_life_hours: number;
  scope: SignalScope;
  requires_verification: boolean;
  created_at?: number;
  updated_at?: number;
  is_active: boolean;
}

// ============================================================
// SIGNAL ACTIVATIONS
// ============================================================

export interface SignalActivation {
  id?: number;
  signal_id: number;
  event_frame_id: number;
  confidence: number; // 0.0-1.0
  activated_at?: number;
  expires_at?: number;
  is_active: boolean;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: number;
  created_at?: number;
}

// ============================================================
// SCENARIO DEFINITIONS
// ============================================================

export type GeographicScope = 'bilateral' | 'regional' | 'global';

export interface ScenarioDefinition {
  id?: number;
  name: string;
  code: string; // e.g., 'SCENARIO_NATO_RUSSIA'
  hypothesis: string;
  description: string;
  trigger_signals: string[]; // Array of signal codes
  base_threshold: number; // 0.0-1.0
  impact_areas: ImpactDomain[]; // Array of domain codes
  geographic_scope: GeographicScope;
  actors_involved: string[]; // Array of country/org codes
  created_at?: number;
  updated_at?: number;
  is_active: boolean;
  last_triggered_at?: number;
}

// ============================================================
// SCENARIO SCORES
// ============================================================

export type ScoreTrend = 'increasing' | 'stable' | 'decreasing';

export interface ActiveSignalData {
  signal_code: string;
  weight: number;
  confidence: number;
  event_frame_ids: number[];
  activated_at: number;
  decay_factor: number;
}

export interface ScenarioScore {
  id?: number;
  scenario_id: number;
  score: number; // 0.0-1.0
  probability: number; // 0.0-1.0
  trend: ScoreTrend;
  active_signals: ActiveSignalData[];
  signal_count: number;
  calculated_at?: number;
  calculation_method: string;
  confidence: number; // 0.0-1.0
  data_quality: number; // 0.0-1.0
}

// ============================================================
// IMPACT MATRIX
// ============================================================

export type ImpactDomain =
  | 'aviation'
  | 'maritime'
  | 'energy'
  | 'financial'
  | 'cyber'
  | 'supply_chain'
  | 'telecommunications'
  | 'humanitarian'
  | 'diplomatic';

export type ImpactLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'critical';

export type Timeframe = 'immediate' | 'short_term' | 'medium_term' | 'long_term';

export type Reversibility = 'reversible' | 'partially_reversible' | 'irreversible';

export interface ImpactSource {
  type: 'feed_item' | 'event_frame' | 'analysis';
  id: number;
  reference?: string;
}

export interface ImpactAssessment {
  id?: number;
  scenario_id: number;
  domain: ImpactDomain;
  impact_level: ImpactLevel;
  impact_score: number; // 0-100
  reasoning: string;
  timeframe: Timeframe;
  reversibility: Reversibility;
  sources: ImpactSource[];
  affected_regions: string[];
  confidence: number; // 0.0-1.0
  assessed_at?: number;
  assessed_by?: string;
  created_at?: number;
  updated_at?: number;
}

// ============================================================
// SCENARIO CHANGELOG
// ============================================================

export type ChangeType =
  | 'score_update'
  | 'threshold_crossed'
  | 'signal_added'
  | 'signal_removed'
  | 'impact_changed'
  | 'status_change'
  | 'manual_override';

export interface ChangeDelta {
  field: string;
  old_value: any;
  new_value: any;
  change_magnitude?: number;
}

export interface ScenarioChangelogEntry {
  id?: number;
  scenario_id: number;
  change_type: ChangeType;
  delta: ChangeDelta;
  reason?: string;
  triggered_by?: string; // 'system', 'analyst:name', 'event:id'
  previous_score?: number;
  new_score?: number;
  affected_signals?: string[];
  timestamp?: number;
  created_at?: number;
}

// ============================================================
// COMPOSITE TYPES (for API responses)
// ============================================================

export interface ScenarioWithScore extends ScenarioDefinition {
  current_score?: ScenarioScore;
  score_history?: ScenarioScore[];
  active_signal_count?: number;
  trend?: ScoreTrend;
}

export interface EventFrameWithRelations extends EventFrame {
  feed_item?: {
    id: number;
    title_en?: string;
    source_name: string;
    published_at: number;
  };
  activated_signals?: SignalActivation[];
}

export interface SignalWithActivations extends Signal {
  recent_activations?: SignalActivation[];
  activation_count?: number;
  last_activated?: number;
  contributing_scenarios?: string[];
}

export interface ImpactMatrixByScenario {
  scenario: ScenarioDefinition;
  impacts: ImpactAssessment[];
  total_impact_score: number;
  critical_domains: ImpactDomain[];
}

// ============================================================
// UTILITY TYPES
// ============================================================

export interface ScenarioScoreCalculation {
  scenario_id: number;
  signal_contributions: {
    signal_code: string;
    base_weight: number;
    confidence: number;
    decay_factor: number;
    final_contribution: number;
  }[];
  total_score: number;
  normalized_score: number;
  calculation_timestamp: number;
}

export interface SignalDecayParams {
  activated_at: number;
  half_life_hours: number;
  current_time?: number;
}

export interface ScenarioTriggerCheck {
  scenario_code: string;
  threshold_met: boolean;
  current_score: number;
  threshold: number;
  missing_signals: string[];
  present_signals: string[];
  recommendation: 'monitor' | 'alert' | 'escalate';
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface ScenarioDashboard {
  scenarios: ScenarioWithScore[];
  active_signals: SignalWithActivations[];
  recent_events: EventFrameWithRelations[];
  impact_summary: {
    domain: ImpactDomain;
    total_scenarios: number;
    max_impact_level: ImpactLevel;
    affected_scenarios: string[];
  }[];
  timeline: {
    timestamp: number;
    events: EventFrame[];
    score_changes: ScenarioChangelogEntry[];
  }[];
}

export interface ScenarioAlert {
  scenario_id: number;
  scenario_name: string;
  alert_type: 'threshold_crossed' | 'rapid_increase' | 'new_signal' | 'high_confidence';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  current_score: number;
  previous_score?: number;
  triggered_at: number;
  requires_action: boolean;
}

// ============================================================
// FILTER AND QUERY TYPES
// ============================================================

export interface EventFrameFilters {
  event_types?: EventType[];
  severity_min?: number;
  severity_max?: number;
  confidence_min?: number;
  actors?: string[];
  locations?: string[];
  time_range?: {
    start: number;
    end: number;
  };
  feed_item_ids?: number[];
}

export interface ScenarioFilters {
  is_active?: boolean;
  geographic_scope?: GeographicScope[];
  impact_areas?: ImpactDomain[];
  score_min?: number;
  score_max?: number;
  actors_involved?: string[];
  last_triggered_after?: number;
}

export interface SignalFilters {
  categories?: SignalCategory[];
  scope?: SignalScope[];
  is_active?: boolean;
  requires_verification?: boolean;
  weight_min?: number;
  weight_max?: number;
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface CreateEventFrameRequest {
  feed_item_id: number;
  event_type: EventType;
  actors: EventActor[];
  location?: EventLocation;
  severity: number;
  confidence: number;
  evidence: string;
}

export interface CalculateScenarioScoreRequest {
  scenario_id: number;
  time_window_hours?: number;
  min_confidence?: number;
}

export interface CalculateScenarioScoreResponse {
  scenario_id: number;
  score: number;
  probability: number;
  trend: ScoreTrend;
  active_signals: ActiveSignalData[];
  confidence: number;
  calculation: ScenarioScoreCalculation;
}

export interface ImpactAssessmentRequest {
  scenario_id: number;
  domain: ImpactDomain;
  impact_level: ImpactLevel;
  reasoning: string;
  timeframe: Timeframe;
  reversibility: Reversibility;
  sources: ImpactSource[];
  affected_regions: string[];
  confidence: number;
}

export interface ScenarioDashboardRequest {
  time_range?: {
    start: number;
    end: number;
  };
  scenario_ids?: number[];
  include_inactive?: boolean;
  impact_domains?: ImpactDomain[];
}
