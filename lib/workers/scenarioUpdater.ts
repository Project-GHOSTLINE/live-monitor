/**
 * WORKER 5: Scenario Updater
 *
 * Updates scenario probabilities based on detected signals
 */

import { DetectedSignal } from '../signals/signalTypes';
import { calculateSignalScore } from './signalDetector';

export interface Scenario {
  scenario_id: string;
  name: string;
  description: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  trend: 'rising' | 'stable' | 'falling';
  active_signals: string[]; // signal codes
  last_updated: number; // unix seconds
}

export interface ScenarioRule {
  scenario_id: string;
  triggerSignals: string[]; // signal codes that increase probability
  inhibitSignals: string[]; // signal codes that decrease probability
  baseWeight: number; // 0-1
}

/**
 * Predefined scenario rules
 */
export const SCENARIO_RULES: ScenarioRule[] = [
  {
    scenario_id: 'iran_israel_direct_conflict',
    triggerSignals: [
      'SIG_AIRSTRIKE',
      'SIG_MISSILE_LAUNCH',
      'SIG_NUCLEAR_ACTIVITY',
      'SIG_INFRASTRUCTURE_STRIKE',
      'SIG_THREAT_STATEMENT',
    ],
    inhibitSignals: ['SIG_NEGOTIATION', 'SIG_CEASEFIRE'],
    baseWeight: 0.65,
  },
  {
    scenario_id: 'gaza_escalation',
    triggerSignals: [
      'SIG_AIRSTRIKE',
      'SIG_GROUND_INCIDENT',
      'SIG_MILITARY_CASUALTIES_HIGH',
      'SIG_BORDER_TENSION',
    ],
    inhibitSignals: ['SIG_CEASEFIRE', 'SIG_NEGOTIATION'],
    baseWeight: 0.75,
  },
  {
    scenario_id: 'red_sea_disruption',
    triggerSignals: [
      'SIG_NAVAL_INCIDENT',
      'SIG_SHIPPING_DISRUPTION',
      'SIG_MISSILE_LAUNCH',
      'SIG_DRONE_STRIKE',
    ],
    inhibitSignals: ['SIG_NEGOTIATION'],
    baseWeight: 0.60,
  },
  {
    scenario_id: 'hezbollah_israel_war',
    triggerSignals: [
      'SIG_MISSILE_LAUNCH',
      'SIG_AIRSTRIKE',
      'SIG_PROXY_ACTIVITY',
      'SIG_BORDER_TENSION',
    ],
    inhibitSignals: ['SIG_CEASEFIRE'],
    baseWeight: 0.55,
  },
  {
    scenario_id: 'iran_nuclear_breakout',
    triggerSignals: [
      'SIG_NUCLEAR_ACTIVITY',
      'SIG_SANCTIONS_NEW',
      'SIG_THREAT_STATEMENT',
    ],
    inhibitSignals: ['SIG_NEGOTIATION'],
    baseWeight: 0.40,
  },
  {
    scenario_id: 'syria_reactivation',
    triggerSignals: [
      'SIG_AIRSTRIKE',
      'SIG_GROUND_INCIDENT',
      'SIG_PROXY_ACTIVITY',
    ],
    inhibitSignals: ['SIG_CEASEFIRE'],
    baseWeight: 0.30,
  },
];

/**
 * Update scenarios based on recent signals
 */
export function updateScenarios(
  currentScenarios: Scenario[],
  recentSignals: DetectedSignal[]
): Scenario[] {
  const now = Math.floor(Date.now() / 1000);
  const updated: Scenario[] = [];

  for (const rule of SCENARIO_RULES) {
    // Find existing scenario or create new
    let scenario = currentScenarios.find(s => s.scenario_id === rule.scenario_id);
    if (!scenario) {
      scenario = {
        scenario_id: rule.scenario_id,
        name: formatScenarioName(rule.scenario_id),
        description: '',
        probability: rule.baseWeight,
        confidence: 0.5,
        trend: 'stable',
        active_signals: [],
        last_updated: now,
      };
    }

    // Calculate probability adjustment
    const oldProbability = scenario.probability;
    const newProbability = calculateProbability(rule, recentSignals);

    // Determine trend
    let trend: 'rising' | 'stable' | 'falling' = 'stable';
    if (newProbability > oldProbability + 0.05) trend = 'rising';
    else if (newProbability < oldProbability - 0.05) trend = 'falling';

    // Get active signal codes
    const activeSignals = recentSignals
      .filter(s => rule.triggerSignals.includes(s.code))
      .map(s => s.code)
      .slice(0, 10); // Limit to 10

    // Calculate confidence based on signal quality
    const confidence = calculateConfidence(recentSignals, rule);

    updated.push({
      ...scenario,
      probability: newProbability,
      confidence,
      trend,
      active_signals: activeSignals,
      last_updated: now,
    });
  }

  return updated.sort((a, b) => b.probability - a.probability);
}

/**
 * Calculate scenario probability from signals
 */
function calculateProbability(
  rule: ScenarioRule,
  signals: DetectedSignal[]
): number {
  let adjustment = 0;

  // Positive adjustment from trigger signals
  for (const signal of signals) {
    if (rule.triggerSignals.includes(signal.code)) {
      const score = calculateSignalScore(signal);
      adjustment += score * 0.02; // Scale factor
    }

    if (rule.inhibitSignals.includes(signal.code)) {
      const score = calculateSignalScore(signal);
      adjustment -= score * 0.03; // Stronger inhibit
    }
  }

  const newProb = rule.baseWeight + adjustment;
  return Math.max(0, Math.min(1, newProb));
}

/**
 * Calculate confidence based on signal quality and quantity
 */
function calculateConfidence(
  signals: DetectedSignal[],
  rule: ScenarioRule
): number {
  const relevantSignals = signals.filter(s =>
    rule.triggerSignals.includes(s.code) || rule.inhibitSignals.includes(s.code)
  );

  if (relevantSignals.length === 0) return 0.3;

  // Average confidence of relevant signals
  const avgConfidence =
    relevantSignals.reduce((sum, s) => sum + s.confidence, 0) /
    relevantSignals.length;

  // Boost by number of signals (more data = more confident)
  const quantityBoost = Math.min(0.3, relevantSignals.length * 0.05);

  return Math.min(1, avgConfidence + quantityBoost);
}

/**
 * Format scenario ID to human-readable name
 */
function formatScenarioName(id: string): string {
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
