-- State Management System Schema (Supabase/PostgreSQL Version)
-- Migration 004: World State (Live + Daily), Relation Edges
-- Compatible with Supabase PostgreSQL database for production
-- Generated: 2026-02-28

-- ============================================================
-- 1. WORLD STATE LIVE - Singleton table for current global state
-- ============================================================
CREATE TABLE IF NOT EXISTS world_state_live (
  id INTEGER PRIMARY KEY CHECK(id = 1),  -- Enforce single row (singleton pattern)

  -- Global Metrics
  last_updated_at BIGINT NOT NULL,
  global_tension_score REAL NOT NULL CHECK(global_tension_score BETWEEN 0 AND 1),
  alert_level TEXT NOT NULL CHECK(alert_level IN ('low', 'medium', 'high', 'critical')),

  -- Active State
  active_event_count INTEGER NOT NULL DEFAULT 0,
  active_scenario_count INTEGER NOT NULL DEFAULT 0,

  -- Recent Events (last 24h IDs)
  active_event_frames JSONB NOT NULL DEFAULT '[]',  -- JSON array of event_frame IDs

  -- Scenario Scores
  scenario_scores JSONB NOT NULL DEFAULT '{}',  -- JSON object: {"SCENARIO_NATO_RUSSIA": 0.45, ...}

  -- Country Status
  country_statuses JSONB NOT NULL DEFAULT '{}',  -- JSON object: {"USA": "heightened", ...}

  -- Metadata
  calculation_method TEXT DEFAULT 'weighted_aggregate',
  data_quality REAL DEFAULT 0.8,
  version INTEGER NOT NULL DEFAULT 1
);

