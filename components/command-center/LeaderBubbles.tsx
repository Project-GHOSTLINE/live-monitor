'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MilitaryAssets {
  ships: number;
  aircraft_carriers: number;
  submarines: number;
  fighter_jets: number;
  bombers: number;
  tanks: number;
  artillery: number;
  troops: number; // in thousands
  nuclear_warheads: number;
}

interface Economy {
  gdp_billions: number; // in billions USD
  military_budget_billions: number;
  defense_spending_percent: number;
}

interface Leader {
  country: string;
  countryCode: string;
  flag: string;
  avatar?: string; // Path to caricature image
  leader: string;
  title: string;
  tagline: string; // C&C style tagline
  stance: 'aggressive' | 'defensive' | 'neutral';
  readiness: number; // 0-100
  relations: { [key: string]: number }; // -100 to 100
  military: MilitaryAssets;
  economy: Economy;
  allies: string[]; // Country codes
  conflicts: string[]; // Active conflicts with these countries
}

const WORLD_LEADERS: Leader[] = [
  {
    country: 'Israel',
    countryCode: 'IL',
    flag: '🇮🇱',
    avatar: '/leaders/netanyahu.png',
    leader: 'Netanyahu',
    title: 'Prime Minister',
    tagline: '"Iron Dome? Iron WILL."',
    stance: 'aggressive',
    readiness: 92,
    relations: { IR: -95, US: 85, LB: -70, SY: -80 },
    military: {
      ships: 65,
      aircraft_carriers: 0,
      submarines: 5,
      fighter_jets: 340,
      bombers: 0,
      tanks: 2760,
      artillery: 1500,
      troops: 170,
      nuclear_warheads: 90,
    },
    economy: {
      gdp_billions: 525,
      military_budget_billions: 24,
      defense_spending_percent: 4.5,
    },
    allies: ['US'],
    conflicts: ['IR', 'LB', 'SY'],
  },
  {
    country: 'Iran',
    countryCode: 'IR',
    flag: '🇮🇷',
    avatar: '/leaders/khamenei.png',
    leader: 'Khamenei',
    title: 'Supreme Leader',
    tagline: '"The Revolution Never Sleeps"',
    stance: 'aggressive',
    readiness: 88,
    relations: { IL: -95, US: -85, RU: 65 },
    military: {
      ships: 398,
      aircraft_carriers: 0,
      submarines: 34,
      fighter_jets: 550,
      bombers: 68,
      tanks: 4071,
      artillery: 2500,
      troops: 610,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 388,
      military_budget_billions: 25,
      defense_spending_percent: 6.4,
    },
    allies: ['RU', 'CN', 'LB', 'SY'],
    conflicts: ['IL', 'US'],
  },
  {
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    avatar: '/leaders/biden.png',
    leader: 'Biden',
    title: 'President',
    tagline: '"Come on, man! Let\'s go!"',
    stance: 'defensive',
    readiness: 75,
    relations: { IL: 85, IR: -85, RU: -60, CN: -45 },
    military: {
      ships: 490,
      aircraft_carriers: 11,
      submarines: 68,
      fighter_jets: 2740,
      bombers: 157,
      tanks: 6612,
      artillery: 1500,
      troops: 1390,
      nuclear_warheads: 5428,
    },
    economy: {
      gdp_billions: 27360,
      military_budget_billions: 877,
      defense_spending_percent: 3.2,
    },
    allies: ['IL', 'UA', 'NATO'],
    conflicts: [],
  },
  {
    country: 'Russia',
    countryCode: 'RU',
    flag: '🇷🇺',
    avatar: '/leaders/putin.png',
    leader: 'Putin',
    title: 'President',
    tagline: '"Special Military Excellence"',
    stance: 'aggressive',
    readiness: 85,
    relations: { UA: -90, US: -60, CN: 70, IR: 65 },
    military: {
      ships: 603,
      aircraft_carriers: 1,
      submarines: 70,
      fighter_jets: 1900,
      bombers: 200,
      tanks: 12420,
      artillery: 6500,
      troops: 1150,
      nuclear_warheads: 5977,
    },
    economy: {
      gdp_billions: 2240,
      military_budget_billions: 86,
      defense_spending_percent: 3.9,
    },
    allies: ['CN', 'IR'],
    conflicts: ['UA'],
  },
  {
    country: 'Ukraine',
    countryCode: 'UA',
    flag: '🇺🇦',
    leader: 'Zelenskyy',
    title: 'President',
    tagline: '"I Need Ammo, Not a Ride"',
    stance: 'defensive',
    readiness: 95,
    relations: { RU: -90, US: 80, EU: 75 },
    military: {
      ships: 25,
      aircraft_carriers: 0,
      submarines: 0,
      fighter_jets: 125,
      bombers: 0,
      tanks: 2596,
      artillery: 1500,
      troops: 900,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 160,
      military_budget_billions: 44,
      defense_spending_percent: 27.5,
    },
    allies: ['US', 'NATO', 'EU'],
    conflicts: ['RU'],
  },
  {
    country: 'China',
    countryCode: 'CN',
    flag: '🇨🇳',
    avatar: '/leaders/xi.png',
    leader: 'Xi Jinping',
    title: 'President',
    tagline: '"One China. Many Options."',
    stance: 'neutral',
    readiness: 70,
    relations: { TW: -75, US: -45, RU: 70 },
    military: {
      ships: 730,
      aircraft_carriers: 3,
      submarines: 79,
      fighter_jets: 2250,
      bombers: 222,
      tanks: 5800,
      artillery: 3100,
      troops: 2035,
      nuclear_warheads: 410,
    },
    economy: {
      gdp_billions: 17963,
      military_budget_billions: 296,
      defense_spending_percent: 1.6,
    },
    allies: ['RU', 'IR', 'KP'],
    conflicts: [],
  },
  {
    country: 'Lebanon',
    countryCode: 'LB',
    flag: '🇱🇧',
    leader: 'Hezbollah',
    title: 'Faction',
    tagline: '"Resistance is NOT Futile"',
    stance: 'aggressive',
    readiness: 80,
    relations: { IL: -70, IR: 85, SY: 60 },
    military: {
      ships: 0,
      aircraft_carriers: 0,
      submarines: 0,
      fighter_jets: 0,
      bombers: 0,
      tanks: 340,
      artillery: 800,
      troops: 50,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 18,
      military_budget_billions: 2.5,
      defense_spending_percent: 14,
    },
    allies: ['IR', 'SY'],
    conflicts: ['IL'],
  },
  {
    country: 'North Korea',
    countryCode: 'KP',
    flag: '🇰🇵',
    leader: 'Kim Jong Un',
    title: 'Supreme Leader',
    tagline: '"Supreme Everything"',
    stance: 'aggressive',
    readiness: 65,
    relations: { US: -90, SK: -85, CN: 50 },
    military: {
      ships: 505,
      aircraft_carriers: 0,
      submarines: 83,
      fighter_jets: 810,
      bombers: 80,
      tanks: 6750,
      artillery: 5500,
      troops: 1280,
      nuclear_warheads: 50,
    },
    economy: {
      gdp_billions: 40,
      military_budget_billions: 10,
      defense_spending_percent: 25,
    },
    allies: ['CN'],
    conflicts: [],
  },
];

