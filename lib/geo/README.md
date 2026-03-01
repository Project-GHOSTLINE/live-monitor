# Offline Geo-Resolution System

High-performance offline geographic resolution for conflict monitoring and real-time event mapping.

## Features

- **Offline First**: No external API calls - all data is local JSON
- **Fuzzy Matching**: Handles typos, transliterations, and aliases (Gaza/Gaza City, Kiev/Kyiv)
- **Two-Tier Resolution**: Cities (precise) → Countries (estimated centroids)
- **Strategic Focus**: Prioritizes conflict zones and geopolitically important locations
- **Fast**: Sub-millisecond resolution with indexed lookups
- **Confidence Scoring**: Clear indication of match quality (0-100)

## Architecture

```
┌─────────────────────┐
│  Feed Item          │
│  entity_places:     │
│  ["Israel", "Iran"] │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  resolveLocations() │
│                     │
│  1. Extract tokens  │
│  2. Try city match  │
│  3. Try country     │
│  4. Fuzzy if needed │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GeoLocation[]      │
│                     │
│  [{                 │
│    lat: 31.768,     │
│    lon: 35.213,     │
│    name: "Jerusalem"│
│    precision: "city"│
│    confidence: 100  │
│  }]                 │
└─────────────────────┘
```

## Data Files

### `/data/geo/country_centroids.json`

- 215 countries with ISO codes
- Capital city coordinates
- Strategic region flags
- Focus: Middle East, Eastern Europe, East Asia

### `/data/geo/city_index.json`

- 563 cities worldwide
- Emphasis on conflict zones:
  - Gaza City, Tel Aviv, Jerusalem
  - Kyiv, Donetsk, Mariupol
  - Taipei, Damascus, Baghdad
- Aliases for transliteration variants
- Strategic importance flags

## API Reference

### `resolveLocation(locationText: string): GeoLocation | null`

Resolve a single location string to coordinates.

```typescript
import { resolveLocation } from '@/lib/geo/resolveLocation';

const location = resolveLocation('Tel Aviv');
// {
//   lat: 32.0853,
//   lon: 34.7818,
//   name: 'Tel Aviv',
//   country: 'Israel',
//   iso2: 'IL',
//   precision: 'city',
//   confidence: 100,
//   method: 'exact',
//   strategic: true
// }
```

**Parameters:**
- `locationText`: Raw location string (e.g., "Gaza", "in Tehran", "Tel Aviv, Israel")

**Returns:**
- `GeoLocation` object with coordinates and metadata
- `null` if no match found

**Precision Levels:**
- `'city'`: Precise city coordinates (±10km accuracy)
- `'country'`: Country centroid/capital (±50-200km accuracy)
- `'unknown'`: Reserved for future use

**Methods:**
- `'exact'`: Perfect string match
- `'fuzzy'`: Levenshtein distance < 3 edits
- `'estimated'`: Country-level fallback

### `resolveLocations(locations: string[]): GeoLocation[]`

Batch resolve multiple locations (e.g., from `entity_places` field).

```typescript
import { resolveLocations } from '@/lib/geo/resolveLocation';

const locations = resolveLocations(['Israel', 'Iran', 'Lebanon']);
// [
//   { name: 'Jerusalem', country: 'Israel', ... },
//   { name: 'Tehran', country: 'Iran', ... },
//   { name: 'Beirut', country: 'Lebanon', ... }
// ]
```

**Parameters:**
- `locations`: Array of location strings

**Returns:**
- Array of `GeoLocation` objects (filters out nulls)

### `getBestLocation(locations: GeoLocation[]): GeoLocation | null`

Select the most relevant location from an array.

**Priority:**
1. Strategic cities (Gaza, Kyiv, Taipei)
2. High confidence matches
3. City precision over country
4. Highest confidence score

```typescript
import { getBestLocation, resolveLocations } from '@/lib/geo/resolveLocation';

const locations = resolveLocations(['Israel', 'Tel Aviv', 'Iran']);
const best = getBestLocation(locations);
// { name: 'Tel Aviv', precision: 'city', strategic: true, ... }
```

