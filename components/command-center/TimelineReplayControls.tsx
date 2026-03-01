'use client';

import { useState, useEffect } from 'react';

export interface TimelineReplayState {
  isReplaying: boolean;
  currentTime: number; // Unix timestamp in seconds
  startTime: number;
  endTime: number;
  speed: 1 | 2 | 4 | 8 | 16;
  progress: number; // 0-100
}

interface TimelineReplayControlsProps {
  onReplayStart?: (startTime: number, endTime: number, speed: number) => void;
  onReplayStop?: () => void;
  onSpeedChange?: (speed: number) => void;
  onTimeSeek?: (timestamp: number) => void;
}

const SPEED_OPTIONS = [
  { value: 1, label: '1x', color: 'bg-green-600' },
  { value: 2, label: '2x', color: 'bg-blue-600' },
  { value: 4, label: '4x', color: 'bg-yellow-600' },
  { value: 8, label: '8x', color: 'bg-orange-600' },
  { value: 16, label: '16x', color: 'bg-red-600' },
] as const;

const TIME_PRESET_OPTIONS = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Last 6H', hours: 6 },
  { label: 'Last 24H', hours: 24 },
  { label: 'Last 3 Days', hours: 72 },
] as const;

export function TimelineReplayControls({
  onReplayStart,
  onReplayStop,
  onSpeedChange,
  onTimeSeek,
}: TimelineReplayControlsProps) {
  const [replayState, setReplayState] = useState<TimelineReplayState>({
    isReplaying: false,
    currentTime: Math.floor(Date.now() / 1000),
    startTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    endTime: Math.floor(Date.now() / 1000),
    speed: 1,
    progress: 0,
  });

  const [selectedPreset, setSelectedPreset] = useState<number>(1); // Last Hour

  // Auto-advance current time during replay
  useEffect(() => {
    if (!replayState.isReplaying) return;

    const interval = setInterval(() => {
      setReplayState((prev) => {
        const elapsed = (prev.endTime - prev.startTime) / 100; // 1% of total duration
        const newTime = prev.currentTime + (elapsed * prev.speed);

        // Check if we've reached the end
        if (newTime >= prev.endTime) {
          handleStop();
          return { ...prev, currentTime: prev.endTime, progress: 100 };
        }

        const newProgress = ((newTime - prev.startTime) / (prev.endTime - prev.startTime)) * 100;

        return {
          ...prev,
          currentTime: newTime,
          progress: newProgress,
        };
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [replayState.isReplaying, replayState.speed]);

  const handlePresetSelect = (hours: number, index: number) => {
    const now = Math.floor(Date.now() / 1000);
    const start = now - hours * 3600;

    setReplayState((prev) => ({
      ...prev,
      startTime: start,
      endTime: now,
      currentTime: start,
      progress: 0,
    }));

    setSelectedPreset(index);
  };

  const handleStart = () => {
    setReplayState((prev) => ({ ...prev, isReplaying: true, progress: 0 }));
    onReplayStart?.(replayState.startTime, replayState.endTime, replayState.speed);
  };

  const handleStop = () => {
    setReplayState((prev) => ({ ...prev, isReplaying: false }));
    onReplayStop?.();
  };

  const handleSpeedChange = (speed: 1 | 2 | 4 | 8 | 16) => {
    setReplayState((prev) => ({ ...prev, speed }));
    onSpeedChange?.(speed);
  };

  const handleSeek = (progressPercent: number) => {
    const duration = replayState.endTime - replayState.startTime;
    const newTime = replayState.startTime + (duration * progressPercent) / 100;

    setReplayState((prev) => ({
      ...prev,
      currentTime: newTime,
      progress: progressPercent,
    }));

    onTimeSeek?.(newTime);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const duration = replayState.endTime - replayState.startTime;

  return (
    <div className="bg-black/60 border-2 border-purple-900/40 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-purple-500/60 font-mono tracking-widest">TACTICAL REPLAY SYSTEM</div>
          <h3 className="text-lg font-bold text-purple-400 font-mono">⏮ TIMELINE CONTROLS</h3>
        </div>

        {/* Replay Status */}
        <div className="flex items-center gap-2">
          {replayState.isReplaying && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/40 border border-purple-600 animate-pulse">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-xs font-mono text-purple-400 font-bold">REPLAYING</span>
            </div>
          )}
          <div className="text-xs font-mono text-purple-400">
            {formatDuration(duration)} @ {replayState.speed}x
          </div>
        </div>
      </div>

      {/* Time Range Presets */}
      <div className="mb-4">
        <div className="text-xs text-purple-500/60 font-mono mb-2">TIME WINDOW:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TIME_PRESET_OPTIONS.map((preset, index) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset.hours, index)}
              disabled={replayState.isReplaying}
              className={`px-3 py-2 text-xs font-mono font-bold border transition-all ${
                selectedPreset === index
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-black/60 border-purple-900/40 text-purple-400 hover:border-purple-600'
              } ${replayState.isReplaying ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Controls */}
      <div className="mb-4">
        <div className="text-xs text-purple-500/60 font-mono mb-2">PLAYBACK SPEED:</div>
        <div className="grid grid-cols-5 gap-2">
          {SPEED_OPTIONS.map((speedOption) => (
            <button
              key={speedOption.value}
              onClick={() => handleSpeedChange(speedOption.value)}
              className={`px-3 py-2 text-xs font-mono font-bold border transition-all ${
                replayState.speed === speedOption.value
                  ? `${speedOption.color} border-white text-white scale-110`
                  : 'bg-black/60 border-purple-900/40 text-purple-400 hover:border-purple-600'
              }`}
            >
              {speedOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-mono text-purple-400 mb-2">
          <span>{formatTimestamp(replayState.startTime)}</span>
          <span className="text-purple-500/60">
            {formatTimestamp(replayState.currentTime)}
          </span>
          <span>{formatTimestamp(replayState.endTime)}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-black border-2 border-purple-900/40 overflow-hidden">
          {/* Background Grid */}
          <div className="absolute inset-0 grid grid-cols-10 opacity-20">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border-r border-purple-700" />
            ))}
          </div>

          {/* Progress Fill */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-800 transition-all duration-200"
            style={{ width: `${replayState.progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>

          {/* Scrubber Handle */}
          <input
            type="range"
            min="0"
            max="100"
            value={replayState.progress}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            disabled={replayState.isReplaying}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 transition-all duration-200"
            style={{ left: `${replayState.progress}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-purple-500/40 mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="grid grid-cols-2 gap-3">
        {!replayState.isReplaying ? (
          <button
            onClick={handleStart}
            className="col-span-2 py-3 bg-purple-900/40 border-2 border-purple-600 text-purple-400 font-mono font-bold hover:bg-purple-800/40 transition-colors"
          >
            ▶ START REPLAY
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="col-span-2 py-3 bg-red-900/40 border-2 border-red-600 text-red-400 font-mono font-bold hover:bg-red-800/40 transition-colors"
          >
            ⏹ STOP REPLAY
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-purple-900/40 text-[10px] font-mono text-purple-500/40">
        <div className="flex items-center justify-between">
          <div>API: /api/map-replay</div>
          <div>Progress: {Math.round(replayState.progress)}%</div>
        </div>
      </div>
    </div>
  );
}
