-- Event Processing System Schema (Supabase/PostgreSQL Version)
-- Migration 003: Event Frames, Signals, Signal Activations, Scenario Definitions
-- Compatible with Supabase PostgreSQL database for production
-- Generated: 2026-02-28

-- ============================================================
-- 1. EVENT FRAMES - Structured events extracted from feed items
-- ============================================================
CREATE TABLE IF NOT EXISTS event_frames (
  id BIGSERIAL PRIMARY KEY,
  feed_item_id BIGINT NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,

  -- Event Classification
  event_type TEXT NOT NULL CHECK(event_type IN (
    'missile_strike', 'drone_strike', 'airstrike', 'artillery_shelling',
    'naval_strike', 'ground_assault', 'rocket_attack', 'air_defense',
    'protest', 'sanction', 'cyberattack', 'diplomatic_action',
    'intelligence_ops', 'information_warfare', 'explosion',
    'accident', 'sabotage', 'unknown'
  )),

  -- Event Details
  actors JSONB,             -- JSON object: {"attacker": "...", "target": "...", ...}
  location JSONB,           -- JSON object: {"lat": 0, "lng": 0, "precision": "...", ...}
  severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 10),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),

  -- Source Assessment
  source_reliability INTEGER NOT NULL CHECK(source_reliability BETWEEN 1 AND 5),
  evidence TEXT NOT NULL,   -- Extracted text snippet

  -- Temporal Data
  occurred_at BIGINT NOT NULL,  -- Unix epoch timestamp in SECONDS
  reported_at BIGINT NOT NULL,  -- Unix epoch timestamp in SECONDS

  -- Additional Details
  casualties JSONB,         -- JSON object: {"killed": 0, "wounded": 0, ...}
  weapon_system TEXT,
  target_type TEXT,
  tags JSONB,               -- JSON array

  -- Verification
  verified BOOLEAN NOT NULL DEFAULT false,
  cluster_id BIGINT,

  -- Metadata
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_event_frames_feed_item ON event_frames(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_event_frames_type ON event_frames(event_type);
CREATE INDEX IF NOT EXISTS idx_event_frames_severity ON event_frames(severity DESC, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_frames_occurred ON event_frames(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_frames_created ON event_frames(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_frames_actors ON event_frames USING GIN (actors);
CREATE INDEX IF NOT EXISTS idx_event_frames_location ON event_frames USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_event_frames_tags ON event_frames USING GIN (tags);

-- ============================================================
-- 2. SIGNALS - Normalized signal definitions with weights
-- ============================================================
CREATE TABLE IF NOT EXISTS signals (
  id BIGSERIAL PRIMARY KEY,

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
  requires_verification BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signals_code ON signals(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_signals_category ON signals(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_signals_weight ON signals(weight DESC) WHERE is_active = true;

-- ============================================================
-- 3. SCENARIO DEFINITIONS - Templates for conflict scenarios
-- ============================================================
CREATE TABLE IF NOT EXISTS scenario_definitions (
  id BIGSERIAL PRIMARY KEY,

  -- Scenario Identity
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- e.g., 'SCENARIO_NATO_RUSSIA', 'SCENARIO_TAIWAN'
  hypothesis TEXT NOT NULL, -- What this scenario predicts
  description TEXT NOT NULL,

  -- Scenario Configuration
  trigger_signals JSONB NOT NULL DEFAULT '[]', -- JSON array of signal codes
  base_threshold REAL NOT NULL DEFAULT 0.3 CHECK(base_threshold BETWEEN 0 AND 1),

  -- Impact Areas
  impact_areas JSONB NOT NULL DEFAULT '[]', -- JSON array: ['aviation', 'energy', 'cyber']
  geographic_scope TEXT NOT NULL CHECK(geographic_scope IN ('bilateral', 'regional', 'global')),
  actors_involved JSONB NOT NULL DEFAULT '[]', -- JSON array of country/org codes

  -- Metadata
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  updated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at BIGINT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenario_definitions_code ON scenario_definitions(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scenario_definitions_active ON scenario_definitions(is_active, last_triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_definitions_trigger_signals ON scenario_definitions USING GIN (trigger_signals);
CREATE INDEX IF NOT EXISTS idx_scenario_definitions_actors ON scenario_definitions USING GIN (actors_involved);

-- ============================================================
-- 4. SIGNAL ACTIVATIONS - Track when signals are detected
-- ============================================================
CREATE TABLE IF NOT EXISTS signal_activations (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  event_frame_id BIGINT NOT NULL REFERENCES event_frames(id) ON DELETE CASCADE,

  -- Activation Details
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  activated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  expires_at BIGINT, -- When this signal activation expires (based on decay)

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by TEXT,
  verified_at BIGINT,

  -- Metadata
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,

  -- Prevent duplicate activations
  UNIQUE(signal_id, event_frame_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signal_activations_signal ON signal_activations(signal_id, activated_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_activations_event ON signal_activations(event_frame_id);
CREATE INDEX IF NOT EXISTS idx_signal_activations_active ON signal_activations(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_signal_activations_unverified ON signal_activations(is_verified, activated_at) WHERE is_verified = false;

-- ============================================================
-- UTILITY FUNCTIONS (PostgreSQL Only)
-- ============================================================

-- Function to calculate signal decay
CREATE OR REPLACE FUNCTION calculate_signal_decay(
  p_activated_at BIGINT,
  p_half_life_hours INTEGER,
  p_current_time BIGINT DEFAULT extract(epoch from now())::bigint
) RETURNS REAL AS $$
DECLARE
  hours_elapsed REAL;
  decay_factor REAL;
BEGIN
  hours_elapsed := (p_current_time - p_activated_at) / 3600.0;
  decay_factor := power(0.5, hours_elapsed / p_half_life_hours);
  RETURN decay_factor;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get active signals for a scenario
CREATE OR REPLACE FUNCTION get_active_scenario_signals(
  p_scenario_id BIGINT,
  p_time_threshold BIGINT DEFAULT extract(epoch from now() - interval '7 days')::bigint
) RETURNS TABLE(
  signal_code TEXT,
  signal_name TEXT,
  activation_count BIGINT,
  latest_activation BIGINT,
  average_confidence REAL,
  current_decay REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.code,
    s.name,
    COUNT(sa.id)::BIGINT AS activation_count,
    MAX(sa.activated_at) AS latest_activation,
    AVG(sa.confidence)::REAL AS average_confidence,
    calculate_signal_decay(MAX(sa.activated_at), s.half_life_hours)::REAL AS current_decay
  FROM signals s
  INNER JOIN signal_activations sa ON s.id = sa.signal_id
  INNER JOIN scenario_definitions sd ON sd.trigger_signals @> jsonb_build_array(s.code)
  WHERE sd.id = p_scenario_id
    AND sa.is_active = true
    AND sa.activated_at >= p_time_threshold
  GROUP BY s.id, s.code, s.name, s.half_life_hours
  ORDER BY latest_activation DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update scenario score
CREATE OR REPLACE FUNCTION update_scenario_score(
  p_scenario_id BIGINT
) RETURNS REAL AS $$
DECLARE
  v_score REAL := 0;
  v_signal_count INTEGER := 0;
  v_signal RECORD;
  v_decay REAL;
  v_contribution REAL;
BEGIN
  -- Calculate weighted sum of active signals with decay
  FOR v_signal IN
    SELECT
      s.id,
      s.code,
      s.weight,
      s.half_life_hours,
      sa.activated_at,
      sa.confidence
    FROM signals s
    INNER JOIN signal_activations sa ON s.id = sa.signal_id
    INNER JOIN scenario_definitions sd ON sd.trigger_signals @> jsonb_build_array(s.code)
    WHERE sd.id = p_scenario_id
      AND sa.is_active = true
      AND sa.activated_at >= extract(epoch from now() - interval '30 days')::bigint
  LOOP
    v_signal_count := v_signal_count + 1;
    v_decay := calculate_signal_decay(
      v_signal.activated_at,
      v_signal.half_life_hours
    );
    v_contribution := v_signal.weight * v_signal.confidence * v_decay;
    v_score := v_score + v_contribution;
  END LOOP;

  -- Normalize score to [0, 1]
  IF v_signal_count > 0 THEN
    v_score := LEAST(v_score, 1.0);
  END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA - Initial signal definitions
-- ============================================================

INSERT INTO signals (code, name, description, category, weight, decay_rate, half_life_hours, scope, requires_verification) VALUES
  -- Military Signals
  ('SIG_AIRSPACE_CLOSED', 'Airspace Closure', 'Airspace closed to civilian traffic', 'military', 0.8, 0.1, 24, 'regional', true),
  ('SIG_TROOPS_MOBILIZED', 'Troop Mobilization', 'Large-scale military mobilization detected', 'military', 0.9, 0.05, 168, 'regional', true),
  ('SIG_NAVAL_DEPLOYMENT', 'Naval Deployment', 'Naval forces deployed to contested area', 'military', 0.7, 0.1, 72, 'regional', false),
  ('SIG_AIR_DEFENSE_ACTIVE', 'Air Defense Activation', 'Air defense systems activated', 'military', 0.85, 0.1, 48, 'regional', true),
  ('SIG_MILITARY_EXERCISE', 'Military Exercise', 'Large-scale military exercise announced', 'military', 0.5, 0.2, 336, 'regional', false),

  -- Diplomatic Signals
  ('SIG_EMBASSY_CLOSURE', 'Embassy Closure', 'Embassy closed or staff evacuated', 'diplomatic', 0.75, 0.05, 168, 'global', true),
  ('SIG_AMBASSADOR_RECALLED', 'Ambassador Recalled', 'Ambassador recalled for consultations', 'diplomatic', 0.7, 0.1, 168, 'global', true),
  ('SIG_DIPLOMATIC_BREAKDOWN', 'Diplomatic Breakdown', 'Diplomatic relations suspended', 'diplomatic', 0.9, 0.05, 336, 'global', true),
  ('SIG_ALLIANCE_INVOKED', 'Alliance Invoked', 'Defense alliance article triggered', 'diplomatic', 0.95, 0.02, 720, 'global', true),

  -- Economic Signals
  ('SIG_SANCTIONS_IMPOSED', 'Sanctions Imposed', 'Economic sanctions implemented', 'economic', 0.6, 0.05, 336, 'global', false),
  ('SIG_ENERGY_DISRUPTION', 'Energy Supply Disruption', 'Energy supply routes disrupted', 'economic', 0.8, 0.1, 72, 'regional', true),
  ('SIG_FINANCIAL_RESTRICTIONS', 'Financial Restrictions', 'Banking or financial restrictions imposed', 'economic', 0.65, 0.05, 168, 'global', false),

  -- Cyber Signals
  ('SIG_CYBER_ATTACK_MAJOR', 'Major Cyber Attack', 'Significant cyber attack on critical infrastructure', 'cyber', 0.75, 0.2, 48, 'global', true),
  ('SIG_COMM_DISRUPTION', 'Communications Disruption', 'Major communications infrastructure disrupted', 'cyber', 0.7, 0.15, 24, 'regional', true),

  -- Infrastructure Signals
  ('SIG_BORDER_CLOSED', 'Border Closure', 'International border closed', 'infrastructure', 0.6, 0.1, 168, 'regional', false),
  ('SIG_TRANSPORT_DISRUPTION', 'Transport Disruption', 'Major transport routes disrupted', 'infrastructure', 0.5, 0.15, 72, 'regional', false),

  -- Humanitarian Signals
  ('SIG_MASS_EVACUATION', 'Mass Evacuation', 'Large-scale civilian evacuation', 'humanitarian', 0.7, 0.1, 72, 'regional', true),
  ('SIG_REFUGEE_CRISIS', 'Refugee Crisis', 'Significant refugee movement detected', 'humanitarian', 0.65, 0.05, 336, 'regional', false),
  ('SIG_CIVILIAN_CASUALTIES', 'Civilian Casualties', 'Reports of significant civilian casualties', 'humanitarian', 0.8, 0.1, 168, 'regional', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED DATA - Sample scenario definitions
-- ============================================================

INSERT INTO scenario_definitions (
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
    '["SIG_TROOPS_MOBILIZED", "SIG_AIRSPACE_CLOSED", "SIG_AIR_DEFENSE_ACTIVE", "SIG_ALLIANCE_INVOKED", "SIG_NAVAL_DEPLOYMENT"]'::jsonb,
    0.3,
    '["aviation", "energy", "cyber", "diplomatic", "humanitarian"]'::jsonb,
    'global',
    '["NATO", "Russia", "Ukraine", "Belarus"]'::jsonb
  ),
  (
    'Taiwan Strait Crisis',
    'SCENARIO_TAIWAN',
    'Military action regarding Taiwan sovereignty',
    'Scenario monitoring tensions and potential military action related to Taiwan, including PRC military posturing and international response.',
    '["SIG_NAVAL_DEPLOYMENT", "SIG_AIRSPACE_CLOSED", "SIG_MILITARY_EXERCISE", "SIG_ALLIANCE_INVOKED", "SIG_DIPLOMATIC_BREAKDOWN"]'::jsonb,
    0.35,
    '["aviation", "maritime", "supply_chain", "cyber", "financial"]'::jsonb,
    'regional',
    '["China", "Taiwan", "USA", "Japan"]'::jsonb
  ),
  (
    'Middle East Escalation',
    'SCENARIO_MIDEAST',
    'Regional conflict escalation in Middle East',
    'Scenario tracking potential escalation of conflicts in the Middle East involving state and non-state actors.',
    '["SIG_AIRSPACE_CLOSED", "SIG_ENERGY_DISRUPTION", "SIG_EMBASSY_CLOSURE", "SIG_CIVILIAN_CASUALTIES", "SIG_REFUGEE_CRISIS"]'::jsonb,
    0.25,
    '["energy", "humanitarian", "aviation", "diplomatic"]'::jsonb,
    'regional',
    '["Israel", "Iran", "Saudi Arabia", "Syria", "Yemen"]'::jsonb
  )
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE event_frames IS 'Structured events extracted from news feed items';
COMMENT ON TABLE signals IS 'Normalized signal definitions with weights and decay rates';
COMMENT ON TABLE scenario_definitions IS 'Templates defining conflict scenarios and their trigger conditions';
COMMENT ON TABLE signal_activations IS 'Records of when signals are detected in event frames';

COMMENT ON COLUMN event_frames.confidence IS 'Confidence in event extraction (0.0-1.0)';
COMMENT ON COLUMN event_frames.severity IS 'Event severity on scale 1-10 (1=minimal, 10=critical)';
COMMENT ON COLUMN signals.weight IS 'Contribution weight to scenario score (0.0-1.0)';
COMMENT ON COLUMN signals.decay_rate IS 'How quickly signal relevance decays over time';
COMMENT ON COLUMN signals.half_life_hours IS 'Hours until signal weight reduces by 50%';
COMMENT ON COLUMN scenario_definitions.base_threshold IS 'Minimum score threshold for scenario activation';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Tables created: event_frames, signals, signal_activations, scenario_definitions
-- Functions created: calculate_signal_decay, get_active_scenario_signals, update_scenario_score
-- Seed data inserted: 19 signals, 3 scenarios
-- Backward compatible: All CREATE TABLE IF NOT EXISTS
-- Idempotent: Can run multiple times safely
