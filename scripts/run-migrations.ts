/**
 * Apply migrations to main database
 *
 * Run with: npx tsx scripts/run-migrations.ts
 */

import fs from 'fs';
import path from 'path';
import { getDatabase } from '../lib/db/client';

const MIGRATIONS_DIR = path.join(process.cwd(), 'lib/db/migrations');

async function runMigrations() {
  console.log('🚀 Applying migrations to main database...\n');

  const db = getDatabase();

  // Migration 003: Event Processing
  console.log('📦 Running Migration 003 (Event Processing)...');
  const migration003 = fs.readFileSync(
    path.join(MIGRATIONS_DIR, '003_event_processing_sqlite.sql'),
    'utf-8'
  );
  db.exec(migration003);
  console.log('✅ Migration 003 complete\n');

  // Migration 004: State Management
  console.log('📦 Running Migration 004 (State Management)...');
  const migration004 = fs.readFileSync(
    path.join(MIGRATIONS_DIR, '004_state_management_sqlite.sql'),
    'utf-8'
  );
  db.exec(migration004);
  console.log('✅ Migration 004 complete\n');

  // Verify tables
  console.log('🔍 Verifying tables...');
  const tables = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
  ).all() as Array<{ name: string }>;

  console.log('Tables in database:');
  for (const table of tables) {
    console.log(`  - ${table.name}`);
  }

  // Check critical tables
  const criticalTables = [
    'event_frames',
    'signals',
    'signal_activations',
    'world_state_live',
    'world_state_daily',
    'relation_edges',
  ];

  let allPresent = true;
  for (const tableName of criticalTables) {
    const found = tables.some(t => t.name === tableName);
    if (!found) {
      console.error(`❌ Missing table: ${tableName}`);
      allPresent = false;
    }
  }

  if (allPresent) {
    console.log('\n✅ All critical tables present!');
  } else {
    console.error('\n❌ Some tables are missing!');
    process.exit(1);
  }

  // Verify seed data
  console.log('\n🌱 Verifying seed data...');
  const signalCount = db.prepare('SELECT COUNT(*) as count FROM signals').get() as { count: number };
  console.log(`  - Signals: ${signalCount.count}`);

  const worldState = db.prepare('SELECT * FROM world_state_live WHERE id = 1').get();
  if (worldState) {
    console.log(`  - World state singleton: ✅ initialized`);
  } else {
    console.log(`  - World state singleton: ❌ not found`);
  }

  console.log('\n🎉 Migrations complete!');
}

runMigrations().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
