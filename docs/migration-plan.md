# Database Migration Plan
**Project**: WW3 Monitor - Event Processing System
**Generated**: 2026-02-28
**Author**: Backend Architect (DB Discovery Specialist)
**Status**: READY FOR EXECUTION

---

## Migration Strategy Overview

### Core Principles
1. **Backward Compatibility ONLY** - No breaking changes to existing tables
2. **Feature Flag Approach** - New features gracefully degrade if tables don't exist
3. **Dual Database Support** - All migrations work for both SQLite (dev) and Supabase (prod)
4. **Zero Downtime** - Migrations can run while app is live
5. **Idempotent Operations** - All migrations use `CREATE TABLE IF NOT EXISTS`

### Migration Philosophy
> "Add new tables, never modify existing ones. Let old code run on new schema, new code checks table existence."

---

## Migration Phases

### Phase 0: Pre-Migration Validation (COMPLETE)
**Status**: COMPLETE ✅
**Deliverables**:
- Database discovery report (db-discovery.md)
- Migration plan (this document)
- Schema comparison (schema-comparison.md)

### Phase 1: Create SQL Migrations (Backward Compatible)
**Duration**: 2-3 hours
**Owner**: migration-engineer
**Dependencies**: None (unblocked by Phase 0 completion)

**Tasks**:
1. Create `/Users/xunit/Desktop/ww3/lib/db/migrations/003_event_processing_sqlite.sql`
   - event_frames table (SQLite-compatible)
   - signals table + seed data
   - signal_activations table
   - scenario_definitions table + seed data
   - Update existing scenario_scores to match Migration 002 schema (ADD columns only)

2. Create `/Users/xunit/Desktop/ww3/lib/db/migrations/003_event_processing_supabase.sql`
   - Same tables but with PostgreSQL types (BIGSERIAL, JSONB, BOOLEAN)
   - Include PostgreSQL functions from Migration 002
   - Compatible with Supabase environment

3. Create `/Users/xunit/Desktop/ww3/lib/db/migrations/004_state_management_sqlite.sql`
   - world_state_daily table
   - world_state_live table (singleton pattern)
   - relation_edges table
   - country_power table (optional)

4. Create `/Users/xunit/Desktop/ww3/lib/db/migrations/004_state_management_supabase.sql`
   - PostgreSQL versions of state management tables

**Validation**:
- Run migrations on fresh SQLite database - no errors
- Run migrations on existing database - no data loss
- Run migrations twice - idempotent (no errors)

### Phase 2: Orchestrator Pipeline Implementation
**Duration**: 3-4 hours
**Owner**: orchestrator-engineer
**Dependencies**: Phase 1 (tables must exist)

**Tasks**:
1. Create `/Users/xunit/Desktop/ww3/lib/orchestrator/pipeline.ts`
   - FeedItem → EventFrame extraction logic
   - EventFrame → Signal detection logic
   - Signal → Scenario score calculation
   - State update triggers

2. Create `/Users/xunit/Desktop/ww3/lib/orchestrator/extractors/eventFrameExtractor.ts`
   - Parse FeedItem text for event details
   - Resolve locations using `/Users/xunit/Desktop/ww3/lib/geo/resolveLocation.ts`
   - Classify event types (kinetic, non-kinetic, incident)
   - Extract actors, casualties, weapon systems

3. Create `/Users/xunit/Desktop/ww3/lib/orchestrator/matchers/signalMatcher.ts`
   - Match EventFrames to Signal definitions
   - Calculate confidence scores
   - Create SignalActivations with expiry times
   - Apply decay functions

4. Create `/Users/xunit/Desktop/ww3/lib/orchestrator/scorers/scenarioScorer.ts`
   - Aggregate active signals for each scenario
   - Calculate weighted scores with decay
   - Determine trend (increasing, stable, decreasing)
   - Update scenario_scores table

**Integration Points**:
- Hook into existing `/api/ingest` route (after FeedItem insert)
- Create `/api/orchestrator/process` route (manual trigger for testing)
- Add background job support (cron or webhook)

