/**
 * WORKER 1: Signal Detector
 *
 * Detects signals in feed items using keyword matching
 * Deterministic, no LLM required
 */

import { SIGNAL_RULES } from '../signals/signalDictionary';
import { DetectedSignal, SignalCode } from '../signals/signalTypes';

export interface FeedItem {
  id: number;
  title_en: string;
  title_ar?: string;
  summary_en?: string;
  published_at: number;
  tags?: string[];
}

/**
 * Detect signals in a single feed item
 */
export function detectSignals(item: FeedItem): DetectedSignal[] {
  const text = [
    item.title_en,
    item.summary_en,
    item.tags?.join(' ')
  ].filter(Boolean).join(' ').toLowerCase();

  const detected: DetectedSignal[] = [];

  for (const rule of SIGNAL_RULES) {
    const matchedKeywords = rule.keywords.filter(keyword =>
      text.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      // Confidence based on number of keyword matches
      const confidence = Math.min(1, matchedKeywords.length / 3);

      detected.push({
        code: rule.code,
        confidence,
        weight: rule.weight,
        severityBoost: rule.severityBoost,
        matchedKeywords,
        timestamp: item.published_at,
        itemId: item.id,
      });
    }
  }

  return detected;
}

/**
 * Batch detect signals for multiple feed items
 */
export function detectSignalsBatch(items: FeedItem[]): Map<number, DetectedSignal[]> {
  const results = new Map<number, DetectedSignal[]>();

  for (const item of items) {
    const signals = detectSignals(item);
    if (signals.length > 0) {
      results.set(item.id, signals);
    }
  }

  return results;
}

/**
 * Get recency decay multiplier
 * < 1h  → 1.0
 * < 6h  → 0.8
 * < 24h → 0.5
 * > 24h → 0.2
 */
export function getRecencyDecay(timestamp: number): number {
  const now = Math.floor(Date.now() / 1000);
  const ageSeconds = now - timestamp;
  const ageHours = ageSeconds / 3600;

  if (ageHours < 1) return 1.0;
  if (ageHours < 6) return 0.8;
  if (ageHours < 24) return 0.5;
  return 0.2;
}

/**
 * Calculate weighted signal score with recency decay
 */
export function calculateSignalScore(signal: DetectedSignal): number {
  const recency = getRecencyDecay(signal.timestamp);
  return signal.weight * signal.confidence * recency;
}