### `calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number`

Calculate distance between two locations using Haversine formula.

```typescript
import { resolveLocation, calculateDistance } from '@/lib/geo/resolveLocation';

const telAviv = resolveLocation('Tel Aviv')!;
const gaza = resolveLocation('Gaza')!;
const distance = calculateDistance(telAviv, gaza);
// ~72.5 km
```

**Returns:** Distance in kilometers

### `isStrategicLocation(location: GeoLocation): boolean`

Check if a location is in a strategic/conflict zone.

```typescript
import { resolveLocation, isStrategicLocation } from '@/lib/geo/resolveLocation';

const location = resolveLocation('Gaza City')!;
if (isStrategicLocation(location)) {
  // Prioritize in feed, show on tactical map, etc.
}
```

## Usage Examples

### Example 1: Process Feed Item

```typescript
import { resolveLocations, getBestLocation } from '@/lib/geo/resolveLocation';

interface FeedItem {
  title: string;
  entity_places: string[];
}

function processFeedItem(item: FeedItem) {
  // Parse entity_places JSON string
  const places = JSON.parse(item.entity_places);

  // Resolve all locations
  const locations = resolveLocations(places);

  // Get primary location for map display
  const primary = getBestLocation(locations);

  if (primary) {
    console.log(`Event in ${primary.name} (${primary.country})`);
    console.log(`Coordinates: ${primary.lat}, ${primary.lon}`);
    console.log(`Strategic: ${primary.strategic ? 'YES' : 'NO'}`);
  }

  return {
    ...item,
    geoLocations: locations,
    primaryLocation: primary
  };
}

// Usage with real feed data
const feedItem = {
  title: 'Strikes reported in Gaza',
  entity_places: '["Israel","Gaza City","Tel Aviv"]'
};

processFeedItem(feedItem);
// Event in Gaza City (Palestine)
// Coordinates: 31.5017, 34.4668
// Strategic: YES
```

### Example 2: Filter Strategic Events

```typescript
import { resolveLocations, isStrategicLocation } from '@/lib/geo/resolveLocation';

async function getStrategicEvents(feedItems: FeedItem[]) {
  return feedItems
    .map(item => {
      const places = JSON.parse(item.entity_places);
      const locations = resolveLocations(places);

      // Check if ANY location is strategic
      const isStrategic = locations.some(isStrategicLocation);

      return { ...item, isStrategic, locations };
    })
    .filter(item => item.isStrategic);
}
```

### Example 3: Real-time Map Updates

```typescript
import { resolveLocation } from '@/lib/geo/resolveLocation';

interface MapEvent {
  id: string;
  title: string;
  location_text: string;
  timestamp: number;
}

function createMapMarker(event: MapEvent) {
  const location = resolveLocation(event.location_text);

  if (!location) {
    console.warn(`Could not resolve: ${event.location_text}`);
    return null;
  }

  // Determine marker style based on precision
  const markerStyle =
    location.precision === 'city'
      ? 'precise-marker' // Small pin icon
      : 'area-marker'; // Large circle/region

  return {
    id: event.id,
    lat: location.lat,
    lon: location.lon,
    title: event.title,
    location: location.name,
    style: markerStyle,
    confidence: location.confidence,
    isStrategic: location.strategic || false
  };
}
```

### Example 4: Distance-Based Clustering

```typescript
import { resolveLocations, calculateDistance } from '@/lib/geo/resolveLocation';

function clusterNearbyEvents(events: MapEvent[], radiusKm: number = 50) {
  const clusters: MapEvent[][] = [];

  events.forEach(event => {
    const location = resolveLocation(event.location_text);
    if (!location) return;

    // Find existing cluster within radius
    const cluster = clusters.find(c => {
      const clusterLoc = resolveLocation(c[0].location_text);
      if (!clusterLoc) return false;

      const distance = calculateDistance(location, clusterLoc);
      return distance <= radiusKm;
    });

    if (cluster) {
      cluster.push(event);
    } else {
      clusters.push([event]);
    }
  });

  return clusters;
}
```