### Phase 3: State Engine Implementation
**Duration**: 3-4 hours
**Owner**: state-engine-architect
**Dependencies**: Phase 2 (orchestrator must populate event_frames)

**Tasks**:
1. Create `/Users/xunit/Desktop/ww3/lib/state/worldStateEngine.ts`
   - Calculate global tension score from active scenarios
   - Aggregate event counts by type/severity
   - Update world_state_live singleton (transactional)
   - Create world_state_daily snapshots at midnight

2. Create `/Users/xunit/Desktop/ww3/lib/state/relationEngine.ts`
   - Extract country relationships from EventFrames
   - Update relation_edges based on event actors
   - Calculate relation strength from event frequency/severity
   - Track alliance/adversary dynamics

3. Create `/Users/xunit/Desktop/ww3/lib/state/countryPowerTracker.ts` (optional)
   - Aggregate military events by country
   - Calculate country power scores
   - Track mobilization levels

**APIs**:
- `GET /api/state/current` - Returns world_state_live
- `GET /api/state/history?days=7` - Returns world_state_daily snapshots
- `GET /api/state/relations?country=USA` - Returns relation_edges for country

### Phase 4: Map Gameplay Engine Enhancements
**Duration**: 2-3 hours
**Owner**: map-gameplay-engineer
**Dependencies**: Phase 2 (event_frames must exist)

**Tasks**:
1. Update `/Users/xunit/Desktop/ww3/lib/map/eventMapper.ts`
   - Query event_frames table instead of mocking data
   - Apply filters (time range, severity, event type)
   - Convert EventFrame → MapAction with proper typing

2. Update `/Users/xunit/Desktop/ww3/app/api/map-actions/route.ts`
   - Replace FeedItem → EventFrame → MapAction pipeline with direct event_frames query
   - Add support for replaying historical events
   - Add filtering by scenario (show only events related to specific scenario)

3. Create `/Users/xunit/Desktop/ww3/app/api/map-stream/route.ts` enhancements
   - Stream real-time event_frames via SSE
   - Include signal activations and scenario updates
   - Add heartbeat mechanism

**Performance Targets**:
- Query response: <50ms for 24h of events
- Stream latency: <500ms from EventFrame creation to map update

### Phase 5: UI Integration (Command Center Upgrades)
**Duration**: 2-3 hours
**Owner**: Any available engineer
**Dependencies**: Phase 2, 3, 4 (APIs must exist)

**Tasks**:
1. Update `/Users/xunit/Desktop/ww3/app/command-center/page.tsx`
   - Add scenario probability gauges (from /api/scenarios)
   - Add global tension meter (from /api/state/current)
   - Add active signals panel

2. Create `/Users/xunit/Desktop/ww3/components/command-center/ScenarioDashboard.tsx`
   - Display all scenarios with real-time probabilities
   - Show active signals per scenario
   - Clickable scenario cards → drill down to events

3. Create `/Users/xunit/Desktop/ww3/components/command-center/TensionMeter.tsx`
   - Global tension score visualization
   - DEFCON-style alert level display
   - Trend indicator (rising/falling)

4. Update TacticalMap to highlight events by scenario
   - Add scenario filter dropdown
   - Color-code events by related scenarios
   - Show scenario probability overlay

---

## Migration Files Structure

```
lib/db/migrations/
├── 001_initial.sql                    # EXISTING - applied ✅
├── 002_scenario_analysis.sql          # EXISTING - partial (Supabase only)
├── 003_event_processing_sqlite.sql    # NEW - Phase 1
├── 003_event_processing_supabase.sql  # NEW - Phase 1
├── 004_state_management_sqlite.sql    # NEW - Phase 1
├── 004_state_management_supabase.sql  # NEW - Phase 1
└── README.md                          # Update with new migrations
```

---

## Migration 003: Event Processing System

### Tables to Create

