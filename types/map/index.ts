/**
 * Map Types - Central Export
 *
 * EventFrame: Intelligence layer (structured military event data)
 * MapAction: Visualization layer (how events render on map)
 */

// EventFrame exports
export type {
  EventFrame,
  EventFrameInput,
  EventType,
  EventSeverity,
  LocationPrecision,
} from './EventFrame';

export {
  EVENT_TYPE_CATEGORIES,
  isKineticEvent,
  isNonKineticEvent,
  isIncidentEvent,
} from './EventFrame';

// MapAction exports
export type {
  MapAction,
  MapActionInput,
  MapActionType,
  MapActionColor,
  AnimationDuration,
} from './MapAction';

export {
  EVENT_TO_ACTION_MAPPING,
  SEVERITY_TO_COLOR_MAPPING,
  SEVERITY_TO_INTENSITY,
  ACTION_TYPE_DURATION,
} from './MapAction';
