'use client';

interface IntelPopoverProps {
  name: string;
  country: string;
  stance: 'aggressive' | 'defensive' | 'neutral';
  readiness: number;
  title: string;
  lastVerified?: string; // ISO date string
  className?: string;
}

export function IntelPopover({
  name,
  country,
  stance,
  readiness,
  title,
  lastVerified,
  className = '',
}: IntelPopoverProps) {
  const getStanceLabel = () => {
    switch (stance) {
      case 'aggressive': return '⚔️ AGGRESSIVE';
      case 'defensive': return '🛡️ DEFENSIVE';
      case 'neutral': return '⚖️ NEUTRAL';
    }
  };

  const getStanceColor = () => {
    switch (stance) {
      case 'aggressive': return 'text-red-400 border-red-600';
      case 'defensive': return 'text-blue-400 border-blue-600';
      case 'neutral': return 'text-gray-400 border-gray-600';
    }
  };

  const getReadinessColor = () => {
    if (readiness >= 90) return 'text-red-400';
    if (readiness >= 75) return 'text-orange-400';
    if (readiness >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 animate-fade-in-up pointer-events-none ${className}`}
    >
      {/* Arrow pointer */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-green-500" />

      {/* Popover content */}
      <div className="bg-black border-2 border-green-500 shadow-2xl shadow-green-500/50 min-w-[280px]">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/10 via-transparent to-green-900/10 pointer-events-none" />

        <div className="relative p-4 space-y-3">
          {/* Header */}
          <div className="border-b border-green-900/40 pb-2">
            <div className="text-xs text-green-500/60 font-mono tracking-widest mb-1">
              TACTICAL INTEL
            </div>
            <div className="text-lg font-bold text-green-400 font-mono">
              {name}
            </div>
            <div className="text-xs text-green-500/70 font-mono">
              {title} • {country}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* Stance */}
            <div>
              <div className="text-green-500/60 mb-1">STANCE</div>
              <div className={`px-2 py-1 border font-bold text-center ${getStanceColor()}`}>
                {getStanceLabel()}
              </div>
            </div>

            {/* Readiness */}
            <div>
              <div className="text-green-500/60 mb-1">READINESS</div>
              <div className={`text-2xl font-bold text-center ${getReadinessColor()}`}>
                {readiness}%
              </div>
            </div>
          </div>

          {/* Last verified */}
          {lastVerified && (
            <div className="text-xs font-mono text-green-500/60 pt-2 border-t border-green-900/40">
              <span className="text-green-500/40">Last verified:</span>{' '}
              <span className="text-green-400">
                {new Date(lastVerified).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Glow border effect */}
          <div className="absolute inset-0 border-2 border-green-500/30 pointer-events-none" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