#### 1. `event_frames` (SQLite Version)
```sql
CREATE TABLE IF NOT EXISTS event_frames (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_item_id INTEGER NOT NULL,

  -- Event Classification
  event_type TEXT NOT NULL CHECK(event_type IN (
    'missile_strike', 'drone_strike', 'airstrike', 'artillery_shelling',
    'naval_strike', 'ground_assault', 'rocket_attack', 'air_defense',
    'protest', 'sanction', 'cyberattack', 'diplomatic_action',
    'intelligence_ops', 'information_warfare', 'explosion',
    'accident', 'sabotage', 'unknown'
  )),

  -- Event Details
  actors TEXT,              -- JSON string: {"attacker": "...", "target": "...", ...}
  location TEXT,            -- JSON string: {"lat": 0, "lng": 0, "precision": "...", ...}
  severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low', 'minimal')),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),

  -- Source Assessment
  source_reliability INTEGER NOT NULL CHECK(source_reliability BETWEEN 1 AND 5),
  evidence TEXT NOT NULL,   -- Extracted text snippet

  -- Temporal Data
  occurred_at INTEGER NOT NULL,
  reported_at INTEGER NOT NULL,

  -- Additional Details
  casualties TEXT,          -- JSON string: {"killed": 0, "wounded": 0, ...}
  weapon_system TEXT,
  target_type TEXT,
  tags TEXT,                -- JSON array string

  -- Verification
  verified INTEGER NOT NULL DEFAULT 0,
  cluster_id INTEGER,

  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER,

  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_frames_feed_item ON event_frames(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_event_frames_type ON event_frames(event_type);
CREATE INDEX IF NOT EXISTS idx_event_frames_severity ON event_frames(severity, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_frames_occurred ON event_frames(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_frames_created ON event_frames(created_at DESC);
```

**Supabase Version Differences**:
- `INTEGER` → `BIGSERIAL`/`BIGINT`
- `TEXT` (for JSON) → `JSONB`
- `INTEGER` (boolean) → `BOOLEAN`
- Add GIN indexes on JSONB columns

#### 2. `signals` (Reuse from Migration 002)
**Status**: Already defined in Migration 002 (lines 56-90)
**Action**: Copy directly into Migration 003 with SQLite adjustments
**Changes**:
- `BIGSERIAL` → `INTEGER PRIMARY KEY AUTOINCREMENT`
- `BOOLEAN` → `INTEGER`
- `extract(epoch from now())::bigint` → `unixepoch()`

**Seed Data**: Copy 19 signal definitions from Migration 002

#### 3. `signal_activations` (Reuse from Migration 002)
**Status**: Already defined in Migration 002 (lines 245-272)
**Action**: Copy with SQLite adjustments
**Changes**: Same as signals table

#### 4. `scenario_definitions` (Reuse from Migration 002)
**Status**: Already defined in Migration 002 (lines 95-123)
**Action**: Copy with SQLite adjustments
**Key Changes**:
- `trigger_signals JSONB` → `trigger_signals TEXT` (JSON string)
- `impact_areas JSONB` → `impact_areas TEXT` (JSON string)
- `actors_involved JSONB` → `actors_involved TEXT` (JSON string)

**Seed Data**: Copy 3 scenario definitions from Migration 002

#### 5. `scenario_scores` Migration (ALTER TABLE)
**Status**: Table exists but missing columns from Migration 002
**Action**: ADD missing columns (backward-compatible)

```sql
-- Add missing columns to existing scenario_scores table
ALTER TABLE scenario_scores ADD COLUMN active_signals TEXT DEFAULT '[]';
ALTER TABLE scenario_scores ADD COLUMN calculation_method TEXT DEFAULT 'weighted_sum';
ALTER TABLE scenario_scores ADD COLUMN data_quality REAL DEFAULT 0.5;

-- Add foreign key to scenario_definitions (if supported)
-- Note: SQLite doesn't support ALTER TABLE ADD FOREIGN KEY
-- Solution: Create new table, copy data, rename
-- OR: Leave scenario_id as TEXT (works with new scenario_definitions.code)

-- Add index
CREATE INDEX IF NOT EXISTS idx_scenario_scores_calculated ON scenario_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_scores_probability ON scenario_scores(probability DESC, calculated_at DESC);
```

