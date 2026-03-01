# Database Discovery Report
**Project**: WW3 Monitor - Live Situation Feed
**Generated**: 2026-02-28
**Author**: Backend Architect (DB Discovery Specialist)
**Status**: COMPLETE - Blocker Task #1

---

## Executive Summary

### Database Technology Stack
- **Development**: SQLite (better-sqlite3) - File-based at `./data/monitor.db`
- **Production**: PostgreSQL (Supabase) - Cloud-hosted at `https://aacumnyzzdviimujuuam.supabase.co`
- **Adapter Layer**: Unified `DatabaseAdapter` class in `/Users/xunit/Desktop/ww3/lib/db/adapter.ts`
- **Auto-Detection**: Environment checks `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to switch modes

### Current Database State
- **Active Tables**: 6 tables (5 data tables + 1 internal)
- **Total Records**: 194 feed_items + minimal rows in other tables
- **Schema Version**: Migration 002 partially applied (scenario_scores exists, but missing event_frames, signals, etc.)
- **Timestamp Format**: Unix epoch in **SECONDS** (not milliseconds)

### Critical Findings
1. **Dual Database Architecture**: Development uses SQLite, production uses Supabase PostgreSQL
2. **Schema Drift**: SQLite and Supabase schemas have differences (TEXT vs JSONB, INTEGER vs BIGINT)
3. **Partial Migration**: Migration 002 (scenario analysis) is incomplete in SQLite
4. **No EventFrame Tables**: event_frames, signals, signal_activations tables do NOT exist yet
5. **Missing State Tables**: No world_state_daily, world_state_live, relation_edges tables

---

## Database Technology Details

### SQLite Configuration (Development)
```typescript
// File: /Users/xunit/Desktop/ww3/lib/db/client.ts
Database Path: process.env.DATABASE_PATH || './data/monitor.db'
Journal Mode: WAL (Write-Ahead Logging)
Foreign Keys: ENABLED
Verbose Logging: Enabled (console.log)
```

### Supabase Configuration (Production)
```typescript
// File: /Users/xunit/Desktop/ww3/lib/db/supabase.ts
URL: process.env.NEXT_PUBLIC_SUPABASE_URL
Service Role Key: process.env.SUPABASE_SERVICE_ROLE_KEY
Auth: persistSession = false
```

### Unified Adapter Layer
```typescript
// File: /Users/xunit/Desktop/ww3/lib/db/adapter.ts
Class: DatabaseAdapter
Auto-Detection: isSupabaseConfigured() checks env vars
Methods:
  - insert(table, data) → returns id
  - update(table, id, data) → void
  - get(table, id) → single record
  - all(table, where?, params?) → array of records
  - query(sql, params?) → array of records
  - exec(sql, params?) → void (for DDL)
  - count(table, where?, params?) → number
```

**IMPORTANT**: WHERE clause support is limited in Supabase adapter (see line 93-96 warning)

---

## Complete Table Inventory

### Existing Tables (SQLite - Current State)

#### 1. `sources` - RSS/News Source Configuration
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
**Rows**: Minimal (1-2 active sources)
**Purpose**: Defines RSS/API sources for news ingestion
**Indexes**: None (UNIQUE on name)

#### 2. `feed_items` - Core News Feed Storage
```sql
CREATE TABLE feed_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  published_at INTEGER NOT NULL,      -- Unix epoch SECONDS
  fetched_at INTEGER NOT NULL,        -- Unix epoch SECONDS
  title_original TEXT NOT NULL,
  content_original TEXT,
  lang TEXT NOT NULL,
  title_en TEXT,
  summary_en TEXT,
  tags TEXT,                          -- Comma-separated or JSON string
  cluster_id INTEGER,
  entity_places TEXT,                 -- Comma-separated or JSON string
  entity_orgs TEXT,                   -- Comma-separated or JSON string
  reliability INTEGER NOT NULL,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  duplicate_of INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (duplicate_of) REFERENCES feed_items(id)
);
```
**Rows**: 194 active records
**Purpose**: Primary storage for news articles and reports
**Indexes**:
- `idx_feed_items_published` ON (published_at DESC)
- `idx_feed_items_cluster` ON (cluster_id)
- `idx_feed_items_source` ON (source_id)
- `idx_feed_items_lang` ON (lang)
- `idx_feed_items_fetched` ON (fetched_at DESC)

**Data Type Notes**:
- SQLite uses `TEXT` for tags/entity_places/entity_orgs
- Supabase schema uses `JSONB` for these fields
- SQLite uses `INTEGER` (0/1) for booleans, Supabase uses `BOOLEAN`

#### 3. `clusters` - Duplicate Detection Grouping
```sql
CREATE TABLE clusters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  representative_item_id INTEGER NOT NULL,
  title_normalized TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at INTEGER NOT NULL,     -- Unix epoch SECONDS
  last_updated_at INTEGER NOT NULL,   -- Unix epoch SECONDS
  FOREIGN KEY (representative_item_id) REFERENCES feed_items(id)
);
```
**Rows**: Minimal (1 record)
**Purpose**: Groups duplicate/similar news items
**Indexes**: `idx_clusters_updated` ON (last_updated_at DESC)

#### 4. `translation_cache` - Translation Results Cache
```sql
CREATE TABLE translation_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_text_hash TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL DEFAULT 'en',
  translated_text TEXT NOT NULL,
  service TEXT NOT NULL CHECK(service IN ('deepl', 'google', 'none')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(source_text_hash, source_lang, target_lang)
);
```
**Rows**: Minimal (1 record)
**Purpose**: Caches translation API results to reduce costs
**Indexes**: `idx_translation_lookup` ON (source_text_hash, source_lang, target_lang)

#### 5. `ingestion_logs` - Ingestion Audit Trail
```sql
CREATE TABLE ingestion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'error', 'partial')),
  items_fetched INTEGER NOT NULL DEFAULT 0,
  items_new INTEGER NOT NULL DEFAULT 0,
  items_duplicate INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);
