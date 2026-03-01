'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface RelationEdge {
  id: number;
  entity_a: string;
  entity_b: string;
  relation_type: string;
  relation_strength: number; // 0-1
  is_mutual: boolean;
  evidence_event_frame_ids: number[];
  evidence_count: number;
  confidence: number;
  last_updated_at: number;
}

interface GlobalState {
  id: number;
  last_updated_at: number;
  global_tension_score: number; // 0-1
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  active_event_count: number;
  active_scenario_count: number;
  scenario_scores: Record<string, number>;
  version: number;
}

interface DEFCONMatrixEnhancedProps {
  onOpenEvidence?: (country: string, target: string, eventIds: number[]) => void;
}

// Map relation strength (0-1) to DEFCON level (1-5)
function strengthToDEFCON(strength: number, relationType: string): 1 | 2 | 3 | 4 | 5 {
  if (relationType === 'hostile') {
    if (strength >= 0.8) return 1; // DEFCON 1: Imminent war
    if (strength >= 0.6) return 2; // DEFCON 2: Armed forces ready
    if (strength >= 0.4) return 3; // DEFCON 3: Increase readiness
    return 4; // DEFCON 4: Increased intelligence
  }

  if (relationType === 'adversary') {
    if (strength >= 0.75) return 2;
    if (strength >= 0.5) return 3;
    return 4;
  }

  // Neutral, allied, trade_partner, etc.
  return 5; // DEFCON 5: Lowest state
}

function getRelationColor(relationType: string) {
  switch (relationType) {
    case 'hostile': return 'border-red-600';
    case 'adversary': return 'border-orange-600';
    case 'sanctioned': return 'border-yellow-600';
    case 'neutral': return 'border-blue-600';
    case 'allied': return 'border-green-600';
    case 'trade_partner': return 'border-cyan-600';
    case 'treaty_member': return 'border-purple-600';
    default: return 'border-gray-600';
  }
}

function getDEFCONColor(defcon: 1 | 2 | 3 | 4 | 5) {
  switch (defcon) {
    case 1: return 'bg-red-600 text-white';
    case 2: return 'bg-orange-600 text-white';
    case 3: return 'bg-yellow-600 text-black';
    case 4: return 'bg-blue-600 text-white';
    case 5: return 'bg-green-600 text-white';
  }
}

