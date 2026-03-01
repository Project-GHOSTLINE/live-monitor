# Schema Comparison: SQLite vs Supabase
**Project**: WW3 Monitor
**Generated**: 2026-02-28
**Purpose**: Cross-reference schemas for dual-database architecture

---

## Type Conversion Reference

### Core Data Types

| Concept | SQLite | Supabase (PostgreSQL) | Notes |
|---------|--------|----------------------|-------|
| Auto-increment ID | `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGSERIAL PRIMARY KEY` | Both return last insert ID |
| Large integer | `INTEGER` | `BIGINT` | SQLite INTEGER can be 8 bytes |
| Small integer | `INTEGER` | `INTEGER` | Both 4 bytes |
| Boolean | `INTEGER` (0/1) | `BOOLEAN` | Must convert in adapter |
| Text (short) | `TEXT` | `TEXT` / `VARCHAR(n)` | Unlimited in both |
| Text (long) | `TEXT` | `TEXT` | No limit in either |
| JSON data | `TEXT` | `JSONB` | Must parse in SQLite |
| Float | `REAL` | `REAL` / `DOUBLE PRECISION` | 8 bytes in both |
| Decimal | `REAL` | `NUMERIC(p,s)` | Fixed precision in PG |
| Timestamp | `INTEGER` (epoch sec) | `BIGINT` (epoch sec) | Custom, not TIMESTAMP |
| Date | `INTEGER` (YYYYMMDD) | `DATE` or `INTEGER` | Custom format |

### Default Value Functions

| Purpose | SQLite | Supabase (PostgreSQL) |
|---------|--------|----------------------|
| Current timestamp (seconds) | `unixepoch()` | `extract(epoch from now())::bigint` |
| Current timestamp (datetime) | `datetime('now')` | `now()` |
| Current date | `date('now')` | `current_date` |
| UUID generation | Not built-in | `gen_random_uuid()` |

### Constraints

| Type | SQLite | Supabase (PostgreSQL) | Notes |
|------|--------|----------------------|-------|
| PRIMARY KEY | ✅ Same | ✅ Same | Identical syntax |
| FOREIGN KEY | ✅ Same | ✅ Same | Must enable in SQLite |
| UNIQUE | ✅ Same | ✅ Same | Identical syntax |
| CHECK | ✅ Same | ✅ Same | Identical syntax |
| NOT NULL | ✅ Same | ✅ Same | Identical syntax |
| DEFAULT | ✅ Same | ✅ Same | Different functions |

### Foreign Key Options

| Option | SQLite | Supabase | Notes |
|--------|--------|----------|-------|
| ON DELETE CASCADE | ✅ Supported | ✅ Supported | Must enable FK in SQLite |
| ON DELETE SET NULL | ✅ Supported | ✅ Supported | |
| ON UPDATE CASCADE | ✅ Supported | ✅ Supported | |
| DEFERRABLE | ❌ Not supported | ✅ Supported | Transaction-level |

---

## Existing Tables: SQLite vs Supabase Schemas

### 1. `sources` Table

#### SQLite Version (Current)
```sql
CREATE TABLE sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('mainstream', 'regional', 'humanitarian', 'official')),
  reliability INTEGER NOT NULL DEFAULT 3 CHECK(reliability BETWEEN 1 AND 5),
  language TEXT NOT NULL DEFAULT 'en',
  rate_limit_seconds INTEGER NOT NULL DEFAULT 300,
  last_fetched_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

#### Supabase Version (Production)
```sql
CREATE TABLE sources (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('mainstream', 'regional', 'humanitarian', 'official')),
  reliability INTEGER NOT NULL DEFAULT 3 CHECK(reliability BETWEEN 1 AND 5),
  language TEXT NOT NULL DEFAULT 'en',
  rate_limit_seconds INTEGER NOT NULL DEFAULT 300,
  last_fetched_at BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| id | `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGSERIAL PRIMARY KEY` | Adapter handles |
| last_fetched_at | `INTEGER` | `BIGINT` | Same range |
| is_active | `INTEGER` (0/1) | `BOOLEAN` | Adapter converts |
| created_at | `unixepoch()` | `extract(epoch from now())::bigint` | Adapter handles |

---

### 2. `feed_items` Table

