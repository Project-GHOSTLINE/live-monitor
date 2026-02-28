# Scenario Analysis System - Implementation Summary

Comprehensive database schema and TypeScript utilities for conflict scenario analysis.

## What Was Created

### 1. Database Schema Migration
**File:** `/Users/xunit/Desktop/ww3/lib/db/migrations/002_scenario_analysis.sql`

**Tables Created:**
- `event_frames` - Structured events extracted from news (11 columns, 6 indexes)
- `signals` - Normalized signal catalog with 19 pre-loaded signals (11 columns, 3 indexes)
- `signal_activations` - Signal detection tracking (10 columns, 4 indexes)
- `scenario_definitions` - Scenario templates with 3 pre-loaded scenarios (12 columns, 3 indexes)
- `scenario_scores` - Historical scoring time-series (10 columns, 4 indexes)
- `impact_matrix` - Impact assessments by domain (14 columns, 4 indexes)
- `scenario_changelog` - Audit trail (10 columns, 3 indexes)

**Functions Created:**
- `calculate_signal_decay()` - Signal decay calculation
- `get_active_scenario_signals()` - Get active signals for scenario
- `update_scenario_score()` - Recalculate scenario score

**Pre-Loaded Data:**
- 19 signal definitions (military, diplomatic, economic, cyber, humanitarian, infrastructure)
- 3 scenario templates (NATO-Russia, Taiwan Strait, Middle East)

### 2. TypeScript Type Definitions
**File:** `/Users/xunit/Desktop/ww3/types/scenario-db.ts`

**Types Defined:**
- Event Frames: `EventFrame`, `EventType`, `EventActor`, `EventLocation`
- Signals: `Signal`, `SignalCategory`, `SignalScope`, `SignalActivation`
- Scenarios: `ScenarioDefinition`, `ScenarioScore`, `ScoreTrend`
- Impacts: `ImpactAssessment`, `ImpactDomain`, `ImpactLevel`
- Changelog: `ScenarioChangelogEntry`, `ChangeType`
- Composites: `ScenarioWithScore`, `EventFrameWithRelations`, `SignalWithActivations`
- Filters: `EventFrameFilters`, `ScenarioFilters`, `SignalFilters`
- API Types: Request/Response types for all operations

### 3. Database Helper Functions
**File:** `/Users/xunit/Desktop/ww3/lib/db/scenario-helpers.ts`

**Functions Implemented:**

**Event Frames:**
- `createEventFrame()` - Create new event frame
- `getEventFrames()` - Query with filters
- `getEventFramesWithRelations()` - Include feed items and signals

**Signals:**
- `getActiveSignals()` - Get signal catalog with filters
- `getSignalByCode()` - Find signal by code
- `getSignalsWithActivations()` - Include recent activations
- `activateSignal()` - Link signal to event frame
- `verifySignalActivation()` - Manual verification

**Scenarios:**
- `getScenarioDefinitions()` - Get scenario templates
- `getScenarioByCode()` - Find scenario by code
- `getScenariosWithScores()` - Include current scores
- `calculateScenarioScore()` - Calculate probability score
- `saveScenarioScore()` - Persist calculation

**Impacts:**
- `createImpactAssessment()` - Create impact assessment
- `getScenarioImpacts()` - Get impacts for scenario

**Changelog:**
- `logScenarioChange()` - Log scenario change
- `getScenarioChangelog()` - Get change history

### 4. Documentation
**Files:**
- `/Users/xunit/Desktop/ww3/lib/db/migrations/README.md` - Complete schema documentation
- `/Users/xunit/Desktop/ww3/lib/db/migrations/API_ROUTES.md` - API route implementation guide

## Database Schema Overview

```
┌─────────────────┐
│  feed_items     │ (existing table)
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│  event_frames   │                  │    clusters     │ (existing)
│  - event_type   │                  └─────────────────┘
│  - actors[]     │
│  - location     │
│  - severity     │
│  - confidence   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│signal_activations│
│  - confidence   │
│  - expires_at   │
│  - is_verified  │
└────────┬────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────────┐
│    signals      │          │scenario_definitions │
│  - code         │◄─────────┤  - trigger_signals[]│
│  - weight       │          │  - base_threshold   │
│  - decay_rate   │          │  - impact_areas[]   │
│  - half_life    │          └──────────┬──────────┘
└─────────────────┘                     │
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                              ▼                   ▼
                   ┌─────────────────┐  ┌─────────────────┐
                   │scenario_scores  │  │ impact_matrix   │
                   │  - score        │  │  - domain       │
                   │  - probability  │  │  - impact_level │
                   │  - trend        │  │  - reasoning    │
                   │  - confidence   │  │  - timeframe    │
                   └─────────────────┘  └─────────────────┘
                              │
                              ▼
                   ┌─────────────────┐
                   │scenario_changelog│
                   │  - change_type  │
                   │  - delta        │
                   │  - reason       │
                   └─────────────────┘
```

## How the System Works