**Alternative**: Leave scenario_scores as-is, create scenario_scores_v2 table with full schema, migrate data in application layer.

#### 6-7. `impact_matrix` and `scenario_changelog` (Optional)
**Priority**: LOW - Not required for MVP
**Action**: Copy from Migration 002 if time permits
**Decision**: Defer to Phase 6 (post-MVP enhancements)

---

## Migration 004: State Management System

### Tables to Create

#### 1. `world_state_live` (Singleton Pattern)
```sql
CREATE TABLE IF NOT EXISTS world_state_live (
  id INTEGER PRIMARY KEY CHECK(id = 1),  -- Enforce single row

  -- Global Metrics
  last_updated_at INTEGER NOT NULL,
  global_tension_score REAL NOT NULL CHECK(global_tension_score BETWEEN 0 AND 1),
  alert_level TEXT NOT NULL CHECK(alert_level IN ('low', 'medium', 'high', 'critical')),

  -- Active State
  active_event_count INTEGER NOT NULL DEFAULT 0,
  active_scenario_count INTEGER NOT NULL DEFAULT 0,

  -- Recent Events (last 24h IDs)
  active_event_frames TEXT NOT NULL DEFAULT '[]',  -- JSON array of event_frame IDs

  -- Scenario Scores
  scenario_scores TEXT NOT NULL DEFAULT '{}',  -- JSON object: {"SCENARIO_NATO_RUSSIA": 0.45, ...}

  -- Country Status
  country_statuses TEXT NOT NULL DEFAULT '{}',  -- JSON object: {"USA": "heightened", ...}

  -- Metadata
  calculation_method TEXT DEFAULT 'weighted_aggregate',
  data_quality REAL DEFAULT 0.8,
  version INTEGER NOT NULL DEFAULT 1
);

-- Insert initial row
INSERT OR IGNORE INTO world_state_live (id, last_updated_at, global_tension_score, alert_level)
VALUES (1, unixepoch(), 0.0, 'low');

CREATE INDEX IF NOT EXISTS idx_world_state_live_updated ON world_state_live(last_updated_at DESC);
```

**Usage Pattern**:
```sql
-- Always UPDATE, never INSERT
UPDATE world_state_live
SET global_tension_score = ?,
    last_updated_at = unixepoch(),
    version = version + 1
WHERE id = 1;

-- Read current state
SELECT * FROM world_state_live WHERE id = 1;
```

#### 2. `world_state_daily` (Historical Snapshots)
```sql
CREATE TABLE IF NOT EXISTS world_state_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Date (YYYYMMDD as INTEGER for efficient queries)
  date INTEGER NOT NULL UNIQUE,  -- e.g., 20260228

  -- Global Metrics
  global_tension_score REAL NOT NULL,
  alert_level TEXT NOT NULL,

  -- Event Counts
  total_events INTEGER NOT NULL DEFAULT 0,
  event_counts_by_type TEXT NOT NULL DEFAULT '{}',  -- JSON: {"missile_strike": 5, ...}
  event_counts_by_severity TEXT NOT NULL DEFAULT '{}',  -- JSON: {"critical": 2, ...}

  -- Scenario Metrics
  active_scenarios TEXT NOT NULL DEFAULT '[]',  -- JSON array of scenario codes
  scenario_scores TEXT NOT NULL DEFAULT '{}',  -- JSON object: scenario scores at end of day

  -- Country Metrics
  country_power_snapshot TEXT NOT NULL DEFAULT '{}',  -- JSON: {"USA": 0.95, "Russia": 0.85, ...}
  active_conflicts TEXT NOT NULL DEFAULT '[]',  -- JSON array: [{"countries": ["A", "B"], "intensity": 0.7}]

  -- Metadata
  calculated_at INTEGER NOT NULL,
  snapshot_source TEXT DEFAULT 'daily_aggregation',
  data_quality REAL DEFAULT 0.9
);

CREATE INDEX IF NOT EXISTS idx_world_state_daily_date ON world_state_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_world_state_daily_tension ON world_state_daily(global_tension_score DESC);
```

