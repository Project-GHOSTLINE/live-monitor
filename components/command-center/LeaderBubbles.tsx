'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Leader {
  country: string;
  countryCode: string;
  flag: string;
  avatar?: string; // Path to caricature image
  leader: string;
  title: string;
  stance: 'aggressive' | 'defensive' | 'neutral';
  readiness: number; // 0-100
  relations: { [key: string]: number }; // -100 to 100
}

const WORLD_LEADERS: Leader[] = [
  {
    country: 'Israel',
    countryCode: 'IL',
    flag: '🇮🇱',
    avatar: '/leaders/netanyahu.png',
    leader: 'Netanyahu',
    title: 'Prime Minister',
    stance: 'aggressive',
    readiness: 92,
    relations: { IR: -95, US: 85, LB: -70, SY: -80 },
  },
  {
    country: 'Iran',
    countryCode: 'IR',
    flag: '🇮🇷',
    avatar: '/leaders/khamenei.png',
    leader: 'Khamenei',
    title: 'Supreme Leader',
    stance: 'aggressive',
    readiness: 88,
    relations: { IL: -95, US: -85, RU: 65 },
  },
  {
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    avatar: '/leaders/biden.png',
    leader: 'Biden',
    title: 'President',
    stance: 'defensive',
    readiness: 75,
    relations: { IL: 85, IR: -85, RU: -60, CN: -45 },
  },
  {
    country: 'Russia',
    countryCode: 'RU',
    flag: '🇷🇺',
    avatar: '/leaders/putin.png',
    leader: 'Putin',
    title: 'President',
    stance: 'aggressive',
    readiness: 85,
    relations: { UA: -90, US: -60, CN: 70, IR: 65 },
  },
  {
    country: 'Ukraine',
    countryCode: 'UA',
    flag: '🇺🇦',
    leader: 'Zelenskyy',
    title: 'President',
    stance: 'defensive',
    readiness: 95,
    relations: { RU: -90, US: 80, EU: 75 },
  },
  {
    country: 'China',
    countryCode: 'CN',
    flag: '🇨🇳',
    avatar: '/leaders/xi.png',
    leader: 'Xi Jinping',
    title: 'President',
    stance: 'neutral',
    readiness: 70,
    relations: { TW: -75, US: -45, RU: 70 },
  },
  {
    country: 'Lebanon',
    countryCode: 'LB',
    flag: '🇱🇧',
    leader: 'Hezbollah',
    title: 'Faction',
    stance: 'aggressive',
    readiness: 80,
    relations: { IL: -70, IR: 85, SY: 60 },
  },
  {
    country: 'North Korea',
    countryCode: 'KP',
    flag: '🇰🇵',
    leader: 'Kim Jong Un',
    title: 'Supreme Leader',
    stance: 'aggressive',
    readiness: 65,
    relations: { US: -90, SK: -85, CN: 50 },
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-900/40">
        <div className="text-xs text-green-500/80 font-mono tracking-widest">WORLD LEADERS COMMAND</div>
        <div className="flex-1 h-px bg-green-900/40" />
      </div>

      {/* Leader Bubbles Grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-6">
        {WORLD_LEADERS.map((leader) => (
          <button
            key={leader.countryCode}
            onClick={() => setSelectedLeader(leader.countryCode === selectedLeader ? null : leader.countryCode)}
            onMouseEnter={() => setHoveredLeader(leader.countryCode)}
            onMouseLeave={() => setHoveredLeader(null)}
            className={`relative group transition-all transform hover:scale-110 ${
              selectedLeader === leader.countryCode
                ? 'ring-4 ring-yellow-400 scale-110 z-10'
                : ''
            }`}
          >
            {/* Bubble Container */}
            <div className="relative">
              {/* Glow effect for aggressive leaders */}
              {leader.stance === 'aggressive' && (
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl animate-pulse" />
              )}

              {/* Main bubble */}
              <div className={`relative w-20 h-20 rounded-full border-4 overflow-hidden bg-gradient-to-br ${getStanceColor(leader.stance)} ${
                selectedLeader === leader.countryCode
                  ? 'border-yellow-400'
                  : 'border-green-600'
              }`}>
                {/* Leader caricature or flag fallback */}
                {leader.avatar ? (
                  <Image
                    src={leader.avatar}
                    alt={leader.leader}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-90">
                    {leader.flag}
                  </div>
                )}

                {/* Readiness indicator ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className={getReadinessColor(leader.readiness)}
                    strokeDasharray={`${(leader.readiness / 100) * 226} 226`}
                    opacity="0.8"
                  />
                </svg>
              </div>

              {/* Readiness percentage badge */}
              <div className={`absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono bg-black border-2 ${
                leader.readiness >= 90 ? 'border-red-600 text-red-400 animate-pulse' :
                leader.readiness >= 75 ? 'border-orange-600 text-orange-400' :
                'border-yellow-600 text-yellow-400'
              }`}>
                {leader.readiness}
              </div>

              {/* Stance indicator */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black border border-green-700 text-xs font-mono font-bold">
                {leader.stance === 'aggressive' && <span className="text-red-400">⚔️</span>}
                {leader.stance === 'defensive' && <span className="text-blue-400">🛡️</span>}
                {leader.stance === 'neutral' && <span className="text-gray-400">⚖️</span>}
              </div>
            </div>

            {/* Country name label */}
            <div className="mt-2 text-center">
              <div className="text-xs font-mono font-bold text-green-400 truncate">
                {leader.countryCode}
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

      {/* Selected Leader Detail Panel */}
      {selected && (
        <div className="bg-black/80 border-2 border-yellow-500 p-4 animate-fade-in">
          <div className="flex items-start gap-4">
            {/* Large Avatar */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden bg-gradient-to-br ${getStanceColor(selected.stance)} ${!selected.avatar ? 'flex items-center justify-center text-6xl' : ''}`}>
                {selected.avatar ? (
                  <Image
                    src={selected.avatar}
                    alt={selected.leader}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  selected.flag
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-black border-2 font-mono text-sm font-bold ${
                selected.readiness >= 90 ? 'border-red-600 text-red-400' :
                selected.readiness >= 75 ? 'border-orange-600 text-orange-400' :
                'border-yellow-600 text-yellow-400'
              }`}>
                {selected.readiness}%
              </div>
            </div>

            {/* Leader Info */}
            <div className="flex-1">
              <div className="text-xs text-yellow-500/60 font-mono mb-1">LEADER PROFILE</div>
              <h3 className="text-2xl font-bold text-yellow-400 font-mono mb-1">
                {selected.leader}
              </h3>
              <div className="text-sm text-yellow-300 font-mono mb-3">
                {selected.title} • {selected.country}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-black/60 border border-yellow-700/40 p-2">
                  <div className="text-xs text-yellow-500/60 font-mono mb-1">STANCE</div>
                  <div className={`text-sm font-bold font-mono ${
                    selected.stance === 'aggressive' ? 'text-red-400' :
                    selected.stance === 'defensive' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {selected.stance.toUpperCase()}
                    {selected.stance === 'aggressive' && ' ⚔️'}
                    {selected.stance === 'defensive' && ' 🛡️'}
                  </div>
                </div>

                <div className="bg-black/60 border border-yellow-700/40 p-2">
                  <div className="text-xs text-yellow-500/60 font-mono mb-1">MILITARY READINESS</div>
                  <div className={`text-sm font-bold font-mono ${getReadinessColor(selected.readiness)}`}>
                    {selected.readiness >= 90 && '🔴 MAXIMUM'}
                    {selected.readiness >= 75 && selected.readiness < 90 && '🟠 HIGH'}
                    {selected.readiness >= 60 && selected.readiness < 75 && '🟡 MODERATE'}
                    {selected.readiness < 60 && '🟢 NORMAL'}
                  </div>
                </div>
              </div>

              {/* Relations */}
              <div className="bg-black/60 border border-yellow-700/40 p-2">
                <div className="text-xs text-yellow-500/60 font-mono mb-2">DIPLOMATIC RELATIONS</div>
                <div className="space-y-1">
                  {Object.entries(selected.relations).map(([code, value]) => (
                    <div key={code} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-yellow-400 w-6">{code}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            value >= 50 ? 'bg-green-500' :
                            value >= 0 ? 'bg-blue-500' :
                            value >= -50 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(value)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold w-10 text-right ${
                        value >= 50 ? 'text-green-400' :
                        value >= 0 ? 'text-blue-400' :
                        value >= -50 ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {value > 0 ? '+' : ''}{value}
                      </span>
                    </div>
                  ))}
                </div>
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
