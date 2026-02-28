import RSSParser from 'rss-parser';
import { stripHtml, detectLanguage } from '../utils/helpers';

export interface ParsedItem {
  title: string;
  link: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
}

export interface NormalizedItem {
  canonical_url: string;
  published_at: number;
  title_original: string;
  content_original?: string;
  lang: string;
}

const parser = new RSSParser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Live Situation Monitor/1.0',
  },
});

/**
 * Fetch and parse RSS feed from URL
 */
export async function fetchRSS(url: string): Promise<ParsedItem[]> {
  try {
    const feed = await parser.parseURL(url);

    return feed.items.map(item => ({
      title: item.title || '',
      link: item.link || item.guid || '',
      pubDate: item.pubDate || item.isoDate,
      content: item.content || item['content:encoded'],
      contentSnippet: item.contentSnippet || item.summary,
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${url}:`, error);
    throw error;
  }
}

/**
 * Normalize parsed RSS item to common schema
 */
export function normalizeItem(item: ParsedItem): NormalizedItem | null {
  // Validate required fields
  if (!item.title || !item.link) {
    console.warn('Skipping item with missing title or link:', item);
    return null;
  }

  // Parse published date
  let publishedAt: number;
  if (item.pubDate) {
    publishedAt = Math.floor(new Date(item.pubDate).getTime() / 1000);
  } else {
    // Use current time if no date provided
    publishedAt = Math.floor(Date.now() / 1000);
  }

  // Clean content
  const content = item.content || item.contentSnippet;
  const cleanContent = content ? stripHtml(content) : undefined;

  // Detect language
  const lang = detectLanguage(item.title + ' ' + (cleanContent || ''));

  return {
    canonical_url: item.link,
    published_at: publishedAt,
    title_original: item.title.trim(),
    content_original: cleanContent,
    lang,
  };
}

/**
 * Fetch and normalize RSS feed
 */
export async function fetchAndNormalize(url: string): Promise<NormalizedItem[]> {
  const items = await fetchRSS(url);

  const normalized = items
    .map(normalizeItem)
    .filter((item): item is NormalizedItem => item !== null);

  return normalized;
}
