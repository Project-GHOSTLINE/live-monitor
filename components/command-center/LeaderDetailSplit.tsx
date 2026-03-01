'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CountryPower } from '@/lib/power/getCountryPower';
import { FactionPulse } from '@/lib/pulse/getFactionPulse';
import { ReadinessScore } from '@/lib/readiness/computeReadiness';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LeaderIntelCinematic } from './LeaderIntelCinematic';

interface MilitaryAssets {
  ships: number;
  aircraft_carriers: number;
  submarines: number;
  fighter_jets: number;
  bombers: number;
  tanks: number;
  artillery: number;
  troops: number;
  nuclear_warheads: number;
}

interface Economy {
  gdp_billions: number;
  military_budget_billions: number;
  defense_spending_percent: number;
}

interface Leader {
  country: string;
  countryCode: string;
  flag: string;
  avatar?: string;
  leader: string;
  title: string;
  tagline: string;
  stance: 'aggressive' | 'defensive' | 'neutral';
  readiness: number;
  relations: { [key: string]: number };
  military: MilitaryAssets;
  economy: Economy;
  allies: string[];
  conflicts: string[];
}

interface LeaderDetailSplitProps {
  leader: Leader;
  power?: CountryPower | null;
  pulse?: FactionPulse | null;
  readiness?: ReadinessScore | null;
  onClose: () => void;
  onIncidentClick?: (incidentId: string) => void;
}

