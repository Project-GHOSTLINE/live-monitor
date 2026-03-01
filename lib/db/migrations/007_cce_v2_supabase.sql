-- ============================================================
-- CCE v2 Schema Additions (Supabase/PostgreSQL)
-- Migration 007: Theatre aggregation, alliance pressure, front-lines
-- Requires: Migration 006 (CCE v1)
-- Feature Flag: CCE_V2_ENABLED
-- ============================================================

-- ============================================================
-- A) Extend conflict_state_live with v2 metrics
-- ============================================================

ALTER TABLE conflict_state_live
ADD COLUMN IF NOT EXISTS momentum NUMERIC DEFAULT 0.0 CHECK(momentum BETWEEN 0 AND 1);

ALTER TABLE conflict_state_live
ADD COLUMN IF NOT EXISTS pressure NUMERIC DEFAULT 0.0 CHECK(pressure BETWEEN 0 AND 1);

ALTER TABLE conflict_state_live
ADD COLUMN IF NOT EXISTS instability NUMERIC DEFAULT 0.0 CHECK(instability BETWEEN 0 AND 1);

ALTER TABLE conflict_state_live
ADD COLUMN IF NOT EXISTS theatre_rank INTEGER DEFAULT 0;

ALTER TABLE conflict_state_live
ADD COLUMN IF NOT EXISTS last_major_change_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conflict_state_live_pressure ON conflict_state_live(pressure DESC);
CREATE INDEX IF NOT EXISTS idx_conflict_state_live_momentum ON conflict_state_live(momentum DESC);
CREATE INDEX IF NOT EXISTS idx_conflict_state_live_theatre_rank ON conflict_state_live(theatre_rank ASC);

-- ============================================================
-- B) Theatre State Live - Theatre-level aggregations
-- ============================================================

CREATE TABLE IF NOT EXISTS theatre_state_live (
  theatre TEXT PRIMARY KEY,
  tension NUMERIC NOT NULL DEFAULT 0.0 CHECK(tension BETWEEN 0 AND 1),
  momentum NUMERIC NOT NULL DEFAULT 0.0 CHECK(momentum BETWEEN 0 AND 1),
  heat NUMERIC NOT NULL DEFAULT 0.0 CHECK(heat BETWEEN 0 AND 1),
  velocity NUMERIC NOT NULL DEFAULT 0.0 CHECK(velocity BETWEEN -1 AND 1),
  dominant_actors JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["US", "RU", "CN"]
  active_fronts JSONB NOT NULL DEFAULT '[]'::jsonb,    -- ["front_id_1", "front_id_2"]
  conflict_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_theatre_state_live_tension ON theatre_state_live(tension DESC);
CREATE INDEX IF NOT EXISTS idx_theatre_state_live_momentum ON theatre_state_live(momentum DESC);
CREATE INDEX IF NOT EXISTS idx_theatre_state_live_updated ON theatre_state_live(updated_at DESC);

-- ============================================================
-- C) Alliance Pressure Live - Alliance tension propagation
-- ============================================================

CREATE TABLE IF NOT EXISTS alliance_pressure_live (
  alliance_name TEXT PRIMARY KEY,
  pressure NUMERIC NOT NULL DEFAULT 0.0 CHECK(pressure BETWEEN 0 AND 1),
  top_conflicts JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{"conflict_id": "US-RU", "tension": 0.85}]
  affected_members JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["US", "UK", "FR"]
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  actors JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["IL", "LB"]
  base_control JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"IL": 0.6, "LB": 0.4}
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (zone_id) REFERENCES conflict_zones(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_front_lines_theatre ON front_lines(theatre);
CREATE INDEX IF NOT EXISTS idx_front_lines_updated ON front_lines(updated_at DESC);

-- ============================================================
-- E) Front State Live - Real-time front-line state
-- ============================================================

CREATE TABLE IF NOT EXISTS front_state_live (
  front_id TEXT PRIMARY KEY,
  control JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"IL": 0.55, "LB": 0.45} [SIM STATE]
  intensity NUMERIC NOT NULL DEFAULT 0.0 CHECK(intensity BETWEEN 0 AND 1),
  last_event_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (front_id) REFERENCES front_lines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_front_state_live_intensity ON front_state_live(intensity DESC);
CREATE INDEX IF NOT EXISTS idx_front_state_live_updated ON front_state_live(updated_at DESC);

-- ============================================================
-- SEED DATA: Initial Front Lines (Global hotspots)
-- ============================================================

-- 1. Levant Arc (Israel-Lebanon-Syria)
INSERT INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_levant_arc',
  'MiddleEast',
  'Levant Arc',
  '["IL", "LB", "SY"]'::jsonb,
  '{"IL": 0.7, "LB": 0.2, "SY": 0.1}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 2. Strait of Hormuz (US-Iran)
INSERT INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_strait_hormuz',
  'MiddleEast',
  'Strait of Hormuz',
  '["US", "IR"]'::jsonb,
  '{"US": 0.6, "IR": 0.4}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 3. Taiwan Strait (US-China-Taiwan)
INSERT INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_taiwan_strait',
  'IndoPacific',
  'Taiwan Strait',
  '["US", "CN", "TW"]'::jsonb,
  '{"US": 0.5, "CN": 0.3, "TW": 0.2}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 4. Korean DMZ (US-North Korea-South Korea)
INSERT INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_korean_dmz',
  'IndoPacific',
  'Korean DMZ',
  '["US", "KP", "KR"]'::jsonb,
  '{"US": 0.5, "KP": 0.3, "KR": 0.2}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 5. Donbas Front (Ukraine-Russia)
INSERT INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_donbas',
  'EuropeEast',
  'Donbas Front',
  '["UA", "RU"]'::jsonb,
  '{"UA": 0.45, "RU": 0.55}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 6. Gulf Corridor (Saudi Arabia-Yemen)
INSERT INTO front_lines (id, theatre, name, actors, base_control, created_at, updated_at)
VALUES (
  'front_gulf_corridor',
  'MiddleEast',
  'Gulf Corridor',
  '["SA", "YE"]'::jsonb,
  '{"SA": 0.7, "YE": 0.3}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Initialize front_state_live for seed fronts
INSERT INTO front_state_live (front_id, control, intensity, last_event_at, updated_at)
SELECT
  id,
  base_control,
  0.0,
  NULL,
  CURRENT_TIMESTAMP
FROM front_lines
ON CONFLICT (front_id) DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Tables created: theatre_state_live, alliance_pressure_live,
--                 front_lines, front_state_live
-- Tables extended: conflict_state_live (+5 columns)
-- Seed data: 6 fronts + initial front_state_live entries
-- Backward compatible: All IF NOT EXISTS, ON CONFLICT DO NOTHING
-- Safe to run multiple times (idempotent)
-- ============================================================