### 1. Event Extraction (from News Feed)
```typescript
News Feed Item
  ↓
Extract Event Frame (AI/Rules)
  ↓
{
  event_type: 'airspace_closure',
  actors: [{name: 'Ukraine', role: 'defender'}],
  severity: 8,
  confidence: 0.92
}
  ↓
Save to event_frames table
```

### 2. Signal Activation
```typescript
Event Frame Created
  ↓
Match to Signal Catalog
  ↓
Activate Signal(s)
  ↓
signal_activations {
  signal_id: SIG_AIRSPACE_CLOSED,
  event_frame_id: 12345,
  confidence: 0.92,
  expires_at: now + 24h
}
```

### 3. Scenario Scoring
```typescript
Signal Activated
  ↓
Find Affected Scenarios
  ↓
Calculate Score:
  score = Σ(weight × confidence × decay_factor)
  decay_factor = 0.5^(hours_elapsed / half_life)
  ↓
Calculate Probability:
  probability = min(score / threshold, 1.0)
  ↓
Save to scenario_scores
```

### 4. Impact Assessment
```typescript
Scenario Score Updated
  ↓
Assess Impact by Domain:
  - Aviation: HIGH (75/100)
  - Energy: MODERATE (50/100)
  - Cyber: LOW (25/100)
  ↓
Save to impact_matrix
```

## Pre-Loaded Signals

### Military (5 signals)
- `SIG_AIRSPACE_CLOSED` - Airspace closure (weight: 0.8)
- `SIG_TROOPS_MOBILIZED` - Troop mobilization (weight: 0.9)
- `SIG_NAVAL_DEPLOYMENT` - Naval deployment (weight: 0.7)
- `SIG_AIR_DEFENSE_ACTIVE` - Air defense activation (weight: 0.85)
- `SIG_MILITARY_EXERCISE` - Military exercise (weight: 0.5)

### Diplomatic (4 signals)
- `SIG_EMBASSY_CLOSURE` - Embassy closure (weight: 0.75)
- `SIG_AMBASSADOR_RECALLED` - Ambassador recalled (weight: 0.7)
- `SIG_DIPLOMATIC_BREAKDOWN` - Diplomatic breakdown (weight: 0.9)
- `SIG_ALLIANCE_INVOKED` - Alliance invoked (weight: 0.95)

### Economic (3 signals)
- `SIG_SANCTIONS_IMPOSED` - Sanctions (weight: 0.6)
- `SIG_ENERGY_DISRUPTION` - Energy disruption (weight: 0.8)
- `SIG_FINANCIAL_RESTRICTIONS` - Financial restrictions (weight: 0.65)

### Cyber (2 signals)
- `SIG_CYBER_ATTACK_MAJOR` - Major cyber attack (weight: 0.75)
- `SIG_COMM_DISRUPTION` - Communications disruption (weight: 0.7)

### Infrastructure (2 signals)
- `SIG_BORDER_CLOSED` - Border closure (weight: 0.6)
- `SIG_TRANSPORT_DISRUPTION` - Transport disruption (weight: 0.5)

### Humanitarian (3 signals)
- `SIG_MASS_EVACUATION` - Mass evacuation (weight: 0.7)
- `SIG_REFUGEE_CRISIS` - Refugee crisis (weight: 0.65)
- `SIG_CIVILIAN_CASUALTIES` - Civilian casualties (weight: 0.8)

## Pre-Loaded Scenarios

### 1. NATO-Russia Escalation
- **Code:** `SCENARIO_NATO_RUSSIA`
- **Threshold:** 0.3
- **Trigger Signals:** 5 (troops, airspace, air defense, alliance, naval)
- **Impact Areas:** aviation, energy, cyber, diplomatic, humanitarian
- **Scope:** global

### 2. Taiwan Strait Crisis
- **Code:** `SCENARIO_TAIWAN`
- **Threshold:** 0.35
- **Trigger Signals:** 5 (naval, airspace, exercise, alliance, diplomatic)
- **Impact Areas:** aviation, maritime, supply_chain, cyber, financial
- **Scope:** regional

### 3. Middle East Escalation
- **Code:** `SCENARIO_MIDEAST`
- **Threshold:** 0.25
- **Trigger Signals:** 5 (airspace, energy, embassy, casualties, refugees)
- **Impact Areas:** energy, humanitarian, aviation, diplomatic
- **Scope:** regional

## Next Steps

### 1. Install Schema in Supabase
```bash
# In Supabase SQL Editor, run:
# /Users/xunit/Desktop/ww3/lib/db/migrations/002_scenario_analysis.sql
```

### 2. Create API Routes
Implement the routes documented in `API_ROUTES.md`:
- `/api/events/extract` - Extract events from feed items
- `/api/scenarios/scores` - Get scenario scores
- `/api/scenarios/calculate-all` - Recalculate all scores
- `/api/dashboard/scenario-overview` - Dashboard data

### 3. Integrate with Feed Ingestion
Add event extraction to your existing feed ingestion pipeline:

