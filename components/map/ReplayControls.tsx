'use client';

/**
 * Replay Controls - Tactical control panel for map playback
 *
 * Features:
 * - Play/Pause toggle (controls auto-refresh)
 * - Speed selector (x1, x2, x4 animation speed)
 * - Window selector (1h, 6h, 24h, 7d time range)
 * - Tactical button styling with active states
 */

interface ReplayControlsProps {
  isPaused: boolean;
  speed: 1 | 2 | 4;
  window: '1h' | '6h' | '24h' | '7d';
  onTogglePause: () => void;
  onSpeedChange: (speed: 1 | 2 | 4) => void;
  onWindowChange: (window: '1h' | '6h' | '24h' | '7d') => void;
  className?: string;
}

export function ReplayControls({
  isPaused,
  speed,
  window,
  onTogglePause,
  onSpeedChange,
  onWindowChange,
  className = '',
}: ReplayControlsProps) {
  const speedOptions: Array<1 | 2 | 4> = [1, 2, 4];
  const windowOptions: Array<{ value: '1h' | '6h' | '24h' | '7d'; label: string }> = [
    { value: '1h', label: '1 HOUR' },
    { value: '6h', label: '6 HOURS' },
    { value: '24h', label: '24 HOURS' },
    { value: '7d', label: '7 DAYS' },
  ];

  return (
    <div
      className={`bg-black/95 border border-green-500/30 rounded-lg shadow-lg shadow-green-500/20 ${className}`}
    >
      <div className="flex items-center divide-x divide-green-500/20">
        {/* Play/Pause Control */}
        <div className="p-3">
          <div className="text-xs text-green-500/60 font-mono tracking-wider mb-2 uppercase">
            Playback
          </div>
          <button
            onClick={onTogglePause}
            className={`px-4 py-2.5 font-mono text-sm font-bold rounded transition-all ${
              isPaused
                ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30 hover:border-green-500/60'
                : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 hover:bg-yellow-500/30 hover:border-yellow-500/60 animate-pulse'
            }`}
          >
            {isPaused ? (
              <span className="flex items-center gap-2">
                <PlayIcon />
                PLAY
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PauseIcon />
                PAUSE
              </span>
            )}
          </button>
        </div>

        {/* Speed Control */}
        <div className="p-3">
          <div className="text-xs text-green-500/60 font-mono tracking-wider mb-2 uppercase">
            Animation Speed
          </div>
          <div className="flex gap-2">
            {speedOptions.map((speedOption) => (
              <button
                key={speedOption}
                onClick={() => onSpeedChange(speedOption)}
                className={`px-3 py-2.5 font-mono text-sm font-bold rounded transition-all ${
                  speed === speedOption
                    ? 'bg-green-500/30 text-green-300 border-2 border-green-400 shadow-lg shadow-green-500/30'
                    : 'bg-green-500/10 text-green-500/70 border-2 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40'
                }`}
              >
                ×{speedOption}
              </button>
            ))}
          </div>
        </div>

        {/* Window Control */}
        <div className="p-3">
          <div className="text-xs text-green-500/60 font-mono tracking-wider mb-2 uppercase">
            Time Window
          </div>
          <div className="flex gap-2">
            {windowOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onWindowChange(option.value)}
                className={`px-3 py-2.5 font-mono text-xs font-bold rounded transition-all whitespace-nowrap ${
                  window === option.value
                    ? 'bg-green-500/30 text-green-300 border-2 border-green-400 shadow-lg shadow-green-500/30'
                    : 'bg-green-500/10 text-green-500/70 border-2 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="border-t border-green-500/20 px-3 py-2 bg-black/60">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'
              }`}
            />
            <span className="text-green-500/70">
              {isPaused ? 'PLAYBACK PAUSED' : 'LIVE UPDATES ACTIVE'}
            </span>
          </div>
          <div className="text-green-500/50">
            SPEED: ×{speed} • WINDOW: {window.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Play Icon Component
 */
function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2 1.5v9l8-4.5z" />
    </svg>
  );
}

/**
 * Pause Icon Component
 */
function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2 1.5h3v9H2zM7 1.5h3v9H7z" />
    </svg>
  );
}
