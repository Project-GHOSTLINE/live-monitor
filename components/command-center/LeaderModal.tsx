'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { MiniBars } from './MiniBars';

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

interface LeaderModalProps {
  leader: Leader | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderModal({ leader, isOpen, onClose }: LeaderModalProps) {
  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !leader) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-modal-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent pointer-events-none animate-scan opacity-30" />

      {/* Modal Content */}
      <div className="relative w-full max-w-7xl h-[90vh] mx-4 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-4 border-green-500 shadow-2xl shadow-green-500/50 animate-modal-slide-up overflow-hidden">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center bg-black/80 border-2 border-red-500 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all text-2xl font-bold group"
        >
          <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
        </button>

        {/* ESC hint */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 border border-green-900/40 text-xs font-mono text-green-500/60">
          Press ESC to close
        </div>

        {/* Main Grid Layout */}
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">

          {/* LEFT SIDE - Massive Commander Portrait */}
          <div className="relative bg-gradient-to-br from-black via-gray-900 to-black border-r-4 border-green-900/40 flex items-center justify-center overflow-hidden">
            {/* Glow effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent pointer-events-none animate-pulse" />

            {/* Portrait */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
              {/* Massive 3D emerging portrait */}
              <div className="relative w-full max-w-md aspect-[3/4] mb-6">
                {/* Shadow layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/30 via-transparent to-black blur-3xl transform translate-y-8" />

                {/* Main portrait frame */}
                <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-green-900 via-black to-black shadow-2xl border-4 border-green-500" style={{
                  clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
                }}>
                  {leader.avatar ? (
                    <Image
                      src={leader.avatar}
                      alt={leader.leader}
                      fill
                      className="object-cover object-top scale-110"
                      sizes="500px"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-9xl">
                      {leader.flag}
                    </div>
                  )}

