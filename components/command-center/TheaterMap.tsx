'use client';

import { useEffect, useState } from 'react';
import { MapEvent } from '@/lib/signals/signalTypes';
import { project } from '@/lib/mapData/projection';

/**
 * C&C Style Theater Map
 * Shows real-time military events with animations
 */

export function TheaterMap() {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMapEvents();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMapEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMapEvents() {
    try {
      const response = await fetch('/api/map-events?scope=middle-east&limit=50');
      if (!response.ok) throw new Error('Failed to fetch map events');

      const data = await response.json();
      setEvents(data.events ?? []);
    } catch (error) {
      console.error('Map events fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="relative h-[420px] w-full rounded-xl border border-green-500/15 bg-black/60 flex items-center justify-center">
        <div className="text-green-400 font-mono text-center animate-pulse">
          <div className="text-4xl mb-4">⬡</div>
          <div>LOADING THEATER MAP...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border-2 border-green-500/30 bg-black/80 shadow-2xl shadow-green-500/20">
      {/* SVG Map */}
      <svg viewBox="0 0 1200 520" className="h-full w-full">
        <defs>
          {/* Arrow marker */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,255,136,0.75)" />
          </marker>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Red glow for hostile */}
          <filter id="glow-hostile">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="1200" height="520" fill="rgba(0,0,0,0.6)" />

        {/* Grid */}
        <g opacity="0.25">
          {Array.from({ length: 26 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              x2="1200"
              y1={i * 20}
              y2={i * 20}
              stroke="rgba(0,255,136,0.10)"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 60 }).map((_, i) => (
            <line
              key={`v${i}`}
              y1="0"
              y2="520"
              x1={i * 20}
              x2={i * 20}
              stroke="rgba(0,255,136,0.06)"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Events */}
        {events.map(event => (
          <MapEventLayer key={event.id} event={event} />
        ))}
      </svg>

      {/* Scanlines overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(180deg,transparent,transparent 3px,rgba(0,255,136,0.10) 4px)',
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-green-500/60 font-mono tracking-widest">
              TACTICAL THEATER
            </div>
            <div className="text-lg font-mono font-bold text-green-400 glow-text">
              ▰ MIDDLE EAST OPERATIONS MAP
            </div>
          </div>
          <div className="text-sm font-mono text-green-400">
            {events.length} ACTIVE EVENTS
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        <div className="flex items-center justify-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400">MISSILE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-yellow-400">DRONE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-green-400">AIRSTRIKE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-blue-400">NAVAL</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glow-text {
          text-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </div>
  );
}

/**
 * Individual map event layer with animations
 */
function MapEventLayer({ event }: { event: MapEvent }) {
  const w = 1200;
  const h = 520;

  const to = project(event.to.lat, event.to.lon, w, h);
  const from = event.from ? project(event.from.lat, event.from.lon, w, h) : null;

  const color = getEventColor(event);
  const filter = event.color === 'hostile' ? 'url(#glow-hostile)' : 'url(#glow)';

  // Calculate curved path if from exists
  const path = from
    ? `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${
        Math.min(from.y, to.y) - 80
      } ${to.x} ${to.y}`
    : '';

  const speed = event.type === 'missile' ? '0.9s' : event.type === 'drone' ? '2.2s' : '1.5s';

  return (
    <g filter={filter}>
      {/* Trajectory arc */}
      {from && (
        <>
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray="6 8"
            markerEnd="url(#arrow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-40"
              dur={speed}
              repeatCount="indefinite"
            />
          </path>

          {/* Moving projectile */}
          <circle r="4" fill={color}>
            <animateMotion dur={speed} repeatCount="indefinite" path={path} />
          </circle>
        </>
      )}

      {/* Impact point */}
      <circle cx={to.x} cy={to.y} r="4.5" fill={color} />

      {/* Expanding ring */}
      <circle cx={to.x} cy={to.y} r="6" fill="none" stroke={color} strokeWidth="2" opacity="0.7">
        <animate attributeName="r" values="6;26" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* Second ring for emphasis */}
      <circle cx={to.x} cy={to.y} r="6" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5">
        <animate
          attributeName="r"
          values="6;36"
          dur="2.4s"
          repeatCount="indefinite"
          begin="0.4s"
        />
        <animate
          attributeName="opacity"
          values="0.5;0"
          dur="2.4s"
          repeatCount="indefinite"
          begin="0.4s"
        />
      </circle>
    </g>
  );
}

/**
 * Get color for event type
 */
function getEventColor(event: MapEvent): string {
  const colors: Record<MapEvent['type'], string> = {
    missile: 'rgba(255,69,58,0.95)', // Red
    drone: 'rgba(255,214,10,0.95)', // Yellow
    airstrike: 'rgba(0,255,136,0.95)', // Green
    tank: 'rgba(255,159,10,0.95)', // Orange
    naval: 'rgba(10,132,255,0.95)', // Blue
    cyber: 'rgba(191,90,242,0.95)', // Purple
    explosion: 'rgba(255,55,95,0.95)', // Hot pink
  };

  return colors[event.type] || 'rgba(0,255,136,0.75)';
}