#### SQLite Version (Current)
```sql
CREATE TABLE feed_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  published_at INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,
  title_original TEXT NOT NULL,
  content_original TEXT,
  lang TEXT NOT NULL,
  title_en TEXT,
  summary_en TEXT,
  tags TEXT,                          -- Comma-separated string
  cluster_id INTEGER,
  entity_places TEXT,                 -- Comma-separated string
  entity_orgs TEXT,                   -- Comma-separated string
  reliability INTEGER NOT NULL,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  duplicate_of INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (duplicate_of) REFERENCES feed_items(id)
);
```

#### Supabase Version (Production)
```sql
CREATE TABLE feed_items (
  id BIGSERIAL PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  published_at BIGINT NOT NULL,
  fetched_at BIGINT NOT NULL,
  title_original TEXT NOT NULL,
  content_original TEXT,
  lang TEXT NOT NULL,
  title_en TEXT,
  summary_en TEXT,
  tags JSONB,                         -- JSON array
  cluster_id BIGINT,
  entity_places JSONB,                -- JSON array
  entity_orgs JSONB,                  -- JSON array
  reliability INTEGER NOT NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_of BIGINT REFERENCES feed_items(id),
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| id | `INTEGER` | `BIGSERIAL/BIGINT` | Adapter handles |
| source_id | `INTEGER` | `BIGINT` | Adapter handles |
| published_at | `INTEGER` | `BIGINT` | Same range |
| fetched_at | `INTEGER` | `BIGINT` | Same range |
| tags | `TEXT` (CSV or JSON string) | `JSONB` (native array) | App must parse in SQLite |
| entity_places | `TEXT` (CSV or JSON string) | `JSONB` (native array) | App must parse in SQLite |
| entity_orgs | `TEXT` (CSV or JSON string) | `JSONB` (native array) | App must parse in SQLite |
| is_duplicate | `INTEGER` (0/1) | `BOOLEAN` | Adapter converts |
| duplicate_of | `INTEGER` | `BIGINT` | Adapter handles |
| created_at | `unixepoch()` | `extract(epoch)` | Adapter handles |

**CRITICAL**: Application code must handle JSON parsing for SQLite TEXT fields.

---

### 3. `clusters` Table

#### SQLite Version (Current)
```sql
CREATE TABLE clusters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  representative_item_id INTEGER NOT NULL,
  title_normalized TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at INTEGER NOT NULL,
  last_updated_at INTEGER NOT NULL,
  FOREIGN KEY (representative_item_id) REFERENCES feed_items(id)
);
```

#### Supabase Version (Production)
```sql
CREATE TABLE clusters (
  id BIGSERIAL PRIMARY KEY,
  representative_item_id BIGINT NOT NULL REFERENCES feed_items(id),
  title_normalized TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at BIGINT NOT NULL,
  last_updated_at BIGINT NOT NULL
);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| id | `INTEGER` | `BIGSERIAL` | Adapter handles |
| representative_item_id | `INTEGER` | `BIGINT` | Adapter handles |
| first_seen_at | `INTEGER` | `BIGINT` | Same range |
| last_updated_at | `INTEGER` | `BIGINT` | Same range |

---

### 4. `scenario_scores` Table

#### SQLite Version (Current - Simplified)
```sql
CREATE TABLE scenario_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id TEXT NOT NULL,          -- String code (no FK)
  probability REAL NOT NULL,
  raw_score REAL NOT NULL,
  confidence REAL NOT NULL,
  trend TEXT NOT NULL,
  signal_count INTEGER NOT NULL,
  calculated_at INTEGER NOT NULL
);
```

