'use client';

import Link from 'next/link';
import { ScenarioScore } from '@/types/scenario';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ScenarioCardProps {
  scenario: ScenarioScore & { name: string; description: string };
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const probabilityPercent = Math.round(scenario.probability * 100);
  const confidencePercent = Math.round(scenario.confidence * 100);

  // Color based on probability
  const getProbabilityColor = (prob: number) => {
    if (prob < 0.2) return 'text-green-600 bg-green-50 border-green-200';
    if (prob < 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (prob < 0.7) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return '↑';
      case 'falling':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'text-red-500';
      case 'falling':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Link
      href={`/scenarios/${scenario.scenario_id}`}
      className="block bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{scenario.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{scenario.description}</p>
        </div>
        <div className={`ml-4 flex items-center gap-1 font-bold text-2xl ${getTrendColor(scenario.trend)}`}>
          <span>{probabilityPercent}%</span>
          <span className="text-xl">{getTrendIcon(scenario.trend)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Confiance:</span>
            <span className="font-medium text-gray-700">{confidencePercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Signaux actifs:</span>
            <span className="font-medium text-gray-700">{scenario.active_signals.length}</span>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          MAJ {formatDistanceToNow(scenario.last_updated, { addSuffix: true, locale: fr })}
        </div>
      </div>

      <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getProbabilityColor(scenario.probability)}`}>
        {probabilityPercent < 20 && 'Probabilité faible'}
        {probabilityPercent >= 20 && probabilityPercent < 50 && 'Probabilité moyenne'}
        {probabilityPercent >= 50 && probabilityPercent < 70 && 'Probabilité élevée'}
        {probabilityPercent >= 70 && 'Probabilité critique'}
      </div>
    </Link>
  );
}
