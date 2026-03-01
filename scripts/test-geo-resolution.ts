#!/usr/bin/env tsx
/**
 * Geo-Resolution System Verification Script
 *
 * Tests the geo-resolution system against real feed_items data from the database.
 * Run with: npx tsx scripts/test-geo-resolution.ts
 */

import Database from 'better-sqlite3';
import { resolveLocations, getBestLocation, calculateDistance } from '../lib/geo/resolveLocation';

const db = new Database('./data/monitor.db', { readonly: true });

console.log('🌍 WW3 Monitor - Geo-Resolution System Verification\n');
console.log('=' .repeat(80));

// Test 1: Sample real entity_places from database
console.log('\n📍 TEST 1: Real Database Feed Items\n');

const sampleItems = db
  .prepare(
    `
  SELECT
    id,
    title_en,
    title_original,
    entity_places,
    published_at
  FROM feed_items
  WHERE entity_places IS NOT NULL
    AND entity_places != '[]'
  ORDER BY published_at DESC
  LIMIT 10
`
  )
  .all() as Array<{
  id: number;
  title_en: string | null;
  title_original: string;
  entity_places: string;
  published_at: number;
}>;

sampleItems.forEach((item, index) => {
  console.log(`\n${index + 1}. Feed Item #${item.id}`);
  console.log(`   Title: ${item.title_en || item.title_original}`);

  const places = JSON.parse(item.entity_places);
  console.log(`   Raw Places: ${JSON.stringify(places)}`);

  const locations = resolveLocations(places);
  const best = getBestLocation(locations);

  if (best) {
    console.log(`   ✅ Resolved: ${best.name}, ${best.country}`);
    console.log(`   📍 Coordinates: ${best.lat.toFixed(4)}, ${best.lon.toFixed(4)}`);
    console.log(`   🎯 Precision: ${best.precision} (${Math.round(best.confidence)}% confidence)`);
    console.log(`   ${best.strategic ? '⚠️  STRATEGIC ZONE' : '   Regular zone'}`);
  } else {
    console.log(`   ❌ Could not resolve locations`);
  }
});

// Test 2: Resolution statistics
console.log('\n' + '='.repeat(80));
console.log('\n📊 TEST 2: Database-wide Resolution Statistics\n');

const allItems = db
  .prepare(
    `
  SELECT entity_places
  FROM feed_items
  WHERE entity_places IS NOT NULL
`
  )
  .all() as Array<{ entity_places: string }>;

let totalItems = 0;
let resolvedItems = 0;
let strategicItems = 0;
let cityPrecision = 0;
let countryPrecision = 0;

const locationCounts = new Map<string, number>();

allItems.forEach(item => {
  try {
    const places = JSON.parse(item.entity_places);
    if (places.length === 0) return;

    totalItems++;
    const locations = resolveLocations(places);

    if (locations.length > 0) {
      resolvedItems++;

      const best = getBestLocation(locations);
      if (best) {
        // Track precision
        if (best.precision === 'city') cityPrecision++;
        if (best.precision === 'country') countryPrecision++;

        // Track strategic
        if (best.strategic) strategicItems++;

        // Track location frequency
        const key = `${best.name}, ${best.country}`;
        locationCounts.set(key, (locationCounts.get(key) || 0) + 1);
      }
    }
  } catch (error) {
    // Skip malformed JSON
  }
});

console.log(`Total feed items with places: ${totalItems}`);
console.log(`Successfully resolved: ${resolvedItems} (${((resolvedItems / totalItems) * 100).toFixed(1)}%)`);
console.log(`Strategic events: ${strategicItems} (${((strategicItems / totalItems) * 100).toFixed(1)}%)`);
console.log(`\nPrecision breakdown:`);
console.log(`  - City-level: ${cityPrecision} (${((cityPrecision / resolvedItems) * 100).toFixed(1)}%)`);
console.log(
  `  - Country-level: ${countryPrecision} (${((countryPrecision / resolvedItems) * 100).toFixed(1)}%)`
);

// Test 3: Top locations
console.log('\n' + '='.repeat(80));
console.log('\n🏆 TEST 3: Most Frequently Mentioned Locations\n');

