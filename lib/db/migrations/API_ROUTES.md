# API Routes for Scenario Analysis System

Recommended Next.js API routes to expose scenario analysis functionality.

## Event Frames

### POST /api/events/extract
Extract event frames from a feed item.

**Request:**
```typescript
{
  feed_item_id: number;
  event_type: EventType;
  actors: EventActor[];
  location?: EventLocation;
  severity: number;
  confidence: number;
  evidence: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  event_frame: EventFrame;
  activated_signals?: SignalActivation[];
}
```

**Implementation:**
```typescript
// app/api/events/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createEventFrame, getSignalByCode, activateSignal } from '@/lib/db/scenario-helpers';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Create event frame
  const eventFrame = await createEventFrame(body);

  if (!eventFrame) {
    return NextResponse.json(
      { success: false, error: 'Failed to create event frame' },
      { status: 500 }
    );
  }

  // Auto-activate relevant signals based on event type
  const signalActivations = [];
  const signalMapping = {
    'airspace_closure': 'SIG_AIRSPACE_CLOSED',
    'military_mobilization': 'SIG_TROOPS_MOBILIZED',
    // ... add more mappings
  };

  const signalCode = signalMapping[body.event_type];
  if (signalCode) {
    const signal = await getSignalByCode(signalCode);
    if (signal) {
      const activation = await activateSignal(
        signal.id!,
        eventFrame.id!,
        body.confidence
      );
      if (activation) {
        signalActivations.push(activation);
      }
    }
  }

  return NextResponse.json({
    success: true,
    event_frame: eventFrame,
    activated_signals: signalActivations,
  });
}
```

### GET /api/events
Get event frames with filters.

**Query Parameters:**
- `event_types[]` - Filter by event types
- `severity_min` - Minimum severity
- `severity_max` - Maximum severity
- `confidence_min` - Minimum confidence
- `time_range_start` - Start timestamp
- `time_range_end` - End timestamp
- `limit` - Results limit (default: 100)
- `offset` - Pagination offset

**Response:**
```typescript
{
  events: EventFrame[];
  total: number;
  hasMore: boolean;
}
```

**Implementation:**
```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEventFrames } from '@/lib/db/scenario-helpers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    event_types: searchParams.getAll('event_types[]') as any,
    severity_min: searchParams.get('severity_min') ?
      parseInt(searchParams.get('severity_min')!) : undefined,
    severity_max: searchParams.get('severity_max') ?
      parseInt(searchParams.get('severity_max')!) : undefined,
    confidence_min: searchParams.get('confidence_min') ?
      parseFloat(searchParams.get('confidence_min')!) : undefined,
    time_range: searchParams.get('time_range_start') ? {
      start: parseInt(searchParams.get('time_range_start')!),
      end: parseInt(searchParams.get('time_range_end')!),
    } : undefined,
  };

  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const events = await getEventFrames(filters, limit, offset);

  return NextResponse.json({
    events,
    total: events.length,
    hasMore: events.length === limit,
  });
}
```

## Signals

### GET /api/signals
Get active signals.

**Query Parameters:**
- `categories[]` - Filter by categories
- `scope[]` - Filter by scope
- `weight_min` - Minimum weight

**Response:**
```typescript
{
  signals: Signal[];
}
```

### GET /api/signals/activations
Get signals with their recent activations.

**Query Parameters:**
- `time_window_hours` - Time window (default: 168)

**Response:**
```typescript
{
  signals: SignalWithActivations[];
}
```

**Implementation:**
```typescript
// app/api/signals/activations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSignalsWithActivations } from '@/lib/db/scenario-helpers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeWindowHours = parseInt(
    searchParams.get('time_window_hours') || '168'
  );

  const signals = await getSignalsWithActivations(timeWindowHours);

  return NextResponse.json({ signals });
}
```

### POST /api/signals/activate
Activate a signal based on an event.

**Request:**
```typescript
{
  signal_code: string;
  event_frame_id: number;
  confidence: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  activation: SignalActivation;
}
```

### POST /api/signals/verify/:activationId
Verify a signal activation.

**Request:**
```typescript
{
  verified_by: string;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

## Scenarios

### GET /api/scenarios
Get all scenario definitions.

**Query Parameters:**
- `is_active` - Filter active/inactive
- `geographic_scope[]` - Filter by scope

**Response:**
```typescript
{
  scenarios: ScenarioDefinition[];
}
```

### GET /api/scenarios/scores
Get scenarios with their current scores.

**Response:**
```typescript
{
  scenarios: ScenarioWithScore[];
}
```

**Implementation:**
```typescript
// app/api/scenarios/scores/route.ts
import { NextResponse } from 'next/server';
import { getScenariosWithScores } from '@/lib/db/scenario-helpers';

