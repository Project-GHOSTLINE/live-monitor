-- Supabase Schema for Live Situation Monitor
-- Run this in Supabase SQL Editor

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
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

-- Feed items table
CREATE TABLE IF NOT EXISTS feed_items (
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
  tags JSONB,
  cluster_id BIGINT,
  entity_places JSONB,
  entity_orgs JSONB,
  reliability INTEGER NOT NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_of BIGINT REFERENCES feed_items(id),
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_items_published ON feed_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_cluster ON feed_items(cluster_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_source ON feed_items(source_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_lang ON feed_items(lang);
CREATE INDEX IF NOT EXISTS idx_feed_items_fetched ON feed_items(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_tags ON feed_items USING GIN (tags);

-- Clusters table
CREATE TABLE IF NOT EXISTS clusters (
  id BIGSERIAL PRIMARY KEY,
  representative_item_id BIGINT NOT NULL REFERENCES feed_items(id),
  title_normalized TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at BIGINT NOT NULL,
  last_updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clusters_updated ON clusters(last_updated_at DESC);

-- Translation cache table
CREATE TABLE IF NOT EXISTS translation_cache (
  id BIGSERIAL PRIMARY KEY,
  source_text_hash TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL DEFAULT 'en',
  translated_text TEXT NOT NULL,
  service TEXT NOT NULL CHECK(service IN ('deepl', 'google', 'none')),
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
  UNIQUE(source_text_hash, source_lang, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translation_lookup ON translation_cache(source_text_hash, source_lang, target_lang);

-- Ingestion logs table
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id BIGSERIAL PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id),
  status TEXT NOT NULL CHECK(status IN ('success', 'error', 'partial')),
  items_fetched INTEGER NOT NULL DEFAULT 0,
  items_new INTEGER NOT NULL DEFAULT 0,
  items_duplicate INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint
);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_created ON ingestion_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_source ON ingestion_logs(source_id);
