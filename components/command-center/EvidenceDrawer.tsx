'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface FeedItem {
  id: number;
  title_en: string;
  source_name: string;
  published_at: number;
  tags: string[];
  reliability: number;
  url?: string;
}

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  country?: string;
  target?: string;
  title?: string;
}

export function EvidenceDrawer({
  isOpen,
  onClose,
  country,
  target,
  title = 'Evidence Timeline',
}: EvidenceDrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch relevant feed items
  const { data, isLoading } = useQuery<{ items: FeedItem[]; total: number }>({
    queryKey: ['evidence', country, target],
    queryFn: async () => {
      // Build query params - filter by tags if country/target provided
      const params = new URLSearchParams();
      params.set('limit', '10');
      params.set('sort_by', 'published_at');
      params.set('order', 'desc');

      // If we have country/target, try to filter by tags
      // This is a simple approach - can be enhanced server-side
      if (country || target) {
        // We'll filter client-side for now since /api/items might not support tag filtering yet
      }

      const response = await fetch(`/api/items?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch evidence');
      return response.json();
    },
    enabled: isOpen,
    refetchInterval: false,
  });

  // Handle animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isAnimating && !isOpen) return null;

  // Filter items client-side by country codes in tags
  const filteredItems = data?.items.filter(item => {
    if (!country && !target) return true;
    const tags = item.tags || [];
    const matchesCountry = country ? tags.includes(country) : true;
    const matchesTarget = target ? tags.includes(target) : true;
    return matchesCountry || matchesTarget;
  }) || [];

  const getSeverityBadge = (reliability: number) => {
    if (reliability >= 4) return { label: 'HIGH', color: 'bg-green-600 text-white' };
    if (reliability >= 3) return { label: 'MED', color: 'bg-yellow-600 text-black' };
    return { label: 'LOW', color: 'bg-red-600 text-white' };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-gradient-to-br from-gray-900 via-black to-gray-900 border-l-4 border-green-500 shadow-2xl shadow-green-500/30 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent pointer-events-none animate-scan opacity-30" />

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="border-b-4 border-green-500 bg-black/80 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-green-500/60 font-mono tracking-widest mb-2">
                  INTELLIGENCE EVIDENCE
                </div>
                <h2 className="text-2xl font-bold text-green-400 font-mono tracking-wider glow-text mb-2">
                  {title}
                </h2>
                {country && target && (
                  <div className="text-sm font-mono text-green-500/80">
                    <span className="text-2xl">{country}</span>
                    <span className="text-red-500 mx-2">→</span>
                    <span className="text-2xl">{target}</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-green-400 hover:text-red-400 font-mono text-2xl font-bold transition-colors ml-4"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Evidence items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading && (
              <div className="text-center text-green-400 font-mono py-8 animate-pulse">
                <div className="text-4xl mb-4">⬡</div>
                <div>LOADING EVIDENCE...</div>
              </div>
            )}

            {!isLoading && filteredItems.length === 0 && (
              <div className="text-center text-green-500/60 font-mono py-8">
                <div className="text-4xl mb-4">📂</div>
                <div>NO EVIDENCE FOUND</div>
                <div className="text-xs mt-2">Signals may be classified or unavailable</div>
              </div>
            )}

            {filteredItems.map((item, index) => {
              const severity = getSeverityBadge(item.reliability);

              return (
                <div
                  key={item.id}
                  className="bg-black/60 border-2 border-green-900/40 hover:border-green-500/60 p-4 transition-all animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-green-500/60">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-mono font-bold ${severity.color}`}>
                          {severity.label}
                        </span>
                      </div>
                      <div className="text-sm text-green-300 font-medium leading-tight mb-2">
                        {item.title_en}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-green-500/60 font-mono mb-3">
                    <span>{item.source_name}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.published_at * 1000).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 5).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-green-900/40 border border-green-700/40 text-xs font-mono text-green-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* URL if available */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      🔗 View Source
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-green-900/40 bg-black/80 p-4">
            <div className="text-xs font-mono text-green-500/60 text-center">
              {filteredItems.length > 0
                ? `Showing ${filteredItems.length} relevant signal${filteredItems.length !== 1 ? 's' : ''}`
                : 'No signals match current filters'}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-scan {
            animation: scan 8s linear infinite;
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out backwards;
          }
          .glow-text {
            text-shadow: 0 0 10px currentColor;
          }
        `}</style>
      </div>
    </>
  );
}
