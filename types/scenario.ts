// Event and Scenario Types

export type EventType =
  | 'strike'
  | 'protest'
  | 'sanction'
  | 'border_closure'
  | 'warning'
  | 'negotiation'
  | 'cyber_attack'
  | 'troop_movement'
  | 'diplomatic_expulsion'
  | 'aid_blockage'
  | 'infrastructure_damage'
  | 'civilian_casualties'
  | 'policy_change'
  | 'alliance_shift'
  | 'economic_disruption';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ImpactLevel = 'low' | 'medium' | 'high';

export interface EventFrame {
  event_type: EventType;
  actors: string[]; // Countries, organizations, groups
  location?: string;
  severity: SeverityLevel;
  confidence: number; // 0-1
  feed_item_id: number;
  extracted_at: number;
}

export interface Signal {
  signal_id: string; // Ex: SIG_US_STRIKE, SIG_IRAN_SANCTION
  event_type: EventType;
  actors: string[];
  weight: number; // Base weight from event type
  reliability: number; // From source reliability
  severity: SeverityLevel;
  timestamp: number;
  feed_item_ids: number[]; // Supporting sources
  recency_factor: number; // Decay factor based on age
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  required_signals: string[]; // Signal patterns that trigger this scenario
  boost_signals: string[]; // Signals that increase probability
  inhibit_signals: string[]; // Signals that decrease probability
  baseline_probability: number; // Initial probability without signals
}

export interface ScenarioScore {
  scenario_id: string;
  probability: number; // 0-1
  raw_score: number; // Before normalization
  active_signals: Signal[];
  confidence: number; // Based on signal quality and quantity
  trend: 'rising' | 'stable' | 'falling';
  last_updated: number;
}

export interface ImpactDomain {
  domain: 'aviation' | 'energy' | 'cyber' | 'humanitarian' | 'supply_chain' | 'financial' | 'security';
  level: ImpactLevel;
  reasoning: string;
  supporting_signals: string[]; // Signal IDs
  source_links: number[]; // Feed item IDs
}

export interface ImpactMatrix {
  scenario_id: string;
  impacts: ImpactDomain[];
  overall_severity: SeverityLevel;
  last_updated: number;
}

export interface ScenarioChangelog {
  scenario_id: string;
  change_type: 'probability_increase' | 'probability_decrease' | 'new_signal' | 'impact_change';
  old_value?: number;
  new_value?: number;
  reason: string;
  timestamp: number;
}

// Default scenario templates
export const DEFAULT_SCENARIOS: ScenarioTemplate[] = [
  {
    id: 'status_quo_unstable',
    name: 'Statu quo instable',
    description: 'Continuation du conflit avec incidents sporadiques sans escalade majeure',
    required_signals: [],
    boost_signals: ['SIG_NEGOTIATION', 'SIG_CEASEFIRE_TALK'],
    inhibit_signals: ['SIG_MAJOR_STRIKE', 'SIG_MULTI_ACTOR'],
    baseline_probability: 0.4,
  },
  {
    id: 'limited_escalation',
    name: 'Escalade limitée',
    description: 'Augmentation des frappes entre acteurs existants sans élargissement du conflit',
    required_signals: ['SIG_STRIKE', 'SIG_RETALIATION'],
    boost_signals: ['SIG_CIVILIAN_CASUALTIES', 'SIG_INFRASTRUCTURE'],
    inhibit_signals: ['SIG_NEGOTIATION', 'SIG_CEASEFIRE'],
    baseline_probability: 0.3,
  },
  {
    id: 'multi_actor_escalation',
    name: 'Escalade multi-acteurs',
    description: 'Extension du conflit avec entrée de nouveaux acteurs étatiques',
    required_signals: ['SIG_MULTI_ACTOR', 'SIG_ALLIANCE_SHIFT'],
    boost_signals: ['SIG_TROOP_MOVEMENT', 'SIG_MILITARY_MOBILIZATION'],
    inhibit_signals: ['SIG_NEGOTIATION', 'SIG_DIPLOMATIC_PROGRESS'],
    baseline_probability: 0.15,
  },
  {
    id: 'infrastructure_attacks',
    name: 'Attaques infrastructures critiques',
    description: 'Ciblage délibéré des infrastructures civiles et énergétiques',
    required_signals: ['SIG_INFRASTRUCTURE_DAMAGE', 'SIG_ENERGY_DISRUPTION'],
    boost_signals: ['SIG_CYBER_ATTACK', 'SIG_STRATEGIC_TARGETING'],
    inhibit_signals: ['SIG_HUMANITARIAN_PAUSE'],
    baseline_probability: 0.2,
  },
  {
    id: 'internal_political_crisis',
    name: 'Crise politique interne',
    description: 'Instabilité politique majeure dans un des pays belligérants',
    required_signals: ['SIG_PROTEST', 'SIG_POLICY_CHANGE'],
    boost_signals: ['SIG_GOVERNMENT_CRISIS', 'SIG_COUP_ATTEMPT'],
    inhibit_signals: ['SIG_STABILITY_MEASURES'],
    baseline_probability: 0.1,
  },
  {
    id: 'protest_wave',
    name: 'Vague de protestations régionales',
    description: 'Mobilisations populaires massives affectant plusieurs pays',
    required_signals: ['SIG_PROTEST', 'SIG_REGIONAL_UNREST'],
    boost_signals: ['SIG_VIOLENCE', 'SIG_REPRESSION'],
    inhibit_signals: ['SIG_DIALOGUE', 'SIG_REFORMS'],
    baseline_probability: 0.15,
  },
  {
    id: 'economic_energy_shock',
    name: 'Choc économique et énergétique',
    description: 'Disruption majeure des approvisionnements énergétiques et chaînes logistiques',
    required_signals: ['SIG_SANCTION', 'SIG_ENERGY_DISRUPTION', 'SIG_SUPPLY_CHAIN'],
    boost_signals: ['SIG_BORDER_CLOSURE', 'SIG_TRADE_RESTRICTION'],
    inhibit_signals: ['SIG_TRADE_AGREEMENT', 'SIG_ENERGY_DEAL'],
    baseline_probability: 0.2,
  },
  {
    id: 'security_hardening',
    name: 'Renforcement sécuritaire global',
    description: 'Mesures de sécurité accrues et restrictions dans plusieurs pays',
    required_signals: ['SIG_SECURITY_ALERT', 'SIG_BORDER_CONTROL'],
    boost_signals: ['SIG_TERROR_THREAT', 'SIG_SURVEILLANCE_INCREASE'],
    inhibit_signals: ['SIG_DIPLOMATIC_NORMALIZATION'],
    baseline_probability: 0.25,
  },
];

// Event type weights for scoring
export const EVENT_WEIGHTS: Record<EventType, number> = {
  strike: 0.8,
  cyber_attack: 0.7,
  troop_movement: 0.75,
  infrastructure_damage: 0.85,
  civilian_casualties: 0.9,
  sanction: 0.6,
  diplomatic_expulsion: 0.65,
  border_closure: 0.7,
  warning: 0.5,
  protest: 0.55,
  aid_blockage: 0.75,
  policy_change: 0.6,
  alliance_shift: 0.8,
  economic_disruption: 0.7,
  negotiation: -0.4, // Negative weight (de-escalation)
};

// Severity multipliers
export const SEVERITY_MULTIPLIERS: Record<SeverityLevel, number> = {
  low: 0.5,
  medium: 1.0,
  high: 1.5,
  critical: 2.0,
};