export function LeaderDetailSplit({
  leader,
  power,
  pulse,
  readiness,
  onClose,
  onIncidentClick,
}: LeaderDetailSplitProps) {
  const { t } = useLanguage();

  const getThreatLevel = (score: number) => {
    if (score >= 90) return { label: 'DEFCON 2', color: 'text-red-500', bg: 'bg-red-500/20' };
    if (score >= 75) return { label: 'DEFCON 3', color: 'text-orange-500', bg: 'bg-orange-500/20' };
    if (score >= 60) return { label: 'DEFCON 4', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { label: 'DEFCON 5', color: 'text-green-500', bg: 'bg-green-500/20' };
  };

  const threat = getThreatLevel(readiness?.readiness_score || leader.readiness);
  const readinessScore = readiness?.readiness_score || leader.readiness;

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/95 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 bg-black/90 border-2 border-green-500 rounded text-green-400 hover:bg-green-500/20 font-mono text-xl font-bold transition-colors z-10"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Main container - 2 columns */}
      <div className="w-full max-w-7xl h-full max-h-[90vh] flex gap-6">
        {/* LEFT COLUMN - Leader Detail (60%) */}
        <div className="flex-[6] bg-black/80 border-2 border-green-500 rounded-lg p-8 overflow-y-auto font-mono">
          {/* Header */}
          <div className="mb-8 pb-4 border-b-2 border-green-500/40">
            <div className="flex items-start justify-between gap-6">
              {/* Portrait */}
              <div className="relative w-48 h-64 flex-shrink-0">
                <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-gray-900 via-black to-black shadow-2xl" style={{
                  clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                }}>
                  {leader.avatar ? (
                    <Image
                      src={leader.avatar}
                      alt={leader.leader}
                      fill
                      className="object-cover object-top scale-125"
                      sizes="192px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-90">
                      {leader.flag}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="text-sm text-green-500/60 tracking-widest uppercase mb-2">
                  {leader.title}
                </div>
                <h1 className="text-5xl font-bold text-green-400 tracking-wider mb-2" style={{ textShadow: '0 0 16px rgba(34,197,94,0.8)' }}>
                  {leader.country}
                </h1>
                <div className="text-2xl text-green-300 mb-4">
                  {leader.leader}
                </div>
                <div className="text-lg text-green-500/70 italic mb-6">
                  {leader.tagline}
                </div>

                {/* Stats Row */}
                <div className="flex gap-4 items-center">
                  <div className={`px-4 py-2 rounded text-sm font-bold uppercase tracking-wider ${threat.bg} ${threat.color} border-2 border-current`}>
                    {threat.label}
                  </div>
                  <div className="px-4 py-2 bg-black/60 border-2 border-green-500/40 rounded">
                    <div className="text-xs text-green-500/60 uppercase">Readiness</div>
                    <div className="text-3xl font-bold text-green-400" style={{ textShadow: '0 0 12px rgba(34,197,94,1)' }}>
                      {readinessScore}%
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-black/60 border-2 border-green-500/40 rounded">
                    <div className="text-xs text-green-500/60 uppercase">Stance</div>
                    <div className="text-xl font-bold">
                      {leader.stance === 'aggressive' && <span className="text-red-400">⚔️ Aggressive</span>}
                      {leader.stance === 'defensive' && <span className="text-blue-400">🛡️ Defensive</span>}
                      {leader.stance === 'neutral' && <span className="text-gray-400">⚖️ Neutral</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Military Assets */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4 tracking-wider">
              ▸ MILITARY ASSETS
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Ships</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.ships}</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Carriers</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.aircraft_carriers}</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Submarines</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.submarines}</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Fighter Jets</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.fighter_jets}</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Bombers</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.bombers}</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Tanks</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.tanks}</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Artillery</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.artillery}</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Troops (k)</div>
                <div className="text-2xl font-bold text-green-400">{leader.military.troops}k</div>
              </div>
              <div className="bg-black/40 border border-red-500/30 rounded p-3">
                <div className="text-xs text-red-500/60 uppercase mb-1">Nuclear</div>
                <div className="text-2xl font-bold text-red-400">{leader.military.nuclear_warheads}</div>
              </div>
            </div>
          </div>

          {/* Economy */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4 tracking-wider">
              ▸ ECONOMY
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">GDP (Billions)</div>
                <div className="text-2xl font-bold text-green-400">${leader.economy.gdp_billions}B</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Military Budget</div>
                <div className="text-2xl font-bold text-green-400">${leader.economy.military_budget_billions}B</div>
              </div>
              <div className="bg-black/40 border border-green-500/30 rounded p-3">
                <div className="text-xs text-green-500/60 uppercase mb-1">Defense %</div>
                <div className="text-2xl font-bold text-green-400">{leader.economy.defense_spending_percent}%</div>
              </div>
            </div>
          </div>

          {/* Relations */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4 tracking-wider">
              ▸ INTERNATIONAL RELATIONS
            </h2>
            <div className="space-y-3">
              {Object.entries(leader.relations).map(([code, value]) => (
                <div key={code} className="flex items-center gap-4">
                  <div className="text-xl font-bold text-green-400 w-16">{code}</div>
                  <div className="flex-1 h-6 bg-black/60 rounded overflow-hidden border border-green-500/30">
                    <div
                      className={`h-full transition-all duration-500 ${
                        value > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                        value > 0 ? 'bg-gradient-to-r from-blue-600 to-blue-400' :
                        value > -50 ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                        'bg-gradient-to-r from-red-600 to-red-400'
                      }`}
                      style={{
                        width: `${Math.abs(value)}%`,
                        marginLeft: value < 0 ? `${100 - Math.abs(value)}%` : '0',
                      }}
                    />
                  </div>
                  <div className="text-lg font-bold w-16 text-right">
                    {value > 0 ? '+' : ''}{value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allies & Conflicts */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-green-400 mb-3 tracking-wider">
                ▸ ALLIES
              </h2>
              <div className="flex flex-wrap gap-2">
                {leader.allies.map((ally) => (
                  <div key={ally} className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded text-green-300 font-bold">
                    {ally}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400 mb-3 tracking-wider">
                ▸ CONFLICTS
              </h2>
              <div className="flex flex-wrap gap-2">
                {leader.conflicts.length > 0 ? (
                  leader.conflicts.map((conflict) => (
                    <div key={conflict} className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded text-red-300 font-bold">
                      {conflict}
                    </div>
                  ))
                ) : (
                  <div className="text-green-500/40 italic">None active</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Intel Card Embedded (40%) */}
        <div className="flex-[4] flex items-start justify-center pt-8">
          <LeaderIntelCinematic
            leaderId={leader.countryCode}
            leaderName={leader.country}
            readinessScore={readinessScore}
            readinessDelta={0}
            anchorRect={{ x: 0, y: 0 }}
            onIncidentClick={onIncidentClick}
            power={power}
            pulse={pulse}
            readiness={readiness}
            mode="embedded"
          />
        </div>
      </div>
    </div>
  );
}
