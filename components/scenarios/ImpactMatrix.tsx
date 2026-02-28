'use client';

import { ImpactMatrix as ImpactMatrixType } from '@/types/scenario';

interface ImpactMatrixProps {
  impacts: ImpactMatrixType;
}

export function ImpactMatrix({ impacts }: ImpactMatrixProps) {
  const getImpactColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getImpactLabel = (level: string) => {
    switch (level) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyen';
      case 'high':
        return 'Élevé';
      default:
        return 'Inconnu';
    }
  };

  const domains = impacts.impacts.map((impact) => ({
    ...impact,
    displayName: getDomainDisplayName(impact.domain),
  }));

  function getDomainDisplayName(domain: string): string {
    const names: Record<string, string> = {
      aviation: 'Aviation',
      energy: 'Énergie',
      cyber: 'Cybersécurité',
      humanitarian: 'Humanitaire',
      supply_chain: 'Chaînes logistiques',
      financial: 'Finance',
      security: 'Sécurité',
    };
    return names[domain] || domain;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Matrice d'Impact</h3>
        <span className="text-xs text-gray-500">
          Sévérité globale:{' '}
          <span className={`font-semibold ${getImpactColor(impacts.overall_severity)}`}>
            {getImpactLabel(impacts.overall_severity)}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map((impact) => (
          <div key={impact.domain} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{impact.displayName}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getImpactColor(impact.level)}`}>
                {getImpactLabel(impact.level)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">{impact.reasoning}</p>

            {impact.supporting_signals.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">{impact.supporting_signals.length}</span> signaux de support
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
            <span>Faible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
            <span>Moyen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
            <span>Élevé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
