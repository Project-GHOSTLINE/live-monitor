/**
 * Offline Geo-Resolution System
 *
 * Resolves location text from feed items to geographic coordinates.
 * Uses offline datasets with intelligent fuzzy matching and estimation rules.
 *
 * Architecture:
 * - No external API calls - fully offline resolution
 * - Two-tier system: cities (precise) -> countries (estimated)
 * - Fuzzy matching with Levenshtein distance for typos/variants
 * - Clear estimation confidence scoring
 */

import countriesData from '@/data/geo/country_centroids.json';
import citiesData from '@/data/geo/city_index.json';

// Types
export interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
  country?: string;
  iso2?: string;
  precision: 'city' | 'country' | 'unknown';
  confidence: number; // 0-100
  method: 'exact' | 'fuzzy' | 'estimated';
  strategic?: boolean;
}

interface Country {
  iso2: string;
  name: string;
  capital: string;
  lat: number;
  lon: number;
  region: string;
  strategic?: boolean;
}

interface City {
  name: string;
  country: string;
  iso2: string;
  lat: number;
  lon: number;
  region: string;
  strategic?: boolean;
  aliases?: string[];
}

// Load data
const countries: Country[] = countriesData.countries;
const cities: City[] = citiesData.cities;

// Build fast lookup indexes
const countryByName = new Map<string, Country>();
const countryByIso = new Map<string, Country>();
const cityByName = new Map<string, City[]>();

// Initialize indexes
countries.forEach(country => {
  countryByName.set(country.name.toLowerCase(), country);
  countryByIso.set(country.iso2.toLowerCase(), country);
});

cities.forEach(city => {
  const key = city.name.toLowerCase();
  if (!cityByName.has(key)) {
    cityByName.set(key, []);
  }
  cityByName.get(key)!.push(city);

  // Index aliases
  if (city.aliases) {
    city.aliases.forEach(alias => {
      const aliasKey = alias.toLowerCase();
      if (!cityByName.has(aliasKey)) {
        cityByName.set(aliasKey, []);
      }
      cityByName.get(aliasKey)!.push(city);
    });
  }
});

/**
 * Levenshtein distance for fuzzy matching
 * Handles typos, transliterations, and minor variations
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate fuzzy match score (0-100)
 */
function fuzzyScore(query: string, target: string): number {
  const distance = levenshtein(query.toLowerCase(), target.toLowerCase());
  const maxLen = Math.max(query.length, target.length);

  if (maxLen === 0) return 100;

  const similarity = ((maxLen - distance) / maxLen) * 100;
  return Math.max(0, Math.min(100, similarity));
}

/**
 * Extract location entities from text
 * Handles patterns like "in Gaza", "Tel Aviv, Israel", "from Tehran"
 */