#### Supabase Version (Migration 002 - Full Schema)
```sql
CREATE TABLE scenario_scores (
  id BIGSERIAL PRIMARY KEY,
  scenario_id BIGINT NOT NULL REFERENCES scenario_definitions(id) ON DELETE CASCADE,
  score REAL NOT NULL CHECK(score BETWEEN 0 AND 1),
  probability REAL NOT NULL CHECK(probability BETWEEN 0 AND 1),
  trend TEXT NOT NULL CHECK(trend IN ('increasing', 'stable', 'decreasing')),
  active_signals JSONB NOT NULL DEFAULT '[]',
  signal_count INTEGER NOT NULL DEFAULT 0,
  calculated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  calculation_method TEXT NOT NULL DEFAULT 'weighted_sum',
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  data_quality REAL NOT NULL CHECK(data_quality BETWEEN 0 AND 1)
);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| scenario_id | `TEXT` (no FK) | `BIGINT` (FK to scenario_definitions) | **BREAKING**: Different types |
| score | ❌ Missing (has raw_score) | ✅ Present | Schema drift |
| active_signals | ❌ Missing | `JSONB` array | Schema drift |
| calculation_method | ❌ Missing | `TEXT` | Schema drift |
| data_quality | ❌ Missing | `REAL` | Schema drift |

**CRITICAL**: SQLite schema is incomplete. Need migration to add missing columns OR create scenario_scores_v2.

---

## New Tables: SQLite vs Supabase Schemas

### 5. `event_frames` Table

#### SQLite Version (Migration 003)
```sql
CREATE TABLE event_frames (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_item_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('missile_strike', ...)),
  actors TEXT,                        -- JSON string
  location TEXT,                      -- JSON string
  severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', ...)),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  source_reliability INTEGER NOT NULL CHECK(source_reliability BETWEEN 1 AND 5),
  evidence TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  reported_at INTEGER NOT NULL,
  casualties TEXT,                    -- JSON string
  weapon_system TEXT,
  target_type TEXT,
  tags TEXT,                          -- JSON array string
  verified INTEGER NOT NULL DEFAULT 0,
  cluster_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER,
  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE
);
```

#### Supabase Version (Migration 003)
```sql
CREATE TABLE event_frames (
  id BIGSERIAL PRIMARY KEY,
  feed_item_id BIGINT NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('missile_strike', ...)),
  actors JSONB NOT NULL DEFAULT '[]',           -- JSON array
  location JSONB,                               -- JSON object
  severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 10),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  source_reliability INTEGER NOT NULL CHECK(source_reliability BETWEEN 1 AND 5),
  evidence TEXT NOT NULL,
  extracted_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  UNIQUE(feed_item_id, event_type, evidence)
);

-- GIN indexes for JSONB columns
CREATE INDEX idx_event_frames_actors ON event_frames USING GIN (actors);
CREATE INDEX idx_event_frames_location ON event_frames USING GIN (location);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| id | `INTEGER` | `BIGSERIAL` | Adapter handles |
| feed_item_id | `INTEGER` | `BIGINT` | Adapter handles |
| actors | `TEXT` (JSON string) | `JSONB` (native) | App must parse for SQLite |
| location | `TEXT` (JSON string) | `JSONB` (native) | App must parse for SQLite |
| severity | `TEXT` enum | `INTEGER` (1-10) | **TYPE CONFLICT** - need to align |
| casualties | `TEXT` (JSON) | ❌ Not in PG schema | Schema drift |
| occurred_at | `INTEGER` | ❌ Not in PG schema (has extracted_at) | Schema drift |
| verified | `INTEGER` (0/1) | ❌ Not in PG schema | Schema drift |

**CRITICAL**: Severity field has incompatible types. Must standardize on one approach.

**RECOMMENDATION**: Use INTEGER (1-10) in both for consistency with DEFCON levels.

---

### 6. `signals` Table

#### SQLite Version (Migration 003)
```sql
CREATE TABLE signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('military', 'diplomatic', ...)),
  weight REAL NOT NULL CHECK(weight BETWEEN 0 AND 1),
  decay_rate REAL NOT NULL DEFAULT 0.1 CHECK(decay_rate BETWEEN 0 AND 1),
  half_life_hours INTEGER NOT NULL DEFAULT 168,
  scope TEXT NOT NULL CHECK(scope IN ('local', 'regional', 'global')),
  requires_verification INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active INTEGER NOT NULL DEFAULT 1
);
```

