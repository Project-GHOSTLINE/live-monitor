/**
 * Geo-Resolution System - Practical Examples
 *
 * Real-world usage patterns for WW3 Monitor tactical mapping
 */

import {
  resolveLocation,
  resolveLocations,
  getBestLocation,
  calculateDistance,
  isStrategicLocation,
  type GeoLocation,
} from './resolveLocation';

// ============================================================================
// Example 1: Process Database Feed Items
// ============================================================================

interface FeedItem {
  id: number;
  title_en: string | null;
  title_original: string;
  entity_places: string | null;
  published_at: number;
  tags: string | null;
}

interface EnrichedFeedItem extends FeedItem {
  geoLocations: GeoLocation[];
  primaryLocation: GeoLocation | null;
  isStrategic: boolean;
  locationSummary: string;
}

export function enrichFeedItemWithGeo(item: FeedItem): EnrichedFeedItem {
  // Parse entity_places JSON string
  let places: string[] = [];
  try {
    places = item.entity_places ? JSON.parse(item.entity_places) : [];
  } catch (error) {
    console.warn(`Failed to parse entity_places for item ${item.id}:`, error);
  }

  // Resolve all locations
  const geoLocations = resolveLocations(places);

  // Get primary location for map display
  const primaryLocation = getBestLocation(geoLocations);

  // Check if event is in strategic zone
  const isStrategic = geoLocations.some(isStrategicLocation);

  // Create human-readable summary
  const locationSummary = createLocationSummary(geoLocations, primaryLocation);

  return {
    ...item,
    geoLocations,
    primaryLocation,
    isStrategic,
    locationSummary,
  };
}

function createLocationSummary(
  locations: GeoLocation[],
  primary: GeoLocation | null
): string {
  if (!primary) {
    return 'Location unknown';
  }

  if (locations.length === 1) {
    return `${primary.name}, ${primary.country}`;
  }

  // Multiple locations - show primary + count
  const others = locations.length - 1;
  return `${primary.name}, ${primary.country} +${others} location${others > 1 ? 's' : ''}`;
}

// ============================================================================
// Example 2: Create Map Markers for Real-time Display
// ============================================================================

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  title: string;
  location: string;
  timestamp: number;
  markerType: 'precise' | 'area' | 'estimated';
  priority: 'high' | 'medium' | 'low';
  tooltipText: string;
}

