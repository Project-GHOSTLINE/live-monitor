import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/client';
import { detectSignals, detectSignalsBatch } from '@/lib/workers/signalDetector';
import { calculateReadinessBatch } from '@/lib/workers/readinessCalculator';
import { updateConflictGraph } from '@/lib/workers/conflictGraphUpdater';
import { updateScenarios, SCENARIO_RULES } from '@/lib/workers/scenarioUpdater';

/**
 * GET /api/signals
 *
 * Detects signals in recent feed items and returns:
 * - Detected signals
 * - Updated readiness scores
 * - Updated conflict graph
 * - Updated scenarios
 *
 * Query params:
 * - hours: number (default: 24, analyze items from last N hours)
 * - limit: number (default: 100, max feed items to analyze)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    const db = getDatabase();

    // Calculate timestamp threshold
    const thresholdTimestamp = Math.floor(Date.now() / 1000) - hours * 3600;

    // Fetch recent feed items
    const stmt = db.prepare(`
      SELECT
        id,
        title_en,
        summary_en,
        published_at,
        tags
      FROM feed_items
      WHERE published_at >= ?
      ORDER BY published_at DESC
      LIMIT ?
    `);

    const items = stmt.all(thresholdTimestamp, limit) as Array<{
      id: number;
      title_en: string;
      summary_en?: string;
      published_at: number;
      tags?: string;
    }>;

    // Parse tags
    const parsedItems = items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
    }));

    // Detect signals (Worker 1)
    const signalsMap = detectSignalsBatch(parsedItems);

    // Flatten all signals
    const allSignals = Array.from(signalsMap.values()).flat();

    // Group signals by country (extract from tags)
    const countrySignalsMap = new Map<string, typeof allSignals>();

    for (const item of parsedItems) {
      const signals = signalsMap.get(item.id) || [];
      if (signals.length === 0) continue;

      // Extract country codes from tags
      const countryCodes = item.tags.filter(
        (tag: string) => tag.length === 2 && tag === tag.toUpperCase()
      );

      for (const code of countryCodes) {
        const existing = countrySignalsMap.get(code) || [];
        countrySignalsMap.set(code, [...existing, ...signals]);
      }
    }

    // Calculate readiness scores (Worker 2)
    const countrySignals = Array.from(countrySignalsMap.entries()).map(
      ([countryCode, signals]) => ({
        countryCode,
        signals,
      })
    );

    const readinessScores = calculateReadinessBatch(countrySignals);

    // Update conflict graph (Worker 3)
    // Note: Simplified - assumes signals have actor info from tags
    const signalsWithActors = allSignals.map(signal => {
      const item = parsedItems.find(i => i.id === signal.itemId);
      const actors =
        item?.tags.filter((tag: string) => tag.length === 2 && tag === tag.toUpperCase()) ||
        [];
      return { ...signal, actors };
    });

    const conflictEdges = updateConflictGraph([], signalsWithActors);

    // Update scenarios (Worker 5)
    const scenarios = updateScenarios(
      SCENARIO_RULES.map(rule => ({
        scenario_id: rule.scenario_id,
        name: rule.scenario_id
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        description: '',
        probability: rule.baseWeight,
        confidence: 0.5,
        trend: 'stable' as const,
        active_signals: [],
        last_updated: Math.floor(Date.now() / 1000),
      })),
      allSignals
    );

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      signals: allSignals.length,
      readiness: readinessScores,
      conflictEdges: conflictEdges.map(edge => ({
        ...edge,
        defcon: tensionToDEFCON(edge.tension),
      })),
      scenarios: scenarios.map(s => ({
        ...s,
        probability: Math.round(s.probability * 100) / 100,
        confidence: Math.round(s.confidence * 100) / 100,
      })),
      analysis: {
        items_analyzed: items.length,
        signals_detected: allSignals.length,
        countries_tracked: readinessScores.length,
        time_window_hours: hours,
      },
      response_time_ms: responseTime,
    });
  } catch (error) {
    console.error('Signals analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze signals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function tensionToDEFCON(tension: number): 1 | 2 | 3 | 4 | 5 {
  if (tension >= 90) return 1;
  if (tension >= 75) return 2;
  if (tension >= 55) return 3;
  if (tension >= 35) return 4;
  return 5;
}