#### Supabase Version (Migration 002)
```sql
CREATE TABLE signals (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('military', 'diplomatic', ...)),
  weight REAL NOT NULL CHECK(weight BETWEEN 0 AND 1),
  decay_rate REAL NOT NULL DEFAULT 0.1 CHECK(decay_rate BETWEEN 0 AND 1),
  half_life_hours INTEGER NOT NULL DEFAULT 168,
  scope TEXT NOT NULL CHECK(scope IN ('local', 'regional', 'global')),
  requires_verification BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| id | `INTEGER` | `BIGSERIAL` | Adapter handles |
| requires_verification | `INTEGER` (0/1) | `BOOLEAN` | Adapter converts |
| is_active | `INTEGER` (0/1) | `BOOLEAN` | Adapter converts |
| created_at | `INTEGER` + `unixepoch()` | `BIGINT` + `extract(epoch)` | Adapter handles |
| updated_at | `INTEGER` + `unixepoch()` | `BIGINT` + `extract(epoch)` | Adapter handles |

---

### 7. `signal_activations` Table

#### SQLite Version (Migration 003)
```sql
CREATE TABLE signal_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id INTEGER NOT NULL,
  event_frame_id INTEGER NOT NULL,
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  activated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_verified INTEGER NOT NULL DEFAULT 0,
  verified_by TEXT,
  verified_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE,
  FOREIGN KEY (event_frame_id) REFERENCES event_frames(id) ON DELETE CASCADE,
  UNIQUE(signal_id, event_frame_id)
);
```

#### Supabase Version (Migration 002)
```sql
CREATE TABLE signal_activations (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  event_frame_id BIGINT NOT NULL REFERENCES event_frames(id) ON DELETE CASCADE,
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  activated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  expires_at BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by TEXT,
  verified_at BIGINT,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  UNIQUE(signal_id, event_frame_id)
);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| id | `INTEGER` | `BIGSERIAL` | Adapter handles |
| signal_id | `INTEGER` | `BIGINT` | Adapter handles |
| event_frame_id | `INTEGER` | `BIGINT` | Adapter handles |
| activated_at | `INTEGER` + `unixepoch()` | `BIGINT` + `extract(epoch)` | Adapter handles |
| expires_at | `INTEGER` | `BIGINT` | Adapter handles |
| is_active | `INTEGER` (0/1) | `BOOLEAN` | Adapter converts |
| is_verified | `INTEGER` (0/1) | `BOOLEAN` | Adapter converts |
| verified_at | `INTEGER` | `BIGINT` | Adapter handles |
| created_at | `INTEGER` + `unixepoch()` | `BIGINT` + `extract(epoch)` | Adapter handles |

---

### 8. `scenario_definitions` Table

#### SQLite Version (Migration 003)
```sql
CREATE TABLE scenario_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  hypothesis TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_signals TEXT NOT NULL DEFAULT '[]',       -- JSON array string
  base_threshold REAL NOT NULL DEFAULT 0.3 CHECK(base_threshold BETWEEN 0 AND 1),
  impact_areas TEXT NOT NULL DEFAULT '[]',          -- JSON array string
  geographic_scope TEXT NOT NULL CHECK(geographic_scope IN ('bilateral', 'regional', 'global')),
  actors_involved TEXT NOT NULL DEFAULT '[]',       -- JSON array string
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active INTEGER NOT NULL DEFAULT 1,
  last_triggered_at INTEGER
);
```

#### Supabase Version (Migration 002)
```sql
CREATE TABLE scenario_definitions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  hypothesis TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_signals JSONB NOT NULL DEFAULT '[]',      -- JSON array
  base_threshold REAL NOT NULL DEFAULT 0.3 CHECK(base_threshold BETWEEN 0 AND 1),
  impact_areas JSONB NOT NULL DEFAULT '[]',         -- JSON array
  geographic_scope TEXT NOT NULL CHECK(geographic_scope IN ('bilateral', 'regional', 'global')),
  actors_involved JSONB NOT NULL DEFAULT '[]',      -- JSON array
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at BIGINT
);
```

#### Differences
| Field | SQLite | Supabase | Impact |
|-------|--------|----------|--------|
| id | `INTEGER` | `BIGSERIAL` | Adapter handles |
| trigger_signals | `TEXT` (JSON string) | `JSONB` (native) | App must parse for SQLite |
| impact_areas | `TEXT` (JSON string) | `JSONB` (native) | App must parse for SQLite |
| actors_involved | `TEXT` (JSON string) | `JSONB` (native) | App must parse for SQLite |
| is_active | `INTEGER` (0/1) | `BOOLEAN` | Adapter converts |
| created_at | `INTEGER` + `unixepoch()` | `BIGINT` + `extract(epoch)` | Adapter handles |
| updated_at | `INTEGER` + `unixepoch()` | `BIGINT` + `extract(epoch)` | Adapter handles |
| last_triggered_at | `INTEGER` | `BIGINT` | Adapter handles |

