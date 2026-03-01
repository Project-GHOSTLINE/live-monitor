'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapEvent } from '@/lib/signals/signalTypes';
import { TheaterMap } from '../command-center/TheaterMap';
import { GlobalTensionMeter } from './GlobalTensionMeter';
import { TimelinePanel } from './TimelinePanel';
import { ReplayControls } from './ReplayControls';

/**
 * TacticalMapComposite - Unified tactical map with all controls
 *
 * Combines:
 * - TheaterMap (center): SVG map with animated events
 * - GlobalTensionMeter (top): DEFCON-style threat meter
 * - TimelinePanel (left): Scrollable event timeline
 * - ReplayControls (bottom): Playback controls
 *
 * Features:
 * - Centralized state management
 * - Auto-refresh with pause control
 * - Configurable time windows
 * - Event highlighting from timeline
 * - Responsive grid layout
 */

interface TacticalMapCompositeProps {
  scope?: 'middle-east' | 'global';
  autoRefresh?: boolean;
  defaultWindow?: '1h' | '6h' | '24h' | '7d';
  className?: string;
}

export function TacticalMapComposite({
  scope = 'middle-east',
  autoRefresh = true,
  defaultWindow = '24h',
  className = '',
}: TacticalMapCompositeProps) {
  // State management
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(!autoRefresh);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [window, setWindow] = useState<'1h' | '6h' | '24h' | '7d'>(defaultWindow);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  // Fetch map events
  const fetchMapEvents = useCallback(async () => {
    try {
      const limit = window === '1h' ? 30 : window === '6h' ? 50 : window === '24h' ? 100 : 200;
      const response = await fetch(
        `/api/map-events?scope=${scope}&limit=${limit}&window=${window}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch map events');
      }

      const data = await response.json();
      setEvents(data.events ?? []);
    } catch (error) {
      console.error('Map events fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [scope, window]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchMapEvents();

    if (!isPaused && autoRefresh) {
      // Auto-refresh interval based on speed (faster speed = more frequent updates)
      const intervalMs = speed === 4 ? 15000 : speed === 2 ? 30000 : 45000;
      const interval = setInterval(fetchMapEvents, intervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchMapEvents, isPaused, autoRefresh, speed]);

  // Handlers
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: 1 | 2 | 4) => {
    setSpeed(newSpeed);
  }, []);

  const handleWindowChange = useCallback((newWindow: '1h' | '6h' | '24h' | '7d') => {
    setWindow(newWindow);
    setIsLoading(true);
  }, []);

  const handleEventClick = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    // Clear selection after 3 seconds
    setTimeout(() => setSelectedEventId(undefined), 3000);
  }, []);

  if (isLoading && events.length === 0) {
    return (
      <div className="relative h-[800px] w-full rounded-xl border border-green-500/15 bg-black/60 flex items-center justify-center">
        <div className="text-green-400 font-mono text-center animate-pulse">
          <div className="text-4xl mb-4">⬡</div>
          <div>INITIALIZING TACTICAL OPERATIONS CENTER...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main Grid Layout */}
      <div className="grid grid-rows-[auto_1fr_auto] gap-4">
        {/* Top: Global Tension Meter */}
        <GlobalTensionMeter events={events} timeWindow={window} />

        {/* Middle: Timeline (left) + Map (center) */}
        <div className="flex gap-4 min-h-[500px]">
          {/* Timeline Panel - Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <TimelinePanel
              events={events}
              onEventClick={handleEventClick}
              selectedEventId={selectedEventId}
              className="h-full"
            />
          </div>

          {/* Theater Map - Center */}
          <div className="flex-1 min-w-0">
            <TheaterMap />
          </div>
        </div>

        {/* Bottom: Replay Controls */}
        <div className="flex justify-center">
          <ReplayControls
            isPaused={isPaused}
            speed={speed}
            window={window}
            onTogglePause={handleTogglePause}
            onSpeedChange={handleSpeedChange}
            onWindowChange={handleWindowChange}
          />
        </div>
      </div>

      {/* Status Overlay (optional debug info) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/90 border border-green-500/30 rounded px-3 py-2 text-xs font-mono text-green-500/70">
          <div>Events: {events.length}</div>
          <div>
            Status: {isPaused ? 'PAUSED' : 'LIVE'} • Speed: ×{speed} • Window: {window}
          </div>
          <div>Scope: {scope.toUpperCase()}</div>
        </div>
      )}
    </div>
  );
}