export async function GET() {
  const scenarios = await getScenariosWithScores();
  return NextResponse.json({ scenarios });
}
```

### POST /api/scenarios/:scenarioId/calculate
Calculate score for a specific scenario.

**Request:**
```typescript
{
  time_window_hours?: number;
  min_confidence?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  calculation: CalculateScenarioScoreResponse;
}
```

**Implementation:**
```typescript
// app/api/scenarios/[scenarioId]/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculateScenarioScore, saveScenarioScore } from '@/lib/db/scenario-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const body = await request.json();
  const scenarioId = parseInt(params.scenarioId);

  const calculation = await calculateScenarioScore({
    scenario_id: scenarioId,
    time_window_hours: body.time_window_hours,
    min_confidence: body.min_confidence,
  });

  if (!calculation) {
    return NextResponse.json(
      { success: false, error: 'Failed to calculate score' },
      { status: 500 }
    );
  }

  // Optionally save the score
  if (body.save !== false) {
    await saveScenarioScore(calculation);
  }

  return NextResponse.json({
    success: true,
    calculation,
  });
}
```

### POST /api/scenarios/calculate-all
Recalculate scores for all active scenarios.

**Response:**
```typescript
{
  success: boolean;
  results: {
    scenario_id: number;
    scenario_code: string;
    score: number;
    probability: number;
  }[];
  errors: string[];
}
```

**Implementation:**
```typescript
// app/api/scenarios/calculate-all/route.ts
import { NextResponse } from 'next/server';
import {
  getScenarioDefinitions,
  calculateScenarioScore,
  saveScenarioScore,
  logScenarioChange,
} from '@/lib/db/scenario-helpers';

