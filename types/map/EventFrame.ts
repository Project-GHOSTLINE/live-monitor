/**
 * EventFrame Data Model
 *
 * Represents a military/conflict event extracted from FeedItem data
 * Based on historical conflict patterns (WW1/WW2) and modern warfare evolution
 */

// Event Type Classification based on historical and modern conflict patterns
export type EventType =
  // Kinetic Events (Physical Military Action)
  | 'missile_strike'        // Ballistic, cruise, ATACMS, hypersonic
  | 'drone_strike'          // UAV/kamikaze drones (modern warfare staple)
  | 'airstrike'             // Fighter jets, bombers, helicopters
  | 'artillery_shelling'    // Howitzers, MLRS, mortars (WW1/WW2 evolution)
  | 'naval_strike'          // Ship-to-shore, submarine-launched
  | 'ground_assault'        // Infantry/armor offensive operations
  | 'rocket_attack'         // Unguided rockets, Grad systems
  | 'air_defense'           // SAM launches, interceptors

  // Non-Kinetic Events (Non-Physical Actions)
  | 'protest'               // Civil demonstrations, social unrest
  | 'sanction'              // Economic/diplomatic pressure
  | 'cyberattack'           // Digital warfare (modern WW3 component)
  | 'diplomatic_action'     // Negotiations, agreements, declarations
  | 'intelligence_ops'      // Espionage, surveillance, recon
  | 'information_warfare'   // Propaganda, disinformation campaigns

  // Incident Events (Accidental/Unclear)
  | 'explosion'             // Unclear origin explosions
  | 'accident'              // Military accidents, friendly fire
  | 'sabotage'              // Covert destructive actions
  | 'unknown';              // Cannot be classified

// Severity Classification (inspired by DEFCON levels)
export type EventSeverity =
  | 'critical'    // Mass casualties, strategic targets, WMD threats
  | 'high'        // Significant military action, major infrastructure
  | 'medium'      // Tactical operations, limited scope
  | 'low'         // Minor incidents, posturing
  | 'minimal';    // Diplomatic gestures, protests

// Geographic precision levels
export type LocationPrecision =
  | 'exact'       // GPS coordinates available
  | 'city'        // City-level precision
  | 'region'      // Province/state level
  | 'country'     // Country-level only
  | 'unknown';    // Location unclear

/**
 * EventFrame: Structured representation of a conflict event
 *
 * Purpose: Convert unstructured news data (FeedItem) into structured
 * military intelligence suitable for map visualization
 */
export interface EventFrame {
  // Identity & Source
  id: string;                         // Unique event ID (UUID or hash)
  feed_item_id?: number;              // Link back to source FeedItem

  // Event Classification
  event_type: EventType;
  severity: EventSeverity;

  // Temporal Data
  occurred_at: number;                // Unix timestamp (seconds) - when event happened
  reported_at: number;                // Unix timestamp (seconds) - when news reported it

  // Geospatial Data
  location: {
    lat: number;                      // Latitude (WGS84)
    lng: number;                      // Longitude (WGS84)
    precision: LocationPrecision;
    display_name: string;             // Human-readable location
    country_code?: string;            // ISO 3166-1 alpha-2
  };

  // Event Details
  description: string;                // Event summary (English)
  actors?: {
    attacker?: string;                // Initiating party
    target?: string;                  // Target party
    affected_parties?: string[];      // Collateral parties
  };

  // Impact Assessment
  casualties?: {
    killed?: number;
    wounded?: number;
    missing?: number;
    civilians?: boolean;              // Civilian vs military
  };

  // Military Intelligence
  weapon_system?: string;             // Specific weapon used (e.g., "ATACMS", "Shahed-136")
  target_type?: string;               // What was targeted (e.g., "energy infrastructure", "military base")

  // Confidence & Verification
  confidence: number;                 // 0.0-1.0 - How confident are we in this classification?
  verified: boolean;                  // Has this been verified by multiple sources?
  source_reliability: number;         // 0.0-1.0 - From FeedItem.reliability

  // Metadata
  tags?: string[];                    // Additional context tags
  cluster_id?: number;                // Link to event cluster (same incident, multiple reports)
  created_at: number;                 // Unix timestamp (seconds) - when EventFrame was created
  updated_at?: number;                // Unix timestamp (seconds) - last update
}

/**
 * EventFrameInput: Partial data used to create EventFrame
 * Used during extraction process before all fields are determined
 */
export interface EventFrameInput {
  feed_item_id: number;
  event_type: EventType;
  occurred_at: number;
  location: {
    lat: number;
    lng: number;
    precision: LocationPrecision;
    display_name: string;
    country_code?: string;
  };
  description: string;
  severity?: EventSeverity;
  actors?: EventFrame['actors'];
  casualties?: EventFrame['casualties'];
  weapon_system?: string;
  target_type?: string;
  confidence?: number;
  verified?: boolean;
  tags?: string[];
}

/**
 * Event Type Categorization Helper
 */
export const EVENT_TYPE_CATEGORIES = {
  kinetic: [
    'missile_strike',
    'drone_strike',
    'airstrike',
    'artillery_shelling',
    'naval_strike',
    'ground_assault',
    'rocket_attack',
    'air_defense',
  ] as EventType[],

  non_kinetic: [
    'protest',
    'sanction',
    'cyberattack',
    'diplomatic_action',
    'intelligence_ops',
    'information_warfare',
  ] as EventType[],

  incident: [
    'explosion',
    'accident',
    'sabotage',
    'unknown',
  ] as EventType[],
} as const;

/**
 * Check if event type is kinetic (physical military action)
 */
export function isKineticEvent(eventType: EventType): boolean {
  return EVENT_TYPE_CATEGORIES.kinetic.includes(eventType);
}

/**
 * Check if event type is non-kinetic (non-physical action)
 */
export function isNonKineticEvent(eventType: EventType): boolean {
  return EVENT_TYPE_CATEGORIES.non_kinetic.includes(eventType);
}

/**
 * Check if event type is incident (accidental/unclear)
 */
export function isIncidentEvent(eventType: EventType): boolean {
  return EVENT_TYPE_CATEGORIES.incident.includes(eventType);
}
