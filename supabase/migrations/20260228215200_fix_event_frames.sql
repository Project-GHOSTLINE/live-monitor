-- Drop and recreate event_frames with correct schema

DROP TABLE IF EXISTS signal_activations CASCADE;
DROP TABLE IF EXISTS event_frames CASCADE;

CREATE TABLE event_frames (
  id BIGSERIAL PRIMARY KEY,
  feed_item_id BIGINT,
  event_type TEXT NOT NULL,
  actors JSONB,
  location JSONB,
  severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 10),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  source_reliability INTEGER NOT NULL CHECK(source_reliability BETWEEN 1 AND 5),
  evidence TEXT NOT NULL,
  occurred_at BIGINT NOT NULL,
  reported_at BIGINT NOT NULL,
  casualties JSONB,
  weapon_system TEXT,
  target_type TEXT,
  tags JSONB,
  verified BOOLEAN NOT NULL DEFAULT false,
  cluster_id BIGINT,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  updated_at BIGINT
);

CREATE INDEX idx_event_frames_occurred ON event_frames(occurred_at DESC);
CREATE INDEX idx_event_frames_severity ON event_frames(severity DESC);

CREATE TABLE signal_activations (
  id BIGSERIAL PRIMARY KEY,
  signal_id BIGINT,
  event_frame_id BIGINT,
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  activated_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
);

CREATE TABLE IF NOT EXISTS signals (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight BETWEEN 0 AND 1),
  decay_rate REAL NOT NULL DEFAULT 0.1,
  half_life_hours INTEGER NOT NULL DEFAULT 168,
  scope TEXT NOT NULL,
  requires_verification BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS scenario_definitions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  hypothesis TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_signals JSONB NOT NULL DEFAULT '[]',
  base_threshold REAL NOT NULL DEFAULT 0.3,
  impact_areas JSONB NOT NULL DEFAULT '[]',
  geographic_scope TEXT NOT NULL,
  actors_involved JSONB NOT NULL DEFAULT '[]',
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS world_state_live (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  last_updated_at BIGINT NOT NULL,
  global_tension_score REAL NOT NULL DEFAULT 0.0,
  alert_level TEXT NOT NULL DEFAULT 'low',
  active_event_count INTEGER NOT NULL DEFAULT 0,
  scenario_scores JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO world_state_live (id, last_updated_at, global_tension_score, alert_level)
VALUES (1, extract(epoch from now())::bigint, 0.0, 'low')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS relation_edges (
  id BIGSERIAL PRIMARY KEY,
  entity_a TEXT NOT NULL,
  entity_b TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  relation_strength REAL NOT NULL DEFAULT 0.5,
  last_updated_at BIGINT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5
);

INSERT INTO signals (code, name, description, category, weight, scope, requires_verification) VALUES
  ('SIG_TROOPS_MOBILIZED', 'Troop Mobilization', 'Military mobilization', 'military', 0.9, 'regional', true),
  ('SIG_AIRSPACE_CLOSED', 'Airspace Closure', 'Airspace closed', 'military', 0.8, 'regional', true),
  ('SIG_NAVAL_DEPLOYMENT', 'Naval Deployment', 'Naval deployment', 'military', 0.7, 'regional', false),
  ('SIG_EMBASSY_CLOSURE', 'Embassy Closure', 'Embassy closed', 'diplomatic', 0.75, 'global', true),
  ('SIG_SANCTIONS_IMPOSED', 'Sanctions', 'Economic sanctions', 'economic', 0.6, 'global', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO scenario_definitions (name, code, hypothesis, description, trigger_signals, geographic_scope, actors_involved) VALUES
  ('Middle East Escalation', 'SCENARIO_MIDEAST', 'Regional conflict', 'Middle East scenario', '["SIG_AIRSPACE_CLOSED"]'::jsonb, 'regional', '["Israel", "Iran"]'::jsonb)
ON CONFLICT (code) DO NOTHING;
