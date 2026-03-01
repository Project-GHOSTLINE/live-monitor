/**
 * Leader Intelligence Data Fetching Utility
 *
 * Provides cached data fetching for leader intelligence cards with 30s TTL.
 * Uses client-side filtering to match feed items to leaders based on country/faction.
 */

export interface LeaderIncident {
  title: string;
  time: number;
  url: string;
  source: string;
}

export interface LeaderPulse {
  events_6h: number;
  severity_score: number;
  velocity_score: number;
  confidence: number;
}

export interface LeaderRelation {
  faction: string;
  delta: number;
  evidence_urls: string[];
}

export interface LeaderIntel {
  incidents: LeaderIncident[];
  pulse: LeaderPulse;
  relations: LeaderRelation[];
}

interface CacheEntry {
  data: LeaderIntel;
  timestamp: number;
}

// In-memory cache with 30s TTL
const intelCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Get country keywords for filtering feed items
 */
function getCountryKeywords(leaderId: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'usa_trump': ['United States', 'USA', 'U.S.', 'America', 'American', 'Washington', 'Pentagon'],
    'usa_biden': ['United States', 'USA', 'U.S.', 'America', 'American', 'Washington', 'Pentagon'],
    'ru_putin': ['Russia', 'Russian', 'Moscow', 'Kremlin'],
    'cn_xi': ['China', 'Chinese', 'Beijing', 'PRC'],
    'il_netanyahu': ['Israel', 'Israeli', 'Jerusalem', 'Tel Aviv', 'IDF'],
    'ir_khamenei': ['Iran', 'Iranian', 'Tehran'],
    'ua_zelenskyy': ['Ukraine', 'Ukrainian', 'Kyiv', 'Kiev'],
    'sa_mbs': ['Saudi Arabia', 'Saudi', 'Riyadh'],
    'tr_erdogan': ['Turkey', 'Turkish', 'Ankara'],
    'uk_sunak': ['United Kingdom', 'UK', 'Britain', 'British', 'London'],
    'fr_macron': ['France', 'French', 'Paris'],
    'de_scholz': ['Germany', 'German', 'Berlin'],
  };

  return keywordMap[leaderId] || [];
}

/**
 * Filter feed items by country/faction relevance
 */
function filterItemsByLeader(items: any[], leaderId: string): any[] {
  const keywords = getCountryKeywords(leaderId);
  if (keywords.length === 0) return [];

  return items.filter((item: any) => {
    const title = (item.title_en || item.title_original || '').toLowerCase();
    const summary = (item.summary_en || '').toLowerCase();
    const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
    const places: string[] = Array.isArray(item.entity_places) ? item.entity_places : [];
    const orgs: string[] = Array.isArray(item.entity_orgs) ? item.entity_orgs : [];

    // Check if any keyword appears in title, summary, tags, places, or orgs
    return keywords.some(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      return (
        title.includes(lowerKeyword) ||
        summary.includes(lowerKeyword) ||
        tags.some((tag: string) => tag.toLowerCase().includes(lowerKeyword)) ||
        places.some((place: string) => place.toLowerCase().includes(lowerKeyword)) ||
        orgs.some((org: string) => org.toLowerCase().includes(lowerKeyword))
      );
    });
  });
}

/**
 * Calculate pulse metrics from recent items
 */
function calculatePulse(items: any[]): LeaderPulse {
  const now = Math.floor(Date.now() / 1000);
  const sixHoursAgo = now - (6 * 3600);

  // Filter items from last 6 hours
  const recentItems = items.filter((item: any) => item.published_at >= sixHoursAgo);

  // Calculate metrics
  const events_6h = recentItems.length;

  // Average severity (reliability score)
  const avgReliability = recentItems.length > 0
    ? recentItems.reduce((sum: number, item: any) => sum + (item.reliability || 3), 0) / recentItems.length
    : 3;

  const severity_score = Math.round((avgReliability / 5) * 100);

  // Velocity: events per hour in last 6h
  const velocity = events_6h / 6;
  const velocity_score = Math.min(100, Math.round(velocity * 20)); // Scale to 0-100

  // Confidence based on data volume
  const confidence = events_6h > 0 ? Math.min(100, 50 + (events_6h * 10)) : 0;

  return {
    events_6h,
    severity_score,
    velocity_score,
    confidence,
  };
}

/**
 * Calculate relations from feed items (simplified implementation)
 * In a real system, this would use NLP to detect relationships between factions
 */
function calculateRelations(items: any[], leaderId: string): LeaderRelation[] {
  // For now, return empty array as this requires more complex analysis
  // Future enhancement: analyze entity co-occurrences in feed items
  return [];
}

/**
 * Fetch leader intelligence data with caching
 */
export async function fetchLeaderIntel(leaderId: string): Promise<LeaderIntel> {
  // Check cache first
  const cached = intelCache.get(leaderId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // Fetch recent items from API (last 24 hours should be sufficient)
    const response = await fetch('/api/items?time_range=24h&limit=100');
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const data = await response.json();
    const allItems = data.items || [];

    // Filter items relevant to this leader
    const relevantItems = filterItemsByLeader(allItems, leaderId);

    // Get top 3 most recent incidents
    const incidents: LeaderIncident[] = relevantItems
      .sort((a: any, b: any) => b.published_at - a.published_at)
      .slice(0, 3)
      .map((item: any) => ({
        title: item.title_en || item.title_original || 'Untitled',
        time: item.published_at,
        url: item.source_url || item.canonical_url || '#',
        source: item.source_name || 'Unknown',
      }));

    // Calculate pulse metrics
    const pulse = calculatePulse(relevantItems);

    // Calculate relations (placeholder for now)
    const relations = calculateRelations(relevantItems, leaderId);

    const intel: LeaderIntel = {
      incidents,
      pulse,
      relations,
    };

    // Cache the result
    intelCache.set(leaderId, {
      data: intel,
      timestamp: Date.now(),
    });

    return intel;
  } catch (error) {
    console.error(`Failed to fetch intel for ${leaderId}:`, error);

    // Return empty data structure on error
    return {
      incidents: [],
      pulse: {
        events_6h: 0,
        severity_score: 0,
        velocity_score: 0,
        confidence: 0,
      },
      relations: [],
    };
  }
}

/**
 * Clear cache for a specific leader or all leaders
 */
export function clearIntelCache(leaderId?: string): void {
  if (leaderId) {
    intelCache.delete(leaderId);
  } else {
    intelCache.clear();
  }
}