function extractLocationTokens(text: string): string[] {
  if (!text || text.trim() === '') return [];

  // Remove common prepositions and articles
  const cleaned = text
    .replace(/\b(in|from|at|to|near|around|outside|inside|within)\b/gi, ' ')
    .replace(/\b(the|a|an)\b/gi, ' ')
    .trim();

  // Split by common delimiters
  const tokens = cleaned
    .split(/[,;\-\/]/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Also add the full cleaned string
  if (cleaned.length > 0 && !tokens.includes(cleaned)) {
    tokens.unshift(cleaned);
  }

  return tokens;
}

/**
 * Find city with fuzzy matching
 */
function findCity(query: string): { city: City; score: number; method: 'exact' | 'fuzzy' } | null {
  const queryLower = query.toLowerCase().trim();

  // Exact match
  const exactMatches = cityByName.get(queryLower);
  if (exactMatches && exactMatches.length > 0) {
    // Prefer strategic cities in case of ambiguity
    const strategic = exactMatches.find(c => c.strategic);
    return {
      city: strategic || exactMatches[0],
      score: 100,
      method: 'exact'
    };
  }

  // Fuzzy matching
  let bestCity: City | null = null;
  let bestScore = 0;

  cityByName.forEach((citiesArr, name) => {
    const score = fuzzyScore(queryLower, name);

    // Only consider matches with >70% similarity
    if (score > 70 && score > bestScore) {
      // Prefer strategic cities with equal scores
      const strategic = citiesArr.find(c => c.strategic);
      const selectedCity = strategic || citiesArr[0];
      if (selectedCity) {
        bestCity = selectedCity;
        bestScore = score;
      }
    }
  });

  if (bestCity && bestScore > 0) {
    return {
      city: bestCity,
      score: bestScore,
      method: 'fuzzy'
    };
  }

  return null;
}

/**
 * Find country with fuzzy matching
 */
function findCountry(query: string): { country: Country; score: number; method: 'exact' | 'fuzzy' } | null {
  const queryLower = query.toLowerCase().trim();

  // Exact match by name
  const exactMatch = countryByName.get(queryLower);
  if (exactMatch) {
    return {
      country: exactMatch,
      score: 100,
      method: 'exact'
    };
  }

  // Exact match by ISO code
  const isoMatch = countryByIso.get(queryLower);
  if (isoMatch) {
    return {
      country: isoMatch,
      score: 100,
      method: 'exact'
    };
  }

  // Fuzzy matching
  let bestCountry: Country | null = null;
  let bestScore = 0;

  countryByName.forEach((country, name) => {
    const score = fuzzyScore(queryLower, name);

    // Only consider matches with >75% similarity for countries
    if (score > 75 && score > bestScore) {
      bestCountry = country;
      bestScore = score;
    }
  });

  if (bestCountry && bestScore > 75) {
    return {
      country: bestCountry,
      score: bestScore,
      method: 'fuzzy'
    };
  }

  return null;
}

/**
 * Main resolution function
 *
 * Resolution strategy:
 * 1. Try to find specific city (highest precision)
 * 2. Fall back to country centroid (estimated)
 * 3. Return null if no match
 *
 * @param locationText - Raw location text from feed item (e.g., "Gaza City", "Tel Aviv, Israel")
 * @returns GeoLocation with coordinates and metadata, or null if no match
 */
export function resolveLocation(locationText: string | null | undefined): GeoLocation | null {
  if (!locationText || locationText.trim() === '') {
    return null;
  }

  const tokens = extractLocationTokens(locationText);

  if (tokens.length === 0) {
    return null;
  }

  // Strategy 1: Try to find city in any token
  for (const token of tokens) {
    const cityResult = findCity(token);

    if (cityResult) {
      return {
        lat: cityResult.city.lat,
        lon: cityResult.city.lon,
        name: cityResult.city.name,
        country: cityResult.city.country,
        iso2: cityResult.city.iso2,
        precision: 'city',
        confidence: cityResult.score,
        method: cityResult.method,
        strategic: cityResult.city.strategic
      };
    }
  }

  // Strategy 2: Try to find country in any token
  for (const token of tokens) {
    const countryResult = findCountry(token);

    if (countryResult) {
      return {
        lat: countryResult.country.lat,
        lon: countryResult.country.lon,
        name: countryResult.country.capital,
        country: countryResult.country.name,
        iso2: countryResult.country.iso2,
        precision: 'country',
        confidence: countryResult.score * 0.7, // Reduce confidence for country-level
        method: 'estimated',
        strategic: countryResult.country.strategic
      };
    }
  }

  // No match found
  return null;
}

/**
 * Batch resolve multiple locations
 * Useful for processing entity_places arrays from feed items
 *
 * @param locations - Array of location strings
 * @returns Array of resolved GeoLocations (excludes null results)
 */
export function resolveLocations(locations: string[]): GeoLocation[] {
  if (!Array.isArray(locations)) {
    return [];
  }

  return locations
    .map(loc => resolveLocation(loc))
    .filter((loc): loc is GeoLocation => loc !== null);
}

/**
 * Get the most relevant location from an array
 * Prioritizes: strategic cities > high confidence > cities > countries
 *
 * @param locations - Array of resolved locations
 * @returns Best location or null
 */
export function getBestLocation(locations: GeoLocation[]): GeoLocation | null {
  if (!locations || locations.length === 0) {
    return null;
  }

  // Sort by priority
  const sorted = [...locations].sort((a, b) => {
    // Strategic cities first
    if (a.strategic && !b.strategic) return -1;
    if (!a.strategic && b.strategic) return 1;

    // Then by precision (city > country)
    if (a.precision === 'city' && b.precision !== 'city') return -1;
    if (a.precision !== 'city' && b.precision === 'city') return 1;

    // Then by confidence
    return b.confidence - a.confidence;
  });

  return sorted[0];
}

/**
 * Calculate distance between two locations (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
  const R = 6371; // Earth's radius in km

  const lat1Rad = (loc1.lat * Math.PI) / 180;
  const lat2Rad = (loc2.lat * Math.PI) / 180;
  const deltaLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const deltaLon = ((loc2.lon - loc1.lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a location is in a strategic region
 * Useful for filtering high-priority events
 */
export function isStrategicLocation(location: GeoLocation): boolean {
  return location.strategic === true;
}
