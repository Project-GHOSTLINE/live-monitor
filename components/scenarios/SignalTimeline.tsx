'use client';

import { Signal } from '@/types/scenario';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SignalTimelineProps {
  signals: Signal[];
}

export function SignalTimeline({ signals }: SignalTimelineProps) {
  const sortedSignals = [...signals].sort((a, b) => b.timestamp - a.timestamp);

  const getSignalTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      strike: 'bg-red-100 text-red-800 border-red-300',
      protest: 'bg-orange-100 text-orange-800 border-orange-300',
      sanction: 'bg-purple-100 text-purple-800 border-purple-300',
      negotiation: 'bg-green-100 text-green-800 border-green-300',
      cyber_attack: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      troop_movement: 'bg-red-200 text-red-900 border-red-400',
      default: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[eventType] || colors.default;
  };

  const getSeverityDot = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return colors[severity] || colors.low;
  };

  if (sortedSignals.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Signaux actifs récents</h3>
        <p className="text-sm text-gray-500">Aucun signal actif pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Signaux actifs récents <span className="text-gray-500 font-normal text-sm">({sortedSignals.length})</span>
      </h3>

      <div className="space-y-4">
        {sortedSignals.map((signal, index) => (
          <div key={signal.signal_id} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
            <div className={`absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white ${getSeverityDot(signal.severity)}`}></div>

            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getSignalTypeColor(signal.event_type)}`}>
                      {signal.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(signal.timestamp, { addSuffix: true, locale: fr })}
                    </span>
                  </div>

                  {signal.actors.length > 0 && (
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Acteurs:</span> {signal.actors.join(', ')}
                    </div>
                  )}
                </div>

                <div className="ml-4 text-right">
                  <div className="text-xs text-gray-500">Poids</div>
                  <div className="text-sm font-semibold text-gray-900">{Math.round(signal.weight * 100)}%</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Fiabilité:</span> {Math.round(signal.reliability * 100)}%
                </div>
                <div>
                  <span className="font-medium">Récence:</span> {Math.round(signal.recency_factor * 100)}%
                </div>
                <div>
                  <span className="font-medium">Sources:</span> {signal.feed_item_ids.length}
                </div>
              </div>

              {signal.feed_item_ids.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {signal.feed_item_ids.slice(0, 3).map((itemId) => (
                      <a
                        key={itemId}
                        href={`/monitor?item=${itemId}`}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source #{itemId}
                      </a>
                    ))}
                    {signal.feed_item_ids.length > 3 && (
                      <span className="text-xs text-gray-500">+{signal.feed_item_ids.length - 3} autres</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
