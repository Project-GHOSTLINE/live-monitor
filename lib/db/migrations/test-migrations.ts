#!/usr/bin/env ts-node
/**
 * Test script to verify SQLite migrations work correctly
 * Run: npx ts-node lib/db/migrations/test-migrations.ts
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = './data/test-migrations.db';

async function testMigrations() {
  console.log('🧪 Testing SQLite Migrations...\n');

  // Create test database
  const db = new Database(TEST_DB_PATH);
  db.pragma('foreign_keys = ON');

  try {
    // Migration 001 - Initial schema
    console.log('📦 Running Migration 001 (Initial)...');
    const migration001 = readFileSync(
      join(process.cwd(), 'lib/db/migrations/001_initial.sql'),
      'utf-8'
    );
    db.exec(migration001);
    console.log('✅ Migration 001 complete\n');

    // Migration 003 - Event Processing (SQLite)
    console.log('📦 Running Migration 003 (Event Processing - SQLite)...');
    const migration003 = readFileSync(
      join(process.cwd(), 'lib/db/migrations/003_event_processing_sqlite.sql'),
      'utf-8'
    );
    db.exec(migration003);
    console.log('✅ Migration 003 complete\n');

    // Migration 004 - State Management (SQLite)
    console.log('📦 Running Migration 004 (State Management - SQLite)...');
    const migration004 = readFileSync(
      join(process.cwd(), 'lib/db/migrations/004_state_management_sqlite.sql'),
      'utf-8'
    );
    db.exec(migration004);
    console.log('✅ Migration 004 complete\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
      )
      .all() as { name: string }[];

    console.log('Tables created:');
    tables.forEach(t => console.log(`  - ${t.name}`));

    // Expected tables
    const expectedTables = [
      'event_frames',
      'signals',
      'signal_activations',
      'scenario_definitions',
      'world_state_live',
      'world_state_daily',
      'relation_edges',
    ];

    const missingTables = expectedTables.filter(
      t => !tables.find(table => table.name === t)
    );

    if (missingTables.length > 0) {
      console.error('\n❌ Missing tables:', missingTables);
      process.exit(1);
    }

    console.log('\n✅ All expected tables exist!');

    // Test idempotency - run migrations again
    console.log('\n🔄 Testing idempotency (running migrations again)...');
    db.exec(migration003);
    db.exec(migration004);
    console.log('✅ Migrations are idempotent!\n');

    // Verify seed data
    console.log('🌱 Verifying seed data...');
    const signalCount = db.prepare('SELECT COUNT(*) as count FROM signals').get() as { count: number };
    const scenarioCount = db.prepare('SELECT COUNT(*) as count FROM scenario_definitions').get() as { count: number };

    console.log(`  - Signals: ${signalCount.count} (expected: 19)`);
    console.log(`  - Scenarios: ${scenarioCount.count} (expected: 3)`);

    if (signalCount.count !== 19) {
      console.error('❌ Expected 19 signals, got', signalCount.count);
      process.exit(1);
    }

    if (scenarioCount.count !== 3) {
      console.error('❌ Expected 3 scenarios, got', scenarioCount.count);
      process.exit(1);
    }

    console.log('✅ Seed data correct!\n');

    // Verify world_state_live singleton
    console.log('🔍 Verifying world_state_live singleton...');
    const worldState = db.prepare('SELECT * FROM world_state_live WHERE id = 1').get();
    if (!worldState) {
      console.error('❌ world_state_live singleton not initialized!');
      process.exit(1);
    }
    console.log('✅ Singleton initialized correctly!\n');

    // Test foreign key constraints
    console.log('🔗 Testing foreign key constraints...');
    try {
      db.prepare('INSERT INTO event_frames (feed_item_id, event_type, severity, confidence, source_reliability, evidence, occurred_at, reported_at) VALUES (999999, "unknown", 5, 0.8, 3, "test", 0, 0)').run();
      console.error('❌ Foreign key constraint not enforced!');
      process.exit(1);
    } catch (error) {
      console.log('✅ Foreign key constraints working!\n');
    }

    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('  ✅ Migration 003 (Event Processing) - OK');
    console.log('  ✅ Migration 004 (State Management) - OK');
    console.log('  ✅ Idempotency verified');
    console.log('  ✅ Seed data verified');
    console.log('  ✅ Constraints verified');
    console.log('  ✅ Singleton pattern verified\n');

  } catch (error) {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

testMigrations();
