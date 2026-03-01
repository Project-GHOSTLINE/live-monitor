'use client';

import { useEffect, useState } from 'react';
import { CountryPower } from '@/lib/power/getCountryPower';
import { FactionPulse } from '@/lib/pulse/getFactionPulse';
import { ReadinessScore } from '@/lib/readiness/computeReadiness';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface LeaderIntelCinematicProps {
  leaderId: string;
  leaderName: string;
  readinessScore: number;
  readinessDelta?: number;
  anchorRect: { x: number; y: number };
  isLocked?: boolean;
  onClose?: () => void;
  onIncidentClick?: (incidentId: string) => void;
  power?: CountryPower | null;
  pulse?: FactionPulse | null;
  readiness?: ReadinessScore | null;
  mode?: 'floating' | 'embedded';
}

export function LeaderIntelCinematic({
  leaderId,
  leaderName,
  readinessScore,
  readinessDelta = 0,
  anchorRect,
  isLocked = false,
  onClose,
  onIncidentClick,
  power,
  pulse,
  readiness,
  mode = 'floating',
}: LeaderIntelCinematicProps) {
  const { t } = useLanguage();
  const [radarDots, setRadarDots] = useState<Array<{ x: number; y: number; intensity: number }>>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Set current time on client only to prevent hydration mismatch
  useEffect(() => {
    setCurrentTime(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Trigger open animation on mount (floating mode only)
  useEffect(() => {
    if (mode === 'floating') {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(true); // Embedded mode starts visible
    }
  }, [mode]);

  useEffect(() => {
    // Generate 3-10 incident dots based on pulse data
    const incidentCount = pulse?.events_6h_count || 0;
    const dotCount = Math.min(Math.max(incidentCount, 3), 10);
    const dots = Array.from({ length: dotCount }, (_, i) => ({
      x: 40 + Math.random() * 60, // 40-100% from center
      y: 40 + Math.random() * 60,
      intensity: Math.random(),
    }));
    setRadarDots(dots);
  }, [pulse?.events_6h_count]);

  const formatTime = (timestamp: number) => {
    if (!currentTime) return '—'; // Return placeholder during SSR
    const diff = currentTime - timestamp;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getThreatLevel = (score: number) => {
    if (score >= 90) return { label: 'DEFCON 2', color: 'text-red-500', bg: 'bg-red-500/20' };
    if (score >= 75) return { label: 'DEFCON 3', color: 'text-orange-500', bg: 'bg-orange-500/20' };
    if (score >= 60) return { label: 'DEFCON 4', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { label: 'DEFCON 5', color: 'text-green-500', bg: 'bg-green-500/20' };
  };

  const threat = getThreatLevel(readinessScore);

  // Calculate heat bars (0-100 normalized)
  const signalVelocity = pulse ? Math.min((pulse.events_6h_count / 20) * 100, 100) : 0;
  const severityMix = pulse
    ? ((pulse.severity_breakdown.high * 2 + pulse.severity_breakdown.med) / (pulse.events_6h_count || 1)) * 50
    : 0;
  const confidence = pulse ? pulse.confidence_score * 100 : 0;

  // Relations data (mock - replace with actual data)
  const relations = [
    { code: 'US', heat: 85, delta: 5 },
    { code: 'RU', heat: 45, delta: -3 },
    { code: 'CN', heat: 30, delta: 0 },
  ].slice(0, 3);

  // Conditional styles based on mode
  const containerClassName = mode === 'floating'
    ? `fixed z-[9999] w-[380px] h-[480px] bg-black/98 border-2 border-green-500 rounded-lg shadow-2xl shadow-green-500/50 font-mono text-xs overflow-hidden transition-all duration-150 ease-out origin-left ${
        isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`
    : 'relative w-full max-w-[420px] h-[480px] bg-black/98 border-2 border-green-500 rounded-lg shadow-2xl shadow-green-500/50 font-mono text-xs overflow-hidden';

  const containerStyle = mode === 'floating'
    ? {
        left: anchorRect.x,
        top: anchorRect.y,
      }
    : undefined;

  return (
    <div
      className={containerClassName}
      style={containerStyle}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.15) 3px)',
        }}
      />

      {/* Header */}
      <div className="relative border-b border-green-500/40 p-2.5 bg-gradient-to-r from-green-950/40 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-green-500/60 text-[8px] tracking-widest uppercase">TACTICAL INTEL</div>
            <h3 className="text-green-400 text-sm font-bold tracking-wide mt-0.5" style={{ textShadow: '0 0 8px rgba(34,197,94,0.8)' }}>
              {leaderName}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-green-500/60 text-[8px] uppercase">Readiness</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-4xl font-bold text-green-400" style={{ textShadow: '0 0 16px rgba(34,197,94,1), 0 0 32px rgba(34,197,94,0.6)' }}>
                {readinessScore}%
              </span>
              {readinessDelta !== 0 && (
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${readinessDelta > 0 ? 'text-red-400 bg-red-500/20' : 'text-green-600 bg-green-500/20'}`}>
                  {readinessDelta > 0 ? '+' : ''}{readinessDelta}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${threat.bg} ${threat.color} border-2 border-current`}>
            {threat.label}
          </div>
          <div className="text-green-500/40 text-[8px]">
            Updated {currentTime ? formatTime(currentTime) : '—'} ago
          </div>
        </div>
      </div>

      {/* 2-Column Layout: LEFT (Radar 160px) + RIGHT (Bars, Incidents, Relations 200px) */}
      <div className="relative p-3 flex gap-3">
        {/* LEFT COLUMN: Radar (160px) */}
        <div className="w-[160px] flex-shrink-0">
          <div className="relative w-full h-[160px]">
            <div className="absolute inset-0 rounded-full border-2 border-green-500/40 bg-green-950/20">
              {/* Circular grid */}
              <div className="absolute inset-2 rounded-full border border-green-500/20" />
              <div className="absolute inset-4 rounded-full border border-green-500/20" />
              <div className="absolute inset-6 rounded-full border border-green-500/20" />

              {/* Crosshairs */}
              <div className="absolute top-0 left-1/2 w-px h-full bg-green-500/20 transform -translate-x-1/2" />
              <div className="absolute left-0 top-1/2 w-full h-px bg-green-500/20 transform -translate-y-1/2" />

              {/* Radar sweep cone */}
              <div className="absolute inset-0 radar-sweep">
                <div
                  className="absolute w-full h-1/2 origin-bottom"
                  style={{
                    background: 'linear-gradient(180deg, rgba(34,197,94,0.4) 0%, transparent 100%)',
                    clipPath: 'polygon(50% 100%, 50% 0%, 100% 0%, 100% 100%)',
                  }}
                />
              </div>

              {/* Incident dots */}
              {radarDots.map((dot, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y}%`,
                    opacity: 0.6 + dot.intensity * 0.4,
                    boxShadow: '0 0 4px rgba(239,68,68,0.8)',
                  }}
                />
              ))}

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-green-500 transform -translate-x-1/2 -translate-y-1/2"
                style={{ boxShadow: '0 0 8px rgba(34,197,94,1)' }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bars + Incidents + Relations (~200px) */}
        <div className="flex-1 space-y-3">
          {/* Heat Bars */}
          <div className="space-y-2">
            {/* Signal Velocity */}
            <div>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-green-500/60 uppercase tracking-wider">Signal Velocity</span>
                <span className="text-green-400 font-bold">{Math.round(signalVelocity)}</span>
              </div>
              <div className="h-2 bg-black/60 rounded overflow-hidden border border-green-500/30">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                  style={{
                    width: `${signalVelocity}%`,
                    boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                  }}
                />
              </div>
            </div>

            {/* Severity Mix */}
            <div>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-green-500/60 uppercase tracking-wider">Severity Mix</span>
                <span className="text-green-400 font-bold">{Math.round(severityMix)}</span>
              </div>
              <div className="h-2 bg-black/60 rounded overflow-hidden border border-green-500/30">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-red-500 transition-all duration-500"
                  style={{
                    width: `${severityMix}%`,
                    boxShadow: severityMix > 50 ? '0 0 8px rgba(239,68,68,0.6)' : '0 0 8px rgba(249,115,22,0.6)',
                  }}
                />
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-green-500/60 uppercase tracking-wider">Confidence</span>
                <span className="text-green-400 font-bold">{Math.round(confidence)}</span>
              </div>
              <div className="h-2 bg-black/60 rounded overflow-hidden border border-green-500/30">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500"
                  style={{
                    width: `${confidence}%`,
                    boxShadow: '0 0 8px rgba(8,145,178,0.6)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Active Incidents - Showing 5 latest */}
          <div className="border border-green-500/30 rounded p-2 bg-gradient-to-br from-green-950/20 to-black/20">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-green-400 font-bold text-[10px] tracking-wider uppercase">
                ▸ Active Incidents
              </h4>
              {pulse && pulse.latest_items.length > 0 && (
                <span className="text-green-500/60 text-[8px] font-mono">
                  {pulse.latest_items.length}/{pulse.events_6h_count} shown
                </span>
              )}
            </div>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
              {pulse?.latest_items.slice(0, 5).map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer hover:bg-green-500/10 bg-black/20 p-1.5 rounded transition-colors border border-green-500/10 hover:border-green-500/30"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                    onIncidentClick?.(String(idx));
                  }}
                >
                  <div className="flex items-start gap-1.5 mb-0.5">
                    <span className="text-red-400 flex-shrink-0 mt-0.5">⚡</span>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-green-200 font-bold text-[11px] leading-tight mb-0.5" style={{ textShadow: '0 0 4px rgba(34,197,94,0.4)' }}>
                        {item.title}
                      </h5>
                      {item.description && (
                        <p className="text-green-500/70 text-[9px] leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="text-green-500/60 flex-shrink-0 font-mono text-[9px]">
                      {formatTime(item.time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-5 mt-0.5">
                    <span className="text-green-500/40 text-[8px]">
                      {item.source}
                    </span>
                    {item.tags && item.tags.length > 0 && (
                      <span className="text-green-500/30 text-[8px]">
                        • {item.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </a>
              )) || (
                <div className="text-green-500/40 text-center py-2 text-[10px]">
                  No recent incidents
                </div>
              )}
            </div>
          </div>

          {/* Relations Mini List */}
          <div className="border border-green-500/30 rounded p-2 bg-gradient-to-br from-green-950/20 to-black/20">
            <h4 className="text-green-400 font-bold mb-1.5 text-[10px] tracking-wider uppercase">
              ▸ Relations
            </h4>
            <div className="space-y-1.5">
              {relations.map((rel, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px]">
                  <span className="text-green-400 font-bold w-6">{rel.code}</span>
                  <div className="flex-1 h-1.5 bg-black/60 rounded overflow-hidden border border-green-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-green-400"
                      style={{
                        width: `${rel.heat}%`,
                        boxShadow: '0 0 4px rgba(34,197,94,0.5)',
                      }}
                    />
                  </div>
                  <span className={`font-mono font-bold w-7 text-right ${rel.delta > 0 ? 'text-red-400' : rel.delta < 0 ? 'text-green-600' : 'text-green-500/60'}`}>
                    {rel.delta !== 0 ? `${rel.delta > 0 ? '+' : ''}${rel.delta}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Hints */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-green-500/30 bg-black/60 px-3 py-1.5 flex items-center justify-between text-[8px] text-green-500/60 uppercase tracking-wider">
        <span>ENTER: Details</span>
        {isLocked && <span>ESC: Close</span>}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes radar-sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .radar-sweep {
          animation: radar-sweep 4s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