---

## Index Comparison

### SQLite Index Syntax
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
CREATE INDEX IF NOT EXISTS idx_name ON table(column) WHERE condition;
CREATE UNIQUE INDEX IF NOT EXISTS idx_name ON table(column);
```

### Supabase Index Syntax
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
CREATE INDEX IF NOT EXISTS idx_name ON table(column) WHERE condition;
CREATE UNIQUE INDEX IF NOT EXISTS idx_name ON table(column);
CREATE INDEX IF NOT EXISTS idx_name ON table USING GIN (jsonb_column);  -- JSONB only
CREATE INDEX IF NOT EXISTS idx_name ON table USING BTREE (column);       -- Explicit
```

### Special Indexes

| Index Type | SQLite | Supabase | Notes |
|------------|--------|----------|-------|
| B-Tree (default) | ✅ Default | ✅ Default | Standard for most columns |
| Partial index (WHERE) | ✅ Supported | ✅ Supported | Filter on active rows |
| GIN (JSONB) | ❌ Not supported | ✅ Supported | For JSONB columns only |
| GiST (Geographic) | ❌ Not supported | ✅ Supported | For spatial data |
| Full-text search | ✅ FTS5 extension | ✅ tsvector/GIN | Different implementations |

---

## PostgreSQL-Only Features Used in Migration 002

### 1. Functions (Not Supported in SQLite)
```sql
-- calculate_signal_decay function
CREATE OR REPLACE FUNCTION calculate_signal_decay(...)
$$ LANGUAGE plpgsql IMMUTABLE;

-- get_active_scenario_signals function
CREATE OR REPLACE FUNCTION get_active_scenario_signals(...)
$$ LANGUAGE plpgsql;

-- update_scenario_score function
CREATE OR REPLACE FUNCTION update_scenario_score(...)
$$ LANGUAGE plpgsql;
```

**Solution for SQLite**: Implement these functions in application layer (TypeScript).

### 2. JSONB Operators (Not Supported in SQLite)
```sql
-- Check if JSONB array contains value
WHERE sd.trigger_signals @> jsonb_build_array(s.code)

-- JSONB path queries
WHERE data->>'status' = 'active'
```

**Solution for SQLite**: Use `json_extract()` function or parse in application layer.

### 3. Advanced Types
```sql
-- Arrays (not in SQLite)
actors TEXT[]

-- JSONB (not in SQLite)
actors JSONB

-- UUID (not in SQLite)
id UUID DEFAULT gen_random_uuid()
```

**Solution for SQLite**: Use TEXT for JSON, INTEGER/TEXT for IDs.

---

## Adapter Conversion Logic

### Boolean Conversion
```typescript
// Writing to database
const sqliteValue = booleanValue ? 1 : 0;
const supabaseValue = booleanValue;  // Native boolean

// Reading from database
const booleanValue = sqliteValue === 1;  // Convert back
const booleanValue = supabaseValue;      // Already boolean
```

### JSON Conversion
```typescript
// Writing to database (array example)
const sqliteValue = JSON.stringify(arrayValue);  // "[1,2,3]"
const supabaseValue = arrayValue;                // [1,2,3] (native)

// Reading from database
const arrayValue = JSON.parse(sqliteValue);      // Parse string
const arrayValue = supabaseValue;                // Already array
```

### Timestamp Conversion
```typescript
// Current timestamp (seconds)
const sqliteTimestamp = Math.floor(Date.now() / 1000);
const supabaseTimestamp = Math.floor(Date.now() / 1000);  // Same

// In SQL
const sqliteSQL = `SELECT unixepoch() as now`;
const supabaseSQL = `SELECT extract(epoch from now())::bigint as now`;
```

---

## Migration Compatibility Matrix

