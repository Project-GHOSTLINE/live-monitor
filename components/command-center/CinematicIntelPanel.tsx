'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface ReadinessBreakdown {
  military: number;
  economic: number;
  political: number;
  diplomatic: number;
  cyber: number;
  overall: number;
}

interface CountryState {
  country_code: string;
  country_name: string;
  readiness: ReadinessBreakdown;
  alert_status: string;
  active_signals: string[];
  active_events: number[];
  last_updated_at: number;
  confidence: number;
}

interface CinematicIntelPanelProps {
  onOpenEvidence?: (country: string, eventIds: number[]) => void;
}

const COUNTRY_CONFIGS = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺' },
  { code: 'CHN', name: 'China', flag: '🇨🇳' },
  { code: 'IRN', name: 'Iran', flag: '🇮🇷' },
  { code: 'ISR', name: 'Israel', flag: '🇮🇱' },
  { code: 'UKR', name: 'Ukraine', flag: '🇺🇦' },
];

const COMPONENT_LABELS = [
  { key: 'military', label: 'MILITARY', icon: '⚔️', color: 'from-red-600 to-red-800' },
  { key: 'economic', label: 'ECONOMIC', icon: '💰', color: 'from-green-600 to-green-800' },
  { key: 'political', label: 'POLITICAL', icon: '🏛️', color: 'from-blue-600 to-blue-800' },
  { key: 'diplomatic', label: 'DIPLOMATIC', icon: '🤝', color: 'from-purple-600 to-purple-800' },
  { key: 'cyber', label: 'CYBER', icon: '🔒', color: 'from-cyan-600 to-cyan-800' },
] as const;

function getAlertColor(status: string) {
  switch (status.toLowerCase()) {
    case 'critical': return 'text-red-400 animate-pulse';
    case 'heightened': return 'text-orange-400';
    case 'elevated': return 'text-yellow-400';
    case 'guarded': return 'text-green-400';
    default: return 'text-blue-400';
  }
}

function getScoreColor(score: number) {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 25) return 'text-orange-400';
  return 'text-red-400';
}