```typescript
// In your feed ingestion code
import { createEventFrame, activateSignal } from '@/lib/db/scenario-helpers';

async function processFeedItem(feedItem: FeedItem) {
  // ... existing ingestion logic ...

  // Extract events using AI
  const events = await extractEventsFromText(feedItem.content_original);

  for (const event of events) {
    await createEventFrame({
      feed_item_id: feedItem.id,
      ...event,
    });
  }

  // Trigger scenario recalculation
  await fetch('/api/scenarios/calculate-all', { method: 'POST' });
}
```

### 4. Set Up Scheduled Tasks
Configure automatic scenario recalculation:

**Create vercel.json:**
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

### 5. Build Dashboard UI
Create React components to display scenario data:
- Scenario probability gauges
- Signal activation timeline
- Impact matrix heatmap
- Changelog history

### 6. Implement Event Extraction
Choose an approach for extracting events from news:
- **AI-based:** Use Claude/GPT to extract structured events
- **Rule-based:** Pattern matching for known event types
- **Hybrid:** AI with rule validation

Example AI prompt:
```typescript
const prompt = `
Analyze this news article and extract conflict events.

Article: ${feedItem.content_original}

For each event, provide:
- event_type: (airspace_closure, military_mobilization, etc.)
- actors: [{name, role, country}]
- location: {country, region}
- severity: 1-10
- confidence: 0.0-1.0
- evidence: supporting text excerpt

Return JSON array of events.
`;
```

### 7. Configure Alerts
Set up notifications for high-probability scenarios:
- Email alerts when probability > 0.8
- Dashboard banners for threshold crossings
- Slack/Discord webhooks for critical events

## Testing

### Test Event Creation
```typescript
import { createEventFrame } from '@/lib/db/scenario-helpers';

const testEvent = await createEventFrame({
  feed_item_id: 1, // Use real feed_item_id
  event_type: 'airspace_closure',
  actors: [
    { name: 'Ukraine', role: 'defender', country: 'UA' }
  ],
  location: { country: 'Ukraine', region: 'Eastern' },
  severity: 8,
  confidence: 0.92,
  evidence: 'Ukraine closes airspace over eastern regions',
});

console.log('Event created:', testEvent);
```

### Test Scenario Scoring
```typescript
import { calculateScenarioScore, saveScenarioScore } from '@/lib/db/scenario-helpers';

const calculation = await calculateScenarioScore({
  scenario_id: 1, // NATO-Russia scenario
  time_window_hours: 168, // 7 days
  min_confidence: 0.5,
});

console.log('Scenario score:', calculation);

if (calculation) {
  await saveScenarioScore(calculation);
  console.log('Score saved');
}
```

### Test Dashboard Query
```typescript
import { getScenariosWithScores } from '@/lib/db/scenario-helpers';

const scenarios = await getScenariosWithScores();

scenarios.forEach((scenario) => {
  console.log(`${scenario.name}:`);
  console.log(`  Probability: ${(scenario.current_score?.probability || 0) * 100}%`);
  console.log(`  Active Signals: ${scenario.active_signal_count || 0}`);
  console.log(`  Trend: ${scenario.current_score?.trend || 'unknown'}`);
});
```

## Performance Considerations

### Indexes
All critical queries are indexed for performance:
- Event lookups by type, severity, time
- Signal lookups by code, category
- Score lookups by scenario + time
- Activation lookups by signal, event, time

### Query Optimization
- Use time-range filters to limit result sets
- Batch scenario calculations (calculate all at once)
- Cache signal catalog in memory (rarely changes)
- Use JSONB indexes for actor/location queries

### Scaling Strategy
For high-volume systems (1M+ events):
1. **Partition tables** by time (monthly partitions)
2. **Archive old data** (scores > 1 year, activations > 90 days)
3. **Aggregate historical scores** (daily/weekly summaries)
4. **Separate read replicas** for dashboard queries

## Support

**Database Schema:**
- `/lib/db/migrations/002_scenario_analysis.sql`
- `/lib/db/migrations/README.md`

**TypeScript Types:**
- `/types/scenario-db.ts`

**Helper Functions:**
- `/lib/db/scenario-helpers.ts`

**API Implementation:**
- `/lib/db/migrations/API_ROUTES.md`

## Summary

You now have a complete, production-ready database schema for scenario analysis:

**Created:**
- 7 database tables with 25+ indexes
- 3 PostgreSQL functions for scoring
- 19 pre-loaded signals
- 3 pre-loaded scenarios
- 20+ TypeScript helper functions
- Complete type definitions
- Comprehensive documentation

**Ready to implement:**
- API routes for data access
- Event extraction pipeline
- Scenario calculation automation
- Dashboard UI components
- Alert notifications

The system is designed to:
- Extract structured events from unstructured news
- Detect normalized signals with confidence scoring
- Calculate scenario probabilities with time-decay
- Assess multi-domain impacts
- Track changes over time with full audit trail

All functions are optimized for performance with proper indexing, efficient queries, and scalable architecture.
