import { getDatabase } from '@/lib/db/client';
import {
  ScenarioScore,
  Signal,
  EventFrame,
  DEFAULT_SCENARIOS,
  EVENT_WEIGHTS,
  SEVERITY_MULTIPLIERS,
} from '@/types/scenario';

/**
 * Calculate probability scores for all scenarios based on recent events
 */
export async function calculateScenarioScores(): Promise<ScenarioScore[]> {
  const db = getDatabase();

  // Get recent feed items (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const recentItems = db
    .prepare(
      `
    SELECT id, title_en, tags, reliability, published_at, entity_orgs, entity_places
    FROM feed_items
    WHERE published_at >= ?
    ORDER BY published_at DESC
    LIMIT 1000
  `
    )
    .all(sevenDaysAgo) as any[];

  // Extract event frames from feed items
  const eventFrames = extractEventFrames(recentItems);

  // Generate signals from event frames
  const signals = generateSignals(eventFrames);

  // Calculate scores for each scenario
  const scenarioScores: ScenarioScore[] = DEFAULT_SCENARIOS.map((template) => {
    const relevantSignals = filterRelevantSignals(signals, template);
    const rawScore = calculateRawScore(relevantSignals, template);
    const probability = normalizeProbability(rawScore, template.baseline_probability);
    const confidence = calculateConfidence(relevantSignals);
    const trend = determineTrend(template.id, probability);

    return {
      scenario_id: template.id,
      probability,
      raw_score: rawScore,
      active_signals: relevantSignals,
      confidence,
      trend,
      last_updated: Date.now(),
    };
  });

  // Store results in database (optional - for historical tracking)
  storeScenarioScores(scenarioScores);

  return scenarioScores;
}

/**
 * Extract event frames from feed items using NLP and pattern matching
 */
function extractEventFrames(items: any[]): EventFrame[] {
  const frames: EventFrame[] = [];

  for (const item of items) {
    const title = item.title_en?.toLowerCase() || '';
    const tags = item.tags ? JSON.parse(item.tags) : [];
    const orgs = item.entity_orgs ? JSON.parse(item.entity_orgs) : [];
    const places = item.entity_places ? JSON.parse(item.entity_places) : [];

    // Pattern matching for event types
    const eventPatterns: Record<string, RegExp[]> = {
      strike: [/strike/i, /attack/i, /bombing/i, /airstrike/i, /missile/i],
      protest: [/protest/i, /demonstration/i, /rally/i, /march/i],
      sanction: [/sanction/i, /embargo/i, /restriction/i],
      border_closure: [/border.*clos/i, /crossing.*clos/i],
      warning: [/warning/i, /threaten/i, /alert/i],
      negotiation: [/negotiat/i, /talks/i, /dialogue/i, /mediation/i],
      cyber_attack: [/cyber/i, /hack/i, /breach/i],
      troop_movement: [/troop/i, /military.*mov/i, /deployment/i],
      diplomatic_expulsion: [/expel.*diplomat/i, /ambassador.*recall/i],
      aid_blockage: [/aid.*block/i, /humanitarian.*prevent/i],
      infrastructure_damage: [/infrastructure/i, /power.*outage/i, /facility.*damage/i],
      civilian_casualties: [/civilian.*kill/i, /casualt/i, /death/i],
      policy_change: [/policy/i, /legislation/i, /law.*pass/i],
      alliance_shift: [/alliance/i, /coalition/i, /partnership/i],
      economic_disruption: [/economic/i, /trade.*disrupt/i, /market/i],
    };

    // Detect event type
    for (const [eventType, patterns] of Object.entries(eventPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(title)) {
          // Determine severity
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          if (title.includes('major') || title.includes('massive') || title.includes('critical')) {
            severity = 'critical';
          } else if (title.includes('significant') || title.includes('large')) {
            severity = 'high';
          } else if (title.includes('minor') || title.includes('small')) {
            severity = 'low';
          }

          frames.push({
            event_type: eventType as any,
            actors: orgs,
            location: places[0] || undefined,
            severity,
            confidence: item.reliability,
            feed_item_id: item.id,
            extracted_at: Date.now(),
          });

          break; // Only one event per item
        }
      }
    }
  }

  return frames;
}

/**
 * Generate signals from event frames
 */
