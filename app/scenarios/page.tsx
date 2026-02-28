'use client';

import { useQuery } from '@tanstack/react-query';
import { ScenarioCard } from '@/components/scenarios/ScenarioCard';
import { Navigation } from '@/components/shared/Navigation';
import { ScenarioScore, DEFAULT_SCENARIOS } from '@/types/scenario';
import { useState } from 'react';

interface ScenarioWithMetadata extends ScenarioScore {
  name: string;
  description: string;
}

export default function ScenariosPage() {
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'probability' | 'updated_at'>('probability');

  // Fetch scenarios from API
  const { data, isLoading, error } = useQuery<{ scenarios: ScenarioWithMetadata[]; last_updated: number }>({
    queryKey: ['scenarios', regionFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (regionFilter !== 'all') params.append('region', regionFilter);
      params.append('sort_by', sortBy);

      const response = await fetch(`/api/scenarios?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h2>
            <p className="text-red-700">Impossible de charger les scénarios. Veuillez réessayer plus tard.</p>
          </div>
        </div>
      </div>
    );
  }

  const scenarios = data?.scenarios || [];
  const lastUpdated = data?.last_updated ? new Date(data.last_updated).toLocaleString('fr-FR') : 'N/A';

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scénarios d'escalade</h1>
          <p className="text-gray-600">
            Analyse probabiliste des scénarios basée sur les signaux d'actualité en temps réel
          </p>
          <div className="mt-2 text-sm text-gray-500">Dernière mise à jour: {lastUpdated}</div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="region" className="text-sm font-medium text-gray-700">
                Région:
              </label>
              <select
                id="region"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les régions</option>
                <option value="middle_east">Moyen-Orient</option>
                <option value="europe">Europe</option>
                <option value="global">Global</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                Trier par:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'probability' | 'updated_at')}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="probability">Probabilité</option>
                <option value="updated_at">Dernière mise à jour</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              <span className="font-medium">{scenarios.length}</span> scénarios actifs
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        {scenarios.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">Aucun scénario actif pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.scenario_id} scenario={scenario} />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">À propos de l'analyse</h3>
          <p className="text-sm text-blue-800">
            Les probabilités sont calculées en temps réel à partir des signaux détectés dans les flux d'actualité.
            La fiabilité de chaque scénario dépend de la qualité et de la quantité des sources disponibles.
          </p>
        </div>
        </div>
      </div>
    </>
  );
}
