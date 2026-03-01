# Database Migrations

Comprehensive database schema for WW3 Monitor including event processing, state management, and scenario analysis.

**Last Updated**: 2026-02-28
**Status**: Production Ready

## Migration Overview

| Migration | SQLite File | Supabase File | Status | Tables Created |
|-----------|-------------|---------------|--------|----------------|
| 001 | `001_initial.sql` | ✅ Applied | Complete | sources, feed_items, clusters, translation_cache, ingestion_logs |
| 002 | N/A | `002_scenario_analysis.sql` | Complete | Full scenario analysis system (Supabase only) |
| 003 | `003_event_processing_sqlite.sql` | `003_event_processing_supabase.sql` | ✅ Ready | event_frames, signals, signal_activations, scenario_definitions |
| 004 | `004_state_management_sqlite.sql` | `004_state_management_supabase.sql` | ✅ Ready | world_state_live, world_state_daily, relation_edges |

## Quick Start

### Development (SQLite)

```bash
# Apply all migrations
sqlite3 data/monitor.db < lib/db/migrations/001_initial.sql
sqlite3 data/monitor.db < lib/db/migrations/003_event_processing_sqlite.sql
sqlite3 data/monitor.db < lib/db/migrations/004_state_management_sqlite.sql

# Or run test script
npx ts-node lib/db/migrations/test-migrations.ts
```

### Production (Supabase)

1. Open Supabase SQL Editor
2. Run `003_event_processing_supabase.sql`
3. Run `004_state_management_supabase.sql`
4. Verify tables created successfully

**Detailed Instructions**: See [`docs/migrations-runbook.md`](/docs/migrations-runbook.md)

## Database Tables (After All Migrations)

### Core Tables (Migration 001)
- **sources** - RSS feed sources
- **feed_items** - Ingested news items
- **clusters** - Related items grouped together
- **translation_cache** - Cached translations
- **ingestion_logs** - Ingestion audit trail

### Event Processing (Migration 003)
- **event_frames** - Structured events extracted from feed items
- **signals** - Signal definitions with weights and decay (19 seeded)
- **signal_activations** - Active signal instances
- **scenario_definitions** - Scenario templates (3 seeded)

### State Management (Migration 004)
- **world_state_live** - Current global state (singleton, id=1)
- **world_state_daily** - Historical daily snapshots
- **relation_edges** - Country relationship graph

### Scenario Analysis (Migration 002 - Supabase only)
- **scenario_scores** - Historical time-series scoring data
- **impact_matrix** - Impact assessments by domain
- **scenario_changelog** - Audit trail of changes

## Table Details

### 1. event_frames

Extracts structured events from unstructured news feed items.

**Columns:**
- `id` - Primary key
- `feed_item_id` - References feed_items table
- `event_type` - Type of event (military_mobilization, airspace_closure, etc.)
- `actors` - JSONB array of actors with roles
- `location` - JSONB object with country, region, coordinates
- `severity` - Severity score 1-10
- `confidence` - Confidence in extraction 0.0-1.0
- `source_reliability` - Reliability rating 1-5
- `evidence` - Text excerpt supporting this event

**Example:**
```sql
INSERT INTO event_frames (
  feed_item_id,
  event_type,
  actors,
  location,
  severity,
  confidence,
  evidence
) VALUES (
  12345,
  'airspace_closure',
  '[
    {"name": "Ukraine", "role": "defender", "country": "UA"},
    {"name": "Russia", "role": "aggressor", "country": "RU"}
  ]'::jsonb,
  '{"country": "Ukraine", "region": "Eastern"}'::jsonb,
  8,
  0.92,
  'Ukraine has closed airspace over eastern regions due to security threats'
);
```

### 2. signals

Normalized signal catalog with weights and decay parameters.

**Columns:**
- `code` - Unique signal code (e.g., 'SIG_AIRSPACE_CLOSED')
- `name` - Human-readable name
- `category` - military, diplomatic, economic, cyber, humanitarian, infrastructure
- `weight` - Contribution to scenario score (0.0-1.0)
- `decay_rate` - How fast signal loses relevance
- `half_life_hours` - Hours until weight reduces by 50%
- `scope` - local, regional, global
- `requires_verification` - Whether signal needs manual verification

**Pre-loaded Signals:**
- `SIG_AIRSPACE_CLOSED` - Airspace closed (weight: 0.8, 24h half-life)
- `SIG_TROOPS_MOBILIZED` - Military mobilization (weight: 0.9, 7d half-life)
- `SIG_EMBASSY_CLOSURE` - Embassy evacuation (weight: 0.75, 7d half-life)
- `SIG_ALLIANCE_INVOKED` - Defense alliance triggered (weight: 0.95, 30d half-life)
- And 15+ more...

