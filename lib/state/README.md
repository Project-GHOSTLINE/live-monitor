# State Engine

World state calculation system for WW3 Monitor. Computes country readiness scores, relation edges, and global tension metrics based on event frames and signal activations.

## Architecture

```
┌─────────────────────┐
│ Orchestrator        │
│ (event_frames +     │
│  signal_activations)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ State Engine                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ computeReadinessBreakdown.ts                    │ │
│ │ - Military, economic, political, diplomatic,    │ │
│ │   cyber readiness scores (0-100)                │ │
│ │ - Baseline 50, events/signals modify scores     │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ updateWorldStateLive.ts                         │ │
│ │ - Global tension score (0-1)                    │ │
│ │ - Alert level (low/medium/high/critical)        │ │
│ │ - Active event counts & scenario scores         │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ updateRelationEdges.ts                          │ │
│ │ - Bilateral relations (hostile/allied/neutral)  │ │
│ │ - Relation strength (0-1)                       │ │
│ │ - Evidence tracking via event_frame_ids         │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ dailySnapshotJob.ts                             │ │
│ │ - Daily aggregation of world state              │ │
│ │ - Historical tracking (90 days retention)       │ │
│ │ - Country power rankings                        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Database Tables     │
│ - world_state_live  │
│ - world_state_daily │
│ - relation_edges    │
└─────────────────────┘
```

## Modules

### computeReadinessBreakdown.ts

Calculates country readiness across 5 components:

- **Military**: Preparedness for kinetic operations (0-100)
- **Economic**: Economic resilience and stability (0-100)
- **Political**: Political stability and governance (0-100)
- **Diplomatic**: Diplomatic positioning and alliances (0-100)
- **Cyber**: Cyber defense capability (0-100)
- **Overall**: Weighted average of all components (0-100)

**Algorithm**:
1. Start at neutral baseline (50 for each component)
2. Process events involving country (attacks reduce scores)
3. Process active signals (most signals increase readiness)
4. Clamp scores to 0-100 range
5. Calculate weighted overall score

**Default Weights**:
- Military: 30%
- Economic: 25%
- Political: 20%
- Diplomatic: 15%
- Cyber: 10%

**Example**:
```typescript
import { computeReadinessBreakdown } from '@/lib/state/computeReadinessBreakdown';

const readiness = await computeReadinessBreakdown('USA', {
  windowHours: 24,
  minConfidence: 0.3,
});

console.log(readiness);
// {
//   military: 72,
//   economic: 68,
//   political: 55,
//   diplomatic: 64,
//   cyber: 71,
//   overall: 68
// }
```

### updateWorldStateLive.ts

Updates the singleton `world_state_live` table with current global metrics.

**Calculated Metrics**:
- **Global tension score**: 0-1 scale based on critical events and active signals
- **Alert level**: low (< 0.25), medium (0.25-0.5), high (0.5-0.75), critical (≥ 0.75)
- **Active event count**: Events in last 24 hours
- **Active scenario count**: Scenarios with probability ≥ 30%
- **Country statuses**: Per-country alert levels
- **Scenario scores**: Current probability for each scenario

**Performance**: Target <50ms execution time

**Example**:
```typescript
import { updateWorldStateLive, getWorldStateLive } from '@/lib/state/updateWorldStateLive';

// Update state (called by cron or on-demand)
await updateWorldStateLive();

// Read current state
const state = await getWorldStateLive();
console.log(`Tension: ${state.global_tension_score.toFixed(2)}, Alert: ${state.alert_level}`);
```

### updateRelationEdges.ts

Creates and updates bilateral relation edges between countries based on events.

**Relation Types**:
- `allied`: Cooperative relationship
- `hostile`: Active conflict
- `neutral`: No significant interaction
- `trade_partner`: Economic cooperation
- `adversary`: Antagonistic but not kinetic
- `treaty_member`: Treaty-based alliance
- `sanctioned`: Economic sanctions imposed

**Relation Strength**: 0-1 scale calculated from event severity and confidence

**Evidence Tracking**: Stores last 10 event_frame_ids as evidence

**Example**:
```typescript
import { updateRelationEdges, getCountryRelations } from '@/lib/state/updateRelationEdges';

// Update relations from recent events
const stats = await updateRelationEdges({
  windowHours: 24,
  minConfidence: 0.4,
  minSeverity: 4,
});
console.log(`Processed ${stats.processed} events: ${stats.created} created, ${stats.updated} updated`);

// Get all relations for a country
const relations = await getCountryRelations('USA', {
  minStrength: 0.5,
  relationType: 'hostile',
});
```

### dailySnapshotJob.ts

Creates daily snapshots of world state for historical analysis.

**Snapshot Data**:
- Global tension and alert level
- Total events by type and severity
- Active scenario codes and scores
- Country power rankings (0-1 scale)
- Active conflicts with intensity scores

**Retention**: Keeps last 90 days, deletes older snapshots

**Example**:
```typescript
import { createDailySnapshot, getDailySnapshots } from '@/lib/state/dailySnapshotJob';

// Create snapshot (called by cron at midnight UTC)
const snapshot = await createDailySnapshot();
console.log(`Snapshot created: ${snapshot.date}, ${snapshot.total_events} events`);

// Get historical snapshots
const history = await getDailySnapshots({
  limit: 30,  // Last 30 days
});
```

## API Endpoints

### GET /api/state/country

Get state for a specific country.

**Query Parameters**:
- `code`: Country code (required, 2-3 uppercase letters, e.g., "USA")
- `window`: Time window in hours (default: 24)
- `min_confidence`: Minimum signal confidence 0-1 (default: 0.3)

