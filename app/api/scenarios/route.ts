import { NextRequest, NextResponse } from 'next/server';
import { calculateScenarioScores } from '@/lib/scenarios/calculator';
import { DEFAULT_SCENARIOS } from '@/types/scenario';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region') || 'all';
    const sortBy = searchParams.get('sort_by') || 'probability';

    // Calculate scenario scores
    const scenarioScores = await calculateScenarioScores();

    // Add metadata from templates
    const scenariosWithMetadata = scenarioScores.map((score) => {
      const template = DEFAULT_SCENARIOS.find((t) => t.id === score.scenario_id);
      return {
        ...score,
        name: template?.name || score.scenario_id,
        description: template?.description || 'No description available',
      };
    });

    // Sort scenarios
    let sortedScenarios = [...scenariosWithMetadata];
    if (sortBy === 'probability') {
      sortedScenarios.sort((a, b) => b.probability - a.probability);
    } else if (sortBy === 'updated_at') {
      sortedScenarios.sort((a, b) => b.last_updated - a.last_updated);
    }

    return NextResponse.json({
      scenarios: sortedScenarios,
      last_updated: Date.now(),
      total: sortedScenarios.length,
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch scenarios',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