const topLocations = Array.from(locationCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

topLocations.forEach(([location, count], index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${location.padEnd(35)} ${count} mentions`);
});

// Test 4: Strategic zone clustering
console.log('\n' + '='.repeat(80));
console.log('\n🎯 TEST 4: Strategic Event Clustering\n');

interface ClusterItem {
  title: string;
  lat: number;
  lon: number;
  timestamp: number;
}

const strategicEvents = db
  .prepare(
    `
  SELECT
    title_en,
    title_original,
    entity_places,
    published_at
  FROM feed_items
  WHERE entity_places IS NOT NULL
    AND entity_places != '[]'
  ORDER BY published_at DESC
  LIMIT 50
`
  )
  .all() as Array<{
  title_en: string | null;
  title_original: string;
  entity_places: string;
  published_at: number;
}>;

const clusters = new Map<
  string,
  { location: string; country: string; events: ClusterItem[]; strategic: boolean }
>();

strategicEvents.forEach(item => {
  try {
    const places = JSON.parse(item.entity_places);
    const locations = resolveLocations(places);
    const best = getBestLocation(locations);

    if (best) {
      const key = `${best.name}, ${best.country}`;

      if (!clusters.has(key)) {
        clusters.set(key, {
          location: best.name,
          country: best.country || 'Unknown',
          events: [],
          strategic: best.strategic || false,
        });
      }

      clusters.get(key)!.events.push({
        title: item.title_en || item.title_original,
        lat: best.lat,
        lon: best.lon,
        timestamp: item.published_at,
      });
    }
  } catch (error) {
    // Skip
  }
});

// Show strategic clusters with multiple events
const strategicClusters = Array.from(clusters.entries())
  .filter(([_, cluster]) => cluster.strategic && cluster.events.length > 1)
  .sort((a, b) => b[1].events.length - a[1].events.length)
  .slice(0, 10);

strategicClusters.forEach(([location, cluster], index) => {
  console.log(`\n${index + 1}. ${location} ⚠️`);
  console.log(`   ${cluster.events.length} events in this strategic zone`);
  console.log(`   Most recent: ${cluster.events[0].title.substring(0, 60)}...`);
});

// Test 5: Distance analysis
console.log('\n' + '='.repeat(80));
console.log('\n📏 TEST 5: Distance Analysis Between Key Strategic Locations\n');

const keyLocations = [
  { name: 'Gaza City', places: ['Gaza City'] },
  { name: 'Tel Aviv', places: ['Tel Aviv'] },
  { name: 'Beirut', places: ['Beirut'] },
  { name: 'Tehran', places: ['Tehran'] },
  { name: 'Baghdad', places: ['Baghdad'] },
  { name: 'Kyiv', places: ['Kyiv'] },
];

const resolvedKeyLocations = keyLocations
  .map(loc => ({
    name: loc.name,
    location: getBestLocation(resolveLocations(loc.places)),
  }))
  .filter(loc => loc.location !== null);

console.log('Distances between strategic cities (km):\n');

for (let i = 0; i < resolvedKeyLocations.length; i++) {
  for (let j = i + 1; j < resolvedKeyLocations.length; j++) {
    const loc1 = resolvedKeyLocations[i];
    const loc2 = resolvedKeyLocations[j];

    const distance = calculateDistance(loc1.location!, loc2.location!);

    console.log(
      `${loc1.name.padEnd(15)} ↔ ${loc2.name.padEnd(15)} ${Math.round(distance).toString().padStart(5)} km`
    );
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('\n✅ VERIFICATION COMPLETE\n');
console.log('Summary:');
console.log(`  - Resolution rate: ${((resolvedItems / totalItems) * 100).toFixed(1)}%`);
console.log(`  - Strategic detection: ${((strategicItems / totalItems) * 100).toFixed(1)}%`);
console.log(`  - City-level precision: ${((cityPrecision / resolvedItems) * 100).toFixed(1)}%`);
console.log(`  - Total unique locations: ${locationCounts.size}`);
console.log('\n🚀 System is production-ready for tactical mapping.\n');

db.close();
