import { NextRequest, NextResponse } from 'next/server';
import { getCountryRelations } from '@/lib/state/updateRelationEdges';

/**
 * GET /api/state/relations?code=US&type=hostile&min_strength=0.5
 *
 * Returns bilateral relations for a specific country.
 * Filters by relation type and minimum strength.
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Check feature flag
    const stateEnabled = process.env.STATE_ENABLED === 'true';
    if (!stateEnabled) {
      return NextResponse.json(
        {
          error: 'State engine disabled',
          message: 'Set STATE_ENABLED=true to enable state calculations',
        },
        { status: 503 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('code');
    const relationType = searchParams.get('type') || undefined;
    const minStrength = parseFloat(searchParams.get('min_strength') || '0.0');

    if (!countryCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: code' },
        { status: 400 }
      );
    }

    // Validate country code
    if (!/^[A-Z]{2,3}$/.test(countryCode)) {
      return NextResponse.json(
        { error: 'Invalid country code format' },
        { status: 400 }
      );
    }

    // Validate relation type if provided
    const validTypes = ['allied', 'hostile', 'neutral', 'trade_partner', 'adversary', 'treaty_member', 'sanctioned'];
    if (relationType && !validTypes.includes(relationType)) {
      return NextResponse.json(
        { error: `Invalid relation type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get relations
    const relations = await getCountryRelations(countryCode, {
      minStrength,
      relationType,
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      country_code: countryCode,
      relations,
      total: relations.length,
      filters: {
        type: relationType || 'all',
        min_strength: minStrength,
      },
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('[GET /api/state/relations] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
