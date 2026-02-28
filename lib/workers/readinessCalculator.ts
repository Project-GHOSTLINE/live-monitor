/**
 * WORKER 2: Readiness Calculator
 *
 * Calculates readiness scores (0-100) for each faction based on detected signals
 */

import { DetectedSignal, ReadinessScore } from '../signals/signalTypes';
import { getSignalRule } from '../signals/signalDictionary';
import { calculateSignalScore } from './signalDetector';

export interface CountrySignals {
  countryCode: string;
  signals: DetectedSignal[];
}

/**
 * Calculate readiness score for a single country
 */
export function calculateReadiness(
  countryCode: string,
  signals: DetectedSignal[]
): ReadinessScore {
  const now = Math.floor(Date.now() / 1000);

  // Filter signals for different time windows
  const signals6h = signals.filter(s => now - s.timestamp < 6 * 3600);
  const signals24h = signals.filter(s => now - s.timestamp < 24 * 3600);

  // Calculate base readiness from all signals
  let readinessDelta = 0;

  for (const signal of signals) {
    const rule = getSignalRule(signal.code);
    if (!rule) continue;

    const readinessImpact = rule.impacts.readiness || 0;
    const score = calculateSignalScore(signal);

    // Scale impact by signal score
    readinessDelta += readinessImpact * (score / 5); // normalize by max weight
  }

  // Baseline readiness (can be adjusted per country)
  const baseReadiness = getBaseReadiness(countryCode);

  // Calculate final readiness (clamped 0-100)
  const readiness = Math.max(0, Math.min(100, baseReadiness + readinessDelta));

  // Calculate deltas
  const delta6h = calculateDelta(signals6h);
  const delta24h = calculateDelta(signals24h);

  // Get top contributing signals
  const contributingSignals = signals
    .slice()
    .sort((a, b) => calculateSignalScore(b) - calculateSignalScore(a))
    .slice(0, 5)
    .map(s => s.code);

  return {
    countryCode,
    readiness: Math.round(readiness),
    delta6h: Math.round(delta6h),
    delta24h: Math.round(delta24h),
    contributingSignals,
    lastUpdated: now,
  };
}

/**
 * Get base readiness for a country (from config or defaults)
 */
function getBaseReadiness(countryCode: string): number {
  const defaults: Record<string, number> = {
    IL: 85, // Israel - high readiness
    IR: 82, // Iran - high readiness
    RU: 78, // Russia - active conflict
    UA: 95, // Ukraine - war state
    US: 70, // USA - moderate readiness
    CN: 65, // China - moderate
    TR: 60, // Turkey - moderate
    LB: 75, // Lebanon/Hezbollah - elevated
    KP: 60, // North Korea - moderate
  };

  return defaults[countryCode] || 50;
}

/**
 * Calculate delta (change) from signals in a time window
 */
function calculateDelta(signals: DetectedSignal[]): number {
  let delta = 0;

  for (const signal of signals) {
    const rule = getSignalRule(signal.code);
    if (!rule) continue;

    const readinessImpact = rule.impacts.readiness || 0;
    const score = calculateSignalScore(signal);

    delta += readinessImpact * (score / 5);
  }

  return delta;
}

/**
 * Batch calculate readiness for multiple countries
 */
export function calculateReadinessBatch(
  countrySignals: CountrySignals[]
): ReadinessScore[] {
  return countrySignals.map(cs =>
    calculateReadiness(cs.countryCode, cs.signals)
  );
}
