'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface TheatreState {
  theatre: string;
  tension: number;
  momentum: number;
  heat: number;
  velocity: number;
  conflict_count: number;
  dominant_actors: string[];
  active_fronts: string[];
}

/**
 * Theatre Bar Component
 *
 * Displays all theatres sorted by tension/momentum in a horizontal bar.
 * C&C aesthetic: green terminal, glow effects, threat colors.
 */
export function TheatreBar() {
  const [selectedTheatre, setSelectedTheatre] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['theatres'],
    queryFn: async () => {
      const response = await fetch('/api/cce/theatres?sort=tension');
      if (!response.ok) throw new Error('Failed to fetch theatres');
      return response.json();
    },
    refetchInterval: 30000,  // 30s refresh
  });

  if (isLoading) {
    return (
      <div className="h-24 bg-black/80 border-t-2 border-green-500/30 flex items-center justify-center">
        <div className="text-green-500 font-mono text-xs animate-pulse uppercase tracking-widest">
          LOADING THEATRES...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;  // Silent fail for graceful degradation
  }

  const theatres = (data.theatres as TheatreState[]) || [];

  // Threat level color mapping
  const getThreatColor = (tension: number): string => {
    if (tension >= 0.8) return 'bg-red-500';
    if (tension >= 0.6) return 'bg-orange-500';
    if (tension >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getGlowColor = (tension: number): string => {
    if (tension >= 0.8) return 'shadow-[0_0_20px_rgba(239,68,68,0.6)]';
    if (tension >= 0.6) return 'shadow-[0_0_20px_rgba(249,115,22,0.6)]';
    if (tension >= 0.4) return 'shadow-[0_0_20px_rgba(234,179,8,0.6)]';
    return 'shadow-[0_0_10px_rgba(34,197,94,0.4)]';
  };

  return (
    <div className="h-24 bg-black/90 border-t-2 border-green-500/50 p-2 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.2) 2px, rgba(34,197,94,0.2) 4px)'
        }}
      />

      <div className="flex items-center justify-between h-full relative z-10">
        {/* Label */}
        <div className="w-32 text-green-400 font-mono text-xs font-bold uppercase tracking-wider"
          style={{ textShadow: '0 0 8px rgba(34,197,94,0.8)' }}>
          Theatres
          <div className="text-green-600 text-[10px]">({theatres.length} ACTIVE)</div>
        </div>

        {/* Theatre bubbles */}
        <div className="flex-1 flex items-center gap-3 overflow-x-auto px-4">
          {theatres.map((theatre) => {
            const isSelected = selectedTheatre === theatre.theatre;
            const threatColor = getThreatColor(theatre.tension);
            const glowClass = getGlowColor(theatre.tension);

            return (
              <button
                key={theatre.theatre}
                onClick={() => setSelectedTheatre(isSelected ? null : theatre.theatre)}
                className={`
                  relative flex-shrink-0 w-20 h-16 rounded border-2 transition-all
                  ${isSelected ? `border-green-400 scale-110 ${glowClass}` : 'border-green-700/50'}
                  hover:border-green-400 hover:scale-105
                  bg-gradient-to-b from-black/50 to-black/80
                  group cursor-pointer
                `}
              >
                {/* Tension bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div
                    className={`h-full ${threatColor} transition-all`}
                    style={{ width: `${theatre.tension * 100}%` }}
                  />
                </div>

                {/* Theatre name */}
                <div className="text-green-400 font-mono text-[10px] font-bold mt-1 px-1 truncate uppercase"
                  style={{ textShadow: '0 0 6px rgba(34,197,94,0.6)' }}>
                  {theatre.theatre}
                </div>

                {/* Metrics */}
                <div className="text-white font-mono text-xs font-bold mt-1"
                  style={{ textShadow: '0 0 4px rgba(255,255,255,0.6)' }}>
                  {(theatre.tension * 100).toFixed(0)}%
                </div>

                {/* Conflict count */}
                <div className="text-green-600 font-mono text-[9px]">
                  {theatre.conflict_count} CONF
                </div>

                {/* Momentum arrow */}
                {theatre.momentum > 0.6 && (
                  <div className="absolute top-0 right-0 text-red-500 text-xs animate-pulse"
                    style={{ textShadow: '0 0 8px rgba(239,68,68,0.8)' }}>
                    ↑
                  </div>
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-black/95 border border-green-500 p-2 rounded text-xs font-mono whitespace-nowrap"
                    style={{ boxShadow: '0 0 20px rgba(34,197,94,0.5)' }}>
                    <div className="text-green-400 font-bold uppercase"
                      style={{ textShadow: '0 0 6px rgba(34,197,94,0.8)' }}>
                      {theatre.theatre}
                    </div>
                    <div className="text-white mt-1">Tension: {(theatre.tension * 100).toFixed(0)}%</div>
                    <div className="text-white">Momentum: {(theatre.momentum * 100).toFixed(0)}%</div>
                    <div className="text-white">Heat: {(theatre.heat * 100).toFixed(0)}%</div>
                    {theatre.dominant_actors.length > 0 && (
                      <div className="text-green-600 text-[10px] mt-1 uppercase">
                        {theatre.dominant_actors.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
