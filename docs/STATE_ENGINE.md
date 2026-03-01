# State Engine Documentation

Comprehensive documentation for the WW3 Monitor State Engine system.

## Overview

The State Engine is a world state calculation system that processes event frames and signal activations to compute:

- **Country Readiness Scores**: Military, economic, political, diplomatic, and cyber readiness (0-100)
- **Global Tension Metrics**: World tension score (0-1) and alert levels
- **Bilateral Relations**: Country-to-country relationship graphs with evidence tracking
- **Historical Snapshots**: Daily aggregations for trend analysis

## Architecture

```
Event Frames (Orchestrator) → State Engine → Database Tables
                             ↓
                    ┌────────┴────────┐
                    │                 │
            Readiness Scores    Relation Edges
                    │                 │
                    └────────┬────────┘
                             ↓
                    World State (Live)
                             ↓
                    Daily Snapshots
```

## Feature Flag

**Environment Variable**: `STATE_ENABLED`

```bash
# Enable state engine
STATE_ENABLED=true

# Disable state engine (default)
STATE_ENABLED=false
```

When disabled, all API endpoints return 503 and cron jobs exit gracefully.

## Components

### 1. Readiness Breakdown

**Module**: `lib/state/computeReadinessBreakdown.ts`

Calculates country readiness across 5 components:

| Component   | Weight | Description                              |
|-------------|--------|------------------------------------------|
| Military    | 30%    | Military preparedness and capabilities   |
| Economic    | 25%    | Economic resilience and stability        |
| Political   | 20%    | Political stability and governance       |
| Diplomatic  | 15%    | Diplomatic positioning and alliances     |
| Cyber       | 10%    | Cyber defense and information security   |

**Scoring Algorithm**:
1. Start at neutral baseline (50 for each component)
2. Events involving country modify scores (negative impact)
3. Active signals modify scores (mostly positive, except humanitarian)
4. Clamp to 0-100 range
5. Calculate weighted overall score

**Example Output**:
```json
{
  "military": 72,
  "economic": 68,
  "political": 55,
  "diplomatic": 64,
  "cyber": 71,
  "overall": 68
}
```

### 2. World State Live

**Module**: `lib/state/updateWorldStateLive.ts`

Updates singleton `world_state_live` table (id=1) with current global metrics.

**Calculated Metrics**:
- **Global Tension Score**: 0-1 scale
  - Based on high-severity events (≥7) and active signals
  - Formula: `(eventTension × 0.6) + (signalTension × 0.4)`
  - 20+ critical events = max tension

- **Alert Level**:
  - `low`: tension < 0.25
  - `medium`: tension 0.25-0.50
  - `high`: tension 0.50-0.75
  - `critical`: tension ≥ 0.75

- **Active Event Count**: Events in last 24 hours
- **Active Scenario Count**: Scenarios with probability ≥ 30%
- **Country Statuses**: Per-country alert levels
- **Scenario Scores**: Current probability for each scenario

**Performance**: Target <50ms execution time

### 3. Relation Edges

**Module**: `lib/state/updateRelationEdges.ts`

Creates and updates bilateral relation edges between countries.

**Relation Types**:
- `allied`: Cooperative relationship
- `hostile`: Active kinetic conflict
- `adversary`: Antagonistic (non-kinetic)
- `neutral`: No significant interaction
- `trade_partner`: Economic cooperation
- `treaty_member`: Treaty-based alliance
- `sanctioned`: Economic sanctions

**Relation Strength**: 0-1 scale
- Calculated from event severity and confidence
- Formula: `(severity / 10) × confidence`
- Severity 8+ → strength 0.8+

**Evidence Tracking**:
- Stores last 10 event_frame_ids
- Includes confidence averaging
- Tracks first/last observation timestamps

### 4. Daily Snapshots

**Module**: `lib/state/dailySnapshotJob.ts`

Creates daily historical snapshots of world state.

**Snapshot Data**:
- Global tension and alert level
- Total events by type (missile_strike, airstrike, etc.)
- Events by severity (critical, high, medium, low)
- Active scenario codes and scores
- Country power rankings (0-1 scale, based on readiness)
- Active conflicts with intensity scores

**Retention**: 90 days (older snapshots auto-deleted)

**Date Format**: YYYYMMDD integer (e.g., 20260228)

