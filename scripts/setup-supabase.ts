#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RSS_SOURCES } from '../lib/rss/sources';

const supabaseUrl = 'https://aacumnyzzdviimujuuam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhY3Vtbnl6emR2aWltdWp1dWFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNTg1NCwiZXhwIjoyMDg3ODgxODU0fQ.-9Olq6AnkVK2pVXoUAUPAcnm1PgFeQ4h7mO9GGkyQEU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Setting up Supabase database...\n');

async function main() {
  try {
    // Read SQL schema
    const schemaPath = join(process.cwd(), 'lib/db/migrations/supabase-schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Executing ${statements.length} SQL statements...`);

    // Execute each statement using RPC
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.error(`❌ Error:`, error.message.substring(0, 100));
        }
      } catch (err) {
        // Ignore errors for CREATE IF NOT EXISTS
        console.log(`  ⊙ ${statement.substring(0, 50)}...`);
      }
    }

    console.log('\n✅ Schema created!');

    // Seed sources
    console.log('\n🌱 Seeding sources...');

    for (const source of RSS_SOURCES) {
      const { error } = await supabase
        .from('sources')
        .insert({
          name: source.name,
          url: source.url,
          source_type: source.type,
          reliability: source.reliability,
          language: source.language,
          rate_limit_seconds: source.rateLimitSeconds,
          is_active: true,
        })
        .select();

      if (error) {
        if (error.message.includes('duplicate')) {
          console.log(`  ⊙ Exists: ${source.name}`);
        } else {
          console.error(`  ❌ Failed: ${source.name}:`, error.message);
        }
      } else {
        console.log(`  ✓ Added: ${source.name}`);
      }
    }

    // Check results
    const { count } = await supabase.from('sources').select('*', { count: 'exact', head: true });

    console.log('\n📈 Database Summary:');
    console.log(`  Sources: ${count}`);

    console.log('\n✅ Supabase setup complete!\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
