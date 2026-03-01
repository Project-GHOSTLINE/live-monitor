'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Clock, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

interface NewsItem {
  id: number;
  title_en: string;
  title_original?: string;
  summary_en?: string;
  source_name: string;
  source_url?: string;
  published_at: number;
  tags?: string[];
  reliability?: number;
  category?: string;
}

interface NewsDetailPopupProps {
  news: NewsItem;
  onClose: () => void;
}

export function NewsDetailPopup({ news, onClose }: NewsDetailPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const timeAgo = () => {
    const seconds = Math.floor(Date.now() / 1000) - news.published_at;
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const reliabilityColor = () => {
    if (!news.reliability) return 'text-gray-400';
    if (news.reliability >= 4) return 'text-green-400';
    if (news.reliability >= 3) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const reliabilityLabel = () => {
    if (!news.reliability) return 'Unknown';
    if (news.reliability >= 4) return 'High';
    if (news.reliability >= 3) return 'Medium';
    return 'Low';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-slate-900 to-black border-2 border-green-500/30 rounded-xl shadow-2xl shadow-green-500/20 overflow-hidden">
          {/* Animated scan lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_48%,rgba(0,255,136,0.1)_50%,transparent_52%,transparent_100%)] bg-[length:100%_4px] animate-[scan_4s_linear_infinite]" />
          </div>

          {/* Glow effect */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />

          <div className="relative p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span className="glow-text">{timeAgo().toUpperCase()}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-mono ${reliabilityColor()}`}>
                    <Shield className="w-3 h-3" />
                    <span>RELIABILITY: {reliabilityLabel()}</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-green-400 mb-3 glow-text leading-tight">
                  {news.title_en}
                </h2>

                {news.title_original && news.title_original !== news.title_en && (
                  <p className="text-sm text-gray-400 font-mono mb-3 italic">
                    Original: {news.title_original}
                  </p>
                )}
              </div>

              <button
                onClick={handleClose}
                className="ml-4 p-2 hover:bg-red-900/40 border border-red-600/30 hover:border-red-500 transition-all rounded-lg group"
              >
                <X className="w-5 h-5 text-red-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Summary */}
            {news.summary_en && (
              <div className="mb-6 p-4 bg-black/40 border border-green-900/40 rounded-lg">
                <h3 className="text-sm font-bold text-green-400 mb-2 font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  INTELLIGENCE BRIEF
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {news.summary_en}
                </p>
              </div>
            )}

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-green-500 mb-2 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  CLASSIFICATION
                </h3>
                <div className="flex flex-wrap gap-2">
                  {news.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-900/20 border border-green-700/40 text-green-300 text-xs font-mono rounded-md hover:bg-green-800/30 hover:border-green-600 transition-all cursor-default"
                    >
                      {tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-black/40 border border-blue-900/40 p-3 rounded-lg">
                <div className="text-xs text-blue-400 font-mono mb-1">SOURCE</div>
                <div className="text-sm text-white font-bold">{news.source_name}</div>
              </div>

              <div className="bg-black/40 border border-purple-900/40 p-3 rounded-lg">
                <div className="text-xs text-purple-400 font-mono mb-1">CATEGORY</div>
                <div className="text-sm text-white font-bold">{news.category || 'UNCATEGORIZED'}</div>
              </div>

              <div className="bg-black/40 border border-yellow-900/40 p-3 rounded-lg">
                <div className="text-xs text-yellow-400 font-mono mb-1">ITEM ID</div>
                <div className="text-sm text-white font-mono font-bold">#{news.id}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {news.source_url && (
                <a
                  href={news.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 border border-green-400 text-black font-bold font-mono text-sm rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 group"
                >
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  VIEW ORIGINAL SOURCE
                </a>
              )}

              <button
                onClick={handleClose}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold font-mono text-sm rounded-lg transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glow-text {
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </>
  );
}
