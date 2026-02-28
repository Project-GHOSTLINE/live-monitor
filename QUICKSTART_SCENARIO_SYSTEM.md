# Quick Start: Scenario Analysis System

Get your scenario analysis system up and running in 15 minutes.

## Step 1: Install Database Schema (5 minutes)

### 1.1 Open Supabase SQL Editor
1. Go to your Supabase project: https://app.supabase.com/project/dllyzfuqjzuhvshrlmuq
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### 1.2 Run the Migration
1. Open the file: `/Users/xunit/Desktop/ww3/lib/db/migrations/002_scenario_analysis.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" or press Cmd+Enter

### 1.3 Verify Installation
Run this query to verify:
```sql
-- Check that tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'event_frames',
    'signals',
    'signal_activations',
    'scenario_definitions',
    'scenario_scores',
    'impact_matrix',
    'scenario_changelog'
  )
ORDER BY table_name;
```

You should see all 7 tables listed.

### 1.4 Verify Seed Data
```sql
-- Check signals were loaded
SELECT code, name, category, weight FROM signals ORDER BY weight DESC;

-- Check scenarios were loaded
SELECT code, name, geographic_scope FROM scenario_definitions;
```

You should see:
- 19 signals
- 3 scenarios (NATO-Russia, Taiwan, Middle East)

## Step 2: Create First API Route (5 minutes)

### 2.1 Create Scenarios Endpoint
Create file: `/Users/xunit/Desktop/ww3/app/api/scenarios/scores/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getScenariosWithScores } from '@/lib/db/scenario-helpers';