**Aggregation Job**: Run at midnight UTC
```sql
INSERT INTO world_state_daily (date, global_tension_score, alert_level, total_events, calculated_at)
SELECT
  strftime('%Y%m%d', 'now') as date,
  (SELECT global_tension_score FROM world_state_live WHERE id = 1) as global_tension_score,
  (SELECT alert_level FROM world_state_live WHERE id = 1) as alert_level,
  (SELECT COUNT(*) FROM event_frames WHERE occurred_at >= unixepoch('now', '-1 day')) as total_events,
  unixepoch() as calculated_at;
```

#### 3. `relation_edges` (Country Relations Graph)
```sql
CREATE TABLE IF NOT EXISTS relation_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Entities (countries or organizations)
  entity_a TEXT NOT NULL,  -- ISO country code or org name
  entity_b TEXT NOT NULL,  -- ISO country code or org name

  -- Relation Type
  relation_type TEXT NOT NULL CHECK(relation_type IN (
    'allied', 'hostile', 'neutral', 'trade_partner',
    'adversary', 'treaty_member', 'sanctioned'
  )),

  -- Relation Strength (0.0 = weak, 1.0 = strong)
  relation_strength REAL NOT NULL DEFAULT 0.5 CHECK(relation_strength BETWEEN 0 AND 1),

  -- Directionality
  is_mutual INTEGER NOT NULL DEFAULT 1,  -- 1 = both ways, 0 = A→B only

  -- Evidence
  evidence_event_frame_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array of event_frame IDs
  evidence_count INTEGER NOT NULL DEFAULT 0,

  -- Temporal Data
  first_observed_at INTEGER NOT NULL,
  last_updated_at INTEGER NOT NULL,
  last_event_at INTEGER,

  -- Metadata
  confidence REAL NOT NULL DEFAULT 0.5 CHECK(confidence BETWEEN 0 AND 1),
  source TEXT DEFAULT 'event_analysis',

  -- Prevent duplicate relations (A-B is same as B-A for mutual relations)
  UNIQUE(entity_a, entity_b, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_relation_edges_entity_a ON relation_edges(entity_a);
CREATE INDEX IF NOT EXISTS idx_relation_edges_entity_b ON relation_edges(entity_b);
CREATE INDEX IF NOT EXISTS idx_relation_edges_type ON relation_edges(relation_type);
CREATE INDEX IF NOT EXISTS idx_relation_edges_strength ON relation_edges(relation_strength DESC);
CREATE INDEX IF NOT EXISTS idx_relation_edges_updated ON relation_edges(last_updated_at DESC);
```

**Usage**: Extract countries from EventFrame actors, create/update relations
```sql
-- Example: EventFrame shows "Russia" attacking "Ukraine"
INSERT OR REPLACE INTO relation_edges
  (entity_a, entity_b, relation_type, relation_strength, first_observed_at, last_updated_at)
VALUES
  ('Russia', 'Ukraine', 'hostile', 0.9, unixepoch(), unixepoch());
```

---

## Schema Comparison Matrix

### Existing vs New Tables

