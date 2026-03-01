'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface FrontState {
  id: string;
  theatre: string;
  name: string;
  actors: string[];
  state: {
    control: Record<string, number>;
    intensity: number;
    last_event_at: number | null;
  };
}

/**
 * Front Lines Panel Component
 *
 * Displays 2-4 active fronts with control distribution and intensity.
 * C&C aesthetic: green terminal, glow effects, pulse animations.
 *
 * NOTE: Control values are [SIM STATE] - simulated from event patterns,
 * not real ground control.
 */
export function FrontLinesPanel() {
  const [selectedFront, setSelectedFront] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['fronts'],
    queryFn: async () => {
      const response = await fetch('/api/cce/fronts?min_intensity=0.1');
      if (!response.ok) throw new Error('Failed to fetch fronts');
      return response.json();
    },
    refetchInterval: 30000,  // 30s refresh
  });

  if (isLoading || !data) {
    return null;  // Silent fail
  }

  const fronts = ((data.fronts as FrontState[]) || []).slice(0, 4);  // Show top 4

  if (fronts.length === 0) {
    return null;
  }

  return (
    <div className="h-48 bg-black/90 border-t-2 border-green-500/50 p-4 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.2) 2px, rgba(34,197,94,0.2) 4px)'
        }}
      />

      <div className="flex items-start justify-between h-full relative z-10">
        {/* Label */}
        <div className="w-32 text-green-400 font-mono text-xs font-bold uppercase tracking-wider"
          style={{ textShadow: '0 0 8px rgba(34,197,94,0.8)' }}>
          Front Lines
          <div className="text-green-600 text-[10px]">ACTIVE ({fronts.length})</div>
          <div className="text-green-600/60 text-[8px] mt-1">[SIM STATE]</div>
        </div>

        {/* Front cards */}
        <div className="flex-1 grid grid-cols-4 gap-4">
          {fronts.map((front) => {
            const isSelected = selectedFront === front.id;
            const controlEntries = Object.entries(front.state.control);
            const intensityColor = front.state.intensity >= 0.7 ? 'text-red-500' :
              front.state.intensity >= 0.4 ? 'text-yellow-500' : 'text-green-500';

            return (
              <div
                key={front.id}
                onClick={() => setSelectedFront(isSelected ? null : front.id)}
                className={`
                  relative border-2 rounded p-3 cursor-pointer transition-all
                  ${isSelected ? 'border-green-400 scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-green-700/50'}
                  hover:border-green-400
                  bg-gradient-to-b from-black/50 to-black/80
                `}
              >
                {/* Front name */}
                <div className="text-green-400 font-mono text-xs font-bold mb-2 truncate uppercase"
                  style={{ textShadow: '0 0 6px rgba(34,197,94,0.6)' }}>
                  {front.name}
                </div>

                {/* Control bars */}
                <div className="space-y-1 mb-2">
                  {controlEntries.map(([actor, control]) => (
                    <div key={actor} className="flex items-center gap-2">
                      <div className="text-white font-mono text-[10px] w-8 font-bold"
                        style={{ textShadow: '0 0 4px rgba(255,255,255,0.4)' }}>
                        {actor}
                      </div>
                      <div className="flex-1 h-2 bg-black/50 rounded overflow-hidden border border-green-800/30">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{
                            width: `${control * 100}%`,
                            boxShadow: '0 0 6px rgba(34,197,94,0.8)'
                          }}
                        />
                      </div>
                      <div className="text-green-600 font-mono text-[10px] w-10 text-right">
                        {(control * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Intensity indicator */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-green-600 uppercase">Intensity:</span>
                  <span className={`font-bold ${intensityColor}`}
                    style={{ textShadow: '0 0 6px currentColor' }}>
                    {(front.state.intensity * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Pulse animation for high intensity */}
                {front.state.intensity > 0.5 && (
                  <div className="absolute inset-0 border-2 border-red-500/30 rounded animate-pulse pointer-events-none"
                    style={{ boxShadow: '0 0 10px rgba(239,68,68,0.3)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
