// Feed Item Types
export type SourceType = 'mainstream' | 'regional' | 'humanitarian' | 'official';

export interface RSSSource {
  id?: number;
  name: string;
  url: string;
  source_type: SourceType;
  reliability: number;
  language: string;
  rate_limit_seconds: number;
  last_fetched_at?: number;
  is_active: boolean;
  created_at?: number;
}

export interface FeedItem {
  id?: number;
  source_id: number;
  source_name: string;
  source_url: string;
  canonical_url: string;
  published_at: number;
  fetched_at: number;
  title_original: string;
  content_original?: string;
  lang: string;
  title_en?: string;
  summary_en?: string;
  tags?: string[];
  cluster_id?: number;
  entity_places?: string[];
  entity_orgs?: string[];
  reliability: number;
  is_duplicate: boolean;
  duplicate_of?: number;
  created_at?: number;
}

export interface Cluster {
  id?: number;
  representative_item_id: number;
  title_normalized: string;
  item_count: number;
  first_seen_at: number;
  last_updated_at: number;
}

export interface TranslationCache {
  id?: number;
  source_text_hash: string;
  source_lang: string;
  target_lang: string;
  translated_text: string;
  service: 'deepl' | 'google' | 'none';
  created_at?: number;
}

export interface IngestionLog {
  id?: number;
  source_id: number;
  status: 'success' | 'error' | 'partial';
  items_fetched: number;
  items_new: number;
  items_duplicate: number;
  error_message?: string;
  duration_ms?: number;
  created_at?: number;
}

// News tags enum
export enum NewsTag {
  SECURITY = 'Security',
  MILITARY = 'Military',
  POLITICS = 'Politics',
  DIPLOMACY = 'Diplomacy',
  HUMANITARIAN = 'Humanitarian',
  CIVILIAN_IMPACT = 'Civilian Impact',
  CEASEFIRE = 'Ceasefire',
  HOSTAGES = 'Hostages',
  REFUGEES = 'Refugees',
  PROTESTS = 'Protests',
  ECONOMY = 'Economy',
  INTERNATIONAL = 'International',
}