## API Endpoints

### GET /api/state/country

Get state for a specific country.

**Parameters**:
- `code` (required): Country code (2-3 uppercase letters)
- `window` (optional): Time window in hours (default: 24)
- `min_confidence` (optional): Minimum signal confidence 0-1 (default: 0.3)

**Example Request**:
```bash
curl "https://middleeastlivefeed.com/api/state/country?code=USA&window=48"
```

**Example Response**:
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

**Parameters**:
- `code` (required): Country code
- `type` (optional): Filter by relation type
- `min_strength` (optional): Minimum strength 0-1 (default: 0.0)

**Example Request**:
```bash
curl "https://middleeastlivefeed.com/api/state/relations?code=USA&type=hostile&min_strength=0.5"
```

**Example Response**:
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

**Parameters**:
- `include_history` (optional): Include daily snapshots (default: false)
- `history_days` (optional): Number of days (default: 30)

**Example Request**:
```bash
curl "https://middleeastlivefeed.com/api/state/global?include_history=true&history_days=7"
```

**Example Response**:
```json
{
  "live_state": {
    "id": 1,
    "last_updated_at": 1709136000,
    "global_tension_score": 0.62,
    "alert_level": "high",
    "active_event_count": 42,
    "active_scenario_count": 3,
    "scenario_scores": {
      "SCENARIO_NATO_RUSSIA": 0.45,
      "SCENARIO_IRAN_ISRAEL": 0.68
    },
    "version": 157
  },
  "history": [...],
  "response_time_ms": 28
}
```

## Cron Jobs

### Live State Update

**Endpoint**: POST /api/cron/state-live
**Schedule**: Every 15 minutes (`*/15 * * * *`)
**Authentication**: `Authorization: Bearer <CRON_SECRET>`

**Actions**:
1. Update world_state_live singleton
2. Update relation_edges from events in last 24h

**Example**:
```bash
curl -X POST https://middleeastlivefeed.com/api/cron/state-live \
  -H "Authorization: Bearer $CRON_SECRET"
```

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

### Daily Snapshot

**Endpoint**: POST /api/cron/state-daily
**Schedule**: Daily at midnight UTC (`0 0 * * *`)
**Authentication**: `Authorization: Bearer <CRON_SECRET>`

**Actions**:
1. Create daily snapshot
2. Clean up snapshots older than 90 days

**Example**:
```bash
curl -X POST https://middleeastlivefeed.com/api/cron/state-daily \
  -H "Authorization: Bearer $CRON_SECRET"
```

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

## Environment Variables

### Required

```bash
# Feature flag
STATE_ENABLED=true

# Cron authentication
CRON_SECRET=your_random_secret_key_here
```

### Optional

```bash
# Database (auto-detected)
# - Uses SQLite in development
# - Uses Supabase in production (if NEXT_PUBLIC_SUPABASE_URL set)
```

## Database Tables

See `/lib/db/migrations/004_state_management_sqlite.sql`

### world_state_live

Singleton table (id=1) for current global state.

**Columns**:
- `id`: Always 1 (enforced by CHECK constraint)
- `last_updated_at`: Unix timestamp (seconds)
- `global_tension_score`: Float 0-1
- `alert_level`: Enum (low/medium/high/critical)
- `active_event_count`: Integer
- `active_scenario_count`: Integer
- `active_event_frames`: JSON array of event IDs
- `scenario_scores`: JSON object {code: probability}
- `country_statuses`: JSON object {country: status}
- `version`: Auto-incremented on each update

### world_state_daily

Daily historical snapshots.

**Columns**:
- `id`: Auto-increment primary key
- `date`: YYYYMMDD integer (unique)
- `global_tension_score`: Float 0-1
- `alert_level`: Enum
- `total_events`: Integer
- `event_counts_by_type`: JSON object
- `event_counts_by_severity`: JSON object
- `active_scenarios`: JSON array
- `scenario_scores`: JSON object
- `country_power_snapshot`: JSON object {country: power 0-1}
- `active_conflicts`: JSON array of {countries, intensity}
- `calculated_at`: Unix timestamp
- `data_quality`: Float 0-1

### relation_edges

Bilateral country relations.