function generateSignals(frames: EventFrame[]): Signal[] {
  const signalMap = new Map<string, Signal>();

  for (const frame of frames) {
    const signalId = `SIG_${frame.event_type.toUpperCase()}_${frame.actors.join('_').toUpperCase()}`;

    if (signalMap.has(signalId)) {
      // Update existing signal
      const signal = signalMap.get(signalId)!;
      signal.feed_item_ids.push(frame.feed_item_id);
      signal.reliability = Math.max(signal.reliability, frame.confidence);
      signal.severity = frame.severity === 'critical' ? 'critical' : signal.severity;
      signal.timestamp = Math.max(signal.timestamp, frame.extracted_at);
    } else {
      // Create new signal
      const weight = EVENT_WEIGHTS[frame.event_type] || 0.5;
      const recencyFactor = calculateRecencyFactor(frame.extracted_at);

      signalMap.set(signalId, {
        signal_id: signalId,
        event_type: frame.event_type,
        actors: frame.actors,
        weight,
        reliability: frame.confidence,
        severity: frame.severity,
        timestamp: frame.extracted_at,
        feed_item_ids: [frame.feed_item_id],
        recency_factor: recencyFactor,
      });
    }
  }

  return Array.from(signalMap.values());
}

/**
 * Calculate recency factor (exponential decay)
 */
function calculateRecencyFactor(timestamp: number): number {
  const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  const halfLife = 48; // 48 hours
  return Math.exp(-Math.log(2) * (ageInHours / halfLife));
}

/**
 * Filter signals relevant to a scenario
 */
function filterRelevantSignals(signals: Signal[], template: any): Signal[] {
  return signals.filter((signal) => {
    const signalType = signal.signal_id.split('_')[1]?.toLowerCase();

    // Check if signal is in boost or required signals
    const isBoost = template.boost_signals.some((s: string) => s.toLowerCase().includes(signalType));
    const isRequired = template.required_signals.some((s: string) => s.toLowerCase().includes(signalType));
    const isInhibit = template.inhibit_signals.some((s: string) => s.toLowerCase().includes(signalType));

    return (isBoost || isRequired) && !isInhibit;
  });
}

/**
 * Calculate raw score from signals
 */
function calculateRawScore(signals: Signal[], template: any): number {
  let score = 0;

  for (const signal of signals) {
    const severityMultiplier = SEVERITY_MULTIPLIERS[signal.severity] || 1.0;
    const signalScore = signal.weight * signal.reliability * signal.recency_factor * severityMultiplier;
    score += signalScore;
  }

  return score;
}

/**
 * Normalize probability between 0 and 1
 */
function normalizeProbability(rawScore: number, baseline: number): number {
  // Sigmoid-like normalization
  const normalized = baseline + (1 - baseline) * (1 - Math.exp(-rawScore / 5));
  return Math.min(1, Math.max(0, normalized));
}

/**
 * Calculate confidence based on signal quality
 */
function calculateConfidence(signals: Signal[]): number {
  if (signals.length === 0) return 0;

  const avgReliability = signals.reduce((sum, s) => sum + s.reliability, 0) / signals.length;
  const sourceCount = Math.min(signals.length / 10, 1); // Cap at 10 signals
  return avgReliability * sourceCount;
}

/**
 * Determine trend by comparing with historical data
 */
function determineTrend(scenarioId: string, currentProbability: number): 'rising' | 'stable' | 'falling' {
  const db = getDatabase();

  try {
    const historical = db
      .prepare(
        `
      SELECT probability FROM scenario_scores
      WHERE scenario_id = ?
      ORDER BY calculated_at DESC
      LIMIT 1
    `
      )
      .get(scenarioId) as any;

    if (!historical) return 'stable';

    const diff = currentProbability - historical.probability;
    if (diff > 0.05) return 'rising';
    if (diff < -0.05) return 'falling';
    return 'stable';
  } catch {
    return 'stable';
  }
}

/**
 * Store scenario scores in database for historical tracking
 */
function storeScenarioScores(scores: ScenarioScore[]): void {
  const db = getDatabase();

  try {
    // Create table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS scenario_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario_id TEXT NOT NULL,
        probability REAL NOT NULL,
        raw_score REAL NOT NULL,
        confidence REAL NOT NULL,
        trend TEXT NOT NULL,
        signal_count INTEGER NOT NULL,
        calculated_at INTEGER NOT NULL
      )
    `);

    const stmt = db.prepare(`
      INSERT INTO scenario_scores (scenario_id, probability, raw_score, confidence, trend, signal_count, calculated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const score of scores) {
      stmt.run(
        score.scenario_id,
        score.probability,
        score.raw_score,
        score.confidence,
        score.trend,
        score.active_signals.length,
        Date.now()
      );
    }
  } catch (error) {
    console.error('Error storing scenario scores:', error);
  }
}
