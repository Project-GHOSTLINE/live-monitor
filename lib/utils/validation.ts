import { z } from 'zod';

// Zod schemas for validation
export const feedItemSchema = z.object({
  source_id: z.number(),
  source_name: z.string(),
  source_url: z.string().url(),
  canonical_url: z.string().url(),
  published_at: z.number(),
  fetched_at: z.number(),
  title_original: z.string().min(1),
  content_original: z.string().optional(),
  lang: z.string().length(2),
  title_en: z.string().optional(),
  summary_en: z.string().optional(),
  tags: z.array(z.string()).optional(),
  cluster_id: z.number().optional(),
  entity_places: z.array(z.string()).optional(),
  entity_orgs: z.array(z.string()).optional(),
  reliability: z.number().min(1).max(5),
  is_duplicate: z.boolean(),
  duplicate_of: z.number().optional(),
});

export const itemsQuerySchema = z.object({
  offset: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().max(200).nullable().optional(),
  source_type: z.string().nullable().optional(),
  reliability: z.coerce.number().min(1).max(5).nullable().optional(),
  tags: z.string().nullable().optional(),
  time_range: z.enum(['1h', '6h', '24h', '7d', 'all']).nullable().optional(),
});
