# Database Migrations Runbook
**Project**: WW3 Monitor - Event Processing System
**Version**: 1.0
**Last Updated**: 2026-02-28
**Author**: Migration Engineer

---

## Overview

This runbook provides step-by-step instructions for applying database migrations to both SQLite (development) and Supabase (production) environments.

### Migration Files

| Migration | SQLite File | Supabase File | Purpose |
|-----------|-------------|---------------|---------|
| 001 | `001_initial.sql` | ✅ Applied | Base schema (sources, feed_items, clusters) |
| 002 | N/A | `002_scenario_analysis.sql` | Scenario analysis (Supabase only) |
| 003 | `003_event_processing_sqlite.sql` | `003_event_processing_supabase.sql` | Event frames, signals, activations |
| 004 | `004_state_management_sqlite.sql` | `004_state_management_supabase.sql` | World state, relations |

---

## Pre-Migration Checklist

### Before ANY migration:
- [ ] **Backup current database** (critical for production)
- [ ] **Verify current schema** matches expected state
- [ ] **Review migration SQL** for understanding
- [ ] **Test on development environment first**
- [ ] **Notify team** of migration schedule (production only)
- [ ] **Schedule during low-traffic window** (production only)

### Development (SQLite) Checklist:
```bash
# 1. Backup database
cp data/monitor.db data/monitor.db.backup-$(date +%Y%m%d-%H%M%S)

# 2. Verify backup
ls -lh data/monitor.db*

# 3. Check current tables
sqlite3 data/monitor.db ".tables"
```

### Production (Supabase) Checklist:
- [ ] Access Supabase SQL Editor: https://supabase.com/dashboard
- [ ] Verify current table list via Dashboard → Table Editor
- [ ] Coordinate with team (no simultaneous deployments)
- [ ] Have rollback plan ready

---

## Migration 003: Event Processing System

### Tables Created:
- `event_frames` - Structured events extracted from feed items
- `signals` - Signal definitions (19 signals seeded)
- `signal_activations` - Active signal instances
- `scenario_definitions` - Scenario templates (3 scenarios seeded)

### SQLite Migration (Development)

**File**: `lib/db/migrations/003_event_processing_sqlite.sql`

**Method 1: Using sqlite3 CLI**
```bash
cd /Users/xunit/Desktop/ww3

# Apply migration
sqlite3 data/monitor.db < lib/db/migrations/003_event_processing_sqlite.sql

# Verify tables created
sqlite3 data/monitor.db "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('event_frames', 'signals', 'signal_activations', 'scenario_definitions');"

# Verify seed data
sqlite3 data/monitor.db "SELECT COUNT(*) FROM signals;"  # Should be 19
sqlite3 data/monitor.db "SELECT COUNT(*) FROM scenario_definitions;"  # Should be 3
```

**Method 2: Using Node.js/TypeScript**
```typescript
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = new Database('./data/monitor.db');
db.pragma('foreign_keys = ON');

const migration = readFileSync(
  join(process.cwd(), 'lib/db/migrations/003_event_processing_sqlite.sql'),
  'utf-8'
);

db.exec(migration);
console.log('✅ Migration 003 complete');
db.close();
```

**Method 3: Run test script**
```bash
npx ts-node lib/db/migrations/test-migrations.ts
```

### Supabase Migration (Production)

**File**: `lib/db/migrations/003_event_processing_supabase.sql`

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `003_event_processing_supabase.sql`
4. Paste into SQL Editor
5. Click "Run" (bottom right)
6. Verify output shows "Success. No rows returned"

**Verification Queries** (run in SQL Editor):
```sql
-- Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('event_frames', 'signals', 'signal_activations', 'scenario_definitions');

-- Check seed data
SELECT COUNT(*) FROM signals;  -- Should be 19
SELECT COUNT(*) FROM scenario_definitions;  -- Should be 3

-- Check functions created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calculate_signal_decay', 'get_active_scenario_signals', 'update_scenario_score');
```

**Expected Duration**: 2-5 seconds

---

## Migration 004: State Management System

### Tables Created:
- `world_state_live` - Current global state (singleton pattern, id=1)
- `world_state_daily` - Historical daily snapshots
- `relation_edges` - Country relationship graph

### SQLite Migration (Development)

**File**: `lib/db/migrations/004_state_management_sqlite.sql`

**Method 1: Using sqlite3 CLI**
```bash
cd /Users/xunit/Desktop/ww3

# Apply migration
sqlite3 data/monitor.db < lib/db/migrations/004_state_management_sqlite.sql

# Verify tables created
sqlite3 data/monitor.db "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('world_state_live', 'world_state_daily', 'relation_edges');"

# Verify singleton initialized
sqlite3 data/monitor.db "SELECT * FROM world_state_live WHERE id = 1;"
```

**Method 2: Using Node.js/TypeScript**
```typescript
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = new Database('./data/monitor.db');
db.pragma('foreign_keys = ON');

const migration = readFileSync(
  join(process.cwd(), 'lib/db/migrations/004_state_management_sqlite.sql'),
  'utf-8'
);

db.exec(migration);
console.log('✅ Migration 004 complete');
db.close();
```

