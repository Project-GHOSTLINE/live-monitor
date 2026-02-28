/**
 * Middle East Theater - Major Locations
 *
 * 40 key locations for map event visualization
 * Coordinates are approximate city centers
 */

export interface Location {
  name: string;
  lat: number;
  lon: number;
  country: string;
  type: 'capital' | 'city' | 'military' | 'infrastructure';
  aliases?: string[]; // for matching in text
}

export const MIDDLE_EAST_LOCATIONS: Location[] = [
  // ISRAEL
  { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, country: 'IL', type: 'capital', aliases: ['tel-aviv', 'telaviv'] },
  { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, country: 'IL', type: 'city', aliases: ['al-quds'] },
  { name: 'Haifa', lat: 32.7940, lon: 34.9896, country: 'IL', type: 'city' },

  // IRAN
  { name: 'Tehran', lat: 35.6892, lon: 51.3890, country: 'IR', type: 'capital' },
  { name: 'Isfahan', lat: 32.6546, lon: 51.6680, country: 'IR', type: 'city', aliases: ['esfahan'] },
  { name: 'Natanz', lat: 33.5102, lon: 51.9066, country: 'IR', type: 'infrastructure', aliases: ['nuclear facility'] },
  { name: 'Bushehr', lat: 28.9684, lon: 50.8385, country: 'IR', type: 'infrastructure' },

  // LEBANON
  { name: 'Beirut', lat: 33.8886, lon: 35.4955, country: 'LB', type: 'capital', aliases: ['beyrouth'] },
  { name: 'Sidon', lat: 33.5631, lon: 35.3756, country: 'LB', type: 'city', aliases: ['saida'] },
  { name: 'Tyre', lat: 33.2704, lon: 35.2038, country: 'LB', type: 'city', aliases: ['sour'] },

  // SYRIA
  { name: 'Damascus', lat: 33.5138, lon: 36.2765, country: 'SY', type: 'capital', aliases: ['damas'] },
  { name: 'Aleppo', lat: 36.2021, lon: 37.1343, country: 'SY', type: 'city', aliases: ['alep'] },
  { name: 'Homs', lat: 34.7298, lon: 36.7095, country: 'SY', type: 'city' },

  // IRAQ
  { name: 'Baghdad', lat: 33.3152, lon: 44.3661, country: 'IQ', type: 'capital' },
  { name: 'Basra', lat: 30.5085, lon: 47.7804, country: 'IQ', type: 'city', aliases: ['bassorah'] },
  { name: 'Erbil', lat: 36.1911, lon: 44.0089, country: 'IQ', type: 'city', aliases: ['arbil'] },

  // SAUDI ARABIA
  { name: 'Riyadh', lat: 24.7136, lon: 46.6753, country: 'SA', type: 'capital' },
  { name: 'Jeddah', lat: 21.5433, lon: 39.1728, country: 'SA', type: 'city', aliases: ['djeddah'] },
  { name: 'Dhahran', lat: 26.2361, lon: 50.0393, country: 'SA', type: 'infrastructure' },

  // YEMEN
  { name: 'Sanaa', lat: 15.3694, lon: 44.1910, country: 'YE', type: 'capital', aliases: ['sana\'a'] },
  { name: 'Aden', lat: 12.7855, lon: 45.0187, country: 'YE', type: 'city' },
  { name: 'Hodeidah', lat: 14.7978, lon: 42.9545, country: 'YE', type: 'city', aliases: ['al-hudaydah'] },

  // UAE
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'AE', type: 'city' },
  { name: 'Abu Dhabi', lat: 24.4539, lon: 54.3773, country: 'AE', type: 'capital' },

  // QATAR
  { name: 'Doha', lat: 25.2854, lon: 51.5310, country: 'QA', type: 'capital' },

  // JORDAN
  { name: 'Amman', lat: 31.9454, lon: 35.9284, country: 'JO', type: 'capital' },

  // EGYPT
  { name: 'Cairo', lat: 30.0444, lon: 31.2357, country: 'EG', type: 'capital', aliases: ['le caire'] },
  { name: 'Suez', lat: 29.9737, lon: 32.5263, country: 'EG', type: 'city', aliases: ['suez canal'] },

  // TURKEY
  { name: 'Ankara', lat: 39.9334, lon: 32.8597, country: 'TR', type: 'capital' },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'TR', type: 'city' },
  { name: 'Incirlik', lat: 37.0021, lon: 35.4259, country: 'TR', type: 'military', aliases: ['incirlik base'] },

  // GAZA & WEST BANK
  { name: 'Gaza City', lat: 31.5, lon: 34.467, country: 'PS', type: 'city', aliases: ['gaza'] },
  { name: 'Rafah', lat: 31.2973, lon: 34.2463, country: 'PS', type: 'city' },
  { name: 'Ramallah', lat: 31.9, lon: 35.2, country: 'PS', type: 'city' },

  // STRATEGIC WATERWAYS
  { name: 'Strait of Hormuz', lat: 26.5667, lon: 56.2500, country: 'INTL', type: 'infrastructure', aliases: ['hormuz'] },
  { name: 'Bab el-Mandeb', lat: 12.5833, lon: 43.3333, country: 'INTL', type: 'infrastructure', aliases: ['bab al-mandab'] },
  { name: 'Red Sea', lat: 20.0, lon: 38.0, country: 'INTL', type: 'infrastructure', aliases: ['mer rouge'] },

  // RUSSIA (for theater context)
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, country: 'RU', type: 'capital', aliases: ['moscou'] },
];

/**
 * Find location by name or alias
 */
export function findLocation(query: string): Location | undefined {
  const q = query.toLowerCase().trim();
  return MIDDLE_EAST_LOCATIONS.find(loc =>
    loc.name.toLowerCase() === q ||
    loc.aliases?.some(alias => alias.toLowerCase() === q)
  );
}

/**
 * Get country centroid (fallback when no specific city)
 */
export function getCountryCentroid(countryCode: string): { lat: number; lon: number } | undefined {
  const capitals = MIDDLE_EAST_LOCATIONS.filter(loc => loc.country === countryCode && loc.type === 'capital');
  if (capitals.length > 0) {
    return { lat: capitals[0].lat, lon: capitals[0].lon };
  }

  // Fallback: average of all locations in country
  const countryLocs = MIDDLE_EAST_LOCATIONS.filter(loc => loc.country === countryCode);
  if (countryLocs.length === 0) return undefined;

  const avgLat = countryLocs.reduce((sum, loc) => sum + loc.lat, 0) / countryLocs.length;
  const avgLon = countryLocs.reduce((sum, loc) => sum + loc.lon, 0) / countryLocs.length;

  return { lat: avgLat, lon: avgLon };
}

/**
 * Map bounds for Middle East theater
 */
export const THEATER_BOUNDS = {
  minLat: 10,
  maxLat: 45,
  minLon: 25,
  maxLon: 65,
};