| Table | Status | SQLite | Supabase | Migration | Priority |
|-------|--------|--------|----------|-----------|----------|
| sources | ✅ Exists | ✅ | ✅ | 001 | - |
| feed_items | ✅ Exists | ✅ | ✅ | 001 | - |
| clusters | ✅ Exists | ✅ | ✅ | 001 | - |
| translation_cache | ✅ Exists | ✅ | ✅ | 001 | - |
| ingestion_logs | ✅ Exists | ✅ | ✅ | 001 | - |
| scenario_scores | ⚠️ Partial | ⚠️ | ⚠️ | 002 | - |
| event_frames | ❌ Missing | ❌ | ❌ | 003 | HIGH |
| signals | ❌ Missing | ❌ | ❌ | 003 | HIGH |
| signal_activations | ❌ Missing | ❌ | ❌ | 003 | HIGH |
| scenario_definitions | ❌ Missing | ❌ | ❌ | 003 | HIGH |
| world_state_live | ❌ Missing | ❌ | ❌ | 004 | MEDIUM |
| world_state_daily | ❌ Missing | ❌ | ❌ | 004 | MEDIUM |
| relation_edges | ❌ Missing | ❌ | ❌ | 004 | MEDIUM |
| impact_matrix | ❌ Missing | ❌ | ❌ | 003 | LOW |
| scenario_changelog | ❌ Missing | ❌ | ❌ | 003 | LOW |

---

## Data Flow After Migration

```
1. RSS Feed → Ingest API
   ↓
2. FeedItem created (feed_items table)
   ↓
3. Orchestrator Pipeline triggered
   ↓
4. EventFrame extracted (event_frames table)
   ↓
5. Signal Matcher runs
   ↓
6. SignalActivations created (signal_activations table)
   ↓
7. Scenario Scorer calculates
   ↓
8. ScenarioScore updated (scenario_scores table)
   ↓
9. State Engine aggregates
   ↓
10. WorldStateLive updated (world_state_live table)
    ↓
11. Map API queries event_frames
    ↓
12. TacticalMap renders events
```

---

## Rollback Strategy

### If Migration Fails
1. **SQLite**: Restore from backup `cp data/monitor.db.backup data/monitor.db`
2. **Supabase**: Rollback via SQL Editor (DROP TABLE IF EXISTS new_tables)

### If New Features Break
1. **Feature Flags**: Disable in environment variables
2. **API Endpoints**: Return 501 Not Implemented if tables don't exist
3. **UI Components**: Show "Feature coming soon" message

### Graceful Degradation Pattern
```typescript
// Example: API route that checks if table exists
import { getDB } from '@/lib/db/adapter';

export async function GET(request: Request) {
  const db = getDB();

  try {
    // Check if event_frames table exists
    await db.query('SELECT 1 FROM event_frames LIMIT 1', []);

    // Table exists, proceed with new logic
    const events = await db.all('event_frames', 'occurred_at >= ?', [timeThreshold]);
    return NextResponse.json({ events });

  } catch (error) {
    // Table doesn't exist, return graceful fallback
    return NextResponse.json({
      events: [],
      message: 'Event processing system not yet initialized',
      feature_status: 'coming_soon'
    });
  }
}
```

---

## Testing Strategy

### Pre-Migration Tests
1. **Backup Verification**: Ensure backup exists and is restorable
2. **Current Functionality**: Run smoke tests on existing features
3. **Database Connection**: Verify both SQLite and Supabase connections work

### Post-Migration Tests
1. **Table Creation**: Verify all tables exist with correct schemas
2. **Index Creation**: Verify all indexes exist
3. **Data Integrity**: Ensure existing data is unchanged
4. **Foreign Keys**: Test cascade deletes and constraint enforcement
5. **Idempotency**: Run migrations again, ensure no errors

### Integration Tests
1. **FeedItem → EventFrame**: Test extraction pipeline
2. **EventFrame → Signal**: Test signal matching
3. **Signal → Scenario**: Test scenario scoring
4. **State Updates**: Test world_state_live updates
5. **API Endpoints**: Test all new /api routes
6. **Map Visualization**: Test TacticalMap with real event_frames

### Performance Tests
1. **Query Performance**: All queries <50ms with 1000 events
2. **Bulk Inserts**: 100 event_frames in <500ms
3. **Concurrent Writes**: No deadlocks under concurrent load
4. **Index Usage**: EXPLAIN QUERY PLAN shows index usage

---

## Risk Mitigation

### Risk 1: Schema Incompatibility (SQLite vs Supabase)
**Mitigation**: Maintain separate migration files, test both environments
**Contingency**: Use adapter layer to abstract differences

