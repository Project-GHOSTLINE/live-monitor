import { NextRequest, NextResponse } from 'next/server';
import { calculateScenarioScores } from '@/lib/scenarios/calculator';
import { getImpactMatrix } from '@/lib/scenarios/impacts';
import { getScenarioChangelog } from '@/lib/scenarios/changelog';
import { DEFAULT_SCENARIOS } from '@/types/scenario';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scenarioId } = await params;

    // Calculate all scenario scores
    const scenarioScores = await calculateScenarioScores();

    // Find the requested scenario
    const scenarioScore = scenarioScores.find((s) => s.scenario_id === scenarioId);

    if (!scenarioScore) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Get template metadata
    const template = DEFAULT_SCENARIOS.find((t) => t.id === scenarioId);

    // Get impact matrix for this scenario
    const impacts = await getImpactMatrix(scenarioId, scenarioScore.active_signals);

    // Get changelog for this scenario
    const changelog = await getScenarioChangelog(scenarioId, 50);

    return NextResponse.json({
      scenario: {
        ...scenarioScore,
        name: template?.name || scenarioId,
        description: template?.description || 'No description available',
      },
      impacts,
      changelog,
    });
  } catch (error) {
    console.error('Error fetching scenario details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch scenario details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