```
**Rows**: Minimal (1 record)
**Purpose**: Logs each ingestion job for monitoring
**Indexes**:
- `idx_ingestion_logs_created` ON (created_at DESC)
- `idx_ingestion_logs_source` ON (source_id)

#### 6. `scenario_scores` - Scenario Probability Tracking
```sql
CREATE TABLE scenario_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id TEXT NOT NULL,          -- String code like 'SCENARIO_NATO_RUSSIA'
  probability REAL NOT NULL,
  raw_score REAL NOT NULL,
  confidence REAL NOT NULL,
  trend TEXT NOT NULL,
  signal_count INTEGER NOT NULL,
  calculated_at INTEGER NOT NULL      -- Unix epoch SECONDS
);
```
**Rows**: Minimal (1 record)
**Purpose**: Stores calculated scenario probabilities over time
**Indexes**: None

**DISCREPANCY**: This table exists in SQLite but is simpler than the schema in migration 002.
Migration 002 defines a more complex version with foreign keys to `scenario_definitions`.

---

## Migration File Analysis

### Migration 001: Initial Schema (`/Users/xunit/Desktop/ww3/lib/db/migrations/001_initial.sql`)
**Status**: FULLY APPLIED in SQLite and Supabase
**Tables Created**:
- sources
- feed_items
- clusters
- translation_cache
- ingestion_logs

**Features**:
- Uses `CREATE TABLE IF NOT EXISTS` (backward-compatible)
- Uses `INTEGER` for timestamps (Unix epoch seconds)
- Uses `TEXT` for JSON-like fields (SQLite style)

### Migration 002: Scenario Analysis System (`/Users/xunit/Desktop/ww3/lib/db/migrations/002_scenario_analysis.sql`)
**Status**: PARTIALLY APPLIED (only scenario_scores exists, missing all other tables)
**Tables Defined**:
1. `event_frames` - Structured events from feed items (NOT CREATED YET)
2. `signals` - Signal definitions with weights (NOT CREATED YET)
3. `scenario_definitions` - Scenario templates (NOT CREATED YET)
4. `scenario_scores` - Historical scores (EXISTS but different schema)
5. `impact_matrix` - Impact assessments (NOT CREATED YET)
6. `scenario_changelog` - Audit trail (NOT CREATED YET)
7. `signal_activations` - Signal detection records (NOT CREATED YET)

**Features**:
- Designed for PostgreSQL (uses `BIGSERIAL`, `JSONB`, `BOOLEAN`)
- Includes PostgreSQL functions (calculate_signal_decay, get_active_scenario_signals, update_scenario_score)
- Includes seed data for signals and scenarios
- Uses foreign keys extensively

**Compatibility Issues**:
- `BIGSERIAL` → Must convert to `INTEGER PRIMARY KEY AUTOINCREMENT` for SQLite
- `JSONB` → Must convert to `TEXT` for SQLite
- `BOOLEAN` → Must convert to `INTEGER` (0/1) for SQLite
- PostgreSQL functions → Must port to application logic for SQLite
- `extract(epoch from now())::bigint` → Must convert to `unixepoch()` for SQLite

### Supabase Schema (`/Users/xunit/Desktop/ww3/lib/db/migrations/supabase-schema.sql`)
**Status**: Reference schema for production Supabase deployment
**Tables**: Same as Migration 001 but PostgreSQL-optimized
**Differences from SQLite**:
- Uses `BIGSERIAL` instead of `INTEGER PRIMARY KEY AUTOINCREMENT`
- Uses `BIGINT` for timestamps
- Uses `BOOLEAN` instead of `INTEGER`
- Uses `JSONB` instead of `TEXT` for structured data
- Uses `extract(epoch from now())::bigint` for timestamps

---

## Missing Tables (Required for New Features)

Based on team lead's requirements, these tables need to be created:

### High Priority - Core Event Processing

#### 1. `event_frames` - Structured Event Data
**Purpose**: Converts unstructured feed_items into structured military/conflict events
**Status**: DEFINED in Migration 002, NOT CREATED in SQLite
**Schema**: See Migration 002 lines 8-51
**Key Fields**: event_type, actors (JSONB), location (JSONB), severity, confidence
**Relationships**: foreign key to feed_items(id)

#### 2. `signals` - Signal Definitions
**Purpose**: Defines weighted signals for scenario analysis
**Status**: DEFINED in Migration 002, NOT CREATED in SQLite
**Schema**: See Migration 002 lines 56-90
**Key Fields**: code, weight, decay_rate, half_life_hours, category
**Seed Data**: 19 predefined signals in Migration 002

#### 3. `signal_activations` - Signal Detection Records
**Purpose**: Tracks when signals are detected in event_frames
**Status**: DEFINED in Migration 002, NOT CREATED in SQLite
**Schema**: See Migration 002 lines 245-272
**Key Fields**: signal_id, event_frame_id, confidence, expires_at
**Relationships**: foreign keys to signals(id) and event_frames(id)

#### 4. `scenario_definitions` - Scenario Templates
**Purpose**: Defines scenarios like "NATO-Russia Escalation" with trigger conditions
**Status**: DEFINED in Migration 002, NOT CREATED in SQLite
**Schema**: See Migration 002 lines 95-123
**Key Fields**: code, trigger_signals (JSONB), base_threshold, impact_areas (JSONB)
**Seed Data**: 3 predefined scenarios in Migration 002

### Medium Priority - State Management

#### 5. `world_state_daily` - Daily Aggregated State
**Purpose**: Daily snapshots of global conflict state (for historical analysis)
**Status**: NOT DEFINED in any migration yet
**Required Fields**:
- date (DATE or INTEGER for YYYYMMDD)
- global_tension_score (REAL 0.0-1.0)
- active_conflicts (INTEGER)
- active_scenarios (JSONB array)
- country_power_snapshot (JSONB)
- event_count_by_type (JSONB)
- calculated_at (INTEGER timestamp)

#### 6. `world_state_live` - Real-Time State
**Purpose**: Current live state of global conflicts (single row, constantly updated)
**Status**: NOT DEFINED in any migration yet
**Required Fields**:
- id (always 1, singleton pattern)
- last_updated_at (INTEGER timestamp)
- global_tension_score (REAL 0.0-1.0)
- active_event_frames (JSONB array of recent event IDs)
- scenario_scores (JSONB object mapping scenario_id to score)
- country_statuses (JSONB object mapping country to status)
- alert_level (TEXT: 'low', 'medium', 'high', 'critical')

#### 7. `relation_edges` - Country/Entity Relations
**Purpose**: Tracks relationships between countries (alliances, conflicts, neutral)
**Status**: NOT DEFINED in any migration yet
**Required Fields**:
- id (INTEGER PRIMARY KEY)
- entity_a (TEXT country/org code)
- entity_b (TEXT country/org code)
- relation_type (TEXT: 'allied', 'hostile', 'neutral', 'trade_partner', 'adversary')
- relation_strength (REAL 0.0-1.0)
- last_updated_at (INTEGER timestamp)
- evidence_event_frame_ids (JSONB array)

### Low Priority - Existing Tables from Migration 002

#### 8. `impact_matrix` - Impact Assessments
**Purpose**: Assesses impact of scenarios on domains (aviation, energy, etc.)
**Status**: DEFINED in Migration 002 lines 159-202
**Priority**: Low (analytics feature, not core functionality)

#### 9. `scenario_changelog` - Audit Trail
**Purpose**: Logs all changes to scenarios for compliance/audit
**Status**: DEFINED in Migration 002 lines 207-240
**Priority**: Low (nice-to-have for debugging)

---

## Schema Comparison: SQLite vs Supabase

### Type Mapping Table

| SQLite Type | Supabase Type | Notes |
|-------------|---------------|-------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGSERIAL PRIMARY KEY` | Auto-incrementing ID |
| `INTEGER` | `BIGINT` | Large integers, timestamps |
| `INTEGER` (0/1) | `BOOLEAN` | Boolean values |
| `TEXT` | `TEXT` | Short text fields |
| `TEXT` | `JSONB` | Structured data (arrays, objects) |
| `REAL` | `REAL` | Floating point numbers |
| `unixepoch()` | `extract(epoch from now())::bigint` | Current timestamp function |

