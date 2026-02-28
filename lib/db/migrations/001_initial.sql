-- Live Situation Monitor - Database Schema
-- Migration 001: Initial schema

-- Sources configuration table
CREATE TABLE IF NOT EXISTS sources (
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

-- Feed items table
CREATE TABLE IF NOT EXISTS feed_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,

  -- URLs
  canonical_url TEXT NOT NULL UNIQUE,

  -- Timestamps
  published_at INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,

  -- Content
  title_original TEXT NOT NULL,
  content_original TEXT,
  lang TEXT NOT NULL,
  title_en TEXT,
  summary_en TEXT,

  -- Processing
  tags TEXT,
  cluster_id INTEGER,
  entity_places TEXT,
  entity_orgs TEXT,

  -- Metadata
  reliability INTEGER NOT NULL,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  duplicate_of INTEGER,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (duplicate_of) REFERENCES feed_items(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feed_items_published ON feed_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_cluster ON feed_items(cluster_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_source ON feed_items(source_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_lang ON feed_items(lang);
CREATE INDEX IF NOT EXISTS idx_feed_items_fetched ON feed_items(fetched_at DESC);

-- Clusters table
CREATE TABLE IF NOT EXISTS clusters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  representative_item_id INTEGER NOT NULL,
  title_normalized TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at INTEGER NOT NULL,
  last_updated_at INTEGER NOT NULL,

  FOREIGN KEY (representative_item_id) REFERENCES feed_items(id)
);

CREATE INDEX IF NOT EXISTS idx_clusters_updated ON clusters(last_updated_at DESC);

-- Translation cache table
CREATE TABLE IF NOT EXISTS translation_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_text_hash TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL DEFAULT 'en',
  translated_text TEXT NOT NULL,
  service TEXT NOT NULL CHECK(service IN ('deepl', 'google', 'none')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(source_text_hash, source_lang, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translation_lookup ON translation_cache(source_text_hash, source_lang, target_lang);

-- Ingestion logs table
CREATE TABLE IF NOT EXISTS ingestion_logs (
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

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_created ON ingestion_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_source ON ingestion_logs(source_id);
