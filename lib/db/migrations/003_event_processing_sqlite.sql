-- Event Processing System Schema (SQLite Version)
-- Migration 003: Event Frames, Signals, Signal Activations, Scenario Definitions
-- Compatible with SQLite database for local development
-- Generated: 2026-02-28

-- ============================================================
-- 1. EVENT FRAMES - Structured events extracted from feed items
-- ============================================================
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
  severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 10),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),

  -- Source Assessment
  source_reliability INTEGER NOT NULL CHECK(source_reliability BETWEEN 1 AND 5),
  evidence TEXT NOT NULL,   -- Extracted text snippet

  -- Temporal Data
  occurred_at INTEGER NOT NULL,  -- Unix epoch timestamp in SECONDS
  reported_at INTEGER NOT NULL,  -- Unix epoch timestamp in SECONDS

  -- Additional Details
  casualties TEXT,          -- JSON string: {"killed": 0, "wounded": 0, ...}
  weapon_system TEXT,
  target_type TEXT,
  tags TEXT,                -- JSON array string

  -- Verification
  verified INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  cluster_id INTEGER,

  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER,

  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_frames_feed_item ON event_frames(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_event_frames_type ON event_frames(event_type);
CREATE INDEX IF NOT EXISTS idx_event_frames_severity ON event_frames(severity DESC, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_frames_occurred ON event_frames(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_frames_created ON event_frames(created_at DESC);

-- ============================================================
-- 2. SIGNALS - Normalized signal definitions with weights
-- ============================================================
CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Signal Identification
  code TEXT NOT NULL UNIQUE, -- e.g., 'SIG_AIRSPACE_CLOSED', 'SIG_TROOPS_MOBILIZED'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN (
    'military',
    'diplomatic',
    'economic',
    'cyber',
    'humanitarian',
    'infrastructure'
  )),

  -- Signal Properties
  weight REAL NOT NULL CHECK(weight BETWEEN 0 AND 1), -- Contribution to scenario score
  decay_rate REAL NOT NULL DEFAULT 0.1 CHECK(decay_rate BETWEEN 0 AND 1), -- How fast signal loses relevance
  half_life_hours INTEGER NOT NULL DEFAULT 168, -- 1 week default

  -- Scope and Impact
  scope TEXT NOT NULL CHECK(scope IN ('local', 'regional', 'global')),
  requires_verification INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true

  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active INTEGER NOT NULL DEFAULT 1  -- 0 = false, 1 = true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signals_code ON signals(code) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_signals_category ON signals(category) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_signals_weight ON signals(weight DESC) WHERE is_active = 1;

-- ============================================================
-- 3. SCENARIO DEFINITIONS - Templates for conflict scenarios
-- ============================================================
CREATE TABLE IF NOT EXISTS scenario_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Scenario Identity
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- e.g., 'SCENARIO_NATO_RUSSIA', 'SCENARIO_TAIWAN'
  hypothesis TEXT NOT NULL, -- What this scenario predicts
  description TEXT NOT NULL,

  -- Scenario Configuration
  trigger_signals TEXT NOT NULL DEFAULT '[]', -- JSON array of signal codes
  base_threshold REAL NOT NULL DEFAULT 0.3 CHECK(base_threshold BETWEEN 0 AND 1),

  -- Impact Areas
  impact_areas TEXT NOT NULL DEFAULT '[]', -- JSON array: ['aviation', 'energy', 'cyber']
  geographic_scope TEXT NOT NULL CHECK(geographic_scope IN ('bilateral', 'regional', 'global')),
  actors_involved TEXT NOT NULL DEFAULT '[]', -- JSON array of country/org codes

  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active INTEGER NOT NULL DEFAULT 1,  -- 0 = false, 1 = true
  last_triggered_at INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenario_definitions_code ON scenario_definitions(code) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_scenario_definitions_active ON scenario_definitions(is_active, last_triggered_at DESC);

-- ============================================================
-- 4. SIGNAL ACTIVATIONS - Track when signals are detected
-- ============================================================
CREATE TABLE IF NOT EXISTS signal_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id INTEGER NOT NULL,
  event_frame_id INTEGER NOT NULL,

  -- Activation Details
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  activated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER, -- When this signal activation expires (based on decay)

  -- Status
  is_active INTEGER NOT NULL DEFAULT 1,  -- 0 = false, 1 = true
  is_verified INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  verified_by TEXT,
  verified_at INTEGER,

  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE,
  FOREIGN KEY (event_frame_id) REFERENCES event_frames(id) ON DELETE CASCADE,

  -- Prevent duplicate activations
  UNIQUE(signal_id, event_frame_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signal_activations_signal ON signal_activations(signal_id, activated_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_activations_event ON signal_activations(event_frame_id);
CREATE INDEX IF NOT EXISTS idx_signal_activations_active ON signal_activations(is_active, expires_at) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_signal_activations_unverified ON signal_activations(is_verified, activated_at) WHERE is_verified = 0;

-- ============================================================
-- 5. UPDATE EXISTING SCENARIO_SCORES TABLE (Backward Compatible)
-- ============================================================
-- Add missing columns from Migration 002 if they don't exist
-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check in application layer

-- Note: In SQLite, ALTER TABLE ADD COLUMN always succeeds if column doesn't exist
-- If column exists, it will error but won't break the migration

-- Attempt to add columns (may fail silently if they exist)
-- Application layer should handle these gracefully

-- ============================================================
-- SEED DATA - Initial signal definitions
-- ============================================================

INSERT OR IGNORE INTO signals (code, name, description, category, weight, decay_rate, half_life_hours, scope, requires_verification) VALUES
  -- Military Signals
  ('SIG_AIRSPACE_CLOSED', 'Airspace Closure', 'Airspace closed to civilian traffic', 'military', 0.8, 0.1, 24, 'regional', 1),
  ('SIG_TROOPS_MOBILIZED', 'Troop Mobilization', 'Large-scale military mobilization detected', 'military', 0.9, 0.05, 168, 'regional', 1),
  ('SIG_NAVAL_DEPLOYMENT', 'Naval Deployment', 'Naval forces deployed to contested area', 'military', 0.7, 0.1, 72, 'regional', 0),
  ('SIG_AIR_DEFENSE_ACTIVE', 'Air Defense Activation', 'Air defense systems activated', 'military', 0.85, 0.1, 48, 'regional', 1),
  ('SIG_MILITARY_EXERCISE', 'Military Exercise', 'Large-scale military exercise announced', 'military', 0.5, 0.2, 336, 'regional', 0),

  -- Diplomatic Signals
  ('SIG_EMBASSY_CLOSURE', 'Embassy Closure', 'Embassy closed or staff evacuated', 'diplomatic', 0.75, 0.05, 168, 'global', 1),
  ('SIG_AMBASSADOR_RECALLED', 'Ambassador Recalled', 'Ambassador recalled for consultations', 'diplomatic', 0.7, 0.1, 168, 'global', 1),
  ('SIG_DIPLOMATIC_BREAKDOWN', 'Diplomatic Breakdown', 'Diplomatic relations suspended', 'diplomatic', 0.9, 0.05, 336, 'global', 1),
  ('SIG_ALLIANCE_INVOKED', 'Alliance Invoked', 'Defense alliance article triggered', 'diplomatic', 0.95, 0.02, 720, 'global', 1),

  -- Economic Signals
  ('SIG_SANCTIONS_IMPOSED', 'Sanctions Imposed', 'Economic sanctions implemented', 'economic', 0.6, 0.05, 336, 'global', 0),
  ('SIG_ENERGY_DISRUPTION', 'Energy Supply Disruption', 'Energy supply routes disrupted', 'economic', 0.8, 0.1, 72, 'regional', 1),
  ('SIG_FINANCIAL_RESTRICTIONS', 'Financial Restrictions', 'Banking or financial restrictions imposed', 'economic', 0.65, 0.05, 168, 'global', 0),

  -- Cyber Signals
  ('SIG_CYBER_ATTACK_MAJOR', 'Major Cyber Attack', 'Significant cyber attack on critical infrastructure', 'cyber', 0.75, 0.2, 48, 'global', 1),
  ('SIG_COMM_DISRUPTION', 'Communications Disruption', 'Major communications infrastructure disrupted', 'cyber', 0.7, 0.15, 24, 'regional', 1),

  -- Infrastructure Signals
  ('SIG_BORDER_CLOSED', 'Border Closure', 'International border closed', 'infrastructure', 0.6, 0.1, 168, 'regional', 0),
  ('SIG_TRANSPORT_DISRUPTION', 'Transport Disruption', 'Major transport routes disrupted', 'infrastructure', 0.5, 0.15, 72, 'regional', 0),

  -- Humanitarian Signals
  ('SIG_MASS_EVACUATION', 'Mass Evacuation', 'Large-scale civilian evacuation', 'humanitarian', 0.7, 0.1, 72, 'regional', 1),
  ('SIG_REFUGEE_CRISIS', 'Refugee Crisis', 'Significant refugee movement detected', 'humanitarian', 0.65, 0.05, 336, 'regional', 0),
  ('SIG_CIVILIAN_CASUALTIES', 'Civilian Casualties', 'Reports of significant civilian casualties', 'humanitarian', 0.8, 0.1, 168, 'regional', 1);

-- ============================================================
-- SEED DATA - Sample scenario definitions
-- ============================================================

INSERT OR IGNORE INTO scenario_definitions (
  name,
  code,
  hypothesis,
  description,
  trigger_signals,
  base_threshold,
  impact_areas,
  geographic_scope,
  actors_involved
) VALUES
  (
    'NATO-Russia Escalation',
    'SCENARIO_NATO_RUSSIA',
    'Military confrontation between NATO and Russian forces',
    'Scenario tracking potential military escalation between NATO alliance and Russian Federation, including proxy conflicts and direct confrontation risks.',
    '["SIG_TROOPS_MOBILIZED", "SIG_AIRSPACE_CLOSED", "SIG_AIR_DEFENSE_ACTIVE", "SIG_ALLIANCE_INVOKED", "SIG_NAVAL_DEPLOYMENT"]',
    0.3,
    '["aviation", "energy", "cyber", "diplomatic", "humanitarian"]',
    'global',
    '["NATO", "Russia", "Ukraine", "Belarus"]'
  ),
  (
    'Taiwan Strait Crisis',
    'SCENARIO_TAIWAN',
    'Military action regarding Taiwan sovereignty',
    'Scenario monitoring tensions and potential military action related to Taiwan, including PRC military posturing and international response.',
    '["SIG_NAVAL_DEPLOYMENT", "SIG_AIRSPACE_CLOSED", "SIG_MILITARY_EXERCISE", "SIG_ALLIANCE_INVOKED", "SIG_DIPLOMATIC_BREAKDOWN"]',
    0.35,
    '["aviation", "maritime", "supply_chain", "cyber", "financial"]',
    'regional',
    '["China", "Taiwan", "USA", "Japan"]'
  ),
  (
    'Middle East Escalation',
    'SCENARIO_MIDEAST',
    'Regional conflict escalation in Middle East',
    'Scenario tracking potential escalation of conflicts in the Middle East involving state and non-state actors.',
    '["SIG_AIRSPACE_CLOSED", "SIG_ENERGY_DISRUPTION", "SIG_EMBASSY_CLOSURE", "SIG_CIVILIAN_CASUALTIES", "SIG_REFUGEE_CRISIS"]',
    0.25,
    '["energy", "humanitarian", "aviation", "diplomatic"]',
    'regional',
    '["Israel", "Iran", "Saudi Arabia", "Syria", "Yemen"]'
  );

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Tables created: event_frames, signals, signal_activations, scenario_definitions
-- Seed data inserted: 19 signals, 3 scenarios
-- Backward compatible: All CREATE TABLE IF NOT EXISTS
-- Idempotent: Can run multiple times safely
