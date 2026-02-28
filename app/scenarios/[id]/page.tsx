'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ImpactMatrix } from '@/components/scenarios/ImpactMatrix';
import { SignalTimeline } from '@/components/scenarios/SignalTimeline';
import { ChangelogFeed } from '@/components/scenarios/ChangelogFeed';
import { ProbabilityChart } from '@/components/scenarios/ProbabilityChart';
import { Navigation } from '@/components/shared/Navigation';
import { ScenarioScore, ImpactMatrix as ImpactMatrixType, ScenarioChangelog, DEFAULT_SCENARIOS } from '@/types/scenario';

interface ScenarioDetailData {
  scenario: ScenarioScore & { name: string; description: string };
  impacts: ImpactMatrixType;
  changelog: ScenarioChangelog[];
}

export default function ScenarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.id as string;

  // Fetch scenario details
  const { data, isLoading, error } = useQuery<ScenarioDetailData>({
    queryKey: ['scenario', scenarioId],
    queryFn: async () => {
      const response = await fetch(`/api/scenarios/${scenarioId}`);
      if (!response.ok) throw new Error('Failed to fetch scenario details');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h2>
            <p className="text-red-700">Impossible de charger les détails du scénario.</p>
            <button
              onClick={() => router.push('/scenarios')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retour aux scénarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { scenario, impacts, changelog } = data;
  const probabilityPercent = Math.round(scenario.probability * 100);
  const confidencePercent = Math.round(scenario.confidence * 100);

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

  const getProbabilityColor = (prob: number) => {
    if (prob < 20) return 'text-green-600 bg-green-50 border-green-200';
    if (prob < 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (prob < 70) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/scenarios')}
          className="mb-6 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Retour aux scénarios
        </button>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{scenario.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{scenario.description}</p>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Confiance:</span>
                  <span className="font-medium text-gray-700">{confidencePercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Signaux actifs:</span>
                  <span className="font-medium text-gray-700">{scenario.active_signals.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Tendance:</span>
                  <span className={`font-medium ${getTrendColor(scenario.trend)}`}>
                    {scenario.trend === 'rising' && 'En hausse'}
                    {scenario.trend === 'falling' && 'En baisse'}
                    {scenario.trend === 'stable' && 'Stable'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 text-center">
              <div className={`text-5xl font-bold mb-2 ${getTrendColor(scenario.trend)}`}>
                {probabilityPercent}% {getTrendIcon(scenario.trend)}
              </div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getProbabilityColor(probabilityPercent)}`}>
                {probabilityPercent < 20 && 'Probabilité faible'}
                {probabilityPercent >= 20 && probabilityPercent < 50 && 'Probabilité moyenne'}
                {probabilityPercent >= 50 && probabilityPercent < 70 && 'Probabilité élevée'}
                {probabilityPercent >= 70 && 'Probabilité critique'}
              </div>
            </div>
          </div>
        </div>

        {/* Probability Chart */}
        <div className="mb-6">
          <ProbabilityChart changelog={changelog} currentProbability={scenario.probability} />
        </div>

        {/* Impact Matrix */}
        <div className="mb-6">
          <ImpactMatrix impacts={impacts} />
        </div>

        {/* Two column layout for signals and changelog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SignalTimeline signals={scenario.active_signals} />
          <ChangelogFeed entries={changelog} />
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">Avertissement</h3>
          <p className="text-sm text-yellow-800">
            Cette analyse est générée automatiquement à partir de sources d'actualité et ne constitue pas une prédiction définitive.
            Les probabilités sont indicatives et doivent être interprétées avec prudence.
          </p>
          </div>
        </div>
      </div>
    </>
  );
}