export async function GET() {
  try {
    const scenarios = await getScenariosWithScores();
    return NextResponse.json({
      success: true,
      scenarios,
      count: scenarios.length,
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}
```

### 2.2 Test the Endpoint
Start your dev server:
```bash
cd /Users/xunit/Desktop/ww3
npm run dev
```

Open in browser:
```
http://localhost:3000/api/scenarios/scores
```

You should see:
```json
{
  "success": true,
  "scenarios": [
    {
      "id": 1,
      "name": "NATO-Russia Escalation",
      "code": "SCENARIO_NATO_RUSSIA",
      "current_score": null,
      "active_signal_count": 0,
      "trend": null
    },
    ...
  ],
  "count": 3
}
```

## Step 3: Create Test Event (5 minutes)

### 3.1 Create Event Extraction Endpoint
Create file: `/Users/xunit/Desktop/ww3/app/api/events/extract/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createEventFrame, getSignalByCode, activateSignal } from '@/lib/db/scenario-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create event frame
    const eventFrame = await createEventFrame(body);

    if (!eventFrame) {
      return NextResponse.json(
        { success: false, error: 'Failed to create event frame' },
        { status: 500 }
      );
    }

    // Auto-activate relevant signals
    const signalMapping: Record<string, string> = {
      'airspace_closure': 'SIG_AIRSPACE_CLOSED',
      'military_mobilization': 'SIG_TROOPS_MOBILIZED',
      'diplomatic_action': 'SIG_EMBASSY_CLOSURE',
      'cyber_incident': 'SIG_CYBER_ATTACK_MAJOR',
      'economic_sanction': 'SIG_SANCTIONS_IMPOSED',
      'humanitarian_crisis': 'SIG_MASS_EVACUATION',
    };

    const signalActivations = [];
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
  } catch (error) {
    console.error('Error extracting event:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

### 3.2 Create a Test Feed Item
First, you need a feed item. Go to Supabase SQL Editor and run:

```sql
-- Insert a test feed item
INSERT INTO feed_items (
  source_id,
  source_name,
  source_url,
  canonical_url,
  published_at,
  fetched_at,
  title_original,
  content_original,
  lang,
  title_en,
  summary_en,
  reliability
) VALUES (
  1,
  'Test Source',
  'https://example.com',
  'https://example.com/article-' || extract(epoch from now())::text,
  extract(epoch from now())::bigint,
  extract(epoch from now())::bigint,
  'Ukraine closes airspace over eastern regions',
  'Ukrainian authorities announced immediate closure of airspace over eastern regions citing security threats from ongoing military operations.',
  'en',
  'Ukraine closes airspace over eastern regions',
  'Ukraine has closed airspace over eastern regions due to security concerns.',
  4
) RETURNING id;
```

Note the returned ID (e.g., 12345).

### 3.3 Test Event Extraction
Use curl or Postman:

```bash
curl -X POST http://localhost:3000/api/events/extract \
  -H "Content-Type: application/json" \
  -d '{
    "feed_item_id": 12345,
    "event_type": "airspace_closure",
    "actors": [
      {"name": "Ukraine", "role": "defender", "country": "UA"}
    ],
    "location": {"country": "Ukraine", "region": "Eastern"},
    "severity": 8,
    "confidence": 0.92,
    "evidence": "Ukrainian authorities announced immediate closure of airspace over eastern regions"
  }'
```

Expected response:
```json
{
  "success": true,
  "event_frame": {
    "id": 1,
    "feed_item_id": 12345,
    "event_type": "airspace_closure",
    "severity": 8,
    "confidence": 0.92,
    ...
  },
  "activated_signals": [
    {
      "id": 1,
      "signal_id": 1,
      "event_frame_id": 1,
      "confidence": 0.92,
      ...
    }
  ]
}
```

### 3.4 Verify in Database
```sql
-- Check event was created
SELECT * FROM event_frames ORDER BY created_at DESC LIMIT 1;

-- Check signal was activated
SELECT
  sa.*,
  s.code,
  s.name
FROM signal_activations sa
JOIN signals s ON sa.signal_id = s.id
ORDER BY sa.created_at DESC
LIMIT 1;
```

## Step 4: Calculate Scenario Scores (3 minutes)

### 4.1 Create Calculate Endpoint
Create file: `/Users/xunit/Desktop/ww3/app/api/scenarios/calculate-all/route.ts`

```typescript
import { NextResponse } from 'next/server';
import {
  getScenarioDefinitions,
  calculateScenarioScore,
  saveScenarioScore,
} from '@/lib/db/scenario-helpers';

export async function POST() {
  try {
    const scenarios = await getScenarioDefinitions({ is_active: true });
    const results = [];
    const errors = [];

    for (const scenario of scenarios) {
      try {
        const calculation = await calculateScenarioScore({
          scenario_id: scenario.id!,
          time_window_hours: 168, // 7 days
          min_confidence: 0.5,
        });

        if (calculation) {
          await saveScenarioScore(calculation);

          results.push({
            scenario_id: scenario.id!,
            scenario_code: scenario.code,
            scenario_name: scenario.name,
            score: calculation.score,
            probability: calculation.probability,
            trend: calculation.trend,
            active_signals: calculation.active_signals.length,
          });
        }
      } catch (error) {
        errors.push(`Error calculating ${scenario.code}: ${error}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors,
      calculated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating scenarios:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

### 4.2 Calculate Scores
```bash
curl -X POST http://localhost:3000/api/scenarios/calculate-all
```

Expected response:
```json
{
  "success": true,
  "results": [
    {
      "scenario_id": 1,
      "scenario_code": "SCENARIO_NATO_RUSSIA",
      "scenario_name": "NATO-Russia Escalation",
      "score": 0.736,
      "probability": 0.82,
      "trend": "stable",
      "active_signals": 1
    },
    ...
  ],
  "errors": [],
  "calculated_at": "2026-02-28T15:30:00.000Z"
}
```

### 4.3 View Updated Scenarios
```bash
curl http://localhost:3000/api/scenarios/scores
```

Now you should see scores populated:
```json
{
  "success": true,
  "scenarios": [
    {
      "id": 1,
      "name": "NATO-Russia Escalation",
      "current_score": {
        "score": 0.736,
        "probability": 0.82,
        "trend": "stable",
        "signal_count": 1
      },
      "active_signal_count": 1,
      "trend": "stable"
    },
    ...
  ]
}
```

## Step 5: Create Simple Dashboard (2 minutes)

### 5.1 Create Dashboard Page
Create file: `/Users/xunit/Desktop/ww3/app/scenarios/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { ScenarioWithScore } from '@/types/scenario-db';

export default function ScenariosPage() {
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
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Scenario Analysis</h1>
        <p>Loading scenarios...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Scenario Analysis</h1>

      <div className="grid gap-4">
        {scenarios.map((scenario) => {
          const probability = scenario.current_score?.probability || 0;
          const score = scenario.current_score?.score || 0;

          return (
            <div
              key={scenario.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-semibold">{scenario.name}</h2>
                  <p className="text-sm text-gray-600">{scenario.code}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    probability > 0.7 ? 'text-red-600' :
                    probability > 0.5 ? 'text-orange-600' :
                    probability > 0.3 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {(probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Probability</div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{scenario.hypothesis}</p>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Score</div>
                  <div className="font-medium">{(score * 100).toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Active Signals</div>
                  <div className="font-medium">{scenario.active_signal_count || 0}</div>
                </div>
                <div>
                  <div className="text-gray-500">Trend</div>
                  <div className="font-medium capitalize">
                    {scenario.trend || 'unknown'}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      probability > 0.7 ? 'bg-red-600' :
                      probability > 0.5 ? 'bg-orange-600' :
                      probability > 0.3 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${probability * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 5.2 View Dashboard
Open in browser:
```
http://localhost:3000/scenarios
```

You should see a dashboard showing all scenarios with their probability scores!

## Complete Workflow Test

### Test the Full Pipeline

1. **Create Event**
```bash
curl -X POST http://localhost:3000/api/events/extract \
  -H "Content-Type: application/json" \
  -d '{
    "feed_item_id": 12345,
    "event_type": "military_mobilization",
    "actors": [
      {"name": "Russia", "role": "aggressor", "country": "RU"}
    ],
    "severity": 9,
    "confidence": 0.88,
    "evidence": "Large-scale military mobilization detected"
  }'
```

2. **Calculate Scenarios**
```bash
curl -X POST http://localhost:3000/api/scenarios/calculate-all
```

3. **View Results**
```bash
curl http://localhost:3000/api/scenarios/scores | jq
```

4. **Check Dashboard**
Open http://localhost:3000/scenarios and see updated probabilities!

## Verification Checklist

- [ ] All 7 database tables created
- [ ] 19 signals loaded
- [ ] 3 scenarios loaded
- [ ] API endpoint `/api/scenarios/scores` works
- [ ] API endpoint `/api/events/extract` works
- [ ] API endpoint `/api/scenarios/calculate-all` works
- [ ] Dashboard page shows scenarios
- [ ] Event creation activates signals
- [ ] Scenario scores update correctly

## Troubleshooting

### Database Connection Issues
```typescript
// Check Supabase configuration
import { isSupabaseConfigured } from '@/lib/db/supabase';

console.log('Supabase configured:', isSupabaseConfigured());
```

### No Scores Calculated
```sql
-- Check if signals are active
SELECT COUNT(*) FROM signal_activations WHERE is_active = true;

-- Check if event frames exist
SELECT COUNT(*) FROM event_frames;

-- Check scenario trigger signals
SELECT code, trigger_signals FROM scenario_definitions;
```

### API Route Not Found
Make sure you're creating files in the correct location:
- `/app/api/scenarios/scores/route.ts` (not `/pages/api/`)

### TypeScript Errors
Make sure imports are correct:
```typescript
import type { ScenarioWithScore } from '@/types/scenario-db';
import { getScenariosWithScores } from '@/lib/db/scenario-helpers';
```

## Next Steps

Once basic system is working:

1. **Add More Events** - Extract events from your existing feed items
2. **Implement Auto-Extraction** - Use AI to extract events from news automatically
3. **Set Up Cron Jobs** - Auto-calculate scores every hour
4. **Create Impact Assessments** - Add impact analysis by domain
5. **Build Alerts** - Send notifications for high-probability scenarios
6. **Add Visualization** - Charts showing score trends over time

## Quick Reference

**Database Schema:**
- `/lib/db/migrations/002_scenario_analysis.sql`

**TypeScript Types:**
- `/types/scenario-db.ts`

**Helper Functions:**
- `/lib/db/scenario-helpers.ts`

**Documentation:**
- `/lib/db/migrations/README.md` - Complete schema docs
- `/lib/db/migrations/API_ROUTES.md` - All API routes
- `/SCENARIO_SYSTEM_SUMMARY.md` - System overview

**Supabase Project:**
- URL: https://app.supabase.com/project/dllyzfuqjzuhvshrlmuq
- Database: dllyzfuqjzuhvshrlmuq

## Support

If you encounter issues:

1. Check Supabase logs for SQL errors
2. Check Next.js console for TypeScript errors
3. Verify environment variables are set
4. Check browser console for API errors

All helper functions include error logging - check your console for detailed error messages.
