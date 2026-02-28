import { SourceType } from '@/types/feed';

export interface RSSSource {
  name: string;
  url: string;
  type: SourceType;
  reliability: number;
  language: string;
  rateLimitSeconds: number;
}

export const RSS_SOURCES: RSSSource[] = [
  // Tier 1: International Mainstream (High Reliability)
  {
    name: 'BBC News - Middle East',
    url: 'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    type: 'mainstream',
    reliability: 5,
    language: 'en',
    rateLimitSeconds: 300, // 5 min
  },
  {
    name: 'Reuters - World News',
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
    type: 'mainstream',
    reliability: 5,
    language: 'en',
    rateLimitSeconds: 300,
  },
  {
    name: 'AP News - Middle East',
    url: 'https://feedx.net/rss/ap.xml',
    type: 'mainstream',
    reliability: 5,
    language: 'en',
    rateLimitSeconds: 300,
  },

  // Tier 2: Regional Sources
  {
    name: 'Al Jazeera - English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    type: 'regional',
    reliability: 4,
    language: 'en',
    rateLimitSeconds: 300,
  },
  {
    name: 'Times of Israel',
    url: 'https://www.timesofisrael.com/feed/',
    type: 'regional',
    reliability: 4,
    language: 'en',
    rateLimitSeconds: 300,
  },
  {
    name: 'Haaretz',
    url: 'https://www.haaretz.com/cmlink/1.628752',
    type: 'regional',
    reliability: 4,
    language: 'en',
    rateLimitSeconds: 300,
  },
  {
    name: 'The Jerusalem Post',
    url: 'https://www.jpost.com/rss/rssfeedsheadlines.aspx',
    type: 'regional',
    reliability: 4,
    language: 'en',
    rateLimitSeconds: 300,
  },
  {
    name: 'Middle East Eye',
    url: 'https://www.middleeasteye.net/rss',
    type: 'regional',
    reliability: 4,
    language: 'en',
    rateLimitSeconds: 300,
  },

  // Tier 3: Humanitarian Organizations
  {
    name: 'ReliefWeb - Updates',
    url: 'https://reliefweb.int/updates/rss.xml',
    type: 'humanitarian',
    reliability: 5,
    language: 'en',
    rateLimitSeconds: 600, // 10 min
  },
  {
    name: 'UN OCHA - News',
    url: 'https://www.unocha.org/rss.xml',
    type: 'humanitarian',
    reliability: 5,
    language: 'en',
    rateLimitSeconds: 600,
  },

  // Tier 4: Official Sources
  {
    name: 'UN News - Middle East',
    url: 'https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml',
    type: 'official',
    reliability: 5,
    language: 'en',
    rateLimitSeconds: 600,
  },
  {
    name: 'UN Security Council',
    url: 'https://www.un.org/press/en/content/security-council/rss',
    type: 'official',
    reliability: 5,
    language: 'en',
    rateLimitSeconds: 1800, // 30 min
  },
];

// Source type labels
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  mainstream: 'International Media',
  regional: 'Regional Media',
  humanitarian: 'Humanitarian Orgs',
  official: 'Official Sources',
};

// Reliability level labels
export const RELIABILITY_LABELS: Record<number, string> = {
  5: 'Very High',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Very Low',
};
