/**
 * Event Mapper: EventFrame -> MapAction Conversion
 *
 * Converts structured intelligence data (EventFrame) into visual map actions (MapAction)
 * Based on historical conflict patterns and modern warfare visualization principles
 */

import type {
  EventFrame,
  EventType,
  EventSeverity,
} from '@/types/map/EventFrame';
import type {
  MapAction,
  MapActionType,
  MapActionColor,
  AnimationDuration,
} from '@/types/map/MapAction';
import {
  EVENT_TO_ACTION_MAPPING,
  SEVERITY_TO_COLOR_MAPPING,
  SEVERITY_TO_INTENSITY,
  ACTION_TYPE_DURATION,
} from '@/types/map/MapAction';

/**
 * Convert EventFrame to MapAction
 *
 * Core business logic for translating intelligence into visual representation
 *
 * RULE: If event_type is 'unknown', ONLY use PULSE_STRIKE action type
 * This prevents misrepresentation of uncertain data
 */
export function eventFrameToMapAction(
  eventFrame: EventFrame,
  options?: {
    estimateOrigin?: boolean;   // Attempt to estimate trajectory origin
    expirationMinutes?: number; // How long action stays on map
  }
): MapAction {
  const actionType = determineActionType(eventFrame.event_type);
  const color = determineColor(eventFrame.severity, eventFrame.event_type);
  const duration = determineDuration(actionType);

  // Estimate trajectory origin for projectile-based weapons
  const origin = shouldHaveOrigin(actionType) && options?.estimateOrigin
    ? estimateOrigin(eventFrame, actionType)
    : undefined;

  // Calculate expiration timestamp
  const expiresAt = options?.expirationMinutes
    ? Math.floor(Date.now() / 1000) + (options.expirationMinutes * 60)
    : undefined;

  // Build animation configuration
  const animationConfig = buildAnimationConfig(
    actionType,
    eventFrame.severity,
    eventFrame
  );

  // Build popup content
  const popup = buildPopup(eventFrame);

  // Determine z-index (critical events on top)
  const zIndex = calculateZIndex(eventFrame.severity, actionType);

  return {
    id: eventFrame.id,
    event_frame_id: eventFrame.id,
    action_type: actionType,
    color,
    duration,
    origin,
    target: {
      lat: eventFrame.location.lat,
      lng: eventFrame.location.lng,
    },
    animation_config: animationConfig,
    popup,
    z_index: zIndex,
    visible: true,
    expires_at: expiresAt,
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Determine MapActionType from EventType
 *
 * CRITICAL RULE: unknown events MUST use PULSE_STRIKE only
 */
function determineActionType(eventType: EventType): MapActionType {
  // Enforce conservative rule for unknown events
  if (eventType === 'unknown') {
    return 'PULSE_STRIKE';
  }

  return EVENT_TO_ACTION_MAPPING[eventType];
}

/**
 * Determine color based on severity and event type
 *
 * Special cases:
 * - Cyber/intel ops always purple (regardless of severity)
 * - Protests always yellow (neutral)
 * - Otherwise use severity-based coloring
 */
function determineColor(
  severity: EventSeverity,
  eventType: EventType
): MapActionColor {
  // Special case: Cyber/Information warfare
  if (
    eventType === 'cyberattack' ||
    eventType === 'information_warfare' ||
    eventType === 'intelligence_ops'
  ) {
    return 'purple';
  }

  // Special case: Protests (neutral)
  if (eventType === 'protest') {
    return 'yellow';
  }

  // Special case: Diplomatic actions (positive)
  if (eventType === 'diplomatic_action') {
    return 'green';
  }

  // Default: Severity-based coloring
  return SEVERITY_TO_COLOR_MAPPING[severity];
}

/**
 * Determine animation duration
 */
function determineDuration(actionType: MapActionType): AnimationDuration {
  return ACTION_TYPE_DURATION[actionType];
}

/**
 * Check if action type should have origin point
 * (trajectory-based weapons)
 */
function shouldHaveOrigin(actionType: MapActionType): boolean {
  return (
    actionType === 'TRAJECTORY_MISSILE' ||
    actionType === 'TRAJECTORY_DRONE' ||
    actionType === 'NAVAL_STRIKE' ||
    actionType === 'AIR_DEFENSE'
  );
}

/**
 * Estimate trajectory origin based on event context
 *
 * Uses military intelligence patterns:
 * - Missiles: Estimate based on known launch sites (future: ML model)
 * - Drones: Estimate based on front lines
 * - Naval: Estimate based on known fleet positions
 * - Air Defense: Origin is target location (defensive)
 *
 * Current implementation: Simple estimation
 * TODO: Integrate with ML model for accurate origin prediction
 */
function estimateOrigin(
  eventFrame: EventFrame,
  actionType: MapActionType
): { lat: number; lng: number } | undefined {
  const { location, actors } = eventFrame;

  // Air defense: Origin IS the target (defensive action)
  if (actionType === 'AIR_DEFENSE') {
    return {
      lat: location.lat,
      lng: location.lng,
    };
  }

  // Naval strikes: Estimate from coastline
  if (actionType === 'NAVAL_STRIKE') {
    return estimateNavalOrigin(location.lat, location.lng);
  }

  // Missiles/Drones: Estimate based on attacker
  // Simple heuristic: Offset by 50-200km based on weapon type
  if (actionType === 'TRAJECTORY_MISSILE' || actionType === 'TRAJECTORY_DRONE') {
    const distance = actionType === 'TRAJECTORY_MISSILE' ? 200 : 50; // km
    return estimateOffsetOrigin(location.lat, location.lng, distance);
  }

  return undefined;
}

/**
 * Estimate naval strike origin (simplified)
 * TODO: Integrate with naval tracking data
 */
function estimateNavalOrigin(
  targetLat: number,
  targetLng: number
): { lat: number; lng: number } {
  // Simple heuristic: 20km offshore
  const offsetKm = 20;
  const latOffset = offsetKm / 111; // ~111km per degree latitude

  return {
    lat: targetLat - latOffset, // Assume south of target
    lng: targetLng,
  };
}

/**
 * Estimate offset origin (simplified)
 * TODO: Use actual front line / known base data
 */
function estimateOffsetOrigin(
  targetLat: number,
  targetLng: number,
  distanceKm: number
): { lat: number; lng: number } {
  const latOffset = distanceKm / 111; // ~111km per degree latitude

  return {
    lat: targetLat - latOffset, // Assume north-south trajectory
    lng: targetLng,
  };
}

/**
 * Build animation configuration based on action type and severity
 */
function buildAnimationConfig(
  actionType: MapActionType,
  severity: EventSeverity,
  eventFrame: EventFrame
): MapAction['animation_config'] {
  const intensity = SEVERITY_TO_INTENSITY[severity];

  // Base configuration
  const config: MapAction['animation_config'] = {
    intensity,
  };

  // Action-specific configurations
  switch (actionType) {
    case 'PULSE_STRIKE':
      config.pulse_count = severity === 'critical' ? 5 : severity === 'high' ? 3 : 1;
      config.icon_size = severity === 'critical' ? 'large' : 'medium';
      break;

    case 'TRAJECTORY_MISSILE':
      config.trajectory_arc = 0.7; // High arc for ballistic missiles
      config.icon_size = 'medium';
      break;

    case 'TRAJECTORY_DRONE':
      config.trajectory_arc = 0.3; // Low arc for drones
      config.icon_size = 'small';
      break;

    case 'AREA_SHELLING':
      config.area_radius = severity === 'critical' ? 50 : 30; // pixels
      config.pulse_count = 8; // Multiple impacts
      config.icon_size = 'small';
      break;

    case 'NAVAL_STRIKE':
      config.pulse_count = 2;
      config.icon_size = 'medium';
      break;

    case 'GROUND_MOVEMENT':
      config.icon_size = 'medium';
      break;

    case 'AIR_DEFENSE':
      config.trajectory_arc = 0.9; // Steep upward trajectory
      config.icon_size = 'small';
      break;

    case 'PROTEST_MARKER':
    case 'DIPLOMATIC_ICON':
    case 'INCIDENT_MARKER':
      config.icon_size = severity === 'critical' ? 'large' : 'medium';
      break;

    case 'CYBER_INDICATOR':
      config.icon_size = 'medium';
      config.pulse_count = 1;
      break;
  }

  return config;
}

/**
 * Build popup content from EventFrame
 */
function buildPopup(eventFrame: EventFrame): MapAction['popup'] {
  const details: { casualties?: string; weapon_system?: string; target_type?: string } = {};

  // Format casualties if available
  if (eventFrame.casualties) {
    const { killed, wounded, missing, civilians } = eventFrame.casualties;
    const parts: string[] = [];

    if (killed) parts.push(`${killed} killed`);
    if (wounded) parts.push(`${wounded} wounded`);
    if (missing) parts.push(`${missing} missing`);

    if (parts.length > 0) {
      details.casualties = parts.join(', ') + (civilians ? ' (civilians)' : '');
    }
  }

  // Add weapon system if known
  if (eventFrame.weapon_system) {
    details.weapon_system = eventFrame.weapon_system;
  }

  // Add target type if known
  if (eventFrame.target_type) {
    details.target_type = eventFrame.target_type;
  }

  return {
    title: formatPopupTitle(eventFrame),
    description: eventFrame.description,
    timestamp: eventFrame.occurred_at,
    severity: eventFrame.severity,
    details: Object.keys(details).length > 0 ? details : undefined,
  };
}

/**
 * Format popup title from event data
 */
function formatPopupTitle(eventFrame: EventFrame): string {
  const typeLabel = formatEventTypeLabel(eventFrame.event_type);
  const location = eventFrame.location.display_name;

  return `${typeLabel} - ${location}`;
}

/**
 * Format event type as human-readable label
 */
function formatEventTypeLabel(eventType: EventType): string {
  const labels: Record<EventType, string> = {
    missile_strike: 'Missile Strike',
    drone_strike: 'Drone Strike',
    airstrike: 'Airstrike',
    artillery_shelling: 'Artillery Shelling',
    naval_strike: 'Naval Strike',
    ground_assault: 'Ground Assault',
    rocket_attack: 'Rocket Attack',
    air_defense: 'Air Defense',
    protest: 'Protest',
    sanction: 'Sanction',
    cyberattack: 'Cyberattack',
    diplomatic_action: 'Diplomatic Action',
    intelligence_ops: 'Intelligence Operation',
    information_warfare: 'Information Warfare',
    explosion: 'Explosion',
    accident: 'Accident',
    sabotage: 'Sabotage',
    unknown: 'Unknown Event',
  };

  return labels[eventType];
}

/**
 * Calculate z-index based on severity and action type
 *
 * Priority order:
 * 1. Critical events (highest)
 * 2. Kinetic events
 * 3. Non-kinetic events
 * 4. Incidents (lowest)
 */
function calculateZIndex(
  severity: EventSeverity,
  actionType: MapActionType
): number {
  let base = 100;

  // Severity bonus
  const severityBonus: Record<EventSeverity, number> = {
    critical: 50,
    high: 40,
    medium: 30,
    low: 20,
    minimal: 10,
  };

  // Action type bonus
  const actionBonus: Record<MapActionType, number> = {
    TRAJECTORY_MISSILE: 40,
    AREA_SHELLING: 35,
    PULSE_STRIKE: 30,
    TRAJECTORY_DRONE: 25,
    NAVAL_STRIKE: 25,
    AIR_DEFENSE: 20,
    GROUND_MOVEMENT: 15,
    CYBER_INDICATOR: 10,
    PROTEST_MARKER: 5,
    DIPLOMATIC_ICON: 5,
    INCIDENT_MARKER: 0,
  };

  return base + severityBonus[severity] + actionBonus[actionType];
}

/**
 * Batch convert multiple EventFrames to MapActions
 */
export function batchEventFramesToMapActions(
  eventFrames: EventFrame[],
  options?: Parameters<typeof eventFrameToMapAction>[1]
): MapAction[] {
  return eventFrames.map((frame) => eventFrameToMapAction(frame, options));
}

/**
 * Filter MapActions by time window
 * Useful for showing only recent events
 */
export function filterMapActionsByTimeWindow(
  actions: MapAction[],
  windowMinutes: number
): MapAction[] {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - windowMinutes * 60;

  return actions.filter((action) => {
    const eventTimestamp = action.popup?.timestamp || action.created_at;
    return eventTimestamp >= cutoff;
  });
}

/**
 * Group MapActions by location proximity
 * Useful for clustering nearby events
 */
export function groupMapActionsByProximity(
  actions: MapAction[],
  radiusKm: number = 10
): MapAction[][] {
  const groups: MapAction[][] = [];
  const processed = new Set<string>();

  for (const action of actions) {
    if (processed.has(action.id)) continue;

    const group = [action];
    processed.add(action.id);

    // Find nearby actions
    for (const other of actions) {
      if (processed.has(other.id)) continue;

      const distance = calculateDistance(
        action.target.lat,
        action.target.lng,
        other.target.lat,
        other.target.lng
      );

      if (distance <= radiusKm) {
        group.push(other);
        processed.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
