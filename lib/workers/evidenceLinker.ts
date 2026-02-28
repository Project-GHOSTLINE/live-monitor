/**
 * WORKER 6: Evidence Linker
 *
 * Links signals to scenarios and DEFCON cards for explainability
 */

import { DetectedSignal, ConflictEdge } from '../signals/signalTypes';
import { Scenario } from './scenarioUpdater';

export interface Evidence {
  signal: DetectedSignal;
  itemId: number;
  title: string;
  source: string;
  url?: string;
  timestamp: number;
}

export interface ScenarioEvidence {
  scenario_id: string;
  evidence: Evidence[];
  topSignals: string[]; // top 3 contributing signal codes
}

export interface DEFCONEvidence {
  source: string;
  target: string;
  defcon: 1 | 2 | 3 | 4 | 5;
  evidence: Evidence[];
  topReasons: string[]; // top 3 reasons
}

/**
 * Link evidence to scenarios
 */
export function linkScenarioEvidence(
  scenarios: Scenario[],
  signals: DetectedSignal[],
  feedItems: Map<number, { title: string; source: string; url?: string }>
): ScenarioEvidence[] {
  const results: ScenarioEvidence[] = [];

  for (const scenario of scenarios) {
    // Get signals relevant to this scenario
    const relevantSignals = signals.filter(s =>
      scenario.active_signals.includes(s.code)
    );

    // Sort by score (most important first)
    relevantSignals.sort((a, b) => {
      const scoreA = a.weight * a.confidence;
      const scoreB = b.weight * b.confidence;
      return scoreB - scoreA;
    });

    // Build evidence list
    const evidence: Evidence[] = relevantSignals.slice(0, 10).map(signal => {
      const item = feedItems.get(signal.itemId);
      return {
        signal,
        itemId: signal.itemId,
        title: item?.title || 'Unknown',
        source: item?.source || 'Unknown',
        url: item?.url,
        timestamp: signal.timestamp,
      };
    });

    // Top 3 signal codes
    const topSignals = [
      ...new Set(relevantSignals.slice(0, 3).map(s => s.code)),
    ];

    results.push({
      scenario_id: scenario.scenario_id,
      evidence,
      topSignals,
    });
  }

  return results;
}

/**
 * Link evidence to DEFCON cards
 */
export function linkDEFCONEvidence(
  edges: ConflictEdge[],
  signals: DetectedSignal[],
  feedItems: Map<number, { title: string; source: string; url?: string }>
): DEFCONEvidence[] {
  const results: DEFCONEvidence[] = [];

  for (const edge of edges) {
    // Filter signals involving these countries
    const relevantSignals = signals.filter(s => {
      // This requires signals to have actor info - simplified here
      return edge.recentSignals.includes(s.code);
    });

    // Sort by recency and importance
    relevantSignals.sort((a, b) => {
      const scoreA = (a.timestamp / 1000) + a.weight;
      const scoreB = (b.timestamp / 1000) + b.weight;
      return scoreB - scoreA;
    });

    // Build evidence
    const evidence: Evidence[] = relevantSignals.slice(0, 10).map(signal => {
      const item = feedItems.get(signal.itemId);
      return {
        signal,
        itemId: signal.itemId,
        title: item?.title || 'Unknown',
        source: item?.source || 'Unknown',
        url: item?.url,
        timestamp: signal.timestamp,
      };
    });

    // Top 3 reasons (from recent signals)
    const topReasons = generateReasons(edge, relevantSignals.slice(0, 3));

    // Calculate DEFCON
    const defcon = tensionToDEFCON(edge.tension);

    results.push({
      source: edge.source,
      target: edge.target,
      defcon,
      evidence,
      topReasons,
    });
  }

  return results;
}

/**
 * Generate human-readable reasons from signals
 */
function generateReasons(edge: ConflictEdge, signals: DetectedSignal[]): string[] {
  const reasons: string[] = [];

  const reasonMap: Record<string, string> = {
    SIG_AIRSTRIKE: 'Recent airstrikes detected',
    SIG_MISSILE_LAUNCH: 'Missile launches reported',
    SIG_DRONE_STRIKE: 'Drone attacks ongoing',
    SIG_THREAT_STATEMENT: 'Escalatory rhetoric from leadership',
    SIG_MOBILIZATION: 'Military mobilization underway',
    SIG_NAVAL_INCIDENT: 'Naval confrontations in region',
    SIG_NUCLEAR_ACTIVITY: 'Nuclear program activity detected',
  };

  for (const signal of signals) {
    const reason = reasonMap[signal.code];
    if (reason && !reasons.includes(reason)) {
      reasons.push(reason);
    }
  }

  // Fallback reasons if no specific signals
  if (reasons.length === 0) {
    if (edge.tension >= 80) reasons.push('High regional tension');
    if (edge.relationScore < -50) reasons.push('Deteriorating diplomatic relations');
    reasons.push('Ongoing conflict monitoring');
  }

  return reasons.slice(0, 3);
}

/**
 * Calculate DEFCON from tension
 */
function tensionToDEFCON(tension: number): 1 | 2 | 3 | 4 | 5 {
  if (tension >= 90) return 1;
  if (tension >= 75) return 2;
  if (tension >= 55) return 3;
  if (tension >= 35) return 4;
  return 5;
}