function getStanceColor(stance: string) {
  if (stance === 'aggressive') return 'from-red-600 to-red-800';
  if (stance === 'defensive') return 'from-blue-600 to-blue-800';
  return 'from-gray-600 to-gray-800';
}

function getReadinessColor(readiness: number) {
  if (readiness >= 90) return 'text-red-400';
  if (readiness >= 75) return 'text-orange-400';
  if (readiness >= 60) return 'text-yellow-400';
  return 'text-green-400';
}

export function LeaderBubbles() {
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [hoveredLeader, setHoveredLeader] = useState<string | null>(null);

  const selected = WORLD_LEADERS.find(l => l.countryCode === selectedLeader);

  return (
    <div className="bg-black/60 border-2 border-green-900/40 p-6">
      {/* Header - C&C Style */}
      <div className="mb-6 pb-4 border-b-2 border-green-900/40">
        <div className="text-xs text-green-500/60 font-mono tracking-widest mb-2">█ FACTION SELECTION PROTOCOL</div>
        <div className="text-2xl font-mono font-bold text-green-400 tracking-wider glow-text mb-2">
          ▰▰▰ CHOOSE YOUR COMMANDER ▰▰▰
        </div>
        <div className="text-xs text-green-500/70 font-mono italic">
          "The fate of nations rests in your selection..."
        </div>
      </div>

      {/* Leader Bubbles Grid - C&C Faction Selection Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {WORLD_LEADERS.map((leader) => (
          <button
            key={leader.countryCode}
            onClick={() => setSelectedLeader(leader.countryCode === selectedLeader ? null : leader.countryCode)}
            onMouseEnter={() => setHoveredLeader(leader.countryCode)}
            onMouseLeave={() => setHoveredLeader(null)}
            className={`relative group transition-all transform hover:scale-105 ${
              selectedLeader === leader.countryCode
                ? 'ring-4 ring-yellow-400 scale-105 z-10'
                : ''
            }`}
          >
            {/* Bubble Container */}
            <div className="relative flex flex-col items-center">
              {/* Glow effect for aggressive leaders */}
              {leader.stance === 'aggressive' && (
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl animate-pulse" />
              )}

              {/* Main bubble - BIGGER */}
              <div className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full border-4 overflow-hidden bg-gradient-to-br ${getStanceColor(leader.stance)} ${
                selectedLeader === leader.countryCode
                  ? 'border-yellow-400 shadow-2xl shadow-yellow-400/50'
                  : 'border-green-600'
              }`}>
                {/* Leader caricature or flag fallback */}
                {leader.avatar ? (
                  <Image
                    src={leader.avatar}
                    alt={leader.leader}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 128px, 144px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-90">
                    {leader.flag}
                  </div>
                )}

                {/* Readiness indicator ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className={getReadinessColor(leader.readiness)}
                    strokeDasharray={`${(leader.readiness / 100) * 364} 364`}
                    opacity="0.8"
                  />
                </svg>
              </div>

              {/* Readiness percentage badge */}
              <div className={`absolute top-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono bg-black border-2 ${
                leader.readiness >= 90 ? 'border-red-600 text-red-400 animate-pulse' :
                leader.readiness >= 75 ? 'border-orange-600 text-orange-400' :
                'border-yellow-600 text-yellow-400'
              }`}>
                {leader.readiness}
              </div>

              {/* Stance indicator */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-black border-2 border-green-700 text-sm font-mono font-bold">
                {leader.stance === 'aggressive' && <span className="text-red-400">⚔️</span>}
                {leader.stance === 'defensive' && <span className="text-blue-400">🛡️</span>}
                {leader.stance === 'neutral' && <span className="text-gray-400">⚖️</span>}
              </div>

              {/* COUNTRY NAME - BIG C&C STYLE */}
              <div className="mt-4 text-center space-y-1">
                <div className="text-2xl md:text-3xl font-mono font-black text-green-400 tracking-wider glow-text uppercase">
                  {leader.country}
                </div>
                <div className="text-xs font-mono text-green-500/70 italic px-2">
                  {leader.tagline}
                </div>
              </div>
            </div>

            {/* Hover tooltip */}
            {hoveredLeader === leader.countryCode && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black border-2 border-green-500 text-xs font-mono whitespace-nowrap z-50 animate-fade-in">
                <div className="text-green-400 font-bold">{leader.leader}</div>
                <div className="text-green-500/60">{leader.title}</div>
                <div className="text-green-300 mt-1">Readiness: {leader.readiness}%</div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected Leader Detail Panel - FULL TACTICAL BRIEFING */}
      {selected && (
        <div className="bg-gradient-to-br from-black via-yellow-950/20 to-black border-4 border-yellow-500 p-6 animate-fade-in shadow-2xl shadow-yellow-500/30 space-y-6">
          {/* HEADER */}
          <div className="flex items-start gap-6 pb-4 border-b-2 border-yellow-900/40">
            <div className="relative flex-shrink-0">
              <div className={`w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden bg-gradient-to-br ${getStanceColor(selected.stance)} shadow-2xl shadow-yellow-400/50 ${!selected.avatar ? 'flex items-center justify-center text-7xl' : ''}`}>
                {selected.avatar ? (
                  <Image
                    src={selected.avatar}
                    alt={selected.leader}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  selected.flag
                )}
              </div>
              <div className={`absolute -bottom-3 -right-3 px-4 py-2 rounded-full bg-black border-3 font-mono text-lg font-bold shadow-lg ${
                selected.readiness >= 90 ? 'border-red-600 text-red-400 animate-pulse' :
                selected.readiness >= 75 ? 'border-orange-600 text-orange-400' :
                'border-yellow-600 text-yellow-400'
              }`}>
                {selected.readiness}%
              </div>
            </div>

            <div className="flex-1">
              <div className="text-xs text-yellow-500/60 font-mono tracking-widest mb-2">◢ TACTICAL INTELLIGENCE BRIEFING ◣</div>
              <h3 className="text-4xl font-bold text-yellow-400 font-mono mb-2 glow-text tracking-wide">
                {selected.country.toUpperCase()}
              </h3>
              <div className="text-xl text-yellow-300 font-mono mb-1">{selected.leader}</div>
              <div className="text-sm text-yellow-500/80 font-mono italic mb-3">{selected.tagline}</div>

              <div className="flex gap-3">
                <div className={`px-3 py-1 border-2 font-mono text-sm font-bold ${
                  selected.stance === 'aggressive' ? 'border-red-600 text-red-400 bg-red-900/20' :
                  selected.stance === 'defensive' ? 'border-blue-600 text-blue-400 bg-blue-900/20' :
                  'border-gray-600 text-gray-400 bg-gray-900/20'
                }`}>
                  {selected.stance === 'aggressive' && '⚔️ AGGRESSIVE'}
                  {selected.stance === 'defensive' && '🛡️ DEFENSIVE'}
                  {selected.stance === 'neutral' && '⚖️ NEUTRAL'}
                </div>
              </div>
            </div>
          </div>

          {/* ECONOMIC POWER */}
          <div className="bg-black/60 border-2 border-green-700/40 p-4">
            <div className="text-sm text-green-500/80 font-mono tracking-widest mb-3">💰 ECONOMIC POWER</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-green-500/60 font-mono mb-1">GDP</div>
                <div className="text-2xl font-bold font-mono text-green-400">${selected.economy.gdp_billions}B</div>
              </div>
              <div>
                <div className="text-xs text-green-500/60 font-mono mb-1">MILITARY BUDGET</div>
                <div className="text-2xl font-bold font-mono text-yellow-400">${selected.economy.military_budget_billions}B</div>
              </div>
              <div>
                <div className="text-xs text-green-500/60 font-mono mb-1">DEFENSE SPENDING</div>
                <div className="text-2xl font-bold font-mono text-orange-400">{selected.economy.defense_spending_percent}%</div>
              </div>
            </div>
          </div>

          {/* MILITARY ASSETS - FULL BREAKDOWN */}
          <div className="bg-black/60 border-2 border-red-700/40 p-4">
            <div className="text-sm text-red-500/80 font-mono tracking-widest mb-3">⚔️ MILITARY ASSETS</div>

            {/* Naval Power */}
            <div className="mb-4">
              <div className="text-xs text-blue-400 font-mono mb-2 flex items-center gap-2">
                🚢 NAVAL FORCES
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-900/20 border border-blue-700/40 p-2">
                  <div className="text-xs text-blue-300/60 font-mono">SHIPS</div>
                  <div className="text-xl font-bold font-mono text-blue-400">{selected.military.ships}</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/40 p-2">
                  <div className="text-xs text-blue-300/60 font-mono">CARRIERS</div>
                  <div className="text-xl font-bold font-mono text-blue-400">{selected.military.aircraft_carriers}</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/40 p-2">
                  <div className="text-xs text-blue-300/60 font-mono">SUBS</div>
                  <div className="text-xl font-bold font-mono text-blue-400">{selected.military.submarines}</div>
                </div>
              </div>
            </div>

            {/* Air Power */}
            <div className="mb-4">
              <div className="text-xs text-cyan-400 font-mono mb-2 flex items-center gap-2">
                ✈️ AIR FORCES
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-cyan-900/20 border border-cyan-700/40 p-2">
                  <div className="text-xs text-cyan-300/60 font-mono">FIGHTERS</div>
                  <div className="text-xl font-bold font-mono text-cyan-400">{selected.military.fighter_jets}</div>
                </div>
                <div className="bg-cyan-900/20 border border-cyan-700/40 p-2">
                  <div className="text-xs text-cyan-300/60 font-mono">BOMBERS</div>
                  <div className="text-xl font-bold font-mono text-cyan-400">{selected.military.bombers}</div>
                </div>
              </div>
            </div>

            {/* Ground Forces */}
            <div className="mb-4">
              <div className="text-xs text-orange-400 font-mono mb-2 flex items-center gap-2">
                🎖️ GROUND FORCES
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-orange-900/20 border border-orange-700/40 p-2">
                  <div className="text-xs text-orange-300/60 font-mono">TANKS</div>
                  <div className="text-xl font-bold font-mono text-orange-400">{selected.military.tanks.toLocaleString()}</div>
                </div>
                <div className="bg-orange-900/20 border border-orange-700/40 p-2">
                  <div className="text-xs text-orange-300/60 font-mono">ARTILLERY</div>
                  <div className="text-xl font-bold font-mono text-orange-400">{selected.military.artillery.toLocaleString()}</div>
                </div>
                <div className="bg-orange-900/20 border border-orange-700/40 p-2">
                  <div className="text-xs text-orange-300/60 font-mono">TROOPS</div>
                  <div className="text-xl font-bold font-mono text-orange-400">{selected.military.troops}K</div>
                </div>
              </div>
            </div>

            {/* Nuclear Arsenal */}
            {selected.military.nuclear_warheads > 0 && (
              <div className="bg-red-900/40 border-2 border-red-600 p-3 animate-pulse-slow">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-red-400 font-mono tracking-wider">☢️ NUCLEAR ARSENAL</div>
                  <div className="text-3xl font-bold font-mono text-red-400">{selected.military.nuclear_warheads}</div>
                </div>
                <div className="text-xs text-red-500/60 font-mono mt-1">WARHEADS</div>
              </div>
            )}
          </div>

          {/* ALLIANCES & CONFLICTS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/60 border-2 border-green-700/40 p-4">
              <div className="text-sm text-green-500/80 font-mono tracking-widest mb-3">🤝 ALLIES</div>
              <div className="flex flex-wrap gap-2">
                {selected.allies.map(ally => (
                  <div key={ally} className="px-3 py-1 bg-green-900/40 border border-green-600 text-green-400 font-mono text-sm font-bold">
                    {ally}
                  </div>
                ))}
                {selected.allies.length === 0 && (
                  <div className="text-xs text-green-500/40 font-mono italic">No formal alliances</div>
                )}
              </div>
            </div>

            <div className="bg-black/60 border-2 border-red-700/40 p-4">
              <div className="text-sm text-red-500/80 font-mono tracking-widest mb-3">⚡ ACTIVE CONFLICTS</div>
              <div className="flex flex-wrap gap-2">
                {selected.conflicts.map(conflict => (
                  <div key={conflict} className="px-3 py-1 bg-red-900/40 border border-red-600 text-red-400 font-mono text-sm font-bold animate-pulse">
                    {conflict}
                  </div>
                ))}
                {selected.conflicts.length === 0 && (
                  <div className="text-xs text-red-500/40 font-mono italic">No active conflicts</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-green-900/40 grid grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <span className="text-green-500/60">STANCE:</span>
          <div className="mt-1 space-y-1">
            <div className="text-red-400">⚔️ Aggressive</div>
            <div className="text-blue-400">🛡️ Defensive</div>
            <div className="text-gray-400">⚖️ Neutral</div>
          </div>
        </div>
        <div>
          <span className="text-green-500/60">READINESS:</span>
          <div className="mt-1 space-y-1">
            <div className="text-red-400">90-100% MAXIMUM</div>
            <div className="text-orange-400">75-89% HIGH</div>
            <div className="text-yellow-400">60-74% MODERATE</div>
          </div>
        </div>
        <div>
          <span className="text-green-500/60">RELATIONS:</span>
          <div className="mt-1 space-y-1">
            <div className="text-green-400">+50 to +100 Allied</div>
            <div className="text-blue-400">0 to +49 Friendly</div>
            <div className="text-orange-400">-49 to -1 Tense</div>
            <div className="text-red-400">-50 to -100 Hostile</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