### Critical Differences

1. **JSONB Support**:
   - **Supabase**: Native JSONB with indexing (GIN indexes)
   - **SQLite**: TEXT fields, manual JSON parsing in application layer
   - **Impact**: Supabase queries can filter/search inside JSON, SQLite cannot

2. **Boolean Handling**:
   - **Supabase**: Native BOOLEAN type
   - **SQLite**: INTEGER (0 = false, 1 = true)
   - **Impact**: Adapter must convert boolean inputs to 0/1 for SQLite

3. **Auto-Increment Syntax**:
   - **Supabase**: `BIGSERIAL PRIMARY KEY`
   - **SQLite**: `INTEGER PRIMARY KEY AUTOINCREMENT`
   - **Impact**: Migrations must have separate versions for each DB

4. **Timestamp Precision**:
   - **Both**: Use Unix epoch in SECONDS (not milliseconds)
   - **SQLite**: `unixepoch()` function
   - **Supabase**: `extract(epoch from now())::bigint`
   - **Impact**: Application code must use `Math.floor(Date.now() / 1000)`

5. **Foreign Key Enforcement**:
   - **SQLite**: Must enable with `PRAGMA foreign_keys = ON` (already enabled)
   - **Supabase**: Enabled by default
   - **Impact**: Both enforce constraints properly