export function CinematicIntelPanel({ onOpenEvidence }: CinematicIntelPanelProps) {
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [timeWindow, setTimeWindow] = useState(24);

  const { data, isLoading, error } = useQuery<{ country: CountryState; response_time_ms: number }>({
    queryKey: ['country-state', selectedCountry, timeWindow],
    queryFn: async () => {
      const response = await fetch(`/api/state/country?code=${selectedCountry}&window=${timeWindow}`);
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('STATE_ENGINE_DISABLED');
        }
        throw new Error('Failed to fetch country state');
      }
      return response.json();
    },
    refetchInterval: 30000, // 30s auto-refresh
    retry: false,
  });

  const countryState = data?.country;

  // Feature disabled state
  if (error && error.message === 'STATE_ENGINE_DISABLED') {
    return (
      <div className="bg-black/40 border-2 border-gray-600/40 p-6">
        <div className="text-center text-gray-500 font-mono space-y-3">
          <div className="text-4xl">⚠️</div>
          <div className="text-lg font-bold">STATE ENGINE OFFLINE</div>
          <div className="text-sm opacity-70">Feature flag disabled</div>
          <div className="text-xs mt-4 px-4 py-2 bg-gray-900/60 border border-gray-700">
            Set STATE_ENABLED=true to activate
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border-2 border-green-900/40">
      {/* Header - Country Selector */}
      <div className="border-b-2 border-green-900/40 p-4 bg-black/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-green-500/60 font-mono tracking-widest">COUNTRY READINESS ASSESSMENT</div>
            <h2 className="text-xl font-bold text-green-400 font-mono">◆ CINEMATIC INTEL PANEL</h2>
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-500/60 font-mono">WINDOW:</span>
            {[6, 24, 48, 72].map(hours => (
              <button
                key={hours}
                onClick={() => setTimeWindow(hours)}
                className={`px-3 py-1 text-xs font-mono font-bold border transition-all ${
                  timeWindow === hours
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-black/60 border-green-900/40 text-green-400 hover:border-green-600'
                }`}
              >
                {hours}H
              </button>
            ))}
          </div>
        </div>

        {/* Country Tabs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {COUNTRY_CONFIGS.map(country => (
            <button
              key={country.code}
              onClick={() => setSelectedCountry(country.code)}
              className={`p-2 text-center font-mono border transition-all ${
                selectedCountry === country.code
                  ? 'bg-green-600 border-green-400 text-white scale-105'
                  : 'bg-black/60 border-green-900/40 text-green-400 hover:border-green-600'
              }`}
            >
              <div className="text-2xl mb-1">{country.flag}</div>
              <div className="text-xs font-bold">{country.code}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="text-green-400 font-mono animate-pulse">
            <div className="text-4xl mb-3">◈</div>
            <div>ANALYZING {selectedCountry}...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && error.message !== 'STATE_ENGINE_DISABLED' && (
        <div className="p-8 text-center text-red-400 font-mono">
          <div className="text-4xl mb-3">⚠️</div>
          <div>DATA UNAVAILABLE</div>
          <div className="text-xs mt-2 opacity-70">{error.message}</div>
        </div>
      )}

      {/* Country State Display */}
      {countryState && (
        <div className="p-6 space-y-6">
          {/* Overall Readiness */}
          <div className="bg-black/60 border-2 border-green-700/40 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-green-500/60 font-mono">OVERALL READINESS</div>
                <h3 className="text-2xl font-bold text-green-400 font-mono">{countryState.country_name}</h3>
              </div>
              <div className="text-right">
                <div className={`text-6xl font-bold font-mono tabular-nums ${getScoreColor(countryState.readiness.overall)}`}>
                  {countryState.readiness.overall}
                </div>
                <div className="text-xs text-green-500/60 font-mono">SCORE</div>
              </div>
            </div>

            {/* Alert Status */}
            <div className="flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-green-500/60">ALERT STATUS: </span>
                <span className={`font-bold ${getAlertColor(countryState.alert_status)}`}>
                  {countryState.alert_status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-green-500/60">CONFIDENCE: </span>
                <span className="text-green-400 font-bold">{Math.round(countryState.confidence * 100)}%</span>
              </div>
              <div>
                <span className="text-green-500/60">SIGNALS: </span>
                <span className="text-green-400 font-bold">{countryState.active_signals.length}</span>
              </div>
            </div>
          </div>

          {/* Component Breakdown - Animated Bars */}
          <div className="space-y-4">
            <div className="text-xs text-green-500/60 font-mono tracking-widest mb-2">COMPONENT BREAKDOWN</div>

            {COMPONENT_LABELS.map(({ key, label, icon, color }) => {
              const score = countryState.readiness[key as keyof ReadinessBreakdown];

              return (
                <div key={key} className="bg-black/60 border border-green-900/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm font-mono font-bold text-green-400">{label}</span>
                    </div>
                    <span className={`text-2xl font-bold font-mono tabular-nums ${getScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="relative h-3 bg-gray-900 border border-green-900/40 overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
                      style={{ width: `${score}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                    {/* Grid lines */}
                    <div className="absolute inset-0 grid grid-cols-10 opacity-20">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border-r border-green-900" />
                      ))}
                    </div>
                  </div>

                  {/* Score threshold indicators */}
                  <div className="flex justify-between text-[10px] font-mono text-green-500/40 mt-1">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Signals */}
          {countryState.active_signals.length > 0 && (
            <div className="bg-black/60 border border-green-900/40 p-4">
              <div className="text-xs text-green-500/60 font-mono mb-3">ACTIVE INTELLIGENCE SIGNALS</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {countryState.active_signals.map((signal, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-green-900/20 border border-green-700/40 text-xs font-mono text-green-300"
                  >
                    <span className="text-green-500/60">◆</span> {signal.replace('SIG_', '').replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Button */}
          {countryState.active_events.length > 0 && onOpenEvidence && (
            <button
              onClick={() => onOpenEvidence(selectedCountry, countryState.active_events)}
              className="w-full py-3 bg-green-900/40 border-2 border-green-600 text-green-400 font-mono font-bold hover:bg-green-800/40 transition-colors"
            >
              🔍 VIEW {countryState.active_events.length} SUPPORTING EVENTS
            </button>
          )}

          {/* Data missing fallback */}
          {countryState.active_events.length === 0 && (
            <div className="text-center text-green-500/40 font-mono text-xs py-4">
              — NO ACTIVE EVENTS IN TIME WINDOW —
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-[10px] font-mono text-green-500/40 pt-3 border-t border-green-900/40">
            <div>
              LAST UPDATED: {new Date(countryState.last_updated_at * 1000).toLocaleString()}
            </div>
            <div>
              API RESPONSE: {data?.response_time_ms}ms
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
