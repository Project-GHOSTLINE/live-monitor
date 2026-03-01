-- =========================
-- WW3 / Conflict Core Engine (Realistic) — DB Schema v1
-- Target: PostgreSQL (Supabase)
-- Style: additive, production-safe
-- =========================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE actor_type AS ENUM ('country', 'org', 'bloc');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stance_type AS ENUM ('defensive', 'neutral', 'aggressive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'airstrike','drone_strike','missile_strike','artillery','ground_clash','naval_move',
    'interception','cyber_attack','terror_attack',
    'sanction','embargo','export_control','asset_freeze',
    'diplomacy_talks','ceasefire','treaty',
    'protest','coup','election','internal_security',
    'energy_disruption','shipping_disruption',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE signal_key AS ENUM (
    'KINETIC_ESCALATION','DE_ESCALATION','SANCTIONS_UP','SANCTIONS_DOWN',
    'DIPLOMACY_UP','CYBER_UP','INTERNAL_UNREST_UP',
    'ENERGY_RISK_UP','SHIPPING_RISK_UP'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- CORE ACTORS ----------
CREATE TABLE IF NOT EXISTS actor_profiles (
  id               text PRIMARY KEY,           -- "US", "RU", "IR", "IL", "EU", "NATO", "Houthis", etc.
  actor_type       actor_type NOT NULL,
  display_name     text NOT NULL,
  region           text,                       -- "MiddleEast", "EuropeEast", "IndoPacific", etc.
  flag_emoji       text,
  iso2             text,                       -- if country
  iso3             text,
  capital_city     text,
  centroid_lat     double precision,
  centroid_lon     double precision,
  nuclear_status   boolean,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS actor_profiles_region_idx ON actor_profiles(region);

-- ---------- BLOCS / ALLIANCES ----------
CREATE TABLE IF NOT EXISTS alliances (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,           -- "NATO", "EU", "GCC", etc.
  alliance_type text NOT NULL DEFAULT 'alliance',
  strength     numeric NOT NULL DEFAULT 0.5,   -- 0..1
  sources      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alliance_members (
  alliance_id  uuid NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  actor_id     text NOT NULL REFERENCES actor_profiles(id) ON DELETE CASCADE,
  role         text,                           -- "member", "observer", "partner"
  weight       numeric NOT NULL DEFAULT 1.0,    -- allows partial membership
  joined_on    date,
  left_on      date,
  PRIMARY KEY (alliance_id, actor_id)
);

CREATE INDEX IF NOT EXISTS alliance_members_actor_idx ON alliance_members(actor_id);

-- ---------- SANCTIONS (REALISTIC) ----------
CREATE TABLE IF NOT EXISTS sanctions_regimes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,                  -- "US sanctions on IR", "EU measures on RU", etc.
  issuer_actor text NOT NULL REFERENCES actor_profiles(id),
  target_actor text NOT NULL REFERENCES actor_profiles(id),
  kind         text NOT NULL,                  -- "financial", "trade", "tech", "travel"
  severity     smallint NOT NULL DEFAULT 1,     -- 1..5
  status       text NOT NULL DEFAULT 'active',  -- active/suspended/ended
  start_date   date,
  end_date     date,
  evidence     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sanctions_target_idx ON sanctions_regimes(target_actor, status);
CREATE INDEX IF NOT EXISTS sanctions_issuer_idx ON sanctions_regimes(issuer_actor, status);

-- ---------- STABLE COUNTRY INDICATORS (BASELINE) ----------
-- Baseline "slow-changing" metrics (military/economic/diplomatic)
CREATE TABLE IF NOT EXISTS country_baselines (
  actor_id                 text PRIMARY KEY REFERENCES actor_profiles(id) ON DELETE CASCADE,
  source_bundle            jsonb NOT NULL DEFAULT '{}'::jsonb, -- links: SIPRI, WB, IMF, etc.
  military_power_index     numeric,  -- normalized 0..1 (or store raw + normalize)
  defense_budget_usd       numeric,
  active_personnel         bigint,
  reserve_personnel        bigint,
  aircraft_total           bigint,
  tanks_total              bigint,
  naval_assets_total       bigint,

  gdp_usd                  numeric,
  gdp_growth_pct           numeric,
  inflation_pct            numeric,
  debt_to_gdp_pct          numeric,

  diplomatic_influence     numeric,  -- 0..1
  internal_stability       numeric,  -- 0..1 (baseline; news modulates live)

  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ---------- CONFLICT CORE (PERSISTENT) ----------
CREATE TABLE IF NOT EXISTS conflicts_core (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_a         text NOT NULL REFERENCES actor_profiles(id),
  actor_b         text NOT NULL REFERENCES actor_profiles(id),
  theatre         text NOT NULL,                -- "MiddleEast", "EuropeEast", ...
  base_hostility  numeric NOT NULL DEFAULT 0.5, -- 0..1
  base_tension    numeric NOT NULL DEFAULT 0.2, -- 0..1
  importance      numeric NOT NULL DEFAULT 0.5, -- 0..1 (weights global impact)
  known_since     date,
  tags            text[] NOT NULL DEFAULT ARRAY[]::text[],
  sources         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conflicts_core_pair_unique UNIQUE (actor_a, actor_b)
);

CREATE INDEX IF NOT EXISTS conflicts_core_theatre_idx ON conflicts_core(theatre);
CREATE INDEX IF NOT EXISTS conflicts_core_actor_a_idx ON conflicts_core(actor_a);
CREATE INDEX IF NOT EXISTS conflicts_core_actor_b_idx ON conflicts_core(actor_b);

-- Optional: conflict zones for map/theatre highlighting
CREATE TABLE IF NOT EXISTS conflict_zones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theatre     text NOT NULL,
  name        text NOT NULL,
  actors      text[] NOT NULL DEFAULT ARRAY[]::text[],
  bbox        jsonb,                 -- {minLat,maxLat,minLon,maxLon} OR {centerLat,centerLon,radiusKm}
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conflict_zones_theatre_idx ON conflict_zones(theatre);

-- ---------- NEWS INGESTION (RAW + CANONICAL) ----------
CREATE TABLE IF NOT EXISTS feed_sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  kind          text NOT NULL,                  -- rss, api, social, etc.
  url           text,
  credibility   numeric NOT NULL DEFAULT 0.6,   -- 0..1
  enabled       boolean NOT NULL DEFAULT true,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    uuid REFERENCES feed_sources(id),
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  url          text,
  title        text,
  summary      text,
  content      text,
  lang         text,
  published_at timestamptz,
  raw          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS raw_items_published_idx ON raw_items(published_at DESC);
CREATE INDEX IF NOT EXISTS raw_items_source_idx ON raw_items(source_id, published_at DESC);

-- Canonical / deduped items
CREATE TABLE IF NOT EXISTS canonical_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_hash text NOT NULL UNIQUE,          -- sha256(url+title+date) etc.
  source_id      uuid REFERENCES feed_sources(id),
  url            text,
  title          text,
  summary        text,
  content        text,
  lang           text,
  published_at   timestamptz,
  credibility    numeric NOT NULL DEFAULT 0.6,  -- inherits + adjusted
  entities       jsonb NOT NULL DEFAULT '{}'::jsonb, -- {countries:[], orgs:[], people:[], places:[]}
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS canonical_items_published_idx ON canonical_items(published_at DESC);

-- ---------- EVENT FRAMES (STRUCTURED EVENTS) ----------
CREATE TABLE IF NOT EXISTS event_frames (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id  uuid NOT NULL REFERENCES canonical_items(id) ON DELETE CASCADE,
  event_type    event_type NOT NULL DEFAULT 'unknown',
  theatre       text,
  severity      smallint NOT NULL DEFAULT 1,     -- 1..5
  confidence    numeric NOT NULL DEFAULT 0.3,    -- 0..1
  actors        jsonb NOT NULL DEFAULT '{}'::jsonb, -- {attacker:"", target:"", actors:["US","IR"], method:"pattern"}
  location      jsonb NOT NULL DEFAULT '{}'::jsonb, -- {country:"", city:"", lat,lon}
  evidence      jsonb NOT NULL DEFAULT '{}'::jsonb, -- {url, published_at, source_name}
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_frames_created_idx ON event_frames(created_at DESC);
CREATE INDEX IF NOT EXISTS event_frames_type_idx ON event_frames(event_type);
CREATE INDEX IF NOT EXISTS event_frames_theatre_idx ON event_frames(theatre);

-- ---------- SIGNALS + ACTIVATIONS ----------
CREATE TABLE IF NOT EXISTS signal_impacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           signal_key NOT NULL UNIQUE,
  description   text,
  weight        numeric NOT NULL DEFAULT 0.5,   -- 0..1
  affects       jsonb NOT NULL DEFAULT '{}'::jsonb
  -- affects example:
  -- {"tension":0.12,"heat":0.10,"shipping_risk":0.05,"energy_risk":0.08,"internal_stability":-0.03}
);

CREATE TABLE IF NOT EXISTS signal_activations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_frame_id uuid NOT NULL REFERENCES event_frames(id) ON DELETE CASCADE,
  key           signal_key NOT NULL,
  impact        numeric NOT NULL DEFAULT 0.1,   -- computed per activation
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signal_activations_frame_idx ON signal_activations(event_frame_id);
CREATE INDEX IF NOT EXISTS signal_activations_key_idx ON signal_activations(key, created_at DESC);

-- ---------- CONFLICT EVENTS (AMPLIFICATION / CLUSTER) ----------
CREATE TABLE IF NOT EXISTS conflict_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id   uuid NOT NULL REFERENCES conflicts_core(id) ON DELETE CASCADE,
  window_start  timestamptz NOT NULL,
  window_end    timestamptz NOT NULL,
  event_type    event_type NOT NULL DEFAULT 'unknown',
  severity      smallint NOT NULL DEFAULT 1,
  impact_score  numeric NOT NULL DEFAULT 0.1,  -- 0..1
  evidence_urls jsonb NOT NULL DEFAULT '[]'::jsonb, -- max 5
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conflict_events_conflict_idx ON conflict_events(conflict_id, window_start DESC);

-- ---------- LIVE CONFLICT STATE ----------
CREATE TABLE IF NOT EXISTS conflict_state_live (
  conflict_id       uuid PRIMARY KEY REFERENCES conflicts_core(id) ON DELETE CASCADE,
  tension           numeric NOT NULL DEFAULT 0.0, -- 0..1
  heat              numeric NOT NULL DEFAULT 0.0, -- 0..1
  velocity          numeric NOT NULL DEFAULT 0.0, -- 0..1
  momentum          numeric NOT NULL DEFAULT 0.0, -- 0..1 (v2 ready)
  pressure          numeric NOT NULL DEFAULT 0.0, -- 0..1 (v2 ready)
  instability       numeric NOT NULL DEFAULT 0.0, -- 0..1 (v2 ready)
  last_event_at     timestamptz,
  top_drivers       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conflict_state_live_updated_idx ON conflict_state_live(updated_at DESC);

-- ---------- RELATIONS (DERIVED OUTPUT) ----------
CREATE TABLE IF NOT EXISTS relation_edges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_from      text NOT NULL REFERENCES actor_profiles(id),
  actor_to        text NOT NULL REFERENCES actor_profiles(id),
  relation_score  integer NOT NULL DEFAULT 0,  -- -100..100
  status          text NOT NULL DEFAULT 'neutral',
  evidence        jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT relation_edges_unique UNIQUE(actor_from, actor_to)
);

CREATE INDEX IF NOT EXISTS relation_edges_from_idx ON relation_edges(actor_from);
CREATE INDEX IF NOT EXISTS relation_edges_to_idx ON relation_edges(actor_to);

-- ---------- WORLD STATE (GLOBAL + PER ACTOR) ----------
-- Live per-actor state (what your UI reads)
CREATE TABLE IF NOT EXISTS world_state_live (
  actor_id            text PRIMARY KEY REFERENCES actor_profiles(id) ON DELETE CASCADE,
  stance              stance_type NOT NULL DEFAULT 'neutral',
  readiness_score     integer NOT NULL DEFAULT 50, -- 0..100
  defcon              smallint NOT NULL DEFAULT 5,  -- 1..5
  global_alert        text NOT NULL DEFAULT 'LOW',
  economic_risk       numeric NOT NULL DEFAULT 0.0, -- 0..1
  energy_risk         numeric NOT NULL DEFAULT 0.0, -- 0..1
  shipping_risk       numeric NOT NULL DEFAULT 0.0, -- 0..1
  cyber_risk          numeric NOT NULL DEFAULT 0.0, -- 0..1
  internal_risk       numeric NOT NULL DEFAULT 0.0, -- 0..1
  top_conflicts       jsonb NOT NULL DEFAULT '[]'::jsonb, -- conflict_ids + evidence
  breakdown           jsonb NOT NULL DEFAULT '{}'::jsonb,  -- explainable components
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS world_state_live_updated_idx ON world_state_live(updated_at DESC);

-- Daily snapshots for deltas / history charts
CREATE TABLE IF NOT EXISTS world_state_daily (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day          date NOT NULL,
  actor_id     text NOT NULL REFERENCES actor_profiles(id) ON DELETE CASCADE,
  snapshot     jsonb NOT NULL,                 -- store the whole computed state
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT world_state_daily_unique UNIQUE(day, actor_id)
);

CREATE INDEX IF NOT EXISTS world_state_daily_day_idx ON world_state_daily(day DESC);

-- ---------- MAP ACTIONS (VISUALIZATION) ----------
CREATE TABLE IF NOT EXISTS map_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  theatre      text,
  action_type  text NOT NULL,                 -- "strike_arc","impact_ping","naval_move","front_pulse"
  actor_from   text,
  actor_to     text,
  origin       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {lat,lon,label}
  target       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {lat,lon,label}
  intensity    numeric NOT NULL DEFAULT 0.5,        -- 0..1
  evidence     jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS map_actions_created_idx ON map_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS map_actions_theatre_idx ON map_actions(theatre, created_at DESC);

-- ---------- OPTIONAL: AUDIT / JOB RUNS ----------
CREATE TABLE IF NOT EXISTS job_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    text NOT NULL,
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  status      text NOT NULL DEFAULT 'running', -- running/success/fail
  stats       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error       text
);

CREATE INDEX IF NOT EXISTS job_runs_job_idx ON job_runs(job_name, started_at DESC);
