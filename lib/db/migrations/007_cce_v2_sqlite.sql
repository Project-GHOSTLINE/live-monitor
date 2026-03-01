-- ============================================================
-- CCE v2 Schema Additions (SQLite)
-- Migration 007: Theatre aggregation, alliance pressure, front-lines
-- Requires: Migration 006 (CCE v1)
-- Feature Flag: CCE_V2_ENABLED
-- ============================================================

-- ============================================================
-- A) Extend conflict_state_live with v2 metrics
-- ============================================================

ALTER TABLE conflict_state_live ADD COLUMN momentum REAL DEFAULT 0.0 CHECK(momentum BETWEEN 0 AND 1);
ALTER TABLE conflict_state_live ADD COLUMN pressure REAL DEFAULT 0.0 CHECK(pressure BETWEEN 0 AND 1);
ALTER TABLE conflict_state_live ADD COLUMN instability REAL DEFAULT 0.0 CHECK(instability BETWEEN 0 AND 1);
ALTER TABLE conflict_state_live ADD COLUMN theatre_rank INTEGER DEFAULT 0;
ALTER TABLE conflict_state_live ADD COLUMN last_major_change_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_conflict_state_live_pressure ON conflict_state_live(pressure DESC);
CREATE INDEX IF NOT EXISTS idx_conflict_state_live_momentum ON conflict_state_live(momentum DESC);
CREATE INDEX IF NOT EXISTS idx_conflict_state_live_theatre_rank ON conflict_state_live(theatre_rank ASC);

-- ============================================================
-- B) Theatre State Live - Theatre-level aggregations
-- ============================================================

CREATE TABLE IF NOT EXISTS theatre_state_live (
  theatre TEXT PRIMARY KEY,
  tension REAL NOT NULL DEFAULT 0.0 CHECK(tension BETWEEN 0 AND 1),
  momentum REAL NOT NULL DEFAULT 0.0 CHECK(momentum BETWEEN 0 AND 1),
  heat REAL NOT NULL DEFAULT 0.0 CHECK(heat BETWEEN 0 AND 1),
  velocity REAL NOT NULL DEFAULT 0.0 CHECK(velocity BETWEEN -1 AND 1),
  dominant_actors TEXT NOT NULL DEFAULT '[]',  -- JSON: ["US", "RU", "CN"] (top 5 by involvement)
  active_fronts TEXT NOT NULL DEFAULT '[]',    -- JSON: ["front_id_1", "front_id_2"]
  conflict_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_theatre_state_live_tension ON theatre_state_live(tension DESC);
CREATE INDEX IF NOT EXISTS idx_theatre_state_live_momentum ON theatre_state_live(momentum DESC);
CREATE INDEX IF NOT EXISTS idx_theatre_state_live_updated ON theatre_state_live(updated_at DESC);

-- ============================================================
-- C) Alliance Pressure Live - Alliance tension propagation
-- ============================================================

CREATE TABLE IF NOT EXISTS alliance_pressure_live (
  alliance_name TEXT PRIMARY KEY,
  pressure REAL NOT NULL DEFAULT 0.0 CHECK(pressure BETWEEN 0 AND 1),
  top_conflicts TEXT NOT NULL DEFAULT '[]',  -- JSON: [{"conflict_id": "US-RU", "tension": 0.85}, ...]
  affected_members TEXT NOT NULL DEFAULT '[]',  -- JSON: ["US", "UK", "FR"] (members under pressure)
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_alliance_pressure_live_pressure ON alliance_pressure_live(pressure DESC);
CREATE INDEX IF NOT EXISTS idx_alliance_pressure_live_updated ON alliance_pressure_live(updated_at DESC);

-- ============================================================
-- D) Front Lines - Geographic/strategic front definitions
-- ============================================================