### 3. signal_activations

Tracks when signals are detected in event frames.

**Columns:**
- `signal_id` - References signals table
- `event_frame_id` - References event_frames table
- `confidence` - Confidence in this activation
- `activated_at` - Timestamp of activation
- `expires_at` - When signal activation expires
- `is_active` - Current status
- `is_verified` - Manual verification flag

**Example:**
```sql
-- Link an event frame to a signal
INSERT INTO signal_activations (
  signal_id,
  event_frame_id,
  confidence,
  expires_at
) VALUES (
  (SELECT id FROM signals WHERE code = 'SIG_AIRSPACE_CLOSED'),
  12345,
  0.92,
  extract(epoch from now() + interval '24 hours')::bigint
);
```

### 4. scenario_definitions

Templates defining conflict scenarios to monitor.

**Columns:**
- `code` - Unique scenario code (e.g., 'SCENARIO_NATO_RUSSIA')
- `name` - Scenario name
- `hypothesis` - What this scenario predicts
- `trigger_signals` - JSONB array of signal codes
- `base_threshold` - Threshold for scenario activation
- `impact_areas` - JSONB array of affected domains
- `geographic_scope` - bilateral, regional, global
- `actors_involved` - JSONB array of countries/organizations

**Pre-loaded Scenarios:**
1. **NATO-Russia Escalation** - Tracks military confrontation risks
2. **Taiwan Strait Crisis** - Monitors Taiwan sovereignty tensions
3. **Middle East Escalation** - Regional conflict escalation

### 5. scenario_scores

Time-series data tracking scenario probability over time.

**Columns:**
- `scenario_id` - References scenario_definitions
- `score` - Calculated score 0.0-1.0
- `probability` - Probability of scenario 0.0-1.0
- `trend` - increasing, stable, decreasing
- `active_signals` - JSONB array of contributing signals
- `signal_count` - Number of active signals
- `confidence` - Confidence in calculation
- `calculated_at` - Timestamp

**Score Calculation:**
```
score = Σ (signal.weight × activation.confidence × decay_factor)
decay_factor = 0.5^(hours_elapsed / half_life_hours)
probability = min(score / base_threshold, 1.0)
```

### 6. impact_matrix

Impact assessments by scenario and affected domain.

**Columns:**
- `scenario_id` - References scenario_definitions
- `domain` - aviation, maritime, energy, financial, cyber, etc.
- `impact_level` - minimal, low, moderate, high, critical
- `impact_score` - Numeric score 0-100
- `reasoning` - Explanation of impact assessment
- `timeframe` - immediate, short_term, medium_term, long_term
- `reversibility` - reversible, partially_reversible, irreversible
- `sources` - JSONB array of supporting sources
- `affected_regions` - JSONB array of geographic regions

**Example:**
```sql
INSERT INTO impact_matrix (
  scenario_id,
  domain,
  impact_level,
  impact_score,
  reasoning,
  timeframe,
  reversibility,
  sources,
  affected_regions,
  confidence
) VALUES (
  1,
  'aviation',
  'high',
  75,
  'Airspace closures and flight restrictions across Eastern Europe',
  'immediate',
  'reversible',
  '[{"type": "event_frame", "id": 12345}]'::jsonb,
  '["Eastern Europe", "Baltic States"]'::jsonb,
  0.85
);
```

### 7. scenario_changelog

Audit trail of all scenario changes.

**Columns:**
- `scenario_id` - References scenario_definitions
- `change_type` - score_update, threshold_crossed, signal_added, etc.
- `delta` - JSONB object with old/new values
- `reason` - Why this change occurred
- `triggered_by` - system, analyst:name, event:id
- `previous_score` - Score before change
- `new_score` - Score after change

## Utility Functions

### calculate_signal_decay()

Calculate decay factor for a signal activation.

```sql
SELECT calculate_signal_decay(
  p_activated_at := 1709136000,  -- Activation timestamp
  p_half_life_hours := 168,      -- 7 days
  p_current_time := extract(epoch from now())::bigint
);
-- Returns: 0.5 (if 7 days elapsed)
```

### get_active_scenario_signals()

Get all active signals for a scenario.

```sql
SELECT * FROM get_active_scenario_signals(
  p_scenario_id := 1,
  p_time_threshold := extract(epoch from now() - interval '7 days')::bigint
);
```