                  {/* Dramatic glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-500/50 via-transparent to-transparent pointer-events-none" />

                  {/* Scanlines */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.3) 2px, rgba(0,0,0,.3) 4px)',
                  }} />
                </div>

                {/* Readiness badge - massive */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 flex items-center justify-center font-mono text-4xl font-bold bg-black border-4 transform rotate-12 shadow-2xl animate-pulse ${
                  leader.readiness >= 90 ? 'border-red-600 text-red-400 bg-red-950' :
                  leader.readiness >= 75 ? 'border-orange-600 text-orange-400 bg-orange-950' :
                  'border-yellow-600 text-yellow-400 bg-yellow-950'
                }`}>
                  {leader.readiness}
                </div>
              </div>

              {/* Name & Title - BIG */}
              <div className="text-center space-y-3">
                <div className="text-6xl font-mono font-black text-green-400 tracking-wider glow-text uppercase">
                  {leader.country}
                </div>
                <div className="text-3xl text-green-300 font-mono font-bold">
                  {leader.leader}
                </div>
                <div className="text-lg text-green-500/80 font-mono italic mb-4">
                  {leader.tagline}
                </div>
                <div className={`inline-block px-6 py-3 border-4 font-mono text-2xl font-bold ${
                  leader.stance === 'aggressive' ? 'border-red-600 text-red-400 bg-red-900/20' :
                  leader.stance === 'defensive' ? 'border-blue-600 text-blue-400 bg-blue-900/20' :
                  'border-gray-600 text-gray-400 bg-gray-900/20'
                }`}>
                  {leader.stance === 'aggressive' && '⚔️ AGGRESSIVE'}
                  {leader.stance === 'defensive' && '🛡️ DEFENSIVE'}
                  {leader.stance === 'neutral' && '⚖️ NEUTRAL'}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Stats & Intel */}
          <div className="h-full overflow-y-auto bg-black/40 p-6 space-y-4 custom-scrollbar">

            {/* Header */}
            <div className="border-b-2 border-green-900/40 pb-4">
              <div className="text-xs text-green-500/60 font-mono tracking-widest mb-2">
                █ TACTICAL INTELLIGENCE BRIEFING
              </div>
              <div className="text-2xl font-mono font-bold text-green-400 mb-2">
                COMMANDER DOSSIER
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-green-500/60">Classified Level: TOP SECRET</span>
                <span className="text-green-400">Last Updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tactical Power Bars */}
            <div className="bg-black/60 border-2 border-cyan-700/40 p-4 animate-slide-in-right" style={{ animationDelay: '100ms' }}>
              <div className="text-sm text-cyan-500/80 font-mono tracking-widest mb-4">⚡ TACTICAL POWER INDEX</div>
              <MiniBars
                air={leader.military.fighter_jets}
                sea={leader.military.ships}
                land={leader.military.tanks}
              />
              <div className="mt-3 pt-3 border-t border-cyan-900/40 text-xs font-mono text-cyan-500/60">
                <div className="flex items-center justify-between">
                  <span>Data Credibility</span>
                  <span className="text-cyan-400 font-bold">CONFIDENCE: HIGH</span>
                </div>
              </div>
            </div>

            {/* Economic Power */}
            <div className="bg-black/60 border-2 border-green-700/40 p-4 animate-slide-in-right" style={{ animationDelay: '200ms' }}>
              <div className="text-sm text-green-500/80 font-mono tracking-widest mb-3">💰 ECONOMIC POWER</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/40 border border-green-900/40 p-3 text-center">
                  <div className="text-xs text-green-500/60 font-mono mb-1">GDP</div>
                  <div className="text-2xl font-bold font-mono text-green-400">${leader.economy.gdp_billions}B</div>
                </div>
                <div className="bg-black/40 border border-green-900/40 p-3 text-center">
                  <div className="text-xs text-green-500/60 font-mono mb-1">MIL BUDGET</div>
                  <div className="text-2xl font-bold font-mono text-yellow-400">${leader.economy.military_budget_billions}B</div>
                </div>
                <div className="bg-black/40 border border-green-900/40 p-3 text-center">
                  <div className="text-xs text-green-500/60 font-mono mb-1">DEF %</div>
                  <div className="text-2xl font-bold font-mono text-orange-400">{leader.economy.defense_spending_percent}%</div>
                </div>
              </div>
            </div>

            {/* Military Assets Grid */}
            <div className="bg-black/60 border-2 border-red-700/40 p-4 animate-slide-in-right" style={{ animationDelay: '300ms' }}>
              <div className="text-sm text-red-500/80 font-mono tracking-widest mb-3">⚔️ MILITARY ARSENAL</div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {/* Naval */}
                <div className="bg-blue-900/20 border border-blue-700/40 p-2">
                  <div className="text-blue-300/60">SHIPS</div>
                  <div className="text-lg font-bold text-blue-400">{leader.military.ships}</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/40 p-2">
                  <div className="text-blue-300/60">CARRIERS</div>
                  <div className="text-lg font-bold text-blue-400">{leader.military.aircraft_carriers}</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/40 p-2">
                  <div className="text-blue-300/60">SUBS</div>
                  <div className="text-lg font-bold text-blue-400">{leader.military.submarines}</div>
                </div>

                {/* Air */}
                <div className="bg-cyan-900/20 border border-cyan-700/40 p-2">
                  <div className="text-cyan-300/60">FIGHTERS</div>
                  <div className="text-lg font-bold text-cyan-400">{leader.military.fighter_jets}</div>
                </div>
                <div className="bg-cyan-900/20 border border-cyan-700/40 p-2">
                  <div className="text-cyan-300/60">BOMBERS</div>
                  <div className="text-lg font-bold text-cyan-400">{leader.military.bombers}</div>
                </div>

                {/* Ground */}
                <div className="bg-orange-900/20 border border-orange-700/40 p-2">
                  <div className="text-orange-300/60">TANKS</div>
                  <div className="text-lg font-bold text-orange-400">{leader.military.tanks.toLocaleString()}</div>
                </div>
                <div className="bg-orange-900/20 border border-orange-700/40 p-2">
                  <div className="text-orange-300/60">ARTILLERY</div>
                  <div className="text-lg font-bold text-orange-400">{leader.military.artillery.toLocaleString()}</div>
                </div>
                <div className="bg-orange-900/20 border border-orange-700/40 p-2">
                  <div className="text-orange-300/60">TROOPS</div>
                  <div className="text-lg font-bold text-orange-400">{leader.military.troops}K</div>
                </div>
              </div>

              {/* Nuclear */}
              {leader.military.nuclear_warheads > 0 && (
                <div className="mt-3 bg-red-900/40 border-2 border-red-600 p-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-red-400 font-mono tracking-wider">☢️ NUCLEAR ARSENAL</div>
                    <div className="text-3xl font-bold font-mono text-red-400">{leader.military.nuclear_warheads}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Alliances & Conflicts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/60 border-2 border-green-700/40 p-4 animate-slide-in-right" style={{ animationDelay: '400ms' }}>
                <div className="text-sm text-green-500/80 font-mono tracking-widest mb-3">🤝 ALLIES</div>
                <div className="flex flex-wrap gap-2">
                  {leader.allies.map(ally => (
                    <div key={ally} className="px-3 py-1 bg-green-900/40 border border-green-600 text-green-400 font-mono text-sm font-bold">
                      {ally}
                    </div>
                  ))}
                  {leader.allies.length === 0 && (
                    <div className="text-xs text-green-500/40 font-mono italic">None</div>
                  )}
                </div>
              </div>

              <div className="bg-black/60 border-2 border-red-700/40 p-4 animate-slide-in-right" style={{ animationDelay: '500ms' }}>
                <div className="text-sm text-red-500/80 font-mono tracking-widest mb-3">⚡ CONFLICTS</div>
                <div className="flex flex-wrap gap-2">
                  {leader.conflicts.map(conflict => (
                    <div key={conflict} className="px-3 py-1 bg-red-900/40 border border-red-600 text-red-400 font-mono text-sm font-bold animate-pulse">
                      {conflict}
                    </div>
                  ))}
                  {leader.conflicts.length === 0 && (
                    <div className="text-xs text-red-500/40 font-mono italic">None</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-modal-fade-in {
          animation: modal-fade-in 0.3s ease-out;
        }
        .animate-modal-slide-up {
          animation: modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .glow-text {
          text-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.5);
        }
      `}</style>
    </div>
  );
}