**Columns**:
- `id`: Auto-increment primary key
- `entity_a`, `entity_b`: Country codes (alphabetically sorted)
- `relation_type`: Enum (allied/hostile/neutral/etc.)
- `relation_strength`: Float 0-1
- `is_mutual`: Boolean (0/1)
- `evidence_event_frame_ids`: JSON array (last 10 events)
- `evidence_count`: Integer
- `first_observed_at`: Unix timestamp
- `last_updated_at`: Unix timestamp
- `last_event_at`: Unix timestamp (nullable)
- `confidence`: Float 0-1
- `source`: String (default: 'event_analysis')

**Indexes**:
- `idx_relation_edges_entity_a` on entity_a
- `idx_relation_edges_entity_b` on entity_b
- `idx_relation_edges_type` on relation_type
- `idx_relation_edges_strength` on relation_strength DESC
- `idx_relation_edges_updated` on last_updated_at DESC

## Performance Targets

| Operation                | Target      |
|--------------------------|-------------|
| Country readiness        | <30ms       |
| World state update       | <50ms       |
| Relation edges update    | <200ms      |
| Daily snapshot creation  | <500ms      |
| API response time        | <100ms      |

## Testing

Run comprehensive test suite:

```bash
npx tsx scripts/test-state-engine.ts
```

Manual API testing:

```bash
# 1. Enable state engine
export STATE_ENABLED=true

# 2. Test country state
curl "http://localhost:3000/api/state/country?code=USA"

# 3. Test relations
curl "http://localhost:3000/api/state/relations?code=USA&type=hostile"

# 4. Test global state
curl "http://localhost:3000/api/state/global?include_history=true"

# 5. Trigger cron jobs (requires CRON_SECRET)
export CRON_SECRET=your_secret

curl -X POST http://localhost:3000/api/cron/state-live \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST http://localhost:3000/api/cron/state-daily \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Error Handling

All modules follow consistent error handling:

- Return graceful fallback values on error
- Log errors with context
- Never throw exceptions to API layer
- Use 503 status when feature disabled
- Use 401 status for cron authentication failures

## Security

### Cron Authentication

All cron endpoints require Bearer token authentication:

```bash
Authorization: Bearer <CRON_SECRET>
```

Invalid tokens return 401 Unauthorized.

### Feature Flag

State engine can be disabled globally via `STATE_ENABLED=false`.

### Data Privacy

- No PII stored in state tables
- Country codes used (not names in most places)
- Evidence URLs stored but not content
- Confidence scores track data quality

## Deployment

### Vercel Configuration

Add to `vercel.json`:

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

### Environment Variables

Set in Vercel dashboard:
- `STATE_ENABLED=true`
- `CRON_SECRET=<random_key>`

### First-Time Setup

1. Run migrations (creates tables)
2. Enable STATE_ENABLED
3. Trigger initial state update: POST /api/cron/state-live
4. Verify world_state_live populated
5. Monitor logs for errors

## Troubleshooting

### State Engine Not Working

**Check**:
1. Is `STATE_ENABLED=true`?
2. Are migrations run? (tables exist?)
3. Are event_frames populated by orchestrator?
4. Check logs for errors

### Cron Jobs Failing

**Check**:
1. Is `CRON_SECRET` set correctly?
2. Is Vercel cron enabled?
3. Check Vercel function logs
4. Verify authentication header format

### Low Confidence Scores

**Possible Causes**:
- Not enough event data
- Events missing actors (attacker/target)
- Low confidence events filtered out
- Time window too narrow

**Solutions**:
- Increase window_hours parameter
- Lower min_confidence threshold
- Process more events through orchestrator

## Future Enhancements

1. **Machine Learning**: Train models on historical data for better scoring
2. **Predictive Analytics**: Forecast tension scores 24-48h ahead
3. **Anomaly Detection**: Alert on unusual state changes
4. **Real-time Updates**: WebSocket push for state changes
5. **Country Clustering**: Group countries by behavior patterns
6. **Graph Analytics**: Network analysis on relation_edges
7. **Custom Weights**: Per-user readiness component weights
8. **Multi-language Support**: Country names in multiple languages

## Support

For issues or questions:
- Check logs: Vercel function logs
- Review documentation: `/lib/state/README.md`
- Test locally: `npx tsx scripts/test-state-engine.ts`
- Report bugs: GitHub issues
