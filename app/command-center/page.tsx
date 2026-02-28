'use client';

import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/shared/Navigation';
import { MilitaryForces } from '@/components/scenarios/MilitaryForces';
import { LeaderBubbles } from '@/components/command-center/LeaderBubbles';
import { EvidenceDrawer } from '@/components/command-center/EvidenceDrawer';
import { TheaterMap } from '@/components/command-center/TheaterMap';
import { ScenarioScore } from '@/types/scenario';
import { useState, useEffect } from 'react';

interface FeedItem {
  id: number;
  title_en: string;
  source_name: string;
  published_at: number;
  tags: string[];
  reliability: number;
}

interface ScenarioWithMetadata extends ScenarioScore {
  name: string;
  description: string;
}

interface CountryAggression {
  country: string;
  target: string;
  score: number; // 0-100
  trend: 'up' | 'stable' | 'down';
  defcon: 1 | 2 | 3 | 4 | 5;
}

function getThreatLevel(probability: number) {
  if (probability >= 0.95) return { level: 'DEFCON 1', color: 'from-red-600 to-red-800', label: 'IMMINENT' };
  if (probability >= 0.80) return { level: 'DEFCON 2', color: 'from-orange-600 to-red-600', label: 'CRITICAL' };
  if (probability >= 0.60) return { level: 'DEFCON 3', color: 'from-yellow-500 to-orange-500', label: 'ELEVATED' };
  if (probability >= 0.40) return { level: 'DEFCON 4', color: 'from-blue-500 to-yellow-500', label: 'MODERATE' };
  return { level: 'DEFCON 5', color: 'from-green-600 to-blue-600', label: 'LOW' };
}

// Calculate country aggression based on signals
function calculateCountryAggression(scenarios: ScenarioWithMetadata[]): CountryAggression[] {
  // This is a simplified version - in production, analyze feed items and extract country relationships
  const pairs: CountryAggression[] = [
    { country: 'IL', target: 'IR', score: 85, trend: 'up', defcon: 2 },
    { country: 'IR', target: 'IL', score: 82, trend: 'up', defcon: 2 },
    { country: 'US', target: 'IR', score: 65, trend: 'stable', defcon: 3 },
    { country: 'RU', target: 'UA', score: 78, trend: 'up', defcon: 2 },
    { country: 'CN', target: 'TW', score: 55, trend: 'up', defcon: 3 },
    { country: 'IL', target: 'LB', score: 72, trend: 'up', defcon: 2 },
  ];

  return pairs;
}

type FeedFilter = 'all' | 'military' | 'politics' | 'energy' | 'cyber';

