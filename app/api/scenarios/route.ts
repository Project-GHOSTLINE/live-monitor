import { NextRequest, NextResponse } from 'next/server';
import { calculateScenarioScores } from '@/lib/scenarios/calculator';
import { DEFAULT_SCENARIOS } from '@/types/scenario';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region') || 'all';
    const sortBy = searchParams.get('sort_by') || 'probability';

    console.log(`[Scenarios API] Request received - region: ${region}, sortBy: ${sortBy}`);

    // Validate sort parameter
    const validSortOptions = ['probability', 'updated_at'];
    if (sortBy && !validSortOptions.includes(sortBy)) {
      console.warn(`[Scenarios API] Invalid sort parameter: ${sortBy}`);
      return NextResponse.json(
        {
          error: 'Invalid parameter',
          details: `Invalid sort_by parameter. Must be one of: ${validSortOptions.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Calculate scenario scores with comprehensive error handling
    let scenarioScores;
    try {
      scenarioScores = await calculateScenarioScores();
      console.log(`[Scenarios API] Calculated ${scenarioScores.length} scenario scores`);
    } catch (calculatorError) {
      console.error('[Scenarios API] Calculator failed:', calculatorError);

      // Check if it's a database connection error
      if (
        calculatorError instanceof Error &&
        (calculatorError.message.includes('Database connection') ||
          calculatorError.message.includes('SQLITE'))
      ) {
        return NextResponse.json(
          {
            error: 'Database connection error',
            details: 'Unable to connect to the database. Please ensure the database is properly initialized.',
            retry: true,
          },
          { status: 503 }
        );
      }

      // Return generic error for other calculator failures
      return NextResponse.json(
        {
          error: 'Calculation error',
          details: 'Failed to calculate scenario scores. The system will use baseline data.',
          retry: true,
        },
        { status: 500 }
      );
    }

    // Handle empty results
    if (!scenarioScores || scenarioScores.length === 0) {
      console.warn('[Scenarios API] No scenarios calculated, returning empty result with metadata');
      return NextResponse.json({
        scenarios: [],
        last_updated: Date.now(),
        total: 0,
        message: 'No scenario data available. This may be due to insufficient feed data.',
      });
    }

    // Add metadata from templates with error handling
    const scenariosWithMetadata = scenarioScores.map((score) => {
      try {
        const template = DEFAULT_SCENARIOS.find((t) => t.id === score.scenario_id);
        return {
          ...score,
          name: template?.name || score.scenario_id,
          description: template?.description || 'No description available',
        };
      } catch (metadataError) {
        console.error(`[Scenarios API] Error adding metadata for ${score.scenario_id}:`, metadataError);
        return {
          ...score,
          name: score.scenario_id,
          description: 'No description available',
        };
      }
    });

    // Sort scenarios with error handling
    let sortedScenarios = [...scenariosWithMetadata];
    try {
      if (sortBy === 'probability') {
        sortedScenarios.sort((a, b) => b.probability - a.probability);
      } else if (sortBy === 'updated_at') {
        sortedScenarios.sort((a, b) => b.last_updated - a.last_updated);
      }
    } catch (sortError) {
      console.error('[Scenarios API] Error sorting scenarios:', sortError);
      // Continue with unsorted data
    }

    const responseTime = Date.now() - startTime;
    console.log(`[Scenarios API] Request completed successfully in ${responseTime}ms`);

    return NextResponse.json({
      scenarios: sortedScenarios,
      last_updated: Date.now(),
      total: sortedScenarios.length,
      response_time_ms: responseTime,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[Scenarios API] Unexpected error:', error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error('[Scenarios API] Error name:', error.name);
      console.error('[Scenarios API] Error message:', error.message);
      console.error('[Scenarios API] Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: Date.now(),
        response_time_ms: responseTime,
      },
      { status: 500 }
    );
  }
}