CREATE TABLE IF NOT EXISTS front_lines (
  id TEXT PRIMARY KEY,  -- e.g., "front_levant_arc"
  theatre TEXT NOT NULL,
  name TEXT NOT NULL,
  zone_id TEXT,  -- FK to conflict_zones (nullable)
  actors TEXT NOT NULL DEFAULT '[]',  -- JSON: ["IL", "LB"]
  base_control TEXT NOT NULL DEFAULT '{}',  -- JSON: {"IL": 0.6, "LB": 0.4}
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (zone_id) REFERENCES conflict_zones(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_front_lines_theatre ON front_lines(theatre);
CREATE INDEX IF NOT EXISTS idx_front_lines_updated ON front_lines(updated_at DESC);

-- ============================================================
-- E) Front State Live - Real-time front-line state
-- ============================================================

CREATE TABLE IF NOT EXISTS front_state_live (
  front_id TEXT PRIMARY KEY,
  control TEXT NOT NULL DEFAULT '{}',  -- JSON: {"IL": 0.55, "LB": 0.45} (sum = 1.0) [SIM STATE]
  intensity REAL NOT NULL DEFAULT 0.0 CHECK(intensity BETWEEN 0 AND 1),
  last_event_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (front_id) REFERENCES front_lines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_front_state_live_intensity ON front_state_live(intensity DESC);
CREATE INDEX IF NOT EXISTS idx_front_state_live_updated ON front_state_live(updated_at DESC);

-- ============================================================
-- SEED DATA: Initial Front Lines (Global hotspots)
-- ============================================================

-- 1. Levant Arc (Israel-Lebanon-Syria)
INSERT OR IGNORE INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_levant_arc',
  'MiddleEast',
  'Levant Arc',
  '["IL", "LB", "SY"]',
  '{"IL": 0.7, "LB": 0.2, "SY": 0.1}',
  unixepoch(),
  unixepoch()
);

-- 2. Strait of Hormuz (US-Iran)
INSERT OR IGNORE INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_strait_hormuz',
  'MiddleEast',
  'Strait of Hormuz',
  '["US", "IR"]',
  '{"US": 0.6, "IR": 0.4}',
  unixepoch(),
  unixepoch()
);

-- 3. Taiwan Strait (US-China-Taiwan)
INSERT OR IGNORE INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_taiwan_strait',
  'IndoPacific',
  'Taiwan Strait',
  '["US", "CN", "TW"]',
  '{"US": 0.5, "CN": 0.3, "TW": 0.2}',
  unixepoch(),
  unixepoch()
);

-- 4. Korean DMZ (US-North Korea-South Korea)
INSERT OR IGNORE INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_korean_dmz',
  'IndoPacific',
  'Korean DMZ',
  '["US", "KP", "KR"]',
  '{"US": 0.5, "KP": 0.3, "KR": 0.2}',
  unixepoch(),
  unixepoch()
);

-- 5. Donbas Front (Ukraine-Russia)
INSERT OR IGNORE INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_donbas',
  'EuropeEast',
  'Donbas Front',
  '["UA", "RU"]',
  '{"UA": 0.45, "RU": 0.55}',
  unixepoch(),
  unixepoch()
);

-- 6. Gulf Corridor (Saudi Arabia-Yemen)
INSERT OR IGNORE INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_gulf_corridor',
  'MiddleEast',
  'Gulf Corridor',
  '["SA", "YE"]',
  '{"SA": 0.7, "YE": 0.3}',
  unixepoch(),
  unixepoch()
);

-- Initialize front_state_live for seed fronts
INSERT OR IGNORE INTO front_state_live (front_id, control, intensity, last_event_at, updated_at)
SELECT
  id,
  base_control,
  0.0,
  NULL,
  unixepoch()
FROM front_lines;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Tables created: theatre_state_live, alliance_pressure_live,
--                 front_lines, front_state_live
-- Tables extended: conflict_state_live (+5 columns)
-- Seed data: 6 fronts + initial front_state_live entries
-- Backward compatible: All IF NOT EXISTS, additive only
-- Safe to run multiple times (idempotent)
-- ============================================================