export default function CommandCenterPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [evidenceDrawer, setEvidenceDrawer] = useState<{
    isOpen: boolean;
    country?: string;
    target?: string;
    title?: string;
  }>({ isOpen: false });

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live feed
  const { data: feedData, isLoading: feedLoading } = useQuery<{ items: FeedItem[]; total: number }>({
    queryKey: ['live-feed'],
    queryFn: async () => {
      const response = await fetch('/api/feed?limit=20');
      if (!response.ok) throw new Error('Feed error');
      return response.json();
    },
    refetchInterval: 15000,
  });

  // Fetch scenarios
  const { data: scenarioData, isLoading: scenarioLoading } = useQuery<{
    scenarios: ScenarioWithMetadata[];
    last_updated: number;
  }>({
    queryKey: ['scenarios-unified'],
    queryFn: async () => {
      const response = await fetch('/api/scenarios?sort_by=probability');
      if (!response.ok) throw new Error('Scenarios error');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const feed = feedData?.items || [];
  const scenarios = scenarioData?.scenarios || [];
  const aggression = calculateCountryAggression(scenarios);

  // Filter feed based on selected filter
  const filteredFeed = feed.filter(item => {
    if (feedFilter === 'all') return true;

    const tags = item.tags || [];
    switch (feedFilter) {
      case 'military': return tags.some(t => ['military', 'defense', 'army', 'navy', 'air-force'].includes(t.toLowerCase()));
      case 'politics': return tags.some(t => ['politics', 'diplomacy', 'government'].includes(t.toLowerCase()));
      case 'energy': return tags.some(t => ['energy', 'oil', 'gas', 'nuclear'].includes(t.toLowerCase()));
      case 'cyber': return tags.some(t => ['cyber', 'hacking', 'technology'].includes(t.toLowerCase()));
      default: return true;
    }
  });

  // Helper function for severity badge
  const getSeverityBadge = (reliability: number) => {
    if (reliability >= 4) return { label: 'HIGH', color: 'bg-green-600 text-white border-green-400' };
    if (reliability >= 3) return { label: 'MED', color: 'bg-yellow-600 text-black border-yellow-400' };
    return { label: 'LOW', color: 'bg-red-600 text-white border-red-400' };
  };

  if (feedLoading || scenarioLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-green-400 font-mono text-center space-y-4 animate-pulse">
            <div className="text-6xl font-bold mb-8">⬡</div>
            <div className="text-2xl tracking-widest">INITIALIZING COMMAND CENTER</div>
            <div className="text-sm opacity-60">ESTABLISHING TACTICAL LINKS...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400">
        {/* Scan lines */}
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent pointer-events-none animate-scan" />

        {/* Grid overlay */}
        <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, 0.05) 25%, rgba(34, 197, 94, 0.05) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, 0.05) 75%, rgba(34, 197, 94, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, 0.05) 25%, rgba(34, 197, 94, 0.05) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, 0.05) 75%, rgba(34, 197, 94, 0.05) 76%, transparent 77%, transparent)`,
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10">
          {/* Header - Global Status */}
          <div className="border-b-4 border-green-500 bg-black/80 backdrop-blur-sm p-4">
            <div className="max-w-[2000px] mx-auto flex items-center justify-between">
              <div>
                <div className="text-xs text-green-500/60 font-mono tracking-widest">UNIFIED TACTICAL COMMAND</div>
                <h1 className="text-3xl font-bold tracking-wider font-mono text-green-400 glow-text">
                  ◈ GLOBAL OPERATIONS CENTER ◈
                </h1>
              </div>

              {/* System Clock */}
              <div className="text-right">
                <div className="text-xs text-green-500/60 font-mono mb-1">ZULU TIME</div>
                <div className="text-3xl font-mono text-green-400 tabular-nums glow-text">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </div>
              </div>
            </div>
          </div>

          {/* World Leaders Command */}
          <div className="bg-black/60 border-b-2 border-green-900/40 p-4">
            <div className="max-w-[2000px] mx-auto">
              <LeaderBubbles />
            </div>
          </div>

          {/* Theater Map - C&C Style */}
          <div className="bg-black/60 border-b-2 border-green-900/40 p-4">
            <div className="max-w-[2000px] mx-auto">
              <TheaterMap />
            </div>
          </div>

          {/* DEFCON Matrix - Country Aggression */}
          <div className="bg-black/60 border-b-2 border-red-900/40 p-4">
            <div className="max-w-[2000px] mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs text-red-500/80 font-mono tracking-widest">DEFCON THREAT MATRIX</div>
                <div className="flex-1 h-px bg-red-900/40" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {aggression.map((pair, idx) => (
                  <div
                    key={idx}
                    className={`bg-black/40 border-2 p-3 cursor-pointer hover:scale-105 transition-transform group relative ${
                      pair.defcon === 1 ? 'border-red-600 animate-pulse' :
                      pair.defcon === 2 ? 'border-orange-600' :
                      pair.defcon === 3 ? 'border-yellow-600' :
                      'border-blue-600'
                    }`}
                    onClick={() => setEvidenceDrawer({
                      isOpen: true,
                      country: pair.country,
                      target: pair.target,
                      title: `${pair.country} → ${pair.target} Evidence`,
                    })}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{pair.country}</span>
                      <span className="text-red-500">→</span>
                      <span className="text-2xl">{pair.target}</span>
                    </div>

                    <div className="text-center mb-2">
                      <div className={`text-xl font-bold font-mono ${
                        pair.score >= 80 ? 'text-red-400' :
                        pair.score >= 60 ? 'text-orange-400' :
                        'text-yellow-400'
                      }`}>
                        {pair.score}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">AGGRESSION</div>
                    </div>

                    <div className={`text-center text-xs font-mono font-bold py-1 ${
                      pair.defcon === 1 ? 'bg-red-600 text-white' :
                      pair.defcon === 2 ? 'bg-orange-600 text-white' :
                      pair.defcon === 3 ? 'bg-yellow-600 text-black' :
                      'bg-blue-600 text-white'
                    }`}>
                      DEFCON {pair.defcon}
                    </div>

                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="bg-black border-2 border-green-500 p-3 text-xs font-mono whitespace-nowrap shadow-2xl shadow-green-500/30">
                        <div className="text-green-400 font-bold mb-2">WHY THIS SCORE?</div>
                        <div className="text-green-300 space-y-1">
                          <div>• Recent military movements</div>
                          <div>• Diplomatic tensions rising</div>
                          <div>• Intelligence signals detected</div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-900/40 text-green-500/60">
                          Click to view evidence
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid - Live Feed + Scenarios */}
          <div className="max-w-[2000px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* LEFT: Live Intelligence Feed */}
            <div className="bg-black/40 border-2 border-blue-900/40 h-[800px] flex flex-col">
              <div className="border-b-2 border-blue-900/40 p-4 bg-black/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-blue-500/60 font-mono tracking-widest">REAL-TIME INTELLIGENCE</div>
                    <h2 className="text-xl font-bold text-blue-400 font-mono">◆ LIVE SIGNAL FEED</h2>
                  </div>
                  <div className="text-sm font-mono text-blue-400">
                    {filteredFeed.length} / {feed.length} SIGNALS
                  </div>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2">
                  {(['all', 'military', 'politics', 'energy', 'cyber'] as FeedFilter[]).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setFeedFilter(filter)}
                      className={`px-3 py-1 text-xs font-mono font-bold border transition-all ${
                        feedFilter === filter
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-black/60 border-blue-900/40 text-blue-400 hover:border-blue-600'
                      }`}
                    >
                      {filter.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredFeed.length === 0 && (
                  <div className="text-center text-blue-500/60 font-mono py-8">
                    <div className="text-4xl mb-4">📂</div>
                    <div>NO SIGNALS MATCH FILTER</div>
                  </div>
                )}

                {filteredFeed.map((item) => {
                  const severity = getSeverityBadge(item.reliability);

                  return (
                    <div
                      key={item.id}
                      className="bg-black/60 border border-blue-900/40 hover:border-blue-500/60 p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-blue-300 font-medium leading-tight mb-2">
                            {item.title_en}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-blue-500/60 font-mono">
                            <span>{item.source_name}</span>
                            <span>•</span>
                            <span>{new Date(item.published_at * 1000).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* Severity badge */}
                        <div className="ml-3 flex flex-col gap-1">
                          <div className={`px-2 py-1 text-xs font-mono font-bold border ${severity.color}`}>
                            {severity.label}
                          </div>
                        </div>
                      </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-blue-900/40 border border-blue-700/40 text-xs font-mono text-blue-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Tactical Scenarios */}
            <div className="bg-black/40 border-2 border-green-900/40 h-[800px] flex flex-col">
              <div className="border-b-2 border-green-900/40 p-4 bg-black/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-500/60 font-mono tracking-widest">THREAT ASSESSMENT</div>
                    <h2 className="text-xl font-bold text-green-400 font-mono">▰ ACTIVE SCENARIOS</h2>
                  </div>
                  <div className="text-sm font-mono text-green-400">
                    {scenarios.length} SCENARIOS
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {scenarios.slice(0, 6).map((scenario, index) => {
                  const threat = getThreatLevel(scenario.probability);
                  const probPercent = Math.round(scenario.probability * 100);
                  // Mock delta - in production, calculate from historical data
                  const delta = Math.random() > 0.5 ? Math.floor(Math.random() * 5) : -Math.floor(Math.random() * 5);

                  return (
                    <div
                      key={scenario.scenario_id}
                      className="bg-black/60 border-2 border-green-900/40 hover:border-green-500/60 transition-all relative"
                    >
                      {/* Threat strip */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${threat.color}`} />

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono text-green-500/60">
                                #{String(index + 1).padStart(2, '0')}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-mono font-bold bg-gradient-to-r ${threat.color} text-white`}>
                                {threat.level}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-green-400 font-mono mb-1">
                              {scenario.name.toUpperCase()}
                            </h3>
                            <p className="text-xs text-green-500/70 font-mono">
                              {scenario.description}
                            </p>
                          </div>

                          <div className="ml-3 text-right">
                            <div className="text-4xl font-bold font-mono tabular-nums glow-text" style={{
                              background: `linear-gradient(135deg, ${probPercent >= 80 ? '#ef4444' : probPercent >= 60 ? '#f59e0b' : '#22c55e'} 0%, ${probPercent >= 80 ? '#dc2626' : probPercent >= 60 ? '#d97706' : '#16a34a'} 100%)`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                              {probPercent}
                            </div>
                            <div className="text-xs font-mono text-green-500/60">%</div>
                            {/* Delta indicator */}
                            {delta !== 0 && (
                              <div className={`text-xs font-mono font-bold mt-1 ${delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}% (6h)
                              </div>
                            )}
                            {delta === 0 && (
                              <div className="text-xs font-mono text-yellow-400 mt-1">
                                ━ STABLE
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mini metrics */}
                        <div className="flex items-center gap-4 text-xs font-mono text-green-500/80 pt-3 border-t border-green-900/40">
                          <div>SIGNALS: <span className="text-green-400 font-bold">{scenario.active_signals.length}</span></div>
                          <div>CONF: <span className="text-green-400 font-bold">{Math.round(scenario.confidence * 100)}%</span></div>
                          <div>
                            {scenario.trend === 'rising' && <span className="text-red-400">▲ RISING</span>}
                            {scenario.trend === 'falling' && <span className="text-green-400">▼ FALLING</span>}
                            {scenario.trend === 'stable' && <span className="text-yellow-400">━ STABLE</span>}
                          </div>
                        </div>

                        {/* Collapsible "WHY" section */}
                        <details className="mt-3 pt-3 border-t border-green-900/40">
                          <summary className="text-xs font-mono text-green-400 font-bold cursor-pointer hover:text-green-300 transition-colors">
                            ▶ WHY THIS SCORE?
                          </summary>
                          <div className="mt-3 space-y-2 text-xs font-mono text-green-500/80">
                            <div>• {scenario.active_signals.length} intelligence signals detected</div>
                            <div>• Confidence level: {Math.round(scenario.confidence * 100)}%</div>
                            <div>• Trend: {scenario.trend === 'rising' ? 'Escalating' : scenario.trend === 'falling' ? 'De-escalating' : 'Stable'}</div>
                            {scenario.active_signals.length > 0 && (
                              <button
                                onClick={() => setEvidenceDrawer({
                                  isOpen: true,
                                  title: `${scenario.name} - Evidence`,
                                })}
                                className="mt-2 px-3 py-1 bg-green-900/40 border border-green-600 text-green-400 hover:bg-green-800/40 transition-colors"
                              >
                                🔍 View Evidence
                              </button>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Drawer */}
        <EvidenceDrawer
          isOpen={evidenceDrawer.isOpen}
          onClose={() => setEvidenceDrawer({ isOpen: false })}
          country={evidenceDrawer.country}
          target={evidenceDrawer.target}
          title={evidenceDrawer.title}
        />
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
      `}</style>
    </>
  );
}