**Response**:
```json
{
  "country": {
    "country_code": "USA",
    "country_name": "United States",
    "readiness": {
      "military": 72,
      "economic": 68,
      "political": 55,
      "diplomatic": 64,
      "cyber": 71,
      "overall": 68
    },
    "alert_status": "heightened",
    "active_signals": ["SIG_TROOPS_MOBILIZED", "SIG_NAVAL_DEPLOYMENT"],
    "active_events": [42, 43, 45],
    "last_updated_at": 1709136000,
    "confidence": 0.85
  },
  "response_time_ms": 23
}
```

### GET /api/state/relations

Get bilateral relations for a country.

**Query Parameters**:
- `code`: Country code (required)
- `type`: Relation type filter (optional: allied, hostile, neutral, etc.)
- `min_strength`: Minimum strength 0-1 (default: 0.0)

**Response**:
```json
{
  "country_code": "USA",
  "relations": [
    {
      "id": 1,
      "entity_a": "RUS",
      "entity_b": "USA",
      "relation_type": "adversary",
      "relation_strength": 0.75,
      "is_mutual": false,
      "evidence_event_frame_ids": [42, 45, 48],
      "evidence_count": 3,
      "confidence": 0.8,
      "last_updated_at": 1709136000
    }
  ],
  "total": 1,
  "filters": {
    "type": "adversary",
    "min_strength": 0.5
  },
  "response_time_ms": 15
}
```

### GET /api/state/global

Get global world state with optional historical data.

**Query Parameters**:
- `include_history`: Include daily snapshots (default: false)
- `history_days`: Number of days of history (default: 30)

**Response**:
```json
{
  "live_state": {
    "id": 1,
    "last_updated_at": 1709136000,
    "global_tension_score": 0.62,
    "alert_level": "high",
    "active_event_count": 42,
    "active_scenario_count": 3,
    "active_event_frames": [42, 43, 45, 48],
    "scenario_scores": {
      "SCENARIO_NATO_RUSSIA": 0.45,
      "SCENARIO_IRAN_ISRAEL": 0.68
    },
    "country_statuses": {
      "USA": "heightened",
      "RUS": "critical"
    },
    "version": 157
  },
  "history": [...],
  "response_time_ms": 28
}
```

### POST /api/cron/state-live

Vercel cron job to update live world state (runs every 15 minutes).

**Authentication**: `Authorization: Bearer <CRON_SECRET>`

**Response**:
```json
{
  "success": true,
  "world_state": {
    "tension": 0.62,
    "alert_level": "high",
    "active_events": 42,
    "version": 158
  },
  "relation_edges": {
    "processed": 15,
    "created": 2,
    "updated": 13
  },
  "duration_ms": 456
}
```

### POST /api/cron/state-daily

Vercel cron job to create daily snapshot (runs at midnight UTC).

**Authentication**: `Authorization: Bearer <CRON_SECRET>`

**Response**:
```json
{
  "success": true,
  "snapshot": {
    "date": 20260228,
    "total_events": 87,
    "global_tension_score": 0.62,
    "alert_level": "high",
    "active_scenarios": 3
  },
  "cleanup": {
    "deleted_snapshots": 0
  },
  "duration_ms": 234
}
```

## Feature Flag

Set environment variable to enable state engine:

```bash
STATE_ENABLED=true
```

When disabled:
- All API endpoints return 503 with message
- Cron jobs exit gracefully without processing

## Cron Jobs

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/state-live",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/state-daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**state-live**: Runs every 15 minutes
- Updates world_state_live singleton
- Updates relation_edges from new events

**state-daily**: Runs at midnight UTC
- Creates daily snapshot
- Cleans up old snapshots (>90 days)

## Environment Variables

Required:
```bash
STATE_ENABLED=true        # Enable state engine
CRON_SECRET=your_secret   # Protect cron endpoints
```

## Performance Targets

- **Country readiness**: <30ms per country
- **World state update**: <50ms execution
- **Relation edges update**: <200ms for 24h window
- **Daily snapshot**: <500ms execution

## Database Schema

See `/lib/db/migrations/004_state_management_sqlite.sql`

**Tables**:
- `world_state_live`: Singleton (id=1) for current global state
- `world_state_daily`: Daily historical snapshots
- `relation_edges`: Bilateral country relations

## Testing

Manual test via API:

```bash
# Enable state engine
export STATE_ENABLED=true

# Get country state
curl "http://localhost:3000/api/state/country?code=USA"

# Get country relations
curl "http://localhost:3000/api/state/relations?code=USA&type=hostile"

# Get global state
curl "http://localhost:3000/api/state/global?include_history=true"

# Trigger live state update (requires CRON_SECRET)
curl -X POST http://localhost:3000/api/cron/state-live \
  -H "Authorization: Bearer $CRON_SECRET"

# Trigger daily snapshot (requires CRON_SECRET)
curl -X POST http://localhost:3000/api/cron/state-daily \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Dependencies

- `lib/db/adapter.ts`: Database abstraction (SQLite + Supabase)
- `lib/orchestrator/*`: Event frames and signal activations
- `types/state.ts`: TypeScript type definitions

## Future Enhancements

1. **Machine learning readiness scores**: Train model on historical data
2. **Predictive state forecasting**: Forecast tension scores 24-48h ahead
3. **Anomaly detection**: Alert on unusual state changes
4. **Multi-factor correlation**: Detect complex patterns across signals
5. **Real-time WebSocket updates**: Push state changes to clients
6. **Country clustering**: Group countries by behavior patterns
