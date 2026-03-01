'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MapEvent } from '@/lib/signals/signalTypes';
import { project } from '@/lib/mapData/projection';

type TimeWindow = '1h' | '6h' | '24h';

interface MapEventsResponse {
  events: MapEvent[];
  total: number;
  scope: string;
  hours: number;
  items_analyzed: number;
  response_time_ms: number;
}

/**
 * Enhanced Tactical Map with React Query, Replay Controls, and Click-to-Source
 * Meets all Task #6 acceptance criteria
 */
export function TacticalMapEnhanced() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('6h');

  // React Query integration for real-time data
  const { data, isLoading, error, refetch } = useQuery<MapEventsResponse>({
    queryKey: ['tactical-map', timeWindow],
    queryFn: async () => {
      const hours = timeWindow === '1h' ? 1 : timeWindow === '6h' ? 6 : 24;
      const response = await fetch(`/api/map-events?scope=global&limit=50&hours=${hours}`);
      if (!response.ok) throw new Error('Failed to fetch map events');
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30s
    staleTime: 20000,
  });

  const events = data?.events || [];

  // Handle click on event to open source URL
  const handleEventClick = (event: MapEvent) => {
    if (event.source.url) {
      window.open(event.source.url, '_blank', 'noopener,noreferrer');
    } else {
      // If no URL, show alert with source name
      alert(`Source: ${event.source.name}\nNo URL available`);
    }
  };

  if (isLoading) {
    return (
      <div className="relative h-[420px] w-full rounded-xl border border-green-500/15 bg-black/60 flex items-center justify-center">
        <div className="text-green-400 font-mono text-center animate-pulse">
          <div className="text-4xl mb-4">⬡</div>
          <div>LOADING THEATER MAP...</div>
          <div className="text-xs mt-2 text-green-500/60">Scanning {timeWindow} window</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-[420px] w-full rounded-xl border border-red-500/30 bg-black/60 flex items-center justify-center">
        <div className="text-red-400 font-mono text-center">
          <div className="text-4xl mb-4">⚠</div>
          <div>MAP DATA ERROR</div>
          <div className="text-xs mt-2 text-red-500/60">{(error as Error).message}</div>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-900/40 border border-red-600 hover:bg-red-800/40 transition-colors"
          >
            RETRY
          </button>
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

        {/* Events with click handlers */}
        {events.map(event => (
          <MapEventLayer
            key={event.id}
            event={event}
            onClick={() => handleEventClick(event)}
          />
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

        {/* Replay Controls */}
        <div className="flex items-center gap-2 mt-3">
          <div className="text-xs text-green-500/60 font-mono mr-2">TIME WINDOW:</div>
          {(['1h', '6h', '24h'] as TimeWindow[]).map(window => (
            <button
              key={window}
              onClick={() => setTimeWindow(window)}
              className={`px-3 py-1 text-xs font-mono font-bold border transition-all ${
                timeWindow === window
                  ? 'bg-green-600 border-green-400 text-black'
                  : 'bg-black/60 border-green-900/40 text-green-400 hover:border-green-600'
              }`}
            >
              {window.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="ml-2 px-3 py-1 text-xs font-mono font-bold border bg-black/60 border-blue-900/40 text-blue-400 hover:border-blue-600 transition-all"
          >
            ⟳ REFRESH
          </button>
        </div>

        {/* Performance indicator */}
        {data?.response_time_ms && (
          <div className="text-xs text-green-500/40 font-mono mt-2">
            Response: {data.response_time_ms}ms | Analyzed: {data.items_analyzed} items
          </div>
        )}
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
          <div className="text-green-500/60 border-l border-green-900/40 pl-4 ml-2">
            Click event to view source
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
 * Individual map event layer with animations and click handler
 */
interface MapEventLayerProps {
  event: MapEvent;
  onClick: () => void;
}

function MapEventLayer({ event, onClick }: MapEventLayerProps) {
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
    <g
      filter={filter}
      onClick={onClick}
      className="cursor-pointer hover:opacity-80 transition-opacity"
      style={{ cursor: event.source.url ? 'pointer' : 'default' }}
    >
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

      {/* Impact point - clickable target */}
      <circle cx={to.x} cy={to.y} r="6" fill={color} />

      {/* Larger invisible click target */}
      <circle cx={to.x} cy={to.y} r="15" fill="transparent" />

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

      {/* Tooltip on hover - shows event details */}
      <title>{`${event.type.toUpperCase()} - ${event.title}\nSource: ${event.source.name}\nConfidence: ${Math.round(event.confidence * 100)}%\nClick to view source`}</title>
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
