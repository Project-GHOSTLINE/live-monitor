'use client';

import { FeedItem } from '@/types/feed';
import { formatDistanceToNow } from 'date-fns';

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const publishedDate = new Date(item.published_at * 1000);
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });

  const reliabilityColor = {
    5: 'bg-green-100 text-green-800',
    4: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    2: 'bg-orange-100 text-orange-800',
    1: 'bg-red-100 text-red-800',
  }[item.reliability] || 'bg-gray-100 text-gray-800';

  return (
    <article className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {item.title_en || item.title_original}
          </h2>

          <div className="flex items-center space-x-3 text-sm text-slate-600">
            <span className="font-medium">{item.source_name}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        <span className={`px-2 py-1 text-xs font-semibold rounded ${reliabilityColor}`}>
          Reliability: {item.reliability}/5
        </span>
      </div>

      {/* Summary */}
      {item.summary_en && (
        <p className="text-slate-700 mb-3 line-clamp-2">{item.summary_en}</p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          {item.lang !== 'en' && (
            <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
              Translated from {item.lang.toUpperCase()}
            </span>
          )}

          {item.entity_places && item.entity_places.length > 0 && (
            <span className="text-xs text-slate-500">
              📍 {item.entity_places.slice(0, 3).join(', ')}
            </span>
          )}
        </div>

        <a
          href={item.canonical_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Read Original →
        </a>
      </div>
    </article>
  );
}