Returns:
- `signal_code` - Signal identifier
- `signal_weight` - Weight in scoring
- `activation_count` - How many times activated
- `avg_confidence` - Average confidence
- `latest_activation` - Most recent activation

### update_scenario_score()

Recalculate score for a scenario.

```sql
SELECT update_scenario_score(p_scenario_id := 1);
-- Returns: 0.73 (calculated score)
```

## TypeScript Integration

### Import Types

```typescript
import type {
  EventFrame,
  Signal,
  ScenarioDefinition,
  ScenarioScore,
  ImpactAssessment,
} from '@/types/scenario-db';
```

### Use Helper Functions

```typescript
import {
  createEventFrame,
  getEventFrames,
  calculateScenarioScore,
  saveScenarioScore,
  getScenariosWithScores,
} from '@/lib/db/scenario-helpers';

// Create an event frame
const eventFrame = await createEventFrame({
  feed_item_id: 12345,
  event_type: 'airspace_closure',
  actors: [
    { name: 'Ukraine', role: 'defender', country: 'UA' }
  ],
  severity: 8,
  confidence: 0.92,
  evidence: 'Airspace closed over eastern regions...',
});

// Calculate scenario scores
const calculation = await calculateScenarioScore({
  scenario_id: 1,
  time_window_hours: 168, // 7 days
  min_confidence: 0.5,
});

// Save the score
if (calculation) {
  await saveScenarioScore(calculation);
}

// Get all scenarios with current scores
const scenarios = await getScenariosWithScores();
```

## Common Queries

### Get High-Severity Recent Events

```sql
SELECT
  ef.*,
  fi.title_en,
  fi.source_name
FROM event_frames ef
JOIN feed_items fi ON ef.feed_item_id = fi.id
WHERE ef.severity >= 7
  AND ef.created_at >= extract(epoch from now() - interval '24 hours')::bigint
ORDER BY ef.severity DESC, ef.created_at DESC;
```

### Get Scenario with Active Signals

```sql
SELECT
  sd.name,
  sd.code,
  COUNT(sa.id) as active_signal_count,
  AVG(sa.confidence) as avg_confidence
FROM scenario_definitions sd
JOIN signals s ON s.code = ANY(sd.trigger_signals::text[])
JOIN signal_activations sa ON sa.signal_id = s.id
WHERE sa.is_active = true
  AND sa.activated_at >= extract(epoch from now() - interval '7 days')::bigint
GROUP BY sd.id, sd.name, sd.code
ORDER BY active_signal_count DESC;
```

### Get Impact Summary by Domain

```sql
SELECT
  domain,
  COUNT(*) as scenario_count,
  MAX(impact_score) as max_impact,
  AVG(impact_score) as avg_impact
FROM impact_matrix
WHERE assessed_at >= extract(epoch from now() - interval '30 days')::bigint
GROUP BY domain
ORDER BY max_impact DESC;
```

### Get Scenario Trend Analysis

```sql
WITH recent_scores AS (
  SELECT
    scenario_id,
    score,
    calculated_at,
    ROW_NUMBER() OVER (PARTITION BY scenario_id ORDER BY calculated_at DESC) as rn
  FROM scenario_scores
  WHERE calculated_at >= extract(epoch from now() - interval '7 days')::bigint
)
SELECT
  sd.name,
  sd.code,
  (SELECT score FROM recent_scores WHERE scenario_id = sd.id AND rn = 1) as latest_score,
  (SELECT score FROM recent_scores WHERE scenario_id = sd.id AND rn = 7) as week_ago_score,
  (SELECT score FROM recent_scores WHERE scenario_id = sd.id AND rn = 1) -
  (SELECT score FROM recent_scores WHERE scenario_id = sd.id AND rn = 7) as score_delta
FROM scenario_definitions sd
WHERE sd.is_active = true
ORDER BY ABS(score_delta) DESC NULLS LAST;
```

## Best Practices

### Event Frame Extraction

1. **High Confidence**: Only create event frames with confidence > 0.7
2. **Evidence**: Always include supporting text excerpt
3. **Actor Roles**: Be precise with actor roles (aggressor, defender, etc.)
4. **Severity Calibration**: Use 1-3 for minor, 4-6 for moderate, 7-8 for major, 9-10 for critical

### Signal Management

1. **Verification**: Require verification for high-weight signals (weight > 0.8)
2. **Decay Tuning**: Short half-life (24-48h) for tactical, long (7-30d) for strategic
3. **Scope**: Use 'global' for signals with worldwide implications

### Scenario Scoring

