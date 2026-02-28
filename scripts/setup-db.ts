#!/usr/bin/env tsx

import { getDatabase, runMigrations, DB } from '../lib/db/client';
import { RSS_SOURCES } from '../lib/rss/sources';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

console.log('🚀 Setting up database...\n');

// Ensure data directory exists
const dbPath = process.env.DATABASE_PATH || './data/monitor.db';
const dir = dirname(dbPath);

if (!existsSync(dir)) {
  console.log(`📁 Creating directory: ${dir}`);
  mkdirSync(dir, { recursive: true });
}

try {
  // Run migrations
  console.log('📊 Running migrations...');
  runMigrations();

  // Seed sources
  console.log('\n🌱 Seeding sources...');
  const database = getDatabase();

  for (const source of RSS_SOURCES) {
    // Check if source already exists
    const existing = database
      .prepare('SELECT id FROM sources WHERE name = ?')
      .get(source.name);

    if (!existing) {
      DB.insert('sources', {
        name: source.name,
        url: source.url,
        source_type: source.type,
        reliability: source.reliability,
        language: source.language,
        rate_limit_seconds: source.rateLimitSeconds,
        is_active: 1,
      });

      console.log(`  ✓ Added: ${source.name}`);
    } else {
      console.log(`  ⊙ Exists: ${source.name}`);
    }
  }

  // Display summary
  const sourceCount = DB.count('sources');
  const itemCount = DB.count('feed_items');

  console.log('\n📈 Database Summary:');
  console.log(`  Sources: ${sourceCount}`);
  console.log(`  Feed Items: ${itemCount}`);

  console.log('\n✅ Database setup complete!\n');
} catch (error) {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}