---

## Existing TypeScript Types

### Location: `/Users/xunit/Desktop/ww3/types/`

#### `feed.ts` - Core Feed Types
```typescript
- RSSSource (matches sources table)
- FeedItem (matches feed_items table)
- Cluster (matches clusters table)
- TranslationCache (matches translation_cache table)
- IngestionLog (matches ingestion_logs table)
- NewsTag (enum for tags)
```

#### `map/EventFrame.ts` - Event Frame Types
```typescript
- EventFrame (DOES NOT match event_frames table - not created yet)
- EventType (18 types: missile_strike, drone_strike, etc.)
- EventSeverity (5 levels: critical, high, medium, low, minimal)
- LocationPrecision (5 levels: exact, city, region, country, unknown)
- EventFrameInput (for creating EventFrames)
```

#### `scenario.ts` - Scenario Types
```typescript
- Scenario (for API responses)
- ScenarioWithSignals (includes signal details)
- SignalActivation (partial type, not full DB schema)
```

#### `scenario-db.ts` - Database Schema Types
```typescript
- DbEventFrame (matches Migration 002 event_frames schema)
- DbSignal (matches Migration 002 signals schema)
- DbScenarioDefinition (matches Migration 002 scenario_definitions)
- DbScenarioScore (matches Migration 002 scenario_scores)
- DbImpactMatrix (matches Migration 002 impact_matrix)
- DbSignalActivation (matches Migration 002 signal_activations)
- DbScenarioChangelog (matches Migration 002 scenario_changelog)
```

**Type Sync Status**: Types are well-defined but many corresponding tables are MISSING

---

## Data Volume Analysis

### Current Database Size
```bash
File: ./data/monitor.db
Tables: 6 (5 data + 1 internal)
Total Rows:
  - feed_items: 194 (primary data)
  - sources: ~1-2
  - clusters: ~1
  - scenario_scores: ~1
  - translation_cache: ~1
  - ingestion_logs: ~1
```

