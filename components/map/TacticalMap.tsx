'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapEvent } from '@/lib/signals/signalTypes';
import { project } from '@/lib/mapData/projection';

/**
 * Advanced C&C Style Tactical Map
 * Features:
 * - Multiple animation types (arc, pulse, naval paths, cluster dots, diplo lines)
 * - Global Tension Meter
 * - Timeline Panel with last 20 actions
 * - Play/Pause, Speed controls (x1/x2/x4)
 * - Performance optimized (max 30 concurrent animations, 60fps)
 */

type PlaybackSpeed = 1 | 2 | 4;
type TimeWindow = '1h' | '6h' | '24h' | 'all';

interface AnimatedEvent extends MapEvent {
  createdAt: number; // timestamp when added to animations
  fadeStart?: number; // timestamp when fade begins
}

export function TacticalMap() {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [animatedEvents, setAnimatedEvents] = useState<AnimatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');
  const [globalTension, setGlobalTension] = useState(0);

  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Fetch map events
  useEffect(() => {
    fetchMapEvents();
    const interval = setInterval(fetchMapEvents, 30000);
    return () => clearInterval(interval);
  }, [timeWindow]);

  // Animation loop for fading out old events
  useEffect(() => {
    if (isPaused) return;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      setAnimatedEvents((prev) => {
        const now = Date.now();
        // Remove events older than 3 minutes
        const filtered = prev.filter((e) => now - e.createdAt < 180000);

        // Limit to 30 concurrent animations for performance
        return filtered.slice(-30);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused]);

  async function fetchMapEvents() {
    try {
      const response = await fetch(`/api/map-events?scope=middle-east&limit=50&window=${timeWindow}`);
      if (!response.ok) throw new Error('Failed to fetch map events');

      const data = await response.json();
      const newEvents = data.events ?? [];
      setEvents(newEvents);

      // Add new events to animated list
      const now = Date.now();
      const newAnimated = newEvents
        .filter((e: MapEvent) => !animatedEvents.find((a) => a.id === e.id))
        .map((e: MapEvent) => ({ ...e, createdAt: now }));

      setAnimatedEvents((prev) => [...prev, ...newAnimated].slice(-30));

      // Calculate global tension
      const tension = newEvents.reduce((sum: number, e: MapEvent) => sum + e.severity * 20, 0);
      setGlobalTension(Math.min(tension, 100));
    } catch (error) {
      console.error('Map events fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((speed) => {
      if (speed === 1) return 2;
      if (speed === 2) return 4;
      return 1;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="relative h-[600px] w-full rounded-xl border border-green-500/15 bg-black/60 flex items-center justify-center">
        <div className="text-green-400 font-mono text-center animate-pulse">
          <div className="text-4xl mb-4">⬡</div>
          <div>INITIALIZING TACTICAL MAP...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border-2 border-green-500/30 bg-black/90 shadow-2xl shadow-green-500/20">
      {/* Timeline Panel (Left) */}
      <TimelinePanel events={events.slice(-20)} />

      {/* SVG Map (Center) */}
      <div className="absolute left-56 right-0 top-0 bottom-0">
        <svg viewBox="0 0 1200 600" className="h-full w-full">
          <defs>
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

            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-hostile">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect x="0" y="0" width="1200" height="600" fill="rgba(0,0,0,0.7)" />

          {/* Grid */}
          <g opacity="0.2">
            {Array.from({ length: 30 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                x2="1200"
                y1={i * 20}
                y2={i * 20}
                stroke="rgba(0,255,136,0.12)"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 60 }).map((_, i) => (
              <line
                key={`v${i}`}
                y1="0"
                y2="600"
                x1={i * 20}
                x2={i * 20}
                stroke="rgba(0,255,136,0.08)"
                strokeWidth="0.5"
              />
            ))}
          </g>

          {/* Animated Events */}
          {!isPaused &&
            animatedEvents.map((event) => (
              <MapEventAnimation key={event.id} event={event} speed={playbackSpeed} />
            ))}
        </svg>

        {/* Scanlines overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              'repeating-linear-gradient(180deg,transparent,transparent 3px,rgba(0,255,136,0.12) 4px)',
          }}
        />
      </div>

      {/* Global Tension Meter (Top) */}
      <TensionMeter tension={globalTension} />

      {/* Controls (Bottom Right) */}
      <ControlPanel
        isPaused={isPaused}
        playbackSpeed={playbackSpeed}
        timeWindow={timeWindow}
        onTogglePause={togglePause}
        onCycleSpeed={cycleSpeed}
        onChangeWindow={setTimeWindow}
      />

      {/* Header */}
      <div className="absolute top-0 left-56 right-0 bg-gradient-to-b from-black/95 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-green-500/60 font-mono tracking-widest">
              TACTICAL OPERATIONS CENTER
            </div>
            <div className="text-lg font-mono font-bold text-green-400 glow-text">
              ▰ LIVE THEATER MAP
            </div>
          </div>
          <div className="text-sm font-mono text-green-400">
            {animatedEvents.length} ACTIVE / {events.length} TOTAL
          </div>
        </div>
      </div>

      <style jsx>{`
        .glow-text {
          text-shadow: 0 0 12px currentColor, 0 0 4px currentColor;
        }
      `}</style>
    </div>
  );
}

/**
 * Timeline Panel - Last 20 actions
 */
function TimelinePanel({ events }: { events: MapEvent[] }) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-56 bg-black/95 border-r border-green-500/30 overflow-hidden">
      <div className="p-3 border-b border-green-500/30">
        <div className="text-xs text-green-500/70 font-mono tracking-wider">TIMELINE</div>
        <div className="text-sm font-mono text-green-400 font-semibold">RECENT ACTIONS</div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-60px)] scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
        {events
          .slice()
          .reverse()
          .map((event, idx) => (
            <div
              key={event.id}
              className="p-2 border-b border-green-500/10 hover:bg-green-500/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <EventIcon type={event.type} />
                <span className="text-xs font-mono text-green-400 font-semibold">
                  {event.type.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-green-300/80 font-mono line-clamp-2">{event.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-500/60 font-mono">
                  {new Date(event.time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {event.confidence < 0.8 && (
                  <span className="text-xs px-1 bg-yellow-500/20 text-yellow-400 rounded font-mono">
                    EST
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Global Tension Meter
 */
function TensionMeter({ tension }: { tension: number }) {
  const color =
    tension > 80
      ? 'bg-red-500'
      : tension > 60
      ? 'bg-orange-500'
      : tension > 40
      ? 'bg-yellow-500'
      : 'bg-green-500';

  const textColor =
    tension > 80
      ? 'text-red-400'
      : tension > 60
      ? 'text-orange-400'
      : tension > 40
      ? 'text-yellow-400'
      : 'text-green-400';

  return (
    <div className="absolute top-16 left-56 right-4 bg-black/80 border border-green-500/30 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-green-500/70 tracking-wider">
          GLOBAL TENSION LEVEL
        </span>
        <span className={`text-lg font-mono font-bold ${textColor} glow-text`}>{tension}%</span>
      </div>
      <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-green-500/20">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${tension}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Control Panel - Play/Pause, Speed, Window
 */
function ControlPanel({
  isPaused,
  playbackSpeed,
  timeWindow,
  onTogglePause,
  onCycleSpeed,
  onChangeWindow,
}: {
  isPaused: boolean;
  playbackSpeed: PlaybackSpeed;
  timeWindow: TimeWindow;
  onTogglePause: () => void;
  onCycleSpeed: () => void;
  onChangeWindow: (window: TimeWindow) => void;
}) {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-black/90 border border-green-500/30 rounded-lg p-3">
      <button
        onClick={onTogglePause}
        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-mono text-sm rounded border border-green-500/40 transition-colors"
      >
        {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
      </button>

      <button
        onClick={onCycleSpeed}
        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-mono text-sm rounded border border-green-500/40 transition-colors"
      >
        ⏩ x{playbackSpeed}
      </button>

      <select
        value={timeWindow}
        onChange={(e) => onChangeWindow(e.target.value as TimeWindow)}
        className="px-3 py-2 bg-green-500/20 text-green-400 font-mono text-sm rounded border border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50"
      >
        <option value="1h">1 HOUR</option>
        <option value="6h">6 HOURS</option>
        <option value="24h">24 HOURS</option>
        <option value="all">ALL TIME</option>
      </select>
    </div>
  );
}

/**
 * Event Icon Component
 */
function EventIcon({ type }: { type: MapEvent['type'] }) {
  const icons: Record<MapEvent['type'], string> = {
    missile: '🚀',
    drone: '✈️',
    airstrike: '💥',
    tank: '🛡️',
    naval: '⚓',
    cyber: '💻',
    explosion: '🔥',
  };

  return <span className="text-base">{icons[type] || '⬢'}</span>;
}

/**
 * Map Event Animation Layer
 */
function MapEventAnimation({ event, speed }: { event: AnimatedEvent; speed: PlaybackSpeed }) {
  const w = 1200;
  const h = 600;

  const to = project(event.to.lat, event.to.lon, w, h);
  const from = event.from ? project(event.from.lat, event.from.lon, w, h) : null;

  const color = getEventColor(event);
  const filter = event.color === 'hostile' ? 'url(#glow-hostile)' : 'url(#glow)';

  // Determine animation type based on event type
  if (event.type === 'missile' || event.type === 'drone') {
    return <ArcMissileAnimation from={from} to={to} color={color} filter={filter} speed={speed} type={event.type} />;
  }

  if (event.type === 'airstrike' || event.type === 'explosion') {
    return <PulseStrikeAnimation to={to} color={color} filter={filter} />;
  }

  if (event.type === 'naval') {
    return <NavalMoveAnimation from={from} to={to} color={color} filter={filter} speed={speed} />;
  }

  if (event.type === 'cyber') {
    return <DiploLineAnimation from={from} to={to} color={color} filter={filter} />;
  }

  // Default: simple pulse
  return <PulseStrikeAnimation to={to} color={color} filter={filter} />;
}

/**
 * Arc Missile/Drone Animation - Bézier curve path with moving dot
 */
function ArcMissileAnimation({
  from,
  to,
  color,
  filter,
  speed,
  type,
}: {
  from: { x: number; y: number } | null;
  to: { x: number; y: number };
  color: string;
  filter: string;
  speed: PlaybackSpeed;
  type: 'missile' | 'drone';
}) {
  if (!from) return <PulseStrikeAnimation to={to} color={color} filter={filter} />;

  const path = `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${
    Math.min(from.y, to.y) - 100
  } ${to.x} ${to.y}`;

  const duration = type === 'missile' ? 0.9 / speed : 2.2 / speed;

  return (
    <g filter={filter}>
      {/* Dashed trajectory */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="8 6"
        opacity="0.6"
        markerEnd="url(#arrow)"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;-50"
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
      </path>

      {/* Moving projectile */}
      <circle r="5" fill={color}>
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={path} />
      </circle>

      {/* Impact flash */}
      <circle cx={to.x} cy={to.y} r="8" fill={color} opacity="0.4">
        <animate attributeName="r" values="8;24;8" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

/**
 * Pulse Strike Animation - Expanding concentric rings
 */
function PulseStrikeAnimation({
  to,
  color,
  filter,
}: {
  to: { x: number; y: number };
  color: string;
  filter: string;
}) {
  return (
    <g filter={filter}>
      {/* Center point */}
      <circle cx={to.x} cy={to.y} r="6" fill={color} opacity="0.9" />

      {/* Ring 1 */}
      <circle cx={to.x} cy={to.y} r="8" fill="none" stroke={color} strokeWidth="2.5" opacity="0.8">
        <animate attributeName="r" values="8;30" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* Ring 2 */}
      <circle cx={to.x} cy={to.y} r="8" fill="none" stroke={color} strokeWidth="2" opacity="0.6">
        <animate
          attributeName="r"
          values="8;40"
          dur="2s"
          repeatCount="indefinite"
          begin="0.4s"
        />
        <animate
          attributeName="opacity"
          values="0.6;0"
          dur="2s"
          repeatCount="indefinite"
          begin="0.4s"
        />
      </circle>

      {/* Ring 3 */}
      <circle cx={to.x} cy={to.y} r="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
        <animate
          attributeName="r"
          values="8;50"
          dur="2.4s"
          repeatCount="indefinite"
          begin="0.8s"
        />
        <animate
          attributeName="opacity"
          values="0.4;0"
          dur="2.4s"
          repeatCount="indefinite"
          begin="0.8s"
        />
      </circle>
    </g>
  );
}

/**
 * Naval Move Animation - Icon gliding on dashed path
 */
function NavalMoveAnimation({
  from,
  to,
  color,
  filter,
  speed,
}: {
  from: { x: number; y: number } | null;
  to: { x: number; y: number };
  color: string;
  filter: string;
  speed: PlaybackSpeed;
}) {
  if (!from) return <PulseStrikeAnimation to={to} color={color} filter={filter} />;

  const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  const duration = 3 / speed;

  return (
    <g filter={filter}>
      {/* Dashed path */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="5 5"
        opacity="0.5"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;-30"
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
      </path>

      {/* Moving ship icon (rectangle) */}
      <rect width="10" height="6" fill={color} opacity="0.9">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={path} />
      </rect>

      {/* Destination marker */}
      <circle cx={to.x} cy={to.y} r="5" fill={color} opacity="0.6" />
    </g>
  );
}

/**
 * Diplomatic Line Animation - Blinking line between capitals
 */
function DiploLineAnimation({
  from,
  to,
  color,
  filter,
}: {
  from: { x: number; y: number } | null;
  to: { x: number; y: number };
  color: string;
  filter: string;
}) {
  if (!from) return <PulseStrikeAnimation to={to} color={color} filter={filter} />;

  return (
    <g filter={filter}>
      {/* Blinking line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth="2.5"
        opacity="0.7"
      >
        <animate
          attributeName="opacity"
          values="0.7;0.2;0.7"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </line>

      {/* Endpoints */}
      <circle cx={from.x} cy={from.y} r="4" fill={color} opacity="0.8" />
      <circle cx={to.x} cy={to.y} r="4" fill={color} opacity="0.8" />
    </g>
  );
}

/**
 * Get color for event
 */
function getEventColor(event: MapEvent): string {
  const colors: Record<MapEvent['type'], string> = {
    missile: 'rgba(255,69,58,0.95)',
    drone: 'rgba(255,214,10,0.95)',
    airstrike: 'rgba(0,255,136,0.95)',
    tank: 'rgba(255,159,10,0.95)',
    naval: 'rgba(10,132,255,0.95)',
    cyber: 'rgba(191,90,242,0.95)',
    explosion: 'rgba(255,55,95,0.95)',
  };

  return colors[event.type] || 'rgba(0,255,136,0.75)';
}