### Supabase Migration (Production)

**File**: `lib/db/migrations/004_state_management_supabase.sql`

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `004_state_management_supabase.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify success

**Verification Queries** (run in SQL Editor):
```sql
-- Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('world_state_live', 'world_state_daily', 'relation_edges');

-- Check singleton initialized
SELECT * FROM world_state_live WHERE id = 1;

-- Check functions created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_world_state_live', 'create_daily_snapshot', 'update_country_relations_from_event');
```

**Expected Duration**: 2-5 seconds

---

## Complete Migration Sequence

### Development (SQLite) - Full Setup

```bash
cd /Users/xunit/Desktop/ww3

# 1. Backup
cp data/monitor.db data/monitor.db.backup-$(date +%Y%m%d-%H%M%S)

# 2. Apply Migration 003
sqlite3 data/monitor.db < lib/db/migrations/003_event_processing_sqlite.sql

# 3. Apply Migration 004
sqlite3 data/monitor.db < lib/db/migrations/004_state_management_sqlite.sql

# 4. Verify all tables
sqlite3 data/monitor.db ".tables"

# 5. Verify seed data
sqlite3 data/monitor.db "SELECT code, name FROM signals LIMIT 5;"
sqlite3 data/monitor.db "SELECT code, name FROM scenario_definitions;"
sqlite3 data/monitor.db "SELECT * FROM world_state_live WHERE id = 1;"
```

### Production (Supabase) - Full Setup

**Step 1: Apply Migration 003**
1. Open Supabase SQL Editor
2. Paste `003_event_processing_supabase.sql`
3. Run
4. Verify success

**Step 2: Apply Migration 004**
1. Stay in SQL Editor
2. Paste `004_state_management_supabase.sql`
3. Run
4. Verify success

**Step 3: Verify Complete Schema**
```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- - clusters
-- - event_frames ✨ NEW
-- - feed_items
-- - ingestion_logs
-- - relation_edges ✨ NEW
-- - scenario_definitions ✨ NEW
-- - signal_activations ✨ NEW
-- - signals ✨ NEW
-- - sources
-- - translation_cache
-- - world_state_daily ✨ NEW
-- - world_state_live ✨ NEW
```

---

## Rollback Procedures

### SQLite Rollback

**If migration fails or causes issues:**
```bash
cd /Users/xunit/Desktop/ww3

# 1. Stop application

# 2. Restore from backup
cp data/monitor.db.backup-YYYYMMDD-HHMMSS data/monitor.db

# 3. Verify restored
sqlite3 data/monitor.db ".tables"

# 4. Restart application
```

### Supabase Rollback

**If Migration 003 needs rollback:**
```sql
-- Drop tables in reverse order (respects foreign keys)
DROP TABLE IF EXISTS signal_activations;
DROP TABLE IF EXISTS scenario_definitions;
DROP TABLE IF EXISTS signals;
DROP TABLE IF EXISTS event_frames;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_signal_decay;
DROP FUNCTION IF EXISTS get_active_scenario_signals;
DROP FUNCTION IF EXISTS update_scenario_score;
```

**If Migration 004 needs rollback:**
```sql
-- Drop tables
DROP TABLE IF EXISTS relation_edges;
DROP TABLE IF EXISTS world_state_daily;
DROP TABLE IF EXISTS world_state_live;

-- Drop functions
DROP FUNCTION IF EXISTS update_world_state_live;
DROP FUNCTION IF EXISTS create_daily_snapshot;
DROP FUNCTION IF EXISTS update_country_relations_from_event;
```

---

## Post-Migration Verification

### Functional Tests

**Test 1: Verify signal definitions**
```sql
-- SQLite
SELECT code, name, category, weight FROM signals ORDER BY weight DESC LIMIT 5;

-- Expected: SIG_ALLIANCE_INVOKED (0.95), SIG_TROOPS_MOBILIZED (0.9), etc.
```

**Test 2: Verify scenario definitions**
```sql
-- SQLite
SELECT code, name, base_threshold FROM scenario_definitions;

-- Expected:
-- SCENARIO_NATO_RUSSIA (0.3)
-- SCENARIO_TAIWAN (0.35)
-- SCENARIO_MIDEAST (0.25)
```

**Test 3: Verify world_state_live singleton**
```sql
-- SQLite/Supabase
SELECT id, global_tension_score, alert_level FROM world_state_live WHERE id = 1;