### Risk 2: Data Loss During Migration
**Mitigation**: Use CREATE TABLE IF NOT EXISTS, never DROP or TRUNCATE
**Contingency**: Database backups before each migration

### Risk 3: Performance Degradation
**Mitigation**: Add all necessary indexes, monitor query times
**Contingency**: Add EXPLAIN QUERY PLAN analysis, optimize slow queries

### Risk 4: Breaking Changes to Existing Code
**Mitigation**: New tables only, no ALTER TABLE on existing tables
**Contingency**: Feature flags to disable new code paths

### Risk 5: Migration Takes Too Long in Production
**Mitigation**: Run migrations during low-traffic window
**Contingency**: Abort and rollback if migration exceeds 5 minutes

---

## Success Criteria

### Phase 1 Success (Migrations Created)
- [ ] All 4 migration files created (003/004 for SQLite/Supabase)
- [ ] Migrations run successfully on test database
- [ ] No errors when running migrations twice (idempotent)
- [ ] All indexes created successfully
- [ ] Seed data inserted correctly

### Phase 2 Success (Orchestrator Running)
- [ ] FeedItem automatically generates EventFrame
- [ ] EventFrame triggers SignalActivation
- [ ] Scenario scores update every hour
- [ ] No errors in orchestrator logs
- [ ] Pipeline latency <5 seconds end-to-end

### Phase 3 Success (State Engine Active)
- [ ] world_state_live updates in real-time
- [ ] world_state_daily snapshots created daily
- [ ] relation_edges populated from events
- [ ] Global tension score calculated correctly
- [ ] State APIs return valid data

### Phase 4 Success (Map Integration)
- [ ] TacticalMap shows real event_frames
- [ ] Map actions clickable to source FeedItem
- [ ] Replay mode works with historical events
- [ ] Performance <50ms for 24h query
- [ ] SSE stream delivers events in real-time

### Phase 5 Success (UI Complete)
- [ ] Command Center shows scenario probabilities
- [ ] Global tension meter visible
- [ ] Active signals panel populated
- [ ] All UI components load without errors
- [ ] No hydration errors in production

---

## Timeline Estimate

| Phase | Duration | Dependencies | Owner |
|-------|----------|--------------|-------|
| Phase 0 | COMPLETE | None | db-discovery-specialist |
| Phase 1 | 2-3 hours | Phase 0 | migration-engineer |
| Phase 2 | 3-4 hours | Phase 1 | orchestrator-engineer |
| Phase 3 | 3-4 hours | Phase 2 | state-engine-architect |
| Phase 4 | 2-3 hours | Phase 2 | map-gameplay-engineer |
| Phase 5 | 2-3 hours | Phase 2,3,4 | Any engineer |
| **TOTAL** | **12-17 hours** | Linear chain | 4-5 engineers |

**Critical Path**: Phase 0 → 1 → 2 → [3, 4, 5 parallel]

**Parallel Work**: After Phase 2, Phases 3, 4, and 5 can run in parallel with different engineers.

---

## Next Actions

### Immediate (Now)
1. ✅ Complete Phase 0 (DB Discovery) - DONE
2. ✅ Create migration-plan.md - DONE
3. ⏭️ Unblock migration-engineer to start Phase 1

### Short Term (Next 2-3 hours)
1. Create Migration 003 and 004 SQL files
2. Test migrations on local SQLite database
3. Prepare Supabase migrations for production

### Medium Term (Next 4-8 hours)
1. Implement Orchestrator Pipeline
2. Implement State Engine
3. Update Map APIs

### Long Term (Next 8-12 hours)
1. Complete UI integration
2. Run full integration tests
3. Deploy to production

---

## Document Metadata
- **Generated**: 2026-02-28
- **Total Migration Complexity**: MEDIUM (additive changes only)
- **Estimated Risk Level**: LOW (backward-compatible approach)
- **Confidence Level**: HIGH (comprehensive planning + discovery)
