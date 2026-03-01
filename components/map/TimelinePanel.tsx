'use client';

import { useEffect, useRef, useState } from 'react';
import { MapEvent } from '@/lib/signals/signalTypes';

/**
 * Timeline Panel - Scrollable list of recent map events
 *
 * Features:
 * - Displays last 20 events in reverse chronological order
 * - Click event to highlight on map (emits eventId)
 * - Auto-scroll to newest events
 * - Terminal-style UI with hover effects
 * - Event type icons and location labels
 */

interface TimelinePanelProps {
  events: MapEvent[];
  onEventClick?: (eventId: string) => void;
  selectedEventId?: string;
  className?: string;
}

const EVENT_ICONS: Record<MapEvent['type'], string> = {
  missile: '🚀',
  drone: '✈️',
  airstrike: '💥',
  tank: '🛡️',
  naval: '⚓',
  cyber: '💻',
  explosion: '🔥',
};

const EVENT_COLORS: Record<MapEvent['type'], string> = {
  missile: 'text-red-400 border-red-500/40',
  drone: 'text-yellow-400 border-yellow-500/40',
  airstrike: 'text-green-400 border-green-500/40',
  tank: 'text-orange-400 border-orange-500/40',
  naval: 'text-blue-400 border-blue-500/40',
  cyber: 'text-purple-400 border-purple-500/40',
  explosion: 'text-pink-400 border-pink-500/40',
};

export function TimelinePanel({
  events,
  onEventClick,
  selectedEventId,
  className = '',
}: TimelinePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Scroll to top (newest events)
    }
  }, [events.length, autoScroll]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop } = scrollRef.current;
      // Disable auto-scroll if user scrolls away from top
      setAutoScroll(scrollTop < 10);
    }
  };

  const handleEventClick = (eventId: string) => {
    onEventClick?.(eventId);
  };

  const displayEvents = events.slice().reverse().slice(0, 20);

  return (
    <div
      className={`bg-black/95 border-r border-green-500/30 flex flex-col overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-green-500/30 bg-black/80">
        <div className="text-xs text-green-500/70 font-mono tracking-widest uppercase mb-1">
          Event Timeline
        </div>
        <div className="text-sm font-mono text-green-400 font-semibold">
          RECENT ACTIONS ({displayEvents.length})
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent"
      >
        {displayEvents.length === 0 ? (
          <div className="p-4 text-center text-green-500/50 font-mono text-sm">
            NO EVENTS DETECTED
          </div>
        ) : (
          displayEvents.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              isSelected={event.id === selectedEventId}
              onClick={() => handleEventClick(event.id)}
              index={index}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-green-500/30 bg-black/80">
        <div className="flex items-center justify-between text-xs font-mono text-green-500/50">
          <span>CLICK TO HIGHLIGHT</span>
          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
              }}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              ↑ SCROLL TO TOP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual timeline event item
 */
function TimelineEvent({
  event,
  isSelected,
  onClick,
  index,
}: {
  event: MapEvent;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const eventColor = EVENT_COLORS[event.type] || 'text-green-400 border-green-500/40';
  const icon = EVENT_ICONS[event.type] || '⬢';

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 4) return 'bg-red-500/20 text-red-400 border-red-500/40';
    if (severity >= 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    if (severity >= 2) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    return 'bg-green-500/20 text-green-400 border-green-500/40';
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-green-500/10 hover:bg-green-500/10 transition-all cursor-pointer ${
        isSelected ? 'bg-green-500/20 border-l-4 border-l-green-400' : ''
      }`}
      style={{
        animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Header: Icon + Type */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs font-mono font-semibold uppercase ${eventColor.split(' ')[0]}`}>
          {event.type}
        </span>
        {event.severity && (
          <span
            className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${getSeverityBadge(
              event.severity
            )}`}
          >
            SEV-{event.severity}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="text-xs text-green-300/90 font-mono line-clamp-2 mb-2 leading-relaxed">
        {event.title}
      </div>

      {/* Footer: Time + Location + Confidence */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-green-500/70 font-mono">{formatTime(event.time)}</span>

        {event.to.label && (
          <>
            <span className="text-green-500/40">•</span>
            <span className="text-xs text-green-500/60 font-mono">📍 {event.to.label}</span>
          </>
        )}

        {event.confidence < 0.8 && (
          <>
            <span className="text-green-500/40">•</span>
            <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded font-mono border border-yellow-500/30">
              EST
            </span>
          </>
        )}

        {event.source.name && (
          <>
            <span className="text-green-500/40">•</span>
            <span className="text-xs text-green-500/50 font-mono truncate max-w-[120px]">
              {event.source.name}
            </span>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </button>
  );
}
