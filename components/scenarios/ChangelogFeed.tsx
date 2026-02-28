'use client';

import { ScenarioChangelog } from '@/types/scenario';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChangelogFeedProps {
  entries: ScenarioChangelog[];
}

export function ChangelogFeed({ entries }: ChangelogFeedProps) {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'probability_increase':
        return '📈';
      case 'probability_decrease':
        return '📉';
      case 'new_signal':
        return '🔔';
      case 'impact_change':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'probability_increase':
        return 'Augmentation de probabilité';
      case 'probability_decrease':
        return 'Diminution de probabilité';
      case 'new_signal':
        return 'Nouveau signal';
      case 'impact_change':
        return 'Changement d\'impact';
      default:
        return 'Changement';
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'probability_increase':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'probability_decrease':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'new_signal':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'impact_change':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (sortedEntries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des changements</h3>
        <p className="text-sm text-gray-500">Aucun changement enregistré.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historique des changements <span className="text-gray-500 font-normal text-sm">({sortedEntries.length})</span>
      </h3>

      <div className="space-y-3">
        {sortedEntries.map((entry, index) => (
          <div key={index} className={`border rounded-lg p-4 ${getChangeColor(entry.change_type)}`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{getChangeTypeIcon(entry.change_type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{getChangeTypeLabel(entry.change_type)}</span>
                  <span className="text-xs opacity-75">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale: fr })}
                  </span>
                </div>

                <p className="text-sm mb-2">{entry.reason}</p>

                {entry.old_value !== undefined && entry.new_value !== undefined && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="opacity-75">{entry.old_value}</span>
                    <span>→</span>
                    <span className="font-semibold">{entry.new_value}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
