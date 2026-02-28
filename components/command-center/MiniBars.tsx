'use client';

interface MiniBarProps {
  label: string;
  value: number; // 0-100
  maxValue?: number; // For scaling
  color?: string;
  showValue?: boolean;
}

function MiniBar({ label, value, maxValue = 100, color = 'bg-green-500', showValue = true }: MiniBarProps) {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const isEmpty = value === 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-green-500/60 tracking-wider">{label}</span>
        {showValue && (
          <span className="text-xs font-mono font-bold text-green-400">
            {isEmpty ? '—' : value.toLocaleString()}
          </span>
        )}
      </div>
      <div className="h-2 bg-black/60 border border-green-900/40 overflow-hidden">
        {!isEmpty && (
          <div
            className={`h-full ${color} transition-all duration-500 glow-bar`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

interface MiniBarsProps {
  air: number; // Fighter jets count
  sea: number; // Ships count
  land: number; // Tanks count
  maxAir?: number;
  maxSea?: number;
  maxLand?: number;
  className?: string;
}

export function MiniBars({
  air,
  sea,
  land,
  maxAir = 3000, // US has ~2740 fighters
  maxSea = 750, // China has ~730 ships
  maxLand = 13000, // Russia has ~12420 tanks
  className = '',
}: MiniBarsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <MiniBar
        label="✈️ AIR POWER"
        value={air}
        maxValue={maxAir}
        color="bg-cyan-500"
      />
      <MiniBar
        label="🚢 SEA POWER"
        value={sea}
        maxValue={maxSea}
        color="bg-blue-500"
      />
      <MiniBar
        label="🎖️ LAND POWER"
        value={land}
        maxValue={maxLand}
        color="bg-orange-500"
      />

      <style jsx>{`
        .glow-bar {
          box-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </div>
  );
}