export function createMapMarker(item: EnrichedFeedItem): MapMarker | null {
  if (!item.primaryLocation) {
    return null;
  }

  const loc = item.primaryLocation;

  // Determine marker type based on precision
  let markerType: MapMarker['markerType'];
  if (loc.precision === 'city' && loc.confidence >= 90) {
    markerType = 'precise';
  } else if (loc.precision === 'city') {
    markerType = 'area';
  } else {
    markerType = 'estimated';
  }

  // Determine priority
  let priority: MapMarker['priority'];
  if (loc.strategic && loc.precision === 'city') {
    priority = 'high';
  } else if (loc.strategic || loc.precision === 'city') {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  // Create tooltip
  const tooltipText = [
    item.title_en || item.title_original,
    `Location: ${item.locationSummary}`,
    `Confidence: ${Math.round(loc.confidence)}%`,
    loc.strategic ? '⚠️ Strategic Zone' : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    id: `feed-${item.id}`,
    lat: loc.lat,
    lon: loc.lon,
    title: item.title_en || item.title_original,
    location: item.locationSummary,
    timestamp: item.published_at,
    markerType,
    priority,
    tooltipText,
  };
}

// ============================================================================
// Example 3: Filter Strategic Events for Alert System
// ============================================================================

export function filterStrategicEvents(items: FeedItem[]): EnrichedFeedItem[] {
  return items
    .map(enrichFeedItemWithGeo)
    .filter(item => item.isStrategic)
    .sort((a, b) => {
      // Sort by: strategic confidence desc, then timestamp desc
      const confA = a.primaryLocation?.confidence || 0;
      const confB = b.primaryLocation?.confidence || 0;

      if (confA !== confB) {
        return confB - confA;
      }

      return b.published_at - a.published_at;
    });
}

// ============================================================================
// Example 4: Cluster Nearby Events
// ============================================================================

export interface EventCluster {
  centroid: { lat: number; lon: number };
  events: EnrichedFeedItem[];
  radius: number; // km
  primaryLocation: string;
  isStrategic: boolean;
}

export function clusterNearbyEvents(
  items: EnrichedFeedItem[],
  radiusKm: number = 50
): EventCluster[] {
  const clusters: EventCluster[] = [];

  // Only process items with resolved locations
  const itemsWithLocations = items.filter(item => item.primaryLocation !== null);

  itemsWithLocations.forEach(item => {
    const loc = item.primaryLocation!;

    // Find existing cluster within radius
    const existingCluster = clusters.find(cluster => {
      const distance = calculateDistance(
        { lat: cluster.centroid.lat, lon: cluster.centroid.lon } as GeoLocation,
        loc
      );
      return distance <= radiusKm;
    });

    if (existingCluster) {
      // Add to existing cluster
      existingCluster.events.push(item);

      // Update centroid (weighted average)
      const totalEvents = existingCluster.events.length;
      existingCluster.centroid.lat =
        (existingCluster.centroid.lat * (totalEvents - 1) + loc.lat) / totalEvents;
      existingCluster.centroid.lon =
        (existingCluster.centroid.lon * (totalEvents - 1) + loc.lon) / totalEvents;

      // Update strategic flag
      if (item.isStrategic) {
        existingCluster.isStrategic = true;
      }
    } else {
      // Create new cluster
      clusters.push({
        centroid: { lat: loc.lat, lon: loc.lon },
        events: [item],
        radius: radiusKm,
        primaryLocation: loc.name,
        isStrategic: item.isStrategic,
      });
    }
  });

  return clusters.sort((a, b) => {
    // Sort by: strategic first, then event count desc
    if (a.isStrategic && !b.isStrategic) return -1;
    if (!a.isStrategic && b.isStrategic) return 1;

    return b.events.length - a.events.length;
  });
}

// ============================================================================
// Example 5: Distance-Based Event Correlation
// ============================================================================

export interface RelatedEvent {
  event: EnrichedFeedItem;
  distance: number; // km
  timeDelta: number; // seconds
}

export function findRelatedEvents(
  targetEvent: EnrichedFeedItem,
  allEvents: EnrichedFeedItem[],
  maxDistanceKm: number = 200,
  maxTimeSeconds: number = 86400 // 24 hours
): RelatedEvent[] {
  if (!targetEvent.primaryLocation) {
    return [];
  }

  const targetLoc = targetEvent.primaryLocation;
  const targetTime = targetEvent.published_at;

  return allEvents
    .filter(event => {
      // Exclude self
      if (event.id === targetEvent.id) return false;

      // Must have location
      if (!event.primaryLocation) return false;

      return true;
    })
    .map(event => {
      const distance = calculateDistance(targetLoc, event.primaryLocation!);
      const timeDelta = Math.abs(event.published_at - targetTime);

      return {
        event,
        distance,
        timeDelta,
      };
    })
    .filter(related => {
      return related.distance <= maxDistanceKm && related.timeDelta <= maxTimeSeconds;
    })
    .sort((a, b) => {
      // Sort by combined score: distance + time
      const scoreA = a.distance / maxDistanceKm + a.timeDelta / maxTimeSeconds;
      const scoreB = b.distance / maxDistanceKm + b.timeDelta / maxTimeSeconds;

      return scoreA - scoreB;
    });
}

// ============================================================================
// Example 6: Generate Heatmap Data
// ============================================================================

export interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number; // 0-1
}