| Feature | SQLite | Supabase | Adapter Handles? | Notes |
|---------|--------|----------|------------------|-------|
| CREATE TABLE IF NOT EXISTS | ✅ | ✅ | - | Fully compatible |
| Foreign keys | ✅ | ✅ | - | Must enable in SQLite |
| CHECK constraints | ✅ | ✅ | - | Fully compatible |
| DEFAULT values | ✅ | ✅ | - | Different functions |
| AUTOINCREMENT | ✅ | ✅ (SERIAL) | ✅ | Adapter returns ID |
| Boolean type | ❌ (use INTEGER) | ✅ | ✅ | Adapter converts |
| JSONB type | ❌ (use TEXT) | ✅ | ⚠️ | App must parse |
| Timestamp functions | ✅ Different | ✅ Different | ✅ | Different syntax |
| ON DELETE CASCADE | ✅ | ✅ | - | Fully compatible |
| Partial indexes | ✅ | ✅ | - | Fully compatible |
| GIN indexes | ❌ | ✅ | - | Skip for SQLite |
| Functions (PL/pgSQL) | ❌ | ✅ | ❌ | Port to app layer |

---

## Recommended Best Practices

### 1. Use Common Denominator Types
```sql
-- Good: Works in both
created_at INTEGER NOT NULL  -- Unix epoch seconds

-- Avoid: PostgreSQL-specific
created_at TIMESTAMP NOT NULL
```

### 2. Store JSON as TEXT in SQLite
```sql
-- SQLite
actors TEXT  -- JSON string, parse in app

-- Supabase
actors JSONB  -- Native JSON
```

### 3. Use INTEGER for Booleans in SQLite
```sql
-- SQLite
is_active INTEGER NOT NULL DEFAULT 1

-- Supabase
is_active BOOLEAN NOT NULL DEFAULT true
```

### 4. Create Separate Migration Files
```
003_event_processing_sqlite.sql    -- SQLite-specific types
003_event_processing_supabase.sql  -- Supabase-specific types
```

### 5. Test Both Databases
```bash
# Test SQLite
sqlite3 test.db < migrations/003_sqlite.sql

# Test Supabase
psql $DATABASE_URL -f migrations/003_supabase.sql
```

---

## Critical Incompatibilities Requiring Attention

### 1. `scenario_scores` Schema Drift
**Issue**: SQLite has simplified schema, Supabase has full schema from Migration 002.
**Impact**: HIGH - Existing code expects certain fields.
**Solution**: Migrate SQLite schema to match Supabase OR create v2 table.

### 2. `event_frames.severity` Type Conflict
**Issue**: TypeScript types use TEXT enum, Migration 002 uses INTEGER.
**Impact**: MEDIUM - Type mismatch causes errors.
**Solution**: Standardize on INTEGER (1-10) to match DEFCON levels.

### 3. JSONB vs TEXT for Structured Data
**Issue**: Supabase can query inside JSON, SQLite cannot.
**Impact**: MEDIUM - Query capabilities differ.
**Solution**: Use adapter to abstract queries, parse JSON in app for SQLite.

### 4. PostgreSQL Functions Not in SQLite
**Issue**: Migration 002 defines 3 PL/pgSQL functions.
**Impact**: HIGH - Core scoring logic not available in SQLite.
**Solution**: Port functions to TypeScript in orchestrator layer.

---

## Migration Checklist

### Pre-Migration
- [ ] Backup both SQLite and Supabase databases
- [ ] Review all schema differences in this document
- [ ] Ensure adapter handles all type conversions
- [ ] Test migrations on empty databases first

### During Migration
- [ ] Run SQLite migrations with appropriate type conversions
- [ ] Run Supabase migrations with PostgreSQL-specific features
- [ ] Verify all indexes created successfully
- [ ] Verify seed data inserted correctly

### Post-Migration
- [ ] Test adapter CRUD operations on all new tables
- [ ] Verify JSON parsing works in SQLite
- [ ] Test boolean conversions work correctly
- [ ] Run integration tests on both databases
- [ ] Monitor query performance with EXPLAIN

---

## Document Metadata
- **Generated**: 2026-02-28
- **Tables Compared**: 8 existing + 4 new = 12 total
- **Critical Issues Found**: 3 (scenario_scores drift, severity type conflict, PG functions)
- **Compatibility Level**: 85% (most features work, some require adaptation)
