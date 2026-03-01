'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface NewsItem {
  id: number;
  title: string;
  description?: string;
  content?: string;
  source: string;
  time: number;
  url: string;
  tags: string[];
  reliability: number;
  entity_places?: string[];
  entity_orgs?: string[];
  lang: string;
}

interface NewsItemTooltipProps {
  item: NewsItem;
  children: React.ReactNode;
  formatTime: (timestamp: number) => string;
}

export function NewsItemTooltip({ item, children, formatTime }: NewsItemTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect) {
        // Position tooltip to the right of the item
        const x = rect.right + 12;
        const y = rect.top;
        setTooltipPosition({ x, y });
        setIsHovered(true);
      }
    }, 300); // 300ms delay before showing tooltip
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const now = Math.floor(Date.now() / 1000);
  const ageMinutes = Math.floor((now - item.time) / 60);
  const isLive = ageMinutes < 60; // Less than 1 hour = LIVE

  const getReliabilityColor = (score: number) => {
    if (score >= 8) return { bg: 'bg-green-500', text: 'text-green-400', label: 'HIGH' };
    if (score >= 5) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'MED' };
    return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'LOW' };
  };

  const reliability = getReliabilityColor(item.reliability);

  const formatExactTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <>
      <div
        ref={anchorRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {/* Tooltip Portal */}
      {isMounted && isHovered && createPortal(
        <div
          className="fixed z-[99999] w-[480px] bg-black/98 border-2 border-green-500 rounded-lg shadow-2xl shadow-green-500/50 font-mono text-xs p-4 animate-fade-in pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            maxHeight: '600px',
            overflowY: 'auto',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5 z-10 rounded-lg"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.15) 3px)',
            }}
          />

          {/* Header */}
          <div className="border-b border-green-500/40 pb-3 mb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-green-400 font-bold text-sm leading-tight flex-1" style={{ textShadow: '0 0 8px rgba(34,197,94,0.8)' }}>
                {item.title}
              </h3>
              {isLive && (
                <span className="flex-shrink-0 px-2 py-0.5 bg-red-500/20 border border-red-500 text-red-400 text-[9px] font-bold uppercase tracking-wider rounded animate-pulse">
                  🔴 LIVE
                </span>
              )}
            </div>

            {/* Meta Info Row */}
            <div className="flex items-center gap-3 text-[9px] text-green-500/60">
              <span>📡 {item.source}</span>
              <span>•</span>
              <span>🕐 {formatExactTime(item.time)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className={reliability.text}>●</span>
                Reliability: {reliability.label} ({item.reliability}/10)
              </span>
            </div>
          </div>

          {/* Content */}
          {item.description && (
            <div className="mb-3">
              <div className="text-green-500/60 text-[9px] uppercase tracking-wider mb-1">▸ Summary</div>
              <p className="text-green-200/90 text-[11px] leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {item.content && (
            <div className="mb-3">
              <div className="text-green-500/60 text-[9px] uppercase tracking-wider mb-1">▸ Full Content</div>
              <p className="text-green-200/70 text-[10px] leading-relaxed max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent pr-2">
                {item.content}
              </p>
            </div>
          )}

          {/* Entities */}
          {(item.entity_places && item.entity_places.length > 0) || (item.entity_orgs && item.entity_orgs.length > 0) ? (
            <div className="mb-3 border-t border-green-500/30 pt-3">
              <div className="text-green-500/60 text-[9px] uppercase tracking-wider mb-2">▸ Extracted Entities</div>

              {item.entity_places && item.entity_places.length > 0 && (
                <div className="mb-2">
                  <span className="text-green-400/70 text-[9px] font-bold mr-2">📍 Places:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.entity_places.map((place, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-300 text-[9px] rounded"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.entity_orgs && item.entity_orgs.length > 0 && (
                <div>
                  <span className="text-green-400/70 text-[9px] font-bold mr-2">🏢 Organizations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.entity_orgs.map((org, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] rounded"
                      >
                        {org}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-3">
              <div className="text-green-500/60 text-[9px] uppercase tracking-wider mb-1">▸ Tags</div>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-[9px] rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reliability Bar */}
          <div className="border-t border-green-500/30 pt-3">
            <div className="flex items-center justify-between text-[9px] mb-1">
              <span className="text-green-500/60 uppercase tracking-wider">Reliability Score</span>
              <span className={`${reliability.text} font-bold`}>{item.reliability}/10</span>
            </div>
            <div className="h-2 bg-black/60 rounded overflow-hidden border border-green-500/30">
              <div
                className={`h-full ${reliability.bg} transition-all duration-500`}
                style={{
                  width: `${(item.reliability / 10) * 100}%`,
                  boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-green-500/30 mt-3 pt-3 text-center">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 text-[10px] font-bold uppercase tracking-wider hover:text-green-300 transition-colors pointer-events-auto"
              style={{ textShadow: '0 0 8px rgba(34,197,94,0.6)' }}
            >
              🔗 Open Original Source →
            </a>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
