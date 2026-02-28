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
  try {
    const db = getDatabase();

    if (!db) {
      console.error('[Scenarios Calculator] Database connection failed');
      throw new Error('Database connection is not available');
    }

    // Get recent feed items (last 7 days)
    // Database stores timestamps in Unix epoch seconds, not milliseconds
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    console.log(`[Scenarios Calculator] Fetching feed items from the last 7 days (since ${new Date(sevenDaysAgo * 1000).toISOString()})`);

    let recentItems: any[];
    try {
      recentItems = db
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
    } catch (dbError) {
      console.error('[Scenarios Calculator] Database query failed:', dbError);
      throw new Error('Failed to query feed items from database');
    }

    console.log(`[Scenarios Calculator] Retrieved ${recentItems.length} feed items`);

    // Handle case when no data is available
    if (!recentItems || recentItems.length === 0) {
      console.warn('[Scenarios Calculator] No recent feed items found, returning baseline scenarios');
      return generateBaselineScenarios();
    }

    // Extract event frames from feed items
    let eventFrames: EventFrame[];
    try {
      eventFrames = extractEventFrames(recentItems);
      console.log(`[Scenarios Calculator] Extracted ${eventFrames.length} event frames`);
    } catch (extractError) {
      console.error('[Scenarios Calculator] Event frame extraction failed:', extractError);
      console.warn('[Scenarios Calculator] Falling back to baseline scenarios');
      return generateBaselineScenarios();
    }

    // Generate signals from event frames
    let signals: Signal[];
    try {
      signals = generateSignals(eventFrames);
      console.log(`[Scenarios Calculator] Generated ${signals.length} signals`);
    } catch (signalError) {
      console.error('[Scenarios Calculator] Signal generation failed:', signalError);
      console.warn('[Scenarios Calculator] Falling back to baseline scenarios');
      return generateBaselineScenarios();
    }

    // Calculate scores for each scenario
    const scenarioScores: ScenarioScore[] = DEFAULT_SCENARIOS.map((template) => {
      try {
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
      } catch (scoreError) {
        console.error(`[Scenarios Calculator] Error calculating score for scenario ${template.id}:`, scoreError);
        // Return baseline scenario for this template
        return {
          scenario_id: template.id,
          probability: template.baseline_probability,
          raw_score: 0,
          active_signals: [],
          confidence: 0,
          trend: 'stable' as const,
          last_updated: Date.now(),
        };
      }
    });

    console.log(`[Scenarios Calculator] Successfully calculated ${scenarioScores.length} scenario scores`);

    // Store results in database (optional - for historical tracking)
    try {
      storeScenarioScores(scenarioScores);
    } catch (storeError) {
      console.error('[Scenarios Calculator] Failed to store scenario scores (non-critical):', storeError);
      // Continue despite storage failure
    }

    return scenarioScores;
  } catch (error) {
    console.error('[Scenarios Calculator] Critical error in calculateScenarioScores:', error);
    // Return baseline scenarios as final fallback
    console.warn('[Scenarios Calculator] Returning baseline scenarios as final fallback');
    return generateBaselineScenarios();
  }
}

/**
 * Generate baseline scenarios when no data is available
 */
function generateBaselineScenarios(): ScenarioScore[] {
  console.log('[Scenarios Calculator] Generating baseline scenarios');
  return DEFAULT_SCENARIOS.map((template) => ({
    scenario_id: template.id,
    probability: template.baseline_probability,
    raw_score: 0,
    active_signals: [],
    confidence: 0,
    trend: 'stable' as const,
    last_updated: Date.now(),
  }));
}

/**
 * Extract event frames from feed items using NLP and pattern matching
 */
function extractEventFrames(items: any[]): EventFrame[] {
  const frames: EventFrame[] = [];

  if (!items || items.length === 0) {
    console.warn('[extractEventFrames] No items provided');
    return frames;
  }

  for (const item of items) {
    try {
      const title = item.title_en?.toLowerCase() || '';

      // Skip items without titles
      if (!title) {
        continue;
      }

      // Safely parse JSON fields with error handling
      let tags: string[] = [];
      let orgs: string[] = [];
      let places: string[] = [];

      try {
        tags = item.tags ? JSON.parse(item.tags) : [];
      } catch (parseError) {
        console.warn(`[extractEventFrames] Failed to parse tags for item ${item.id}`);
      }

      try {
        orgs = item.entity_orgs ? JSON.parse(item.entity_orgs) : [];
      } catch (parseError) {
        console.warn(`[extractEventFrames] Failed to parse entity_orgs for item ${item.id}`);
      }

      try {
        places = item.entity_places ? JSON.parse(item.entity_places) : [];
      } catch (parseError) {
        console.warn(`[extractEventFrames] Failed to parse entity_places for item ${item.id}`);
      }

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
              confidence: item.reliability || 0.5, // Default reliability if missing
              feed_item_id: item.id,
              extracted_at: Date.now(),
            });

            break; // Only one event per item
          }
        }
      }
    } catch (itemError) {
      console.error(`[extractEventFrames] Error processing item ${item?.id}:`, itemError);
      // Continue processing other items
      continue;
    }
  }

  return frames;
}

/**
 * Generate signals from event frames
 */
function generateSignals(frames: EventFrame[]): Signal[] {
  const signalMap = new Map<string, Signal>();

  if (!frames || frames.length === 0) {
    console.warn('[generateSignals] No event frames provided');
    return [];
  }

  for (const frame of frames) {
    try {
      // Validate frame has required fields
      if (!frame.event_type || !frame.feed_item_id) {
        console.warn('[generateSignals] Skipping frame with missing required fields');
        continue;
      }

      // Generate safe signal ID
      const actorsStr = Array.isArray(frame.actors) && frame.actors.length > 0
        ? frame.actors.join('_').toUpperCase()
        : 'UNKNOWN';
      const signalId = `SIG_${frame.event_type.toUpperCase()}_${actorsStr}`;

      if (signalMap.has(signalId)) {
        // Update existing signal
        const signal = signalMap.get(signalId)!;
        signal.feed_item_ids.push(frame.feed_item_id);
        signal.reliability = Math.max(signal.reliability, frame.confidence || 0.5);
        signal.severity = frame.severity === 'critical' ? 'critical' : signal.severity;
        signal.timestamp = Math.max(signal.timestamp, frame.extracted_at);
      } else {
        // Create new signal
        const weight = EVENT_WEIGHTS[frame.event_type] || 0.5;
        const recencyFactor = calculateRecencyFactor(frame.extracted_at);

        signalMap.set(signalId, {
          signal_id: signalId,
          event_type: frame.event_type,
          actors: frame.actors || [],
          weight,
          reliability: frame.confidence || 0.5,
          severity: frame.severity || 'medium',
          timestamp: frame.extracted_at,
          feed_item_ids: [frame.feed_item_id],
          recency_factor: recencyFactor,
        });
      }
    } catch (frameError) {
      console.error('[generateSignals] Error processing frame:', frameError);
      // Continue processing other frames
      continue;
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