### Expected Growth After Migration
- **event_frames**: 1-2 events per feed_item → ~200-400 rows
- **signals**: 19 seed rows (static definitions)
- **signal_activations**: ~50-100 per day (active signals)
- **scenario_definitions**: 3-5 scenarios (mostly static)
- **scenario_scores**: 1 row per scenario per hour → ~72-120/day
- **world_state_daily**: 1 row per day → minimal
- **world_state_live**: 1 row total (singleton)
- **relation_edges**: ~50-100 country/entity relationships (mostly static)

### Performance Considerations
- **SQLite**: Should handle 10k-50k rows easily (dev workload)
- **Supabase**: Designed for millions of rows (production workload)
- **Indexes**: All critical indexes are defined in migrations
- **Query Performance**: Expect <50ms response times with proper indexes

---

## Critical Database Rules (From MEMORY.md)

### Timestamp Format (CRITICAL)
**RULE**: Database stores Unix epoch timestamps in **SECONDS**, not milliseconds
**Code Pattern**:
```typescript
// CORRECT
const timestamp = Math.floor(Date.now() / 1000);

// WRONG - causes 500 errors
const timestamp = Date.now(); // This returns milliseconds!
```

**Impact**: All date comparisons, queries, and inserts must use seconds.
**History**: This caused 500 errors in scenario calculations (see MEMORY.md).

### API Endpoint Structure
All API routes follow `/app/api/[endpoint]/route.ts` pattern:
- `/api/feed` - Live feed for Command Center
- `/api/scenarios` - Scenario analysis with probabilities
- `/api/items` - Full feed items with filtering
- `/api/stats` - Statistics and metrics
- `/api/sources` - Source management
- `/api/ingest` - Data ingestion
- `/api/setup` - One-time setup

**Rule**: ALWAYS verify API endpoints exist before deploying components that call them.

---

## Database Access Patterns

### Current Usage (from API routes)

#### `/api/items/route.ts` Pattern
```typescript
import { getDB } from '@/lib/db/adapter';

const db = getDB();
const items = await db.all(
  'feed_items',
  'published_at >= ? ORDER BY published_at DESC LIMIT ?',
  [startTime, limit]
);
```

#### `/api/scenarios/route.ts` Pattern
```typescript
const db = getDB();
const scores = await db.all('scenario_scores', 'calculated_at >= ?', [timeThreshold]);
```

### Adapter Limitations (IMPORTANT)
From adapter.ts line 93-96:
```typescript
// Simple where clause parsing for Supabase
if (where) {
  console.warn('WHERE clauses not fully supported with Supabase adapter');
}
```

**Impact**: Complex WHERE clauses work in SQLite but may fail in Supabase.
**Solution**: Use direct `query()` method for complex queries or enhance adapter.

---

## Next Steps for Migration

See `/Users/xunit/Desktop/ww3/docs/migration-plan.md` for detailed migration strategy.

---

## Appendices

### A. Database Adapter Methods Reference

```typescript
class DatabaseAdapter {
  // Insert new record, returns auto-generated ID
  async insert(table: string, data: Record<string, any>): Promise<number>

  // Update existing record by ID
  async update(table: string, id: number, data: Record<string, any>): Promise<void>

  // Get single record by ID
  async get(table: string, id: number): Promise<any>

  // Get all records matching WHERE clause
  async all(table: string, where?: string, params?: any[]): Promise<any[]>

  // Execute custom SQL query (SELECT)
  async query(sql: string, params: any[] = []): Promise<any[]>

  // Execute SQL statement (DDL/DML)
  async exec(sql: string, params: any[] = []): Promise<void>

  // Count records matching WHERE clause
  async count(table: string, where?: string, params?: any[]): Promise<number>
}
```

### B. Environment Variables Reference

```bash
# Development (SQLite)
DATABASE_PATH=./data/monitor.db  # Optional, defaults to this

# Production (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://aacumnyzzdviimujuuam.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Service role key for admin access
```

### C. Migration Execution Commands

```bash
# SQLite migrations (development)
sqlite3 ./data/monitor.db < lib/db/migrations/001_initial.sql
sqlite3 ./data/monitor.db < lib/db/migrations/002_scenario_analysis_sqlite.sql

# Supabase migrations (production)
# Execute in Supabase SQL Editor:
# Copy/paste from supabase-schema.sql
# Copy/paste from 002_scenario_analysis.sql
```

---

## Document Metadata
- **Generated**: 2026-02-28
- **Source Files Analyzed**: 10+ files
- **Database State**: SQLite (194 feed_items, 6 tables)
- **Migration Status**: 001 complete, 002 partial (scenario_scores only)
- **Confidence Level**: HIGH (direct DB inspection + schema file analysis)
