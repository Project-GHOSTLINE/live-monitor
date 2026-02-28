import { FactionPulse } from '../pulse/getFactionPulse';

export interface ReadinessScore {
  readiness_score: number; // 0-100
  breakdown: {
    intensity: number; // 0-25
    severity: number; // 0-25
    proximity: number; // 0-20
    mobilization: number; // 0-15
    confidence: number; // 0-15
  };
}

/**
 * Compute explainable readiness score from faction pulse
 */
export function computeReadiness(pulse: FactionPulse | null): ReadinessScore {
  if (!pulse) {
    return {
      readiness_score: 0,
      breakdown: {
        intensity: 0,
        severity: 0,
        proximity: 0,
        mobilization: 0,
        confidence: 0,
      },
    };
  }

  // INTENSITY: Based on event velocity (0-25)
  const intensityRatio = pulse.events_24h_count > 0
    ? pulse.events_6h_count / pulse.events_24h_count
    : 0;
  const intensity = Math.min(25, Math.floor(intensityRatio * 50));

  // SEVERITY: Based on high-severity events (0-25)
  const severityRatio = pulse.events_6h_count > 0
    ? pulse.severity_breakdown.high / pulse.events_6h_count
    : 0;
  const severity = Math.min(25, Math.floor(severityRatio * 50));

  // PROXIMITY: Placeholder (0-20) - could be calculated from theater regions
  const proximity = 0;

  // MOBILIZATION: Based on mobilization signals (0-15)
  const mobilizationSignals = pulse.top_signals.filter(
    s => s.code.includes('MOBILIZATION') || s.code.includes('AIRSPACE') || s.code.includes('DEPLOYMENT')
  );
  const mobilization = Math.min(15, mobilizationSignals.length * 5);

  // CONFIDENCE: Based on data quality (0-15)
  const confidence = Math.floor(pulse.confidence_score * 15);

  const readiness_score = intensity + severity + proximity + mobilization + confidence;

  return {
    readiness_score: Math.min(100, readiness_score),
    breakdown: {
      intensity,
      severity,
      proximity,
      mobilization,
      confidence,
    },
  };
}
