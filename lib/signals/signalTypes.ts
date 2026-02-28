/**
 * Signal Types - Standardized Military/Geopolitical Event Classification
 *
 * 30 SIG_* codes for deterministic signal detection
 */

export type SignalCode =
  // MILITARY ACTION (Hard Signals)
  | 'SIG_AIRSTRIKE'
  | 'SIG_MISSILE_LAUNCH'
  | 'SIG_DRONE_STRIKE'
  | 'SIG_GROUND_INCIDENT'
  | 'SIG_NAVAL_INCIDENT'
  | 'SIG_AIRSPACE_CLOSED'
  | 'SIG_MOBILIZATION'
  | 'SIG_MILITARY_DRILL'
  | 'SIG_CYBER_ATTACK'
  | 'SIG_INFRASTRUCTURE_STRIKE'
  // POLITICAL SIGNALS
  | 'SIG_SANCTIONS_NEW'
  | 'SIG_THREAT_STATEMENT'
  | 'SIG_NEGOTIATION'
  | 'SIG_CEASEFIRE'
  | 'SIG_PARLIAMENT_ACTION'
  // SOCIAL / INSTABILITY SIGNALS
  | 'SIG_PROTESTS_SPIKE'
  | 'SIG_RIOTS'
  | 'SIG_BORDER_TENSION'
  | 'SIG_REFUGEE_SURGE'
  // ENERGY / ECONOMIC SIGNALS
  | 'SIG_OIL_PRICE_SPIKE'
  | 'SIG_SHIPPING_DISRUPTION'
  // RELATIONS GRAPH SIGNALS
  | 'SIG_ALLIANCE_SUPPORT'
  | 'SIG_WEAPONS_TRANSFER'
  | 'SIG_PROXY_ACTIVITY'
  // HIGH LEVEL STRATEGIC
  | 'SIG_NUCLEAR_ACTIVITY'
  | 'SIG_LEADER_SPEECH_ESCALATORY'
  | 'SIG_LEADER_SPEECH_DEESCALATE'
  | 'SIG_STATE_OF_EMERGENCY'
  | 'SIG_INTEL_WARNING'
  | 'SIG_MILITARY_CASUALTIES_HIGH';

export interface SignalRule {
  code: SignalCode;
  keywords: string[]; // English + French + Arabic transliteration
  weight: number; // 1-5, impact strength
  severityBoost: number; // 0-3, how much it increases severity
  category: 'military' | 'political' | 'social' | 'economic' | 'strategic';

  // Impact on metrics
  impacts: {
    readiness?: number; // -10 to +10
    tension?: number; // -10 to +10
    hostility?: number; // -10 to +10
    stability?: number; // -10 to +10
  };
}

export interface DetectedSignal {
  code: SignalCode;
  confidence: number; // 0-1
  weight: number;
  severityBoost: number;
  matchedKeywords: string[];
  timestamp: number; // unix seconds
  itemId: number; // feed item ID
}

export interface MapEvent {
  id: string;
  type: 'drone' | 'missile' | 'airstrike' | 'tank' | 'naval' | 'cyber' | 'explosion';
  title: string;
  time: string; // ISO
  severity: 1 | 2 | 3 | 4 | 5;
  confidence: number; // 0-1
  source: { name: string; url?: string };

  // Geolocation
  from?: { lat: number; lon: number; label?: string };
  to: { lat: number; lon: number; label?: string };

  // Actors
  factions: string[]; // country codes

  // UI
  color?: 'ally' | 'hostile' | 'neutral';
}

export interface ReadinessScore {
  countryCode: string;
  readiness: number; // 0-100
  delta6h: number; // change in last 6 hours
  delta24h: number; // change in last 24 hours
  contributingSignals: SignalCode[];
  lastUpdated: number; // unix seconds
}

export interface ConflictEdge {
  source: string; // country code
  target: string; // country code
  relationScore: number; // -100 to +100
  tension: number; // 0-100
  recentSignals: SignalCode[];
  lastIncident: number; // unix seconds
}
