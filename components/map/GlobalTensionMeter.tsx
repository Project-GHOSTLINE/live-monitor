'use client';

import { useMemo } from 'react';
import { MapEvent } from '@/lib/signals/signalTypes';

/**
 * Global Tension Meter - DEFCON-style threat level display
 *
 * Calculates tension score from recent events based on severity:
 * - missile: 5 points
 * - drone: 4 points
 * - airstrike: 4 points
 * - naval: 3 points
 * - tank: 3 points
 * - cyber: 2 points
 * - explosion: 4 points
 */

interface GlobalTensionMeterProps {
  events: MapEvent[];
  timeWindow?: '1h' | '6h' | '24h';
  className?: string;
}

const SEVERITY_WEIGHTS: Record<MapEvent['type'], number> = {
  missile: 5,
  drone: 4,
  airstrike: 4,
  explosion: 4,
  naval: 3,
  tank: 3,
  cyber: 2,
};

export function GlobalTensionMeter({
  events,
  timeWindow = '1h',
  className = '',
}: GlobalTensionMeterProps) {
  const { tension, level, recentCount } = useMemo(() => {
    const now = Date.now();
    const windowMs = timeWindow === '1h' ? 3600000 : timeWindow === '6h' ? 21600000 : 86400000;

    // Filter events within time window
    const recentEvents = events.filter((event) => {
      const eventTime = new Date(event.time).getTime();
      return now - eventTime <= windowMs;
    });

    // Calculate raw tension score
    const rawScore = recentEvents.reduce((sum, event) => {
      const weight = SEVERITY_WEIGHTS[event.type] || 2;
      const severityMultiplier = event.severity || 3;
      return sum + weight * severityMultiplier;
    }, 0);

    // Normalize to 0-100 scale (max expected: ~200 for extreme scenarios)
    const normalized = Math.min(Math.round((rawScore / 200) * 100), 100);

    // Determine threat level
    let threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
    if (normalized >= 80) threatLevel = 'CRITICAL';
    else if (normalized >= 60) threatLevel = 'HIGH';
    else if (normalized >= 35) threatLevel = 'ELEVATED';
    else threatLevel = 'LOW';

    return {
      tension: normalized,
      level: threatLevel,
      recentCount: recentEvents.length,
    };
  }, [events, timeWindow]);

  const barColor =
    tension >= 80
      ? 'bg-red-500'
      : tension >= 60
      ? 'bg-orange-500'
      : tension >= 35
      ? 'bg-yellow-500'
      : 'bg-green-500';

  const textColor =
    tension >= 80
      ? 'text-red-400'
      : tension >= 60
      ? 'text-orange-400'
      : tension >= 35
      ? 'text-yellow-400'
      : 'text-green-400';

  const glowColor =
    tension >= 80
      ? 'shadow-red-500/50'
      : tension >= 60
      ? 'shadow-orange-500/50'
      : tension >= 35
      ? 'shadow-yellow-500/50'
      : 'shadow-green-500/50';

  return (
    <div
      className={`bg-black/90 border border-green-500/30 rounded-lg p-4 ${glowColor} shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-green-500/70 tracking-widest uppercase">
            Global Tension Level
          </div>
          <div className="text-xs font-mono text-green-500/50">
            [{timeWindow.toUpperCase()}]
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`text-2xl font-mono font-bold ${textColor} glow-text`}>
            {tension}%
          </div>
          <div
            className={`px-3 py-1 rounded font-mono text-xs font-bold ${
              tension >= 80
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : tension >= 60
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : tension >= 35
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'bg-green-500/20 text-green-400 border border-green-500/40'
            }`}
          >
            {level}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-black/60 rounded-full overflow-hidden border border-green-500/20">
        <div
          className={`h-full ${barColor} transition-all duration-700 ease-out ${
            tension >= 80 ? 'animate-pulse' : ''
          }`}
          style={{ width: `${tension}%` }}
        />

        {/* Threshold markers */}
        <div className="absolute inset-0 flex">
          <div className="absolute left-[35%] top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-[60%] top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-[80%] top-0 bottom-0 w-px bg-white/40" />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs font-mono text-green-500/60">
          {recentCount} EVENTS IN {timeWindow.replace('h', 'HR').replace('d', 'DAY')}
        </div>

        <div className="flex gap-4 text-xs font-mono text-green-500/50">
          <span>LOW [0-34]</span>
          <span>ELEVATED [35-59]</span>
          <span>HIGH [60-79]</span>
          <span>CRITICAL [80-100]</span>
        </div>
      </div>

      <style jsx>{`
        .glow-text {
          text-shadow: 0 0 12px currentColor, 0 0 4px currentColor;
        }
      `}</style>
    </div>
  );
}
