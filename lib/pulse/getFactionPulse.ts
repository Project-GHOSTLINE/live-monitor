/**
 * Get real-time faction pulse from feed data
 * TODO: Wire to actual DB/API once signals are ready
 */

export interface FactionPulse {
  events_6h_count: number;
  events_24h_count: number;
  severity_breakdown: {
    high: number;
    med: number;
    low: number;
  };
  latest_items: Array<{
    title: string;
    description?: string;
    source: string;
    time: number;
    url: string;
    tags: string[];
  }>;
  trending_topics: string[];
  top_signals: Array<{
    code: string;
    count: number;
    evidence: Array<{
      title: string;
      url: string;
      source: string;
      time: number;
    }>;
  }>;
  relations_delta: Array<{
    with: string;
    delta: number;
    reason_signal_codes: string[];
  }>;
  confidence_score: number;
  updated_at: number;
}

/**
 * Fetch faction pulse from API
 * Falls back to placeholder if API not available
 */
export async function getFactionPulse(
  factionCode: string
): Promise<FactionPulse | null> {
  try {
    // Try to fetch from API
    const response = await fetch(
      `/api/items?tags=${factionCode}&limit=50&time_range=24h`
    );

    if (!response.ok) {
      return getPlaceholderPulse(factionCode);
    }

    const data = await response.json();
    const items = data.items || [];

    // Calculate pulse from items
    const now = Math.floor(Date.now() / 1000);
    const sixHoursAgo = now - 6 * 3600;
    const twentyFourHoursAgo = now - 24 * 3600;

    const items6h = items.filter((item: any) => item.published_at >= sixHoursAgo);
    const items24h = items.filter((item: any) => item.published_at >= twentyFourHoursAgo);

    // Calculate severity breakdown
    const severity = {
      high: items6h.filter((item: any) => item.reliability >= 8).length,
      med: items6h.filter((item: any) => item.reliability >= 5 && item.reliability < 8).length,
      low: items6h.filter((item: any) => item.reliability < 5).length,
    };

    // Extract trending topics from tags
    const allTags = items6h.flatMap((item: any) => item.tags || []);
    const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    const trending = Object.entries(tagCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      events_6h_count: items6h.length,
      events_24h_count: items24h.length,
      severity_breakdown: severity,
      latest_items: items6h.slice(0, 5).map((item: any) => ({
        title: item.title_en || item.title_original,
        description: item.summary_en || item.content_original?.substring(0, 150),
        source: item.source_name,
        time: item.published_at,
        url: item.canonical_url || item.source_url,
        tags: item.tags || [],
      })),
      trending_topics: trending,
      top_signals: [],
      relations_delta: [],
      confidence_score: items6h.length > 5 ? 0.8 : items6h.length > 2 ? 0.5 : 0.3,
      updated_at: now,
    };
  } catch (error) {
    console.error('Failed to fetch faction pulse:', error);
    return getPlaceholderPulse(factionCode);
  }
}

/**
 * Placeholder pulse for when API is not available
 */
function getPlaceholderPulse(factionCode: string): FactionPulse {
  const now = Math.floor(Date.now() / 1000);

  return {
    events_6h_count: 0,
    events_24h_count: 0,
    severity_breakdown: { high: 0, med: 0, low: 0 },
    latest_items: [],
    trending_topics: [],
    top_signals: [],
    relations_delta: [],
    confidence_score: 0,
    updated_at: now,
  };
}