1. **Time Windows**: Use 7-30 days for most scenarios, shorter for fast-moving crises
2. **Thresholds**: Set base_threshold to 0.2-0.4 for most scenarios
3. **Regular Updates**: Recalculate scores every 1-6 hours
4. **Trend Analysis**: Compare with previous 7 scores to determine trend

### Impact Assessment

1. **Multi-Domain**: Assess impact across all relevant domains
2. **Timeframes**: Consider both immediate and long-term impacts
3. **Reversibility**: Distinguish between temporary and permanent impacts
4. **Evidence**: Link to supporting event frames and feed items

## Performance Optimization

### Indexes

All critical queries are indexed:
- Event frames: type, severity, created_at
- Signals: code, category, weight
- Signal activations: signal_id, event_frame_id, activated_at
- Scenarios: code, is_active
- Scores: scenario_id + calculated_at

### Partitioning (Future)

For large-scale deployments, consider partitioning:
- `scenario_scores` by calculated_at (monthly partitions)
- `signal_activations` by activated_at (monthly partitions)
- `scenario_changelog` by timestamp (monthly partitions)

### Archival

Archive old data periodically:
- Signal activations older than 90 days
- Scenario scores older than 365 days (keep aggregates)
- Event frames older than 180 days (unless referenced)

## Monitoring

### Key Metrics to Track

```sql
-- Active signals per scenario
SELECT COUNT(*) FROM signal_activations WHERE is_active = true;

-- Scenarios above threshold
SELECT COUNT(*) FROM scenario_scores
WHERE calculated_at >= extract(epoch from now() - interval '1 hour')::bigint
  AND probability > 0.5;

-- Unverified high-weight signals
SELECT COUNT(*) FROM signal_activations sa
JOIN signals s ON sa.signal_id = s.id
WHERE sa.is_verified = false
  AND s.requires_verification = true
  AND s.weight > 0.8;

-- Recent high-severity events
SELECT COUNT(*) FROM event_frames
WHERE severity >= 8
  AND created_at >= extract(epoch from now() - interval '24 hours')::bigint;
```

## Troubleshooting

### No Scores Generated

Check:
1. Are there active signals? `SELECT COUNT(*) FROM signals WHERE is_active = true;`
2. Are signals activated? `SELECT COUNT(*) FROM signal_activations WHERE is_active = true;`
3. Do scenarios have trigger signals? `SELECT code, trigger_signals FROM scenario_definitions;`

### Low Confidence Scores

Causes:
1. Few signals activated (< 30% of trigger_signals)
2. Low event frame confidence
3. Old signal activations (high decay)

Solutions:
1. Improve event extraction confidence
2. Add more signal definitions
3. Reduce decay rate for strategic signals

### Performance Issues

1. **Check index usage**: `EXPLAIN ANALYZE` on slow queries
2. **Vacuum tables**: `VACUUM ANALYZE scenario_scores;`
3. **Archive old data**: Move scores older than 1 year
4. **Partition tables**: For very large datasets (> 10M rows)

## API Examples

See `/lib/db/scenario-helpers.ts` for complete TypeScript API.

### Example Workflow

```typescript
// 1. Extract event from feed item
const event = await createEventFrame({
  feed_item_id: newsFeedItem.id,
  event_type: 'airspace_closure',
  actors: [{name: 'Ukraine', role: 'defender'}],
  severity: 8,
  confidence: 0.92,
  evidence: extractedText,
});

// 2. Activate relevant signals
const signal = await getSignalByCode('SIG_AIRSPACE_CLOSED');
if (signal && event) {
  await activateSignal(signal.id, event.id, 0.92);
}

// 3. Recalculate affected scenarios
const scenarios = await getScenarioDefinitions();
for (const scenario of scenarios) {
  const calculation = await calculateScenarioScore({
    scenario_id: scenario.id!,
  });

  if (calculation) {
    await saveScenarioScore(calculation);

    // Log if threshold crossed
    if (calculation.probability > scenario.base_threshold) {
      await logScenarioChange({
        scenario_id: scenario.id!,
        change_type: 'threshold_crossed',
        delta: {
          field: 'probability',
          old_value: 0,
          new_value: calculation.probability,
        },
        triggered_by: `event:${event.id}`,
        new_score: calculation.score,
      });
    }
  }
}

// 4. Get dashboard data
const scenariosWithScores = await getScenariosWithScores();
```

## Support

For questions or issues, see:
- Database schema: `/lib/db/migrations/002_scenario_analysis.sql`
- TypeScript types: `/types/scenario-db.ts`
- Helper functions: `/lib/db/scenario-helpers.ts`
