/**
 * MapAction Data Model
 *
 * Represents a visual action to be rendered on the map
 * Converts EventFrame (intelligence) into visual representation (animation)
 */

import type { EventType, EventSeverity } from './EventFrame';

// Visual Action Types (Map Animation Categories)
export type MapActionType =
  | 'PULSE_STRIKE'          // Pulsing circle for strikes/explosions
  | 'TRAJECTORY_MISSILE'    // Animated arc for missiles
  | 'TRAJECTORY_DRONE'      // Animated path for drone strikes
  | 'AREA_SHELLING'         // Multiple small pulses for artillery
  | 'NAVAL_STRIKE'          // Coastal strike indicator
  | 'GROUND_MOVEMENT'       // Arrow showing troop movement
  | 'AIR_DEFENSE'           // Upward trajectory for interceptors
  | 'PROTEST_MARKER'        // Protest/civil unrest marker
  | 'CYBER_INDICATOR'       // Digital attack visualization
  | 'DIPLOMATIC_ICON'       // Diplomatic action marker
  | 'INCIDENT_MARKER';      // Generic incident marker

// Color scheme based on Command & Conquer aesthetic
export type MapActionColor =
  | 'red'       // Enemy/hostile actions
  | 'blue'      // Friendly/allied actions
  | 'yellow'    // Neutral/incident
  | 'green'     // Diplomatic/positive
  | 'purple'    // Cyber/information warfare
  | 'orange';   // High alert/critical

// Animation duration categories
export type AnimationDuration =
  | 'instant'   // 0ms - static markers
  | 'fast'      // 500ms - quick pulses
  | 'medium'    // 1500ms - standard animations
  | 'slow'      // 3000ms - dramatic effects
  | 'persist';  // Stays on map until cleared

/**
 * MapAction: Visual representation of EventFrame on the map
 *
 * Purpose: Define HOW an event should be rendered visually
 */
export interface MapAction {
  // Identity
  id: string;                           // Unique action ID (same as EventFrame.id)
  event_frame_id: string;               // Link to source EventFrame

  // Visual Properties
  action_type: MapActionType;
  color: MapActionColor;
  duration: AnimationDuration;

  // Geospatial Rendering
  origin?: {                            // Starting point (for trajectories)
    lat: number;
    lng: number;
  };
  target: {                             // End point / impact location
    lat: number;
    lng: number;
  };

  // Animation Behavior
  animation_config: {
    intensity: number;                  // 0.0-1.0 - How dramatic the animation
    pulse_count?: number;               // For PULSE_STRIKE (1-5)
    trajectory_arc?: number;            // For missiles (0.0-1.0, 0=flat, 1=high arc)
    area_radius?: number;               // For AREA_SHELLING (in pixels)
    icon_size?: 'small' | 'medium' | 'large';
  };

  // Popup Content
  popup?: {
    title: string;                      // Event title
    description: string;                // Event details
    timestamp: number;                  // When it occurred (Unix seconds)
    severity: EventSeverity;
    details?: {
      casualties?: string;              // Formatted casualties
      weapon_system?: string;
      target_type?: string;
    };
  };

  // Display Control
  z_index: number;                      // Layer priority (higher = on top)
  visible: boolean;                     // Should be rendered?
  expires_at?: number;                  // Unix timestamp when action should auto-remove

  // Metadata
  created_at: number;                   // Unix timestamp (seconds)
}

/**
 * EventType to MapActionType Mapping Rules
 *
 * Based on military tactics and visual effectiveness:
 * - Missiles: Show trajectory for psychological impact (WW2 V2 fear factor)
 * - Drones: Show path to emphasize modern warfare patterns
 * - Artillery: Area effect to show WW1/WW2 barrage patterns
 * - Strikes: Pulse for immediate visual impact
 * - Unknown: Conservative PULSE_STRIKE only (from estimation rule)
 */
export const EVENT_TO_ACTION_MAPPING: Record<EventType, MapActionType> = {
  // Kinetic - Projectile-based
  missile_strike: 'TRAJECTORY_MISSILE',
  drone_strike: 'TRAJECTORY_DRONE',
  rocket_attack: 'TRAJECTORY_MISSILE',      // Similar to missile

  // Kinetic - Area effect
  artillery_shelling: 'AREA_SHELLING',
  airstrike: 'PULSE_STRIKE',
  naval_strike: 'NAVAL_STRIKE',
  ground_assault: 'GROUND_MOVEMENT',
  air_defense: 'AIR_DEFENSE',

  // Non-Kinetic
  protest: 'PROTEST_MARKER',
  sanction: 'DIPLOMATIC_ICON',
  cyberattack: 'CYBER_INDICATOR',
  diplomatic_action: 'DIPLOMATIC_ICON',
  intelligence_ops: 'CYBER_INDICATOR',      // Similar visualization
  information_warfare: 'CYBER_INDICATOR',

  // Incidents
  explosion: 'PULSE_STRIKE',
  accident: 'INCIDENT_MARKER',
  sabotage: 'PULSE_STRIKE',

  // Unknown - Conservative approach (rule: from unknown = PULSE_STRIKE only)
  unknown: 'PULSE_STRIKE',
};

/**
 * Severity to Color Mapping
 * Based on DEFCON-style threat assessment
 */
export const SEVERITY_TO_COLOR_MAPPING: Record<EventSeverity, MapActionColor> = {
  critical: 'red',      // DEFCON 1 equivalent
  high: 'orange',       // DEFCON 2-3
  medium: 'yellow',     // DEFCON 4
  low: 'blue',          // DEFCON 5
  minimal: 'green',     // Peacetime
};

/**
 * Severity to Intensity Mapping
 * Controls animation drama level
 */
export const SEVERITY_TO_INTENSITY: Record<EventSeverity, number> = {
  critical: 1.0,    // Maximum visual impact
  high: 0.8,
  medium: 0.6,
  low: 0.4,
  minimal: 0.2,     // Subtle animation
};

/**
 * Animation Duration Mapping
 * Based on action type tactical significance
 */
export const ACTION_TYPE_DURATION: Record<MapActionType, AnimationDuration> = {
  PULSE_STRIKE: 'fast',           // Quick impact
  TRAJECTORY_MISSILE: 'medium',   // Dramatic arc
  TRAJECTORY_DRONE: 'slow',       // Slower than missiles (realistic)
  AREA_SHELLING: 'medium',        // Multiple pulses
  NAVAL_STRIKE: 'fast',           // Coastal bombardment
  GROUND_MOVEMENT: 'slow',        // Troop movement is slow
  AIR_DEFENSE: 'fast',            // Quick interception
  PROTEST_MARKER: 'persist',      // Stays visible
  CYBER_INDICATOR: 'medium',      // Digital effect
  DIPLOMATIC_ICON: 'persist',     // Stays visible
  INCIDENT_MARKER: 'persist',     // Stays visible
};

/**
 * MapActionInput: Minimal data needed to create MapAction
 */
export interface MapActionInput {
  event_frame_id: string;
  action_type: MapActionType;
  target: { lat: number; lng: number };
  origin?: { lat: number; lng: number };
  popup?: MapAction['popup'];
}
