/**
 * WORKER 4: Map Events Extractor
 *
 * Extracts geolocated military events from signals for theater map visualization
 */

import { DetectedSignal, MapEvent } from '../signals/signalTypes';
import { findLocation, getCountryCentroid } from '../mapData/locations';

export interface FeedItemWithSignals {
  id: number;
  title_en: string;
  published_at: number;
  source_name: string;
  url?: string;
  tags?: string[];
  signals: DetectedSignal[];
}

/**
 * Extract map events from feed items with detected signals
 */
export function extractMapEvents(items: FeedItemWithSignals[]): MapEvent[] {
  const events: MapEvent[] = [];

  for (const item of items) {
    for (const signal of item.signals) {
      const mapEvent = signalToMapEvent(item, signal);
      if (mapEvent) {
        events.push(mapEvent);
      }
    }
  }

  return events;
}

/**
 * Convert a detected signal to a map event
 */
function signalToMapEvent(
  item: FeedItemWithSignals,
  signal: DetectedSignal
): MapEvent | null {
  // Only visualize military/strategic signals
  const visualizableSignals = [
    'SIG_AIRSTRIKE',
    'SIG_MISSILE_LAUNCH',
    'SIG_DRONE_STRIKE',
    'SIG_GROUND_INCIDENT',
    'SIG_NAVAL_INCIDENT',
    'SIG_INFRASTRUCTURE_STRIKE',
    'SIG_NUCLEAR_ACTIVITY',
  ];

  if (!visualizableSignals.includes(signal.code)) {
    return null;
  }

  // Determine event type for visualization
  const eventType = mapSignalToEventType(signal.code);
  if (!eventType) return null;

  // Extract location from title/tags
  const location = extractLocation(item.title_en, item.tags);
  if (!location) return null;

  // Extract actors (countries involved)
  const factions = extractFactions(item.title_en, item.tags);

  // Calculate severity (1-5)
  const severity = calculateSeverity(signal);

  return {
    id: `${item.id}-${signal.code}`,
    type: eventType,
    title: item.title_en,
    time: new Date(item.published_at * 1000).toISOString(),
    severity,
    confidence: signal.confidence,
    source: {
      name: item.source_name,
      url: item.url,
    },
    to: location,
    factions,
    color: determineColor(factions),
  };
}

/**
 * Map signal code to visualization event type
 */
function mapSignalToEventType(
  code: string
): MapEvent['type'] | null {
  const mapping: Record<string, MapEvent['type']> = {
    SIG_AIRSTRIKE: 'airstrike',
    SIG_MISSILE_LAUNCH: 'missile',
    SIG_DRONE_STRIKE: 'drone',
    SIG_GROUND_INCIDENT: 'tank',
    SIG_NAVAL_INCIDENT: 'naval',
    SIG_INFRASTRUCTURE_STRIKE: 'explosion',
    SIG_NUCLEAR_ACTIVITY: 'explosion',
  };

  return mapping[code] || null;
}

/**
 * Extract location from text
 * Returns lat/lon coordinates
 */
function extractLocation(
  title: string,
  tags?: string[]
): { lat: number; lon: number; label?: string } | null {
  const text = [title, ...(tags || [])].join(' ').toLowerCase();

  // Try to find a known location
  for (const word of text.split(/\s+/)) {
    const loc = findLocation(word);
    if (loc) {
      return {
        lat: loc.lat,
        lon: loc.lon,
        label: loc.name,
      };
    }
  }

  // Fallback: extract country codes from tags
  const countryCodes = tags?.filter(tag => tag.length === 2 && tag === tag.toUpperCase()) || [];
  if (countryCodes.length > 0) {
    const centroid = getCountryCentroid(countryCodes[0]);
    if (centroid) {
      return {
        ...centroid,
        label: countryCodes[0],
      };
    }
  }

  return null;
}

/**
 * Extract country codes (factions) from text
 */
function extractFactions(title: string, tags?: string[]): string[] {
  const factions: Set<string> = new Set();

  // Extract from tags (country codes)
  const countryCodes = tags?.filter(tag => tag.length === 2 && tag === tag.toUpperCase()) || [];
  countryCodes.forEach(code => factions.add(code));

  // Extract from country name mentions
  const countryMentions: Record<string, string> = {
    israel: 'IL',
    iran: 'IR',
    russia: 'RU',
    ukraine: 'UA',
    'united states': 'US',
    usa: 'US',
    china: 'CN',
    turkey: 'TR',
    lebanon: 'LB',
    hezbollah: 'LB',
    syria: 'SY',
    iraq: 'IQ',
    yemen: 'YE',
    houthi: 'YE',
  };

  const lowerTitle = title.toLowerCase();
  for (const [name, code] of Object.entries(countryMentions)) {
    if (lowerTitle.includes(name)) {
      factions.add(code);
    }
  }

  return Array.from(factions);
}

/**
 * Calculate severity (1-5) from signal
 */
function calculateSeverity(signal: DetectedSignal): 1 | 2 | 3 | 4 | 5 {
  const score = signal.weight + signal.severityBoost;

  if (score >= 7) return 5;
  if (score >= 5) return 4;
  if (score >= 3) return 3;
  if (score >= 2) return 2;
  return 1;
}

/**
 * Determine color based on factions involved
 */
function determineColor(factions: string[]): 'ally' | 'hostile' | 'neutral' {
  // Simplified - can be made more complex
  const hostile = ['IL', 'IR', 'RU'];
  const hasHostile = factions.some(f => hostile.includes(f));

  if (hasHostile) return 'hostile';
  return 'neutral';
}