-- Insert initial row (singleton pattern)
INSERT INTO world_state_live (id, last_updated_at, global_tension_score, alert_level)
VALUES (1, extract(epoch from now())::bigint, 0.0, 'low')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_world_state_live_updated ON world_state_live(last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_state_live_scenario_scores ON world_state_live USING GIN (scenario_scores);

-- ============================================================
-- 2. WORLD STATE DAILY - Historical snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS world_state_daily (
  id BIGSERIAL PRIMARY KEY,

  -- Date (YYYYMMDD as INTEGER for efficient queries)
  date INTEGER NOT NULL UNIQUE,  -- e.g., 20260228

  -- Global Metrics
  global_tension_score REAL NOT NULL,
  alert_level TEXT NOT NULL,

  -- Event Counts
  total_events INTEGER NOT NULL DEFAULT 0,
  event_counts_by_type JSONB NOT NULL DEFAULT '{}',  -- JSON: {"missile_strike": 5, ...}
  event_counts_by_severity JSONB NOT NULL DEFAULT '{}',  -- JSON: {"critical": 2, ...}

  -- Scenario Metrics
  active_scenarios JSONB NOT NULL DEFAULT '[]',  -- JSON array of scenario codes
  scenario_scores JSONB NOT NULL DEFAULT '{}',  -- JSON object: scenario scores at end of day

  -- Country Metrics
  country_power_snapshot JSONB NOT NULL DEFAULT '{}',  -- JSON: {"USA": 0.95, "Russia": 0.85, ...}
  active_conflicts JSONB NOT NULL DEFAULT '[]',  -- JSON array: [{"countries": ["A", "B"], "intensity": 0.7}]

  -- Metadata
  calculated_at BIGINT NOT NULL,
  snapshot_source TEXT DEFAULT 'daily_aggregation',
  data_quality REAL DEFAULT 0.9
);

CREATE INDEX IF NOT EXISTS idx_world_state_daily_date ON world_state_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_world_state_daily_tension ON world_state_daily(global_tension_score DESC);
CREATE INDEX IF NOT EXISTS idx_world_state_daily_calculated ON world_state_daily(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_state_daily_scenarios ON world_state_daily USING GIN (scenario_scores);

-- ============================================================
-- 3. RELATION EDGES - Country relations graph
-- ============================================================
CREATE TABLE IF NOT EXISTS relation_edges (
  id BIGSERIAL PRIMARY KEY,

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
  is_mutual BOOLEAN NOT NULL DEFAULT true,  -- true = both ways, false = A→B only

  -- Evidence
  evidence_event_frame_ids JSONB NOT NULL DEFAULT '[]',  -- JSON array of event_frame IDs
  evidence_count INTEGER NOT NULL DEFAULT 0,

  -- Temporal Data
  first_observed_at BIGINT NOT NULL,
  last_updated_at BIGINT NOT NULL,
  last_event_at BIGINT,

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
CREATE INDEX IF NOT EXISTS idx_relation_edges_evidence ON relation_edges USING GIN (evidence_event_frame_ids);

-- ============================================================
-- UTILITY FUNCTIONS (PostgreSQL Only)
-- ============================================================

-- Function to update world_state_live from recent events
CREATE OR REPLACE FUNCTION update_world_state_live()
RETURNS void AS $$
DECLARE
  v_event_count INTEGER;
  v_scenario_count INTEGER;
  v_tension_score REAL;
  v_alert_level TEXT;
  v_recent_events JSONB;
  v_scenario_scores JSONB := '{}';
  v_scenario RECORD;
BEGIN
  -- Count active events (last 24h)
  SELECT COUNT(*) INTO v_event_count
  FROM event_frames
  WHERE occurred_at >= extract(epoch from now() - interval '24 hours')::bigint;

  -- Get recent event IDs
  SELECT jsonb_agg(id) INTO v_recent_events
  FROM (
    SELECT id FROM event_frames
    WHERE occurred_at >= extract(epoch from now() - interval '24 hours')::bigint
    ORDER BY occurred_at DESC
    LIMIT 100
  ) recent;

  -- Calculate scenario scores
  FOR v_scenario IN SELECT id, code FROM scenario_definitions WHERE is_active = true LOOP
    v_scenario_scores := v_scenario_scores || jsonb_build_object(
      v_scenario.code,
      update_scenario_score(v_scenario.id)
    );
  END LOOP;

  -- Count active scenarios (score > base_threshold)
  SELECT COUNT(*) INTO v_scenario_count
  FROM scenario_definitions sd
  WHERE is_active = true
    AND (v_scenario_scores->>sd.code)::real > sd.base_threshold;

  -- Calculate global tension score (average of active scenario scores)
  SELECT COALESCE(AVG((value)::text::real), 0.0) INTO v_tension_score
  FROM jsonb_each(v_scenario_scores);

  -- Determine alert level
  v_alert_level := CASE
    WHEN v_tension_score >= 0.8 THEN 'critical'
    WHEN v_tension_score >= 0.6 THEN 'high'
    WHEN v_tension_score >= 0.3 THEN 'medium'
    ELSE 'low'
  END;

  -- Update singleton row
  UPDATE world_state_live
  SET
    last_updated_at = extract(epoch from now())::bigint,
    global_tension_score = v_tension_score,
    alert_level = v_alert_level,
    active_event_count = v_event_count,
    active_scenario_count = v_scenario_count,
    active_event_frames = COALESCE(v_recent_events, '[]'),
    scenario_scores = v_scenario_scores,
    version = version + 1
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Function to create daily snapshot
CREATE OR REPLACE FUNCTION create_daily_snapshot()
RETURNS void AS $$
DECLARE
  v_date INTEGER;
  v_event_counts_by_type JSONB := '{}';
  v_event_counts_by_severity JSONB := '{}';
  v_active_scenarios JSONB;
  v_current_state RECORD;
BEGIN
  -- Get date in YYYYMMDD format
  v_date := to_char(now(), 'YYYYMMDD')::integer;

  -- Check if snapshot already exists
  IF EXISTS (SELECT 1 FROM world_state_daily WHERE date = v_date) THEN
    RETURN;
  END IF;

  -- Get current state
  SELECT * INTO v_current_state FROM world_state_live WHERE id = 1;

  -- Count events by type (last 24h)
  SELECT jsonb_object_agg(event_type, count)
  INTO v_event_counts_by_type
  FROM (
    SELECT event_type, COUNT(*)::integer as count
    FROM event_frames
    WHERE occurred_at >= extract(epoch from now() - interval '24 hours')::bigint
    GROUP BY event_type
  ) type_counts;

  -- Count events by severity (last 24h)
  SELECT jsonb_object_agg(severity::text, count)
  INTO v_event_counts_by_severity
  FROM (
    SELECT severity, COUNT(*)::integer as count
    FROM event_frames
    WHERE occurred_at >= extract(epoch from now() - interval '24 hours')::bigint
    GROUP BY severity
  ) severity_counts;

  -- Get active scenario codes
  SELECT jsonb_agg(code)
  INTO v_active_scenarios
  FROM scenario_definitions sd
  WHERE is_active = true
    AND (v_current_state.scenario_scores->>sd.code)::real > sd.base_threshold;

  -- Insert daily snapshot
  INSERT INTO world_state_daily (
    date,
    global_tension_score,
    alert_level,
    total_events,
    event_counts_by_type,
    event_counts_by_severity,
    active_scenarios,
    scenario_scores,
    calculated_at
  ) VALUES (
    v_date,
    v_current_state.global_tension_score,
    v_current_state.alert_level,
    v_current_state.active_event_count,
    COALESCE(v_event_counts_by_type, '{}'),
    COALESCE(v_event_counts_by_severity, '{}'),
    COALESCE(v_active_scenarios, '[]'),
    v_current_state.scenario_scores,
    extract(epoch from now())::bigint
  );
END;
$$ LANGUAGE plpgsql;

-- Function to extract and update country relations from events
CREATE OR REPLACE FUNCTION update_country_relations_from_event(
  p_event_frame_id BIGINT
)
RETURNS void AS $$
DECLARE
  v_event RECORD;
  v_attacker TEXT;
  v_target TEXT;
  v_relation_type TEXT;
  v_strength REAL;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM event_frames WHERE id = p_event_frame_id;

  -- Extract actors from JSON
  v_attacker := v_event.actors->>'attacker';
  v_target := v_event.actors->>'target';

  -- Only process if we have both actors
  IF v_attacker IS NULL OR v_target IS NULL THEN
    RETURN;
  END IF;

  -- Determine relation type and strength based on event type
  CASE v_event.event_type
    WHEN 'missile_strike', 'drone_strike', 'airstrike', 'artillery_shelling' THEN
      v_relation_type := 'hostile';
      v_strength := 0.9;
    WHEN 'diplomatic_action' THEN
      v_relation_type := 'neutral';
      v_strength := 0.5;
    WHEN 'sanction' THEN
      v_relation_type := 'adversary';
      v_strength := 0.7;
    ELSE
      v_relation_type := 'neutral';
      v_strength := 0.5;
  END CASE;

  -- Insert or update relation
  INSERT INTO relation_edges (
    entity_a,
    entity_b,
    relation_type,
    relation_strength,
    is_mutual,
    evidence_event_frame_ids,
    evidence_count,
    first_observed_at,
    last_updated_at,
    last_event_at,
    confidence
  ) VALUES (
    v_attacker,
    v_target,
    v_relation_type,
    v_strength,
    false,  -- Attack is unidirectional
    jsonb_build_array(p_event_frame_id),
    1,
    v_event.occurred_at,
    v_event.occurred_at,
    v_event.occurred_at,
    v_event.confidence
  )
  ON CONFLICT (entity_a, entity_b, relation_type) DO UPDATE
  SET
    relation_strength = LEAST((relation_edges.relation_strength + v_strength) / 2, 1.0),
    evidence_event_frame_ids = relation_edges.evidence_event_frame_ids || jsonb_build_array(p_event_frame_id),
    evidence_count = relation_edges.evidence_count + 1,
    last_updated_at = v_event.occurred_at,
    last_event_at = v_event.occurred_at,
    confidence = LEAST((relation_edges.confidence + v_event.confidence) / 2, 1.0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE world_state_live IS 'Singleton table holding current global state (id must always = 1)';
COMMENT ON TABLE world_state_daily IS 'Historical daily snapshots of global state for trend analysis';
COMMENT ON TABLE relation_edges IS 'Graph of country/organization relationships extracted from events';

COMMENT ON COLUMN world_state_live.global_tension_score IS 'Overall global tension score (0.0-1.0)';
COMMENT ON COLUMN world_state_live.alert_level IS 'Alert level: low, medium, high, critical';
COMMENT ON COLUMN world_state_live.version IS 'Version counter incremented on each update';
COMMENT ON COLUMN relation_edges.relation_strength IS 'Strength of relationship (0.0=weak, 1.0=strong)';
COMMENT ON COLUMN relation_edges.is_mutual IS 'Whether relationship is bidirectional';

-- ============================================================
-- USAGE EXAMPLES (COMMENTED OUT)
-- ============================================================

-- Update world_state_live from recent events
-- SELECT update_world_state_live();

-- Read current state
-- SELECT * FROM world_state_live WHERE id = 1;

-- Create daily snapshot (run at midnight UTC via cron)
-- SELECT create_daily_snapshot();

-- Extract relations from new event
-- SELECT update_country_relations_from_event(123);

-- Query country relations
-- SELECT * FROM relation_edges WHERE entity_a = 'USA' OR entity_b = 'USA';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Tables created: world_state_live, world_state_daily, relation_edges
-- Functions created: update_world_state_live, create_daily_snapshot, update_country_relations_from_event
-- Singleton initialized: world_state_live (id=1, tension=0.0, alert=low)
-- Backward compatible: All CREATE TABLE IF NOT EXISTS
-- Idempotent: Can run multiple times safely
