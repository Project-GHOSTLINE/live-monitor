import { FeedItem, SourceType, NewsTag } from './feed';

// API Request Types
export interface ItemsQueryParams {
  offset?: number;
  limit?: number;
  source_type?: SourceType[];
  reliability?: number;
  tags?: NewsTag[];
  time_range?: '1h' | '6h' | '24h' | '7d' | 'all';
  search?: string;
}

export interface ItemsResponse {
  items: FeedItem[];
  total: number;
  hasMore: boolean;
}

export interface IngestResponse {
  success: boolean;
  sources_processed: number;
  items_fetched: number;
  items_new: number;
  items_duplicate: number;
  duration_ms: number;
  errors: string[];
}

export interface StatsResponse {
  total_items: number;
  items_by_source_type: Record<SourceType, number>;
  items_by_tag: Record<string, number>;
  trending_keywords: string[];
  recent_logs: any[];
}