export function generateHeatmapData(
  items: EnrichedFeedItem[],
  options: {
    timeWindowSeconds?: number;
    prioritizeStrategic?: boolean;
  } = {}
): HeatmapPoint[] {
  const { timeWindowSeconds = 604800, prioritizeStrategic = true } = options; // 7 days default

  const now = Math.floor(Date.now() / 1000);
  const cutoffTime = now - timeWindowSeconds;

  // Filter to recent events with locations
  const recentEvents = items.filter(
    item => item.primaryLocation && item.published_at >= cutoffTime
  );

  // Group by location
  const locationCounts = new Map<string, { location: GeoLocation; count: number }>();

  recentEvents.forEach(item => {
    const loc = item.primaryLocation!;
    const key = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;

    if (!locationCounts.has(key)) {
      locationCounts.set(key, { location: loc, count: 0 });
    }

    const entry = locationCounts.get(key)!;

    // Weight strategic locations higher
    const weight = prioritizeStrategic && item.isStrategic ? 2 : 1;
    entry.count += weight;
  });

  // Find max count for normalization
  const maxCount = Math.max(...Array.from(locationCounts.values()).map(e => e.count));

  // Convert to heatmap points
  return Array.from(locationCounts.values()).map(({ location, count }) => ({
    lat: location.lat,
    lon: location.lon,
    intensity: count / maxCount,
  }));
}

// ============================================================================
// Example 7: Real Database Query Integration
// ============================================================================

export async function getStrategicEventsForMap(
  db: any, // DatabaseAdapter instance
  limit: number = 100
): Promise<MapMarker[]> {
  // Fetch recent feed items from database
  const items: FeedItem[] = db
    .prepare(
      `
    SELECT
      id,
      title_en,
      title_original,
      entity_places,
      published_at,
      tags
    FROM feed_items
    WHERE entity_places IS NOT NULL
      AND entity_places != '[]'
    ORDER BY published_at DESC
    LIMIT ?
  `
    )
    .all(limit);

  // Enrich with geo data
  const enriched = items.map(enrichFeedItemWithGeo);

  // Filter to strategic events only
  const strategic = enriched.filter(item => item.isStrategic);

  // Create map markers
  const markers = strategic.map(createMapMarker).filter((m): m is MapMarker => m !== null);

  return markers;
}

// ============================================================================
// Example 8: Statistics and Analytics
// ============================================================================

export interface GeoStatistics {
  totalEvents: number;
  resolvedEvents: number;
  resolutionRate: number; // percentage
  strategicEvents: number;
  strategicRate: number; // percentage
  topLocations: Array<{ name: string; country: string; count: number }>;
  topCountries: Array<{ name: string; count: number }>;
  averageConfidence: number;
  precisionBreakdown: {
    city: number;
    country: number;
    unknown: number;
  };
}

export function calculateGeoStatistics(items: EnrichedFeedItem[]): GeoStatistics {
  const totalEvents = items.length;
  const resolvedEvents = items.filter(item => item.primaryLocation !== null).length;
  const strategicEvents = items.filter(item => item.isStrategic).length;

  // Location counts
  const locationCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  let totalConfidence = 0;
  let confidenceCount = 0;

  const precisionBreakdown = {
    city: 0,
    country: 0,
    unknown: 0,
  };

  items.forEach(item => {
    if (item.primaryLocation) {
      const loc = item.primaryLocation;

      // Track location
      const locKey = `${loc.name}|${loc.country}`;
      locationCounts.set(locKey, (locationCounts.get(locKey) || 0) + 1);

      // Track country
      if (loc.country) {
        countryCounts.set(loc.country, (countryCounts.get(loc.country) || 0) + 1);
      }

      // Track confidence
      totalConfidence += loc.confidence;
      confidenceCount++;

      // Track precision
      precisionBreakdown[loc.precision]++;
    }
  });

  // Top locations
  const topLocations = Array.from(locationCounts.entries())
    .map(([key, count]) => {
      const [name, country] = key.split('|');
      return { name, country, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top countries
  const topCountries = Array.from(countryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents,
    resolvedEvents,
    resolutionRate: (resolvedEvents / totalEvents) * 100,
    strategicEvents,
    strategicRate: (strategicEvents / totalEvents) * 100,
    topLocations,
    topCountries,
    averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
    precisionBreakdown,
  };
}
