/**
 * State Engine Test Script
 *
 * Tests all state engine modules and API endpoints.
 * Run with: npx tsx scripts/test-state-engine.ts
 */

import { computeReadinessBreakdown, computeMultipleReadiness } from '../lib/state/computeReadinessBreakdown';
import { updateWorldStateLive, getWorldStateLive } from '../lib/state/updateWorldStateLive';
import { updateRelationEdges, getCountryRelations, getHostileRelations } from '../lib/state/updateRelationEdges';
import { createDailySnapshot, getDailySnapshots } from '../lib/state/dailySnapshotJob';

// Set feature flag
process.env.STATE_ENABLED = 'true';

async function testComputeReadiness() {
  console.log('\n=== Testing computeReadinessBreakdown ===');

  const testCountries = ['USA', 'RUS', 'ISR', 'IRN', 'UKR'];

  for (const country of testCountries) {
    const readiness = await computeReadinessBreakdown(country, {
      windowHours: 24,
      minConfidence: 0.3,
    });

    console.log(`\n${country} Readiness:`);
    console.log(`  Military:    ${readiness.military}`);
    console.log(`  Economic:    ${readiness.economic}`);
    console.log(`  Political:   ${readiness.political}`);
    console.log(`  Diplomatic:  ${readiness.diplomatic}`);
    console.log(`  Cyber:       ${readiness.cyber}`);
    console.log(`  Overall:     ${readiness.overall}`);
  }

  // Test batch computation
  console.log('\n--- Batch Readiness Computation ---');
  const batchReadiness = await computeMultipleReadiness(['USA', 'RUS', 'CHN'], {
    windowHours: 48,
  });
  console.log(`Computed readiness for ${Object.keys(batchReadiness).length} countries`);
}

async function testWorldStateLive() {
  console.log('\n=== Testing updateWorldStateLive ===');

  const state = await updateWorldStateLive();

  console.log('\nGlobal State:');
  console.log(`  Tension Score:       ${state.global_tension_score.toFixed(3)}`);
  console.log(`  Alert Level:         ${state.alert_level}`);
  console.log(`  Active Events:       ${state.active_event_count}`);
  console.log(`  Active Scenarios:    ${state.active_scenario_count}`);
  console.log(`  Version:             ${state.version}`);

  console.log('\nScenario Scores:');
  for (const [scenario, score] of Object.entries(state.scenario_scores)) {
    console.log(`  ${scenario}: ${score.toFixed(3)}`);
  }

  console.log('\nCountry Statuses:');
  const countries = Object.entries(state.country_statuses).slice(0, 5);
  for (const [country, status] of countries) {
    console.log(`  ${country}: ${status}`);
  }

  // Test read-only getter
  console.log('\n--- Testing getWorldStateLive ---');
  const readState = await getWorldStateLive();
  console.log(`Read state version: ${readState?.version}`);
}

async function testRelationEdges() {
  console.log('\n=== Testing updateRelationEdges ===');

  const stats = await updateRelationEdges({
    windowHours: 24,
    minConfidence: 0.4,
    minSeverity: 4,
  });

  console.log('\nRelation Edge Stats:');
  console.log(`  Processed:  ${stats.processed} events`);
  console.log(`  Created:    ${stats.created} new relations`);
  console.log(`  Updated:    ${stats.updated} existing relations`);

  // Test get country relations
  console.log('\n--- Testing getCountryRelations (USA) ---');
  const usaRelations = await getCountryRelations('USA', {
    minStrength: 0.3,
  });
  console.log(`Found ${usaRelations.length} relations for USA`);

  for (const rel of usaRelations.slice(0, 5)) {
    const otherEntity = rel.entity_a === 'USA' ? rel.entity_b : rel.entity_a;
    console.log(`  ${otherEntity}: ${rel.relation_type} (strength: ${rel.relation_strength.toFixed(2)})`);
  }

  // Test hostile relations
  console.log('\n--- Testing getHostileRelations ---');
  const hostileRels = await getHostileRelations(0.5);
  console.log(`Found ${hostileRels.length} hostile/adversary relations`);

  for (const rel of hostileRels.slice(0, 5)) {
    console.log(`  ${rel.entity_a} <-> ${rel.entity_b}: ${rel.relation_type} (${rel.relation_strength.toFixed(2)})`);
  }
}

async function testDailySnapshot() {
  console.log('\n=== Testing createDailySnapshot ===');

  const snapshot = await createDailySnapshot();

  console.log('\nDaily Snapshot:');
  console.log(`  Date:              ${snapshot.date}`);
  console.log(`  Total Events:      ${snapshot.total_events}`);
  console.log(`  Tension Score:     ${snapshot.global_tension_score.toFixed(3)}`);
  console.log(`  Alert Level:       ${snapshot.alert_level}`);

  console.log('\nEvent Counts by Type:');
  const topTypes = Object.entries(snapshot.event_counts_by_type)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);
  for (const [type, count] of topTypes) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\nEvent Counts by Severity:');
  for (const [severity, count] of Object.entries(snapshot.event_counts_by_severity)) {
    console.log(`  ${severity}: ${count}`);
  }

  console.log('\nActive Conflicts:');
  const conflicts = Array.isArray(snapshot.active_conflicts) ? snapshot.active_conflicts : [];
  for (const conflict of conflicts.slice(0, 5)) {
    console.log(`  ${conflict.countries.join(' <-> ')}: intensity ${conflict.intensity.toFixed(2)}`);
  }

  // Test get historical snapshots
  console.log('\n--- Testing getDailySnapshots ---');
  const history = await getDailySnapshots({ limit: 7 });
  console.log(`Retrieved ${history.length} daily snapshots`);

  for (const snap of history) {
    console.log(`  ${snap.date}: ${snap.total_events} events, tension ${snap.global_tension_score.toFixed(2)}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('STATE ENGINE TEST SUITE');
  console.log('='.repeat(60));

  try {
    await testComputeReadiness();
    await testWorldStateLive();
    await testRelationEdges();
    await testDailySnapshot();

    console.log('\n' + '='.repeat(60));
    console.log('ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('TEST FAILED:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main();