## Real Feed Data Patterns

Based on actual `entity_places` from the WW3 Monitor database:

```typescript
// Common patterns
resolveLocations(['Israel', 'Iran']);
resolveLocations(['Israel', 'Iran', 'Lebanon']);
resolveLocations(['Tel Aviv', 'Israel', 'Iran']);
resolveLocations(['Israel', 'Iran', 'Jordan', 'Saudi Arabia', 'UAE']);
resolveLocations(['Israel', 'Iran', 'Lebanon', 'Syria', 'Iraq', 'Yemen']);

// All resolve successfully with high confidence
```

## Performance Characteristics

- **Cold start**: ~1ms (JSON parsing + index building)
- **Resolution time**: <0.1ms per location (indexed lookups)
- **Batch processing**: ~5-10ms for 20 locations
- **Memory footprint**: ~2MB (countries + cities data)
- **Fuzzy matching overhead**: +0.5ms when exact match fails

## Extending the Dataset

### Adding New Cities

Edit `/data/geo/city_index.json`:

```json
{
  "name": "New City",
  "country": "Country Name",
  "iso2": "CC",
  "lat": 12.3456,
  "lon": 78.9012,
  "region": "Region Name",
  "strategic": true,
  "aliases": ["Alternative Name"]
}
```

### Adding New Countries

Edit `/data/geo/country_centroids.json`:

```json
{
  "iso2": "CC",
  "name": "Country Name",
  "capital": "Capital City",
  "lat": 12.3456,
  "lon": 78.9012,
  "region": "Region Name",
  "strategic": true
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test lib/geo/__tests__/resolveLocation.test.ts
```

Tests cover:
- Real feed data patterns
- Fuzzy matching edge cases
- Performance benchmarks
- Distance calculations
- Strategic location filtering

## Integration with WW3 Monitor

### Database Schema

```sql
-- Feed items table (existing)
CREATE TABLE feed_items (
  ...
  entity_places TEXT, -- JSON array: ["Israel", "Iran", "Gaza"]
  ...
);

-- Example query with geo resolution
SELECT
  id,
  title,
  entity_places,
  published_at
FROM feed_items
WHERE entity_places IS NOT NULL
ORDER BY published_at DESC
LIMIT 100;
```

### API Endpoint Example

```typescript
// /app/api/map-actions/route.ts
import { resolveLocations, getBestLocation } from '@/lib/geo/resolveLocation';
import { db } from '@/lib/db/adapter';

export async function GET(request: Request) {
  const items = db.getRecentFeedItems(100);

  const events = items
    .map(item => {
      const places = JSON.parse(item.entity_places || '[]');
      const locations = resolveLocations(places);
      const primary = getBestLocation(locations);

      if (!primary) return null;

      return {
        id: item.id,
        title: item.title_en || item.title_original,
        lat: primary.lat,
        lon: primary.lon,
        location: primary.name,
        country: primary.country,
        strategic: primary.strategic,
        timestamp: item.published_at,
        confidence: primary.confidence
      };
    })
    .filter(Boolean);

  return Response.json({ events });
}
```

## Troubleshooting

### Low Confidence Scores

If you're getting low confidence (<70%), check:
- Typos in location names
- Missing cities in `city_index.json`
- Transliteration variants need aliases

### No Match Found

Common reasons:
- Very small towns/villages (add to index if important)
- Non-standard location names (add aliases)
- Corrupted `entity_places` data

### Incorrect Country Assignment

Cities with identical names (e.g., "Paris, Texas" vs "Paris, France"):
- The system prioritizes strategic cities
- Add more context in `entity_places` (e.g., "Paris, France")
- Check the `strategic` flag to ensure proper prioritization

## License

MIT - Part of WW3 Monitor Tactical Mapping System
