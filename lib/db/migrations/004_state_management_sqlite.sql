-- State Management System Schema (SQLite Version)
-- Migration 004: World State (Live + Daily), Relation Edges
-- Compatible with SQLite database for local development
-- Generated: 2026-02-28

-- ============================================================
-- 1. WORLD STATE LIVE - Singleton table for current global state
-- ============================================================
CREATE TABLE IF NOT EXISTS world_state_live (
  id INTEGER PRIMARY KEY CHECK(id = 1),  -- Enforce single row (singleton pattern)

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

-- Insert initial row (singleton pattern)
INSERT OR IGNORE INTO world_state_live (id, last_updated_at, global_tension_score, alert_level)
VALUES (1, unixepoch(), 0.0, 'low');

CREATE INDEX IF NOT EXISTS idx_world_state_live_updated ON world_state_live(last_updated_at DESC);

-- ============================================================
-- 2. WORLD STATE DAILY - Historical snapshots
-- ============================================================
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

-- ============================================================
-- 3. RELATION EDGES - Country relations graph
-- ============================================================
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

-- ============================================================
-- USAGE EXAMPLES (COMMENTED OUT)
-- ============================================================

-- Update world_state_live (singleton pattern)
-- UPDATE world_state_live
-- SET global_tension_score = 0.75,
--     alert_level = 'high',
--     last_updated_at = unixepoch(),
--     version = version + 1
-- WHERE id = 1;

-- Read current state
-- SELECT * FROM world_state_live WHERE id = 1;

-- Create daily snapshot (run at midnight UTC)
-- INSERT INTO world_state_daily (date, global_tension_score, alert_level, total_events, calculated_at)
-- SELECT
--   strftime('%Y%m%d', 'now') as date,
--   (SELECT global_tension_score FROM world_state_live WHERE id = 1) as global_tension_score,
--   (SELECT alert_level FROM world_state_live WHERE id = 1) as alert_level,
--   (SELECT COUNT(*) FROM event_frames WHERE occurred_at >= unixepoch('now', '-1 day')) as total_events,
--   unixepoch() as calculated_at;

-- Extract and create relation from EventFrame
-- INSERT OR REPLACE INTO relation_edges
--   (entity_a, entity_b, relation_type, relation_strength, first_observed_at, last_updated_at)
-- VALUES
--   ('Russia', 'Ukraine', 'hostile', 0.9, unixepoch(), unixepoch());

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Tables created: world_state_live, world_state_daily, relation_edges
-- Singleton initialized: world_state_live (id=1, tension=0.0, alert=low)
-- Backward compatible: All CREATE TABLE IF NOT EXISTS
-- Idempotent: Can run multiple times safely