-- Expected: id=1, tension=0.0, alert='low'
```

**Test 4: Test foreign key constraints**
```sql
-- Should FAIL (feed_item_id doesn't exist)
INSERT INTO event_frames (feed_item_id, event_type, severity, confidence, source_reliability, evidence, occurred_at, reported_at)
VALUES (999999, 'unknown', 5, 0.8, 3, 'test', 0, 0);

-- Expected: FOREIGN KEY constraint failed
```

### Performance Tests

**Query performance check:**
```sql
-- Should return in < 50ms
EXPLAIN QUERY PLAN
SELECT * FROM event_frames
WHERE occurred_at >= 1709164800  -- Recent timestamp
  AND severity >= 7
ORDER BY occurred_at DESC
LIMIT 50;

-- Verify uses indexes: idx_event_frames_severity and idx_event_frames_occurred
```

---

## Common Issues & Solutions

### Issue 1: Foreign Key Constraint Errors
**Symptom**: `FOREIGN KEY constraint failed`
**Cause**: Trying to insert event_frame with non-existent feed_item_id
**Solution**: Ensure feed_items exist first, or use proper feed_item_id

### Issue 2: Duplicate Signal Codes
**Symptom**: `UNIQUE constraint failed: signals.code`
**Cause**: Running seed data multiple times without INSERT OR IGNORE
**Solution**: Migrations use `INSERT OR IGNORE` (SQLite) or `ON CONFLICT DO NOTHING` (Supabase) - safe to re-run

### Issue 3: world_state_live Not Initialized
**Symptom**: No row in world_state_live table
**Cause**: Singleton initialization failed
**Solution**: Manually insert:
```sql
INSERT OR IGNORE INTO world_state_live (id, last_updated_at, global_tension_score, alert_level)
VALUES (1, unixepoch(), 0.0, 'low');
```

### Issue 4: Migration Already Applied
**Symptom**: "table already exists"
**Cause**: Migration was already run
**Solution**: This is OK - migrations use `CREATE TABLE IF NOT EXISTS` (idempotent)

---

## Integration with Application Code

### Using event_frames in API Routes

```typescript
import { DatabaseAdapter } from '@/lib/db/adapter';

export async function GET(request: Request) {
  const db = new DatabaseAdapter();

  // Query event_frames
  const events = await db.all(
    'event_frames',
    'occurred_at >= ? AND severity >= ?',
    [Date.now() / 1000 - 86400, 7]  // Last 24h, severity >= 7
  );

  return NextResponse.json({ events });
}
```

### Using world_state_live (Singleton Pattern)

```typescript
import { DatabaseAdapter } from '@/lib/db/adapter';

export async function GET(request: Request) {
  const db = new DatabaseAdapter();

  // Always query WHERE id = 1 (singleton)
  const state = await db.get('world_state_live', 1);

  return NextResponse.json({
    tension: state.global_tension_score,
    alert_level: state.alert_level,
    active_events: state.active_event_count,
  });
}
```

---

## Scheduled Jobs (Future Implementation)

### Daily Snapshot Creation (Run at 00:00 UTC)

**SQLite**:
```typescript
// Cron job to run daily
import { getDatabase } from '@/lib/db/client';

function createDailySnapshot() {
  const db = getDatabase();

  const date = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const state = db.prepare('SELECT * FROM world_state_live WHERE id = 1').get();

  db.prepare(`
    INSERT OR IGNORE INTO world_state_daily
    (date, global_tension_score, alert_level, total_events, calculated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(date, state.global_tension_score, state.alert_level, state.active_event_count, Math.floor(Date.now() / 1000));
}
```

**Supabase**:
```sql
-- Run via pg_cron or Supabase Edge Function
SELECT create_daily_snapshot();
```

---

## Success Criteria

### Migration 003 Success:
- ✅ All 4 tables created (event_frames, signals, signal_activations, scenario_definitions)
- ✅ 19 signals inserted
- ✅ 3 scenarios inserted
- ✅ All indexes created
- ✅ Foreign keys enforced
- ✅ Idempotent (can run twice without errors)

### Migration 004 Success:
- ✅ All 3 tables created (world_state_live, world_state_daily, relation_edges)
- ✅ world_state_live singleton initialized (id=1)
- ✅ All indexes created
- ✅ Singleton constraint enforced (only id=1 allowed)
- ✅ Idempotent (can run twice without errors)

---

## Maintenance

### Regular Tasks:
- **Daily**: Verify daily snapshots created successfully
- **Weekly**: Check database size growth (VACUUM if needed for SQLite)
- **Monthly**: Review and archive old world_state_daily records (>90 days)
- **Quarterly**: Review signal definitions for updates

### Monitoring Queries:

**Database size (SQLite)**:
```bash
ls -lh data/monitor.db
```

**Table row counts**:
```sql
SELECT
  'event_frames' as table_name, COUNT(*) as row_count FROM event_frames
UNION ALL
SELECT 'signals', COUNT(*) FROM signals
UNION ALL
SELECT 'signal_activations', COUNT(*) FROM signal_activations
UNION ALL
SELECT 'scenario_definitions', COUNT(*) FROM scenario_definitions
UNION ALL
SELECT 'world_state_daily', COUNT(*) FROM world_state_daily
UNION ALL
SELECT 'relation_edges', COUNT(*) FROM relation_edges;
```

---

## Contact & Support

**Migration Engineer**: Available via team messaging
**Documentation**: `/docs/db-discovery.md`, `/docs/migration-plan.md`, `/docs/schema-comparison.md`
**Source Code**: `/lib/db/migrations/`
**Test Script**: `/lib/db/migrations/test-migrations.ts`

---

**End of Runbook**
*Last verified: 2026-02-28*
*Test results: ALL PASSED ✅*