export async function POST() {
  const scenarios = await getScenarioDefinitions({ is_active: true });
  const results = [];
  const errors = [];

  for (const scenario of scenarios) {
    try {
      const calculation = await calculateScenarioScore({
        scenario_id: scenario.id!,
      });

      if (calculation) {
        await saveScenarioScore(calculation);

        results.push({
          scenario_id: scenario.id!,
          scenario_code: scenario.code,
          score: calculation.score,
          probability: calculation.probability,
        });

        // Log if threshold crossed
        if (calculation.probability > scenario.base_threshold) {
          await logScenarioChange({
            scenario_id: scenario.id!,
            change_type: 'threshold_crossed',
            delta: {
              field: 'probability',
              old_value: scenario.base_threshold,
              new_value: calculation.probability,
            },
            triggered_by: 'system',
            new_score: calculation.score,
          });
        }
      }
    } catch (error) {
      errors.push(`Error calculating ${scenario.code}: ${error}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors,
  });
}
```

### GET /api/scenarios/:scenarioId/history
Get score history for a scenario.

**Query Parameters:**
- `limit` - Number of scores to return (default: 100)
- `time_range_start` - Start timestamp
- `time_range_end` - End timestamp

**Response:**
```typescript
{
  scenario: ScenarioDefinition;
  scores: ScenarioScore[];
}
```

### GET /api/scenarios/:scenarioId/changelog
Get changelog for a scenario.

**Query Parameters:**
- `limit` - Number of entries (default: 100)

**Response:**
```typescript
{
  changelog: ScenarioChangelogEntry[];
}
```

**Implementation:**
```typescript
// app/api/scenarios/[scenarioId]/changelog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getScenarioChangelog } from '@/lib/db/scenario-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const scenarioId = parseInt(params.scenarioId);
  const limit = parseInt(
    request.nextUrl.searchParams.get('limit') || '100'
  );

  const changelog = await getScenarioChangelog(scenarioId, limit);

  return NextResponse.json({ changelog });
}
```

## Impact Matrix

### GET /api/scenarios/:scenarioId/impacts
Get impact assessments for a scenario.

**Response:**
```typescript
{
  impacts: ImpactAssessment[];
}
```

**Implementation:**
```typescript
// app/api/scenarios/[scenarioId]/impacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getScenarioImpacts } from '@/lib/db/scenario-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const scenarioId = parseInt(params.scenarioId);
  const impacts = await getScenarioImpacts(scenarioId);

  return NextResponse.json({ impacts });
}
```

### POST /api/scenarios/:scenarioId/impacts
Create impact assessment.

**Request:**
```typescript
{
  domain: ImpactDomain;
  impact_level: ImpactLevel;
  reasoning: string;
  timeframe: Timeframe;
  reversibility: Reversibility;
  sources: ImpactSource[];
  affected_regions: string[];
  confidence: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  impact: ImpactAssessment;
}
```

**Implementation:**
```typescript
// app/api/scenarios/[scenarioId]/impacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createImpactAssessment } from '@/lib/db/scenario-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const body = await request.json();
  const scenarioId = parseInt(params.scenarioId);

  const impact = await createImpactAssessment({
    scenario_id: scenarioId,
    ...body,
  });

  if (!impact) {
    return NextResponse.json(
      { success: false, error: 'Failed to create impact assessment' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    impact,
  });
}
```

## Dashboard

### GET /api/dashboard/scenario-overview
Get comprehensive dashboard data.

**Query Parameters:**
- `time_range_hours` - Time window (default: 168)

**Response:**
```typescript
{
  scenarios: ScenarioWithScore[];
  active_signals: SignalWithActivations[];
  recent_events: EventFrameWithRelations[];
  high_impact_domains: {
    domain: string;
    scenario_count: number;
    max_impact: ImpactLevel;
  }[];
  alerts: ScenarioAlert[];
}
```

**Implementation:**
```typescript
// app/api/dashboard/scenario-overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getScenariosWithScores,
  getSignalsWithActivations,
  getEventFramesWithRelations,
} from '@/lib/db/scenario-helpers';

export async function GET(request: NextRequest) {
  const timeRangeHours = parseInt(
    request.nextUrl.searchParams.get('time_range_hours') || '168'
  );

  const cutoffTime = Math.floor(Date.now() / 1000) - timeRangeHours * 3600;

  const [scenarios, signals, events] = await Promise.all([
    getScenariosWithScores(),
    getSignalsWithActivations(timeRangeHours),
    getEventFramesWithRelations(
      {
        time_range: {
          start: cutoffTime,
          end: Math.floor(Date.now() / 1000),
        },
      },
      50
    ),
  ]);

  // Generate alerts for high-probability scenarios
  const alerts = scenarios
    .filter((s) => s.current_score && s.current_score.probability > 0.7)
    .map((s) => ({
      scenario_id: s.id!,
      scenario_name: s.name,
      alert_type: 'threshold_crossed' as const,
      severity: s.current_score!.probability > 0.9 ? 'critical' as const :
                s.current_score!.probability > 0.8 ? 'high' as const :
                'medium' as const,
      message: `${s.name} probability at ${(s.current_score!.probability * 100).toFixed(1)}%`,
      current_score: s.current_score!.score,
      triggered_at: s.current_score!.calculated_at!,
      requires_action: s.current_score!.probability > 0.85,
    }));

  return NextResponse.json({
    scenarios,
    active_signals: signals,
    recent_events: events,
    alerts,
  });
}
```

## Scheduled Tasks

### Cron Job: Calculate All Scenarios
Run every hour to recalculate scenario scores.

```typescript
// app/api/cron/calculate-scenarios/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Call calculate-all endpoint
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/scenarios/calculate-all`,
    { method: 'POST' }
  );

  const data = await response.json();

  return NextResponse.json(data);
}
```

**Vercel cron configuration (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/calculate-scenarios",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Client-Side Usage Examples

### React Component: Scenario Dashboard

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { ScenarioWithScore } from '@/types/scenario-db';

export function ScenarioDashboard() {
  const [scenarios, setScenarios] = useState<ScenarioWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScenarios() {
      const response = await fetch('/api/scenarios/scores');
      const data = await response.json();
      setScenarios(data.scenarios);
      setLoading(false);
    }

    loadScenarios();

    // Refresh every 5 minutes
    const interval = setInterval(loadScenarios, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading scenarios...</div>;

  return (
    <div>
      {scenarios.map((scenario) => (
        <div key={scenario.id}>
          <h3>{scenario.name}</h3>
          <p>Probability: {(scenario.current_score?.probability || 0) * 100}%</p>
          <p>Active Signals: {scenario.active_signal_count || 0}</p>
          <p>Trend: {scenario.current_score?.trend || 'unknown'}</p>
        </div>
      ))}
    </div>
  );
}
```

### React Component: Event Extractor

```typescript
'use client';

import { useState } from 'react';
import type { CreateEventFrameRequest } from '@/types/scenario-db';

export function EventExtractor({ feedItemId }: { feedItemId: number }) {
  const [extracting, setExtracting] = useState(false);

  async function extractEvent(data: CreateEventFrameRequest) {
    setExtracting(true);

    try {
      const response = await fetch('/api/events/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Event extracted:', result.event_frame);
        console.log('Signals activated:', result.activated_signals);
      }
    } finally {
      setExtracting(false);
    }
  }

  return (
    <button
      onClick={() =>
        extractEvent({
          feed_item_id: feedItemId,
          event_type: 'airspace_closure',
          actors: [{ name: 'Ukraine', role: 'defender' }],
          severity: 8,
          confidence: 0.92,
          evidence: 'Sample evidence text...',
        })
      }
      disabled={extracting}
    >
      {extracting ? 'Extracting...' : 'Extract Event'}
    </button>
  );
}
```

## Summary

Create these API routes to expose the scenario analysis system:

**Core Routes:**
- `/api/events` - Event frame CRUD
- `/api/signals` - Signal management
- `/api/scenarios` - Scenario definitions and scores
- `/api/dashboard` - Aggregated dashboard data

**Scheduled Tasks:**
- `/api/cron/calculate-scenarios` - Hourly score recalculation

All routes use the helper functions from `/lib/db/scenario-helpers.ts` for database operations.
