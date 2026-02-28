// Scenario Analysis - Main Exports for UI
// Simplified exports for the visualization interface

// Main calculator functions
export { calculateScenarioScores } from './calculator';
export { getImpactMatrix } from './impacts';
export { getScenarioChangelog, addChangelogEntry } from './changelog';

// Types
export type {
  EventType,
  EventFrame,
  Signal,
  ScenarioTemplate,
  ScenarioScore,
  ImpactMatrix,
  ImpactDomain,
  ImpactLevel,
  SeverityLevel,
  ScenarioChangelog,
} from '@/types/scenario';

export {
  DEFAULT_SCENARIOS,
  EVENT_WEIGHTS,
  SEVERITY_MULTIPLIERS,
} from '@/types/scenario';