function getAlertLevelDisplay(level: string) {
  switch (level) {
    case 'critical': return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-900/40' };
    case 'high': return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-900/40' };
    case 'medium': return { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-900/40' };
    case 'low': return { label: 'LOW', color: 'text-green-400', bg: 'bg-green-900/40' };
    default: return { label: 'UNKNOWN', color: 'text-gray-400', bg: 'bg-gray-900/40' };
  }
}

export function DEFCONMatrixEnhanced({ onOpenEvidence }: DEFCONMatrixEnhancedProps) {
  const [minStrength, setMinStrength] = useState(0.4); // Only show significant relations
  const [filterType, setFilterType] = useState<string | null>(null);

  // Fetch global world state
  const { data: globalData, isLoading: globalLoading } = useQuery<{
    live_state: GlobalState;
    response_time_ms: number;
  }>({
    queryKey: ['global-state'],
    queryFn: async () => {
      const response = await fetch('/api/state/global');
      if (!response.ok) {
        if (response.status === 503) throw new Error('STATE_ENGINE_DISABLED');
        throw new Error('Failed to fetch global state');
      }
      return response.json();
    },
    refetchInterval: 30000, // 30s auto-refresh
    retry: false,
  });

  // Fetch relation edges - we'll query for multiple countries and aggregate
  // In production, you might want a dedicated aggregation endpoint
  const MONITORED_COUNTRIES = ['USA', 'RUS', 'CHN', 'IRN', 'ISR', 'UKR'];

  const relationQueries = MONITORED_COUNTRIES.map((country) =>
    useQuery<{ relations: RelationEdge[]; total: number }>({
      queryKey: ['relations', country, minStrength, filterType],
      queryFn: async () => {
        let url = `/api/state/relations?code=${country}&min_strength=${minStrength}`;
        if (filterType) url += `&type=${filterType}`;

        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 503) throw new Error('STATE_ENGINE_DISABLED');
          throw new Error('Failed to fetch relations');
        }
        return response.json();
      },
      refetchInterval: 30000,
      retry: false,
      enabled: !!globalData, // Only fetch if global state loaded
    })
  );

  const relationsLoading = relationQueries.some((q) => q.isLoading);
  const relationsError = relationQueries.find((q) => q.error);

  // Aggregate all relations
  const allRelations: RelationEdge[] = relationQueries.flatMap((q) => q.data?.relations || []);

  // Deduplicate relations (since A→B and B→A might both exist)
  const uniqueRelations = allRelations.reduce((acc, rel) => {
    const key = [rel.entity_a, rel.entity_b].sort().join('-');
    if (!acc[key] || rel.relation_strength > acc[key].relation_strength) {
      acc[key] = rel;
    }
    return acc;
  }, {} as Record<string, RelationEdge>);

  const relations = Object.values(uniqueRelations);

  // Feature disabled state
  if (relationsError?.message === 'STATE_ENGINE_DISABLED' || globalData === undefined && !globalLoading) {
    return (
      <div className="bg-black/40 border-2 border-gray-600/40 p-6">
        <div className="text-center text-gray-500 font-mono space-y-3">
          <div className="text-4xl">⚠️</div>
          <div className="text-lg font-bold">STATE ENGINE OFFLINE</div>
          <div className="text-sm opacity-70">DEFCON Matrix requires state engine</div>
          <div className="text-xs mt-4 px-4 py-2 bg-gray-900/60 border border-gray-700">
            Set STATE_ENABLED=true to activate
          </div>
        </div>
      </div>
    );
  }

  const globalState = globalData?.live_state;
  const alertDisplay = globalState ? getAlertLevelDisplay(globalState.alert_level) : null;

  return (
    <div className="bg-black/60 border-b-2 border-red-900/40 p-4">
      <div className="max-w-[2000px] mx-auto">
        {/* Header with Global Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-xs text-red-500/80 font-mono tracking-widest">DEFCON THREAT MATRIX</div>
            <div className="flex-1 h-px bg-red-900/40" />
          </div>

          {/* Global Tension Display */}
          {globalState && alertDisplay && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-red-500/60 font-mono">GLOBAL TENSION</div>
                <div className="text-2xl font-bold font-mono text-red-400">
                  {Math.round(globalState.global_tension_score * 100)}%
                </div>
              </div>
              <div className={`px-4 py-2 border-2 ${alertDisplay.bg} ${alertDisplay.color} font-mono font-bold`}>
                ALERT: {alertDisplay.label}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-red-500/60 font-mono">FILTER:</span>
          {['all', 'hostile', 'adversary', 'sanctioned'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type === 'all' ? null : type)}
              className={`px-3 py-1 text-xs font-mono font-bold border transition-all ${
                (type === 'all' && !filterType) || filterType === type
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-black/60 border-red-900/40 text-red-400 hover:border-red-600'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-red-500/60 font-mono">MIN STRENGTH:</span>
            <select
              value={minStrength}
              onChange={(e) => setMinStrength(parseFloat(e.target.value))}
              className="px-2 py-1 bg-black border border-red-900/40 text-red-400 text-xs font-mono"
            >
              <option value="0">0% (All)</option>
              <option value="0.3">30%</option>
              <option value="0.4">40%</option>
              <option value="0.5">50%</option>
              <option value="0.6">60%</option>
              <option value="0.7">70%</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {(globalLoading || relationsLoading) && (
          <div className="text-center py-8">
            <div className="text-red-400 font-mono animate-pulse">
              <div className="text-4xl mb-3">◈</div>
              <div>ANALYZING GLOBAL RELATIONS...</div>
            </div>
          </div>
        )}

        {/* Relations Grid */}
        {!globalLoading && !relationsLoading && (
          <>
            {relations.length === 0 ? (
              <div className="text-center text-red-500/60 font-mono py-8">
                <div className="text-4xl mb-4">📂</div>
                <div>NO RELATIONS MATCH CRITERIA</div>
                <div className="text-xs mt-2 opacity-70">
                  Try lowering minimum strength or changing filter
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {relations.map((rel) => {
                  const defcon = strengthToDEFCON(rel.relation_strength, rel.relation_type);
                  const score = Math.round(rel.relation_strength * 100);
                  const borderColor = getRelationColor(rel.relation_type);
                  const defconColor = getDEFCONColor(defcon);

                  return (
                    <div
                      key={rel.id}
                      className={`bg-black/40 border-2 ${borderColor} p-3 cursor-pointer hover:scale-105 transition-transform group relative ${
                        defcon === 1 ? 'animate-pulse' : ''
                      }`}
                      onClick={() =>
                        onOpenEvidence?.(rel.entity_a, rel.entity_b, rel.evidence_event_frame_ids)
                      }
                    >
                      {/* Country Pair */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{rel.entity_a}</span>
                        <span className="text-red-500">→</span>
                        <span className="text-2xl">{rel.entity_b}</span>
                      </div>

                      {/* Strength Score */}
                      <div className="text-center mb-2">
                        <div
                          className={`text-xl font-bold font-mono ${
                            score >= 80
                              ? 'text-red-400'
                              : score >= 60
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {score}
                        </div>
                        <div className="text-xs text-gray-500 font-mono uppercase">
                          {rel.relation_type.replace('_', ' ')}
                        </div>
                      </div>

                      {/* DEFCON Badge */}
                      <div className={`text-center text-xs font-mono font-bold py-1 ${defconColor}`}>
                        DEFCON {defcon}
                      </div>

                      {/* Mutual Indicator */}
                      {rel.is_mutual && (
                        <div className="text-center text-[10px] font-mono text-purple-400 mt-1">
                          ⇄ MUTUAL
                        </div>
                      )}

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="bg-black border-2 border-red-500 p-3 text-xs font-mono whitespace-nowrap shadow-2xl shadow-red-500/30">
                          <div className="text-red-400 font-bold mb-2">RELATION DETAILS</div>
                          <div className="text-red-300 space-y-1">
                            <div>• Strength: {Math.round(rel.relation_strength * 100)}%</div>
                            <div>• Confidence: {Math.round(rel.confidence * 100)}%</div>
                            <div>• Evidence: {rel.evidence_count} events</div>
                            <div>• Type: {rel.relation_type}</div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-red-900/40 text-red-500/60">
                            Click to view evidence
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Footer Stats */}
        {globalState && (
          <div className="mt-4 pt-4 border-t border-red-900/40 flex items-center justify-between text-xs font-mono text-red-500/60">
            <div>ACTIVE EVENTS: {globalState.active_event_count}</div>
            <div>ACTIVE SCENARIOS: {globalState.active_scenario_count}</div>
            <div>RELATIONS DISPLAYED: {relations.length}</div>
            <div>
              UPDATED: {new Date(globalState.last_updated_at * 1000).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
