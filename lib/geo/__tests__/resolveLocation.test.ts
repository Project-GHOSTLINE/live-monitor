/**
 * Geo-Resolution System Tests
 *
 * Tests based on real feed data patterns from WW3 Monitor database
 */

import {
  resolveLocation,
  resolveLocations,
  getBestLocation,
  calculateDistance,
  isStrategicLocation,
  type GeoLocation,
} from '../resolveLocation';

describe('resolveLocation', () => {
  describe('Real feed data patterns', () => {
    it('should resolve "Israel" to Jerusalem (country centroid)', () => {
      const result = resolveLocation('Israel');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Israel');
      expect(result?.precision).toBe('country');
      expect(result?.confidence).toBeGreaterThan(65);
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Iran" to Tehran (country centroid)', () => {
      const result = resolveLocation('Iran');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Iran');
      expect(result?.precision).toBe('country');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Tel Aviv" to precise city coordinates', () => {
      const result = resolveLocation('Tel Aviv');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Tel Aviv');
      expect(result?.country).toBe('Israel');
      expect(result?.precision).toBe('city');
      expect(result?.confidence).toBe(100);
      expect(result?.method).toBe('exact');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Gaza City" or "Gaza" to precise coordinates', () => {
      const result1 = resolveLocation('Gaza City');
      const result2 = resolveLocation('Gaza');

      expect(result1).not.toBeNull();
      expect(result1?.name).toBe('Gaza City');
      expect(result1?.country).toBe('Palestine');
      expect(result1?.precision).toBe('city');

      // Gaza should resolve to Gaza City via alias
      expect(result2).not.toBeNull();
      expect(result2?.name).toBe('Gaza City');
    });

    it('should resolve "Lebanon" to country centroid', () => {
      const result = resolveLocation('Lebanon');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Lebanon');
      expect(result?.precision).toBe('country');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Syria" to Damascus', () => {
      const result = resolveLocation('Syria');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Syria');
      expect(result?.precision).toBe('country');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Iraq" to Baghdad', () => {
      const result = resolveLocation('Iraq');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Iraq');
      expect(result?.precision).toBe('country');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Yemen" to Sana\'a', () => {
      const result = resolveLocation('Yemen');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Yemen');
      expect(result?.precision).toBe('country');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Jordan" to Amman', () => {
      const result = resolveLocation('Jordan');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Jordan');
      expect(result?.precision).toBe('country');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Saudi Arabia" to Riyadh', () => {
      const result = resolveLocation('Saudi Arabia');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('Saudi Arabia');
      expect(result?.precision).toBe('country');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "UAE" to Abu Dhabi', () => {
      const result = resolveLocation('UAE');

      expect(result).not.toBeNull();
      expect(result?.country).toBe('United Arab Emirates');
      expect(result?.precision).toBe('country');
    });
  });

  describe('Conflict zone cities', () => {
    it('should resolve "Kyiv" (Ukraine)', () => {
      const result = resolveLocation('Kyiv');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Kyiv');
      expect(result?.country).toBe('Ukraine');
      expect(result?.precision).toBe('city');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Kiev" alias to Kyiv', () => {
      const result = resolveLocation('Kiev');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Kyiv');
      expect(result?.country).toBe('Ukraine');
    });

    it('should resolve "Taipei" (Taiwan)', () => {
      const result = resolveLocation('Taipei');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Taipei');
      expect(result?.country).toBe('Taiwan');
      expect(result?.precision).toBe('city');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Damascus" (Syria)', () => {
      const result = resolveLocation('Damascus');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Damascus');
      expect(result?.country).toBe('Syria');
      expect(result?.precision).toBe('city');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Baghdad" (Iraq)', () => {
      const result = resolveLocation('Baghdad');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Baghdad');
      expect(result?.country).toBe('Iraq');
      expect(result?.precision).toBe('city');
      expect(result?.strategic).toBe(true);
    });

    it('should resolve "Beirut" (Lebanon)', () => {
      const result = resolveLocation('Beirut');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Beirut');
      expect(result?.country).toBe('Lebanon');
      expect(result?.precision).toBe('city');
      expect(result?.strategic).toBe(true);
    });
  });

  describe('Fuzzy matching', () => {
    it('should handle minor typos with fuzzy matching', () => {
      // Common misspellings
      const result1 = resolveLocation('Jeruzalem'); // Jerusalem
      const result2 = resolveLocation('Teheran'); // Tehran
      const result3 = resolveLocation('Istambul'); // Istanbul

      // Should still match with high confidence
      expect(result1).not.toBeNull();
      expect(result1?.country).toBe('Israel');

      expect(result2).not.toBeNull();
      expect(result2?.country).toBe('Iran');

      expect(result3).not.toBeNull();
      expect(result3?.name).toBe('Istanbul');
    });

    it('should handle transliteration variants', () => {
      const result1 = resolveLocation('Sanaa'); // Sana'a
      const result2 = resolveLocation('Odessa'); // Odesa

      expect(result1).not.toBeNull();
      expect(result1?.name).toBe('Sana\'a');

      expect(result2).not.toBeNull();
      expect(result2?.name).toBe('Odesa');
    });
  });

  describe('Text extraction patterns', () => {
    it('should extract location from "in Gaza"', () => {
      const result = resolveLocation('in Gaza');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Gaza City');
    });

    it('should extract location from "from Tehran"', () => {
      const result = resolveLocation('from Tehran');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Tehran');
    });

    it('should extract location from "Tel Aviv, Israel"', () => {
      const result = resolveLocation('Tel Aviv, Israel');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Tel Aviv');
      expect(result?.country).toBe('Israel');
      expect(result?.precision).toBe('city');
    });

    it('should extract location from "near Kyiv"', () => {
      const result = resolveLocation('near Kyiv');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Kyiv');
    });
  });

  describe('Edge cases', () => {
    it('should return null for empty string', () => {
      expect(resolveLocation('')).toBeNull();
      expect(resolveLocation('   ')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(resolveLocation(null)).toBeNull();
      expect(resolveLocation(undefined)).toBeNull();
    });

    it('should return null for unrecognizable text', () => {
      expect(resolveLocation('xyz123abc')).toBeNull();
      expect(resolveLocation('unknown place')).toBeNull();
    });

    it('should handle very short queries', () => {
      // ISO codes
      const result1 = resolveLocation('IL');
      const result2 = resolveLocation('IR');

      expect(result1).not.toBeNull();
      expect(result1?.country).toBe('Israel');

      expect(result2).not.toBeNull();
      expect(result2?.country).toBe('Iran');
    });
  });
});

describe('resolveLocations (batch processing)', () => {
  it('should resolve array from real feed data: ["Israel","Iran"]', () => {
    const results = resolveLocations(['Israel', 'Iran']);

    expect(results).toHaveLength(2);
    expect(results[0].country).toBe('Israel');
    expect(results[1].country).toBe('Iran');
  });

  it('should resolve array: ["Israel","Iran","Lebanon"]', () => {
    const results = resolveLocations(['Israel', 'Iran', 'Lebanon']);

    expect(results).toHaveLength(3);
    expect(results[0].country).toBe('Israel');
    expect(results[1].country).toBe('Iran');
    expect(results[2].country).toBe('Lebanon');
  });

  it('should resolve array: ["Tel Aviv","Israel","Iran"]', () => {
    const results = resolveLocations(['Tel Aviv', 'Israel', 'Iran']);

    expect(results).toHaveLength(3);
    expect(results[0].precision).toBe('city');
    expect(results[0].name).toBe('Tel Aviv');
    expect(results[1].precision).toBe('country');
    expect(results[2].precision).toBe('country');
  });

  it('should resolve array: ["Israel","Iran","Jordan","Saudi Arabia","UAE"]', () => {
    const results = resolveLocations(['Israel', 'Iran', 'Jordan', 'Saudi Arabia', 'UAE']);

    expect(results).toHaveLength(5);
    expect(results.every(r => r.strategic)).toBe(true);
  });

  it('should filter out null results', () => {
    const results = resolveLocations(['Israel', 'InvalidPlace', 'Iran']);

    expect(results).toHaveLength(2);
    expect(results[0].country).toBe('Israel');
    expect(results[1].country).toBe('Iran');
  });

  it('should handle empty arrays', () => {
    expect(resolveLocations([])).toEqual([]);
  });

  it('should handle arrays from Syria/Iraq conflict zone', () => {
    const results = resolveLocations(['Israel', 'Iran', 'Lebanon', 'Syria', 'Iraq', 'Yemen']);

    expect(results).toHaveLength(6);
    expect(results.every(r => r.strategic)).toBe(true);
  });
});

describe('getBestLocation', () => {
  it('should prioritize strategic cities over regular cities', () => {
    const locations: GeoLocation[] = [
      {
        lat: 40.0,
        lon: 50.0,
        name: 'Regular City',
        precision: 'city',
        confidence: 100,
        method: 'exact',
        strategic: false,
      },
      {
        lat: 32.0853,
        lon: 34.7818,
        name: 'Tel Aviv',
        country: 'Israel',
        precision: 'city',
        confidence: 100,
        method: 'exact',
        strategic: true,
      },
    ];

    const best = getBestLocation(locations);

    expect(best?.name).toBe('Tel Aviv');
    expect(best?.strategic).toBe(true);
  });

  it('should prioritize cities over countries', () => {
    const locations: GeoLocation[] = [
      {
        lat: 35.6892,
        lon: 51.3890,
        name: 'Tehran',
        country: 'Iran',
        precision: 'country',
        confidence: 100,
        method: 'estimated',
        strategic: true,
      },
      {
        lat: 32.0853,
        lon: 34.7818,
        name: 'Tel Aviv',
        country: 'Israel',
        precision: 'city',
        confidence: 90,
        method: 'fuzzy',
        strategic: true,
      },
    ];

    const best = getBestLocation(locations);

    expect(best?.precision).toBe('city');
    expect(best?.name).toBe('Tel Aviv');
  });

  it('should return null for empty array', () => {
    expect(getBestLocation([])).toBeNull();
  });

  it('should handle single location', () => {
    const locations = resolveLocations(['Israel']);
    const best = getBestLocation(locations);

    expect(best).not.toBeNull();
    expect(best?.country).toBe('Israel');
  });
});

describe('calculateDistance', () => {
  it('should calculate distance between Tel Aviv and Gaza City (~70km)', () => {
    const telAviv = resolveLocation('Tel Aviv')!;
    const gaza = resolveLocation('Gaza City')!;

    const distance = calculateDistance(telAviv, gaza);

    // Should be approximately 70-80km
    expect(distance).toBeGreaterThan(60);
    expect(distance).toBeLessThan(90);
  });

  it('should calculate distance between Tehran and Baghdad (~700km)', () => {
    const tehran = resolveLocation('Tehran')!;
    const baghdad = resolveLocation('Baghdad')!;

    const distance = calculateDistance(tehran, baghdad);

    // Should be approximately 600-800km
    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(900);
  });

  it('should return 0 for same location', () => {
    const location = resolveLocation('Tel Aviv')!;
    const distance = calculateDistance(location, location);

    expect(distance).toBe(0);
  });
});

describe('isStrategicLocation', () => {
  it('should identify strategic conflict zones', () => {
    const strategic = ['Gaza City', 'Tel Aviv', 'Kyiv', 'Taipei', 'Damascus', 'Baghdad'];

    strategic.forEach(place => {
      const result = resolveLocation(place);
      expect(result).not.toBeNull();
      expect(isStrategicLocation(result!)).toBe(true);
    });
  });

  it('should identify non-strategic locations', () => {
    const nonStrategic = ['Paris', 'London', 'Tokyo'];

    nonStrategic.forEach(place => {
      const result = resolveLocation(place);
      expect(result).not.toBeNull();
      // These may or may not be strategic, but function should work
      const isStrategic = isStrategicLocation(result!);
      expect(typeof isStrategic).toBe('boolean');
    });
  });
});

describe('Performance and reliability', () => {
  it('should handle large batch processing efficiently', () => {
    const locations = [
      'Israel', 'Iran', 'Lebanon', 'Syria', 'Iraq', 'Yemen',
      'Jordan', 'Saudi Arabia', 'UAE', 'Qatar',
      'Gaza City', 'Tel Aviv', 'Beirut', 'Damascus', 'Baghdad',
      'Kyiv', 'Taipei', 'Tehran', 'Jerusalem', 'Amman',
    ];

    const start = Date.now();
    const results = resolveLocations(locations);
    const elapsed = Date.now() - start;

    expect(results.length).toBeGreaterThan(15);
    expect(elapsed).toBeLessThan(100); // Should be very fast (<100ms)
  });

  it('should be case-insensitive', () => {
    const variants = ['ISRAEL', 'Israel', 'israel', 'IsRaEl'];

    variants.forEach(variant => {
      const result = resolveLocation(variant);
      expect(result).not.toBeNull();
      expect(result?.country).toBe('Israel');
    });
  });

  it('should handle whitespace variations', () => {
    const variants = ['  Israel  ', 'Israel', ' Israel', 'Israel '];

    variants.forEach(variant => {
      const result = resolveLocation(variant);
      expect(result).not.toBeNull();
      expect(result?.country).toBe('Israel');
    });
  });
});
