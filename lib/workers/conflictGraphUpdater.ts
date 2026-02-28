/**
 * WORKER 3: Conflict Graph Updater
 *
 * Updates relations and tension between countries based on signals
 */

import { DetectedSignal, ConflictEdge } from '../signals/signalTypes';
import { getSignalRule } from '../signals/signalDictionary';

export interface SignalWithActors extends DetectedSignal {
  actors: string[]; // country codes involved
}

/**
 * Update conflict graph edges based on new signals
 */
export function updateConflictGraph(
  currentEdges: ConflictEdge[],
  newSignals: SignalWithActors[]
): ConflictEdge[] {
  const edgeMap = new Map<string, ConflictEdge>();

  // Initialize with current edges
  currentEdges.forEach(edge => {
    edgeMap.set(edgeKey(edge.source, edge.target), { ...edge });
  });

  // Process new signals
  for (const signal of newSignals) {
    if (signal.actors.length < 2) continue; // Need at least 2 actors

    // Create/update edges for each pair
    for (let i = 0; i < signal.actors.length; i++) {
      for (let j = i + 1; j < signal.actors.length; j++) {
        const source = signal.actors[i];
        const target = signal.actors[j];
        const key = edgeKey(source, target);

        let edge = edgeMap.get(key);
        if (!edge) {
          edge = {
            source,
            target,
            relationScore: 0,
            tension: 50,
            recentSignals: [],
            lastIncident: signal.timestamp,
          };
        }

        // Apply signal impact
        applySignalToEdge(edge, signal);

        // Update recent signals (keep last 10)
        edge.recentSignals.unshift(signal.code);
        if (edge.recentSignals.length > 10) {
          edge.recentSignals = edge.recentSignals.slice(0, 10);
        }

        edge.lastIncident = Math.max(edge.lastIncident, signal.timestamp);

        edgeMap.set(key, edge);
      }
    }
  }

  return Array.from(edgeMap.values());
}

/**
 * Apply signal impact to an edge
 */
function applySignalToEdge(edge: ConflictEdge, signal: SignalWithActors): void {
  const rule = getSignalRule(signal.code);
  if (!rule) return;

  const impacts = rule.impacts;

  // Update relation score (-100 to +100)
  if (impacts.hostility) {
    edge.relationScore -= impacts.hostility * signal.confidence;
  }
  if (impacts.tension) {
    // Tension increases hostility but less directly
    edge.relationScore -= (impacts.tension * signal.confidence) / 2;
  }

  // Update tension (0-100)
  if (impacts.tension) {
    edge.tension += impacts.tension * signal.confidence;
  }
  if (impacts.hostility) {
    edge.tension += impacts.hostility * signal.confidence;
  }

  // Special cases
  if (signal.code === 'SIG_NEGOTIATION' || signal.code === 'SIG_CEASEFIRE') {
    edge.relationScore += 5 * signal.confidence;
    edge.tension -= 5 * signal.confidence;
  }

  if (signal.code === 'SIG_ALLIANCE_SUPPORT') {
    edge.relationScore += 6 * signal.confidence;
  }

  if (signal.code === 'SIG_WEAPONS_TRANSFER') {
    edge.relationScore += 4 * signal.confidence;
  }

  // Clamp values
  edge.relationScore = Math.max(-100, Math.min(100, edge.relationScore));
  edge.tension = Math.max(0, Math.min(100, edge.tension));
}

/**
 * Generate consistent edge key
 */
function edgeKey(source: string, target: string): string {
  // Alphabetical order for consistency
  return source < target ? `${source}-${target}` : `${target}-${source}`;
}

/**
 * Calculate DEFCON level from tension score
 */
export function tensionToDEFCON(tension: number): 1 | 2 | 3 | 4 | 5 {
  if (tension >= 90) return 1;
  if (tension >= 75) return 2;
  if (tension >= 55) return 3;
  if (tension >= 35) return 4;
  return 5;
}
