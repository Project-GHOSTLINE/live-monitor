'use client';

import { useQuery } from '@tanstack/react-query';
import { ScenarioScore } from '@/types/scenario';
import { Navigation } from '@/components/shared/Navigation';
import { MilitaryForces } from '@/components/scenarios/MilitaryForces';
import { useState, useEffect } from 'react';

interface ScenarioWithMetadata extends ScenarioScore {
  name: string;
  description: string;
}

function getThreatLevel(probability: number): { level: string; color: string; label: string } {
  if (probability >= 0.95) return { level: 'DEFCON 1', color: 'from-red-600 to-red-800', label: 'IMMINENT' };
  if (probability >= 0.80) return { level: 'DEFCON 2', color: 'from-orange-600 to-red-600', label: 'CRITICAL' };
  if (probability >= 0.60) return { level: 'DEFCON 3', color: 'from-yellow-500 to-orange-500', label: 'ELEVATED' };
  if (probability >= 0.40) return { level: 'DEFCON 4', color: 'from-blue-500 to-yellow-500', label: 'MODERATE' };
  return { level: 'DEFCON 5', color: 'from-green-600 to-blue-600', label: 'LOW' };
}

export default function ScenariosPage() {
  const [sortBy, setSortBy] = useState<'probability' | 'updated_at'>('probability');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading, error, refetch, isFetching } = useQuery<{
    scenarios: ScenarioWithMetadata[];
    last_updated: number;
    response_time_ms?: number;
  }>({
    queryKey: ['scenarios', sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('sort_by', sortBy);
      const response = await fetch(`/api/scenarios?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30s
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const scenarios = data?.scenarios || [];
  const responseTime = data?.response_time_ms || 0;

  // Loading state - Tactical boot sequence
  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black">
          <div className="relative">
            {/* Scan lines effect */}
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent pointer-events-none animate-scan"></div>

            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <div className="text-green-400 font-mono text-center space-y-4 animate-pulse">
                  <div className="text-6xl font-bold mb-8">⬡</div>
                  <div className="text-2xl tracking-widest">INITIALIZING TACTICAL DISPLAY</div>
                  <div className="text-sm opacity-60">ACCESSING STRATEGIC DATABASE...</div>
                  <div className="flex gap-2 justify-center mt-8">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping delay-75"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping delay-150"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state - System alert
  if (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black text-red-500">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="border-4 border-red-600 bg-black/90 p-8 animate-pulse-slow">
              <div className="text-center space-y-6">
                <div className="text-8xl">⚠</div>
                <div className="text-4xl font-bold tracking-wider font-mono">SYSTEM ERROR</div>
                <div className="text-xl font-mono">TACTICAL DATABASE UNAVAILABLE</div>
                <div className="bg-red-900/20 border border-red-600 p-4 font-mono text-sm">
                  ERROR CODE: {(error as Error).message}
                </div>
                <button
                  onClick={() => refetch()}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 font-mono font-bold tracking-widest transition-all transform hover:scale-105"
                >
                  ▶ RETRY CONNECTION
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400">
        {/* Scan lines effect */}
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent pointer-events-none animate-scan"></div>

        {/* Grid overlay */}
        <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, 0.05) 25%, rgba(34, 197, 94, 0.05) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, 0.05) 75%, rgba(34, 197, 94, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, 0.05) 25%, rgba(34, 197, 94, 0.05) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, 0.05) 75%, rgba(34, 197, 94, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px'
        }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Header - Command Center */}
          <div className="mb-8 border-l-4 border-green-500 bg-black/60 backdrop-blur-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-green-500/60 font-mono tracking-widest mb-1">GLOBAL THREAT ANALYSIS SYSTEM</div>
                <h1 className="text-4xl font-bold tracking-wider font-mono text-green-400 mb-2 glow-text">
                  ▰▰▰ SCENARIO MATRIX ▰▰▰
                </h1>
                <p className="text-green-500/80 font-mono text-sm">
                  REAL-TIME PROBABILISTIC THREAT ASSESSMENT // LIVE SIGNAL PROCESSING
                </p>
              </div>

              {/* Live Clock */}
              <div className="text-right">
                <div className="text-xs text-green-500/60 font-mono mb-1">SYSTEM TIME</div>
                <div className="text-2xl font-mono text-green-400 tabular-nums glow-text">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </div>
                <div className="text-xs font-mono text-green-500/60">
                  {currentTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-4 text-xs font-mono border-t border-green-900/40 pt-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-green-500">
                  STATUS: {isFetching ? 'UPDATING...' : 'ACTIVE'}
                </span>
              </div>
              <div className="text-green-600">•</div>
              <span className="text-green-500/80">SCENARIOS: {scenarios.length}</span>
              <div className="text-green-600">•</div>
              <span className="text-green-500/80">LATENCY: {responseTime}ms</span>
              <div className="text-green-600">•</div>
              <span className="text-green-500/80">AUTO-REFRESH: 30s</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 bg-black/40 border border-green-900/40 p-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-green-500/80 tracking-wider">SORT MODE:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('probability')}
                    className={`px-4 py-2 font-mono text-xs tracking-wider transition-all ${
                      sortBy === 'probability'
                        ? 'bg-green-600 text-black font-bold'
                        : 'bg-black/60 text-green-500/60 hover:text-green-400 border border-green-900/40'
                    }`}
                  >
                    THREAT LEVEL
                  </button>
                  <button
                    onClick={() => setSortBy('updated_at')}
                    className={`px-4 py-2 font-mono text-xs tracking-wider transition-all ${
                      sortBy === 'updated_at'
                        ? 'bg-green-600 text-black font-bold'
                        : 'bg-black/60 text-green-500/60 hover:text-green-400 border border-green-900/40'
                    }`}
                  >
                    CHRONOLOGICAL
                  </button>
                </div>
              </div>

              <div className="ml-auto">
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-black/60 border border-green-900/40 text-green-400 hover:bg-green-900/20 font-mono text-xs tracking-wider transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  MANUAL REFRESH
                </button>
              </div>
            </div>
          </div>

          {/* Scenarios Grid - Tactical Display */}
          {scenarios.length === 0 ? (
            <div className="border-2 border-dashed border-green-900/40 bg-black/40 p-16 text-center">
              <div className="text-6xl mb-4 opacity-40">⬡</div>
              <div className="text-xl font-mono text-green-500/60 mb-2">NO ACTIVE THREATS DETECTED</div>
              <div className="text-sm font-mono text-green-500/40">TACTICAL DATABASE EMPTY</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scenarios.map((scenario, index) => {
                const threat = getThreatLevel(scenario.probability);
                const probPercent = Math.round(scenario.probability * 100);

                return (
                  <div
                    key={scenario.scenario_id}
                    className="bg-black/60 border-2 border-green-900/40 hover:border-green-500/60 transition-all backdrop-blur-sm group relative overflow-hidden"
                  >
                    {/* Threat Level Strip */}
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${threat.color}`}></div>

                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono text-green-500/60">
                              SCENARIO #{String(index + 1).padStart(2, '0')}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-mono font-bold bg-gradient-to-r ${threat.color} text-white`}>
                              {threat.level}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-green-400 font-mono tracking-wide mb-2 group-hover:text-green-300 transition-colors">
                            {scenario.name.toUpperCase()}
                          </h3>
                          <p className="text-sm text-green-500/70 font-mono leading-relaxed">
                            {scenario.description}
                          </p>
                        </div>

                        {/* Probability Meter */}
                        <div className="ml-4 flex flex-col items-end">
                          <div className="text-5xl font-bold font-mono tabular-nums glow-text" style={{
                            background: `linear-gradient(135deg, ${probPercent >= 80 ? '#ef4444' : probPercent >= 60 ? '#f59e0b' : '#22c55e'} 0%, ${probPercent >= 80 ? '#dc2626' : probPercent >= 60 ? '#d97706' : '#16a34a'} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>
                            {probPercent}
                          </div>
                          <div className="text-xs font-mono text-green-500/60">PERCENT</div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-green-900/40">
                        <div>
                          <div className="text-xs font-mono text-green-500/60 mb-1">SIGNALS</div>
                          <div className="text-2xl font-bold font-mono text-green-400">
                            {scenario.active_signals.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-mono text-green-500/60 mb-1">CONFIDENCE</div>
                          <div className="text-2xl font-bold font-mono text-green-400">
                            {Math.round(scenario.confidence * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-mono text-green-500/60 mb-1">TREND</div>
                          <div className={`text-xl font-bold font-mono ${
                            scenario.trend === 'rising' ? 'text-red-400' :
                            scenario.trend === 'falling' ? 'text-green-400' :
                            'text-yellow-400'
                          }`}>
                            {scenario.trend === 'rising' ? '▲' : scenario.trend === 'falling' ? '▼' : '━'}
                            <span className="text-sm ml-1">
                              {scenario.trend.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Threat Label */}
                      <div className={`inline-block px-4 py-2 font-mono text-xs font-bold tracking-widest bg-gradient-to-r ${threat.color} text-white`}>
                        THREAT LEVEL: {threat.label}
                      </div>

                      {/* Military Forces Display */}
                      <MilitaryForces scenario={scenario} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer - System Info */}
          <div className="mt-8 bg-black/40 border-l-4 border-blue-500 p-4">
            <div className="text-xs font-mono text-blue-400/80 leading-relaxed">
              <span className="font-bold text-blue-400">◆ SYSTEM NOTE:</span> Probability calculations are derived from real-time signal analysis of global news feeds.
              Confidence metrics reflect data quality and source reliability. All values update automatically every 30 seconds.
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .glow-text {
          text-shadow: 0 0 10px currentColor;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-75 {
          animation-delay: 75ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </>
  );
}
