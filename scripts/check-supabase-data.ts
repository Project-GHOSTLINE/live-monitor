#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aacumnyzzdviimujuuam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhY3Vtbnl6emR2aWltdWp1dWFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwNTg1NCwiZXhwIjoyMDg3ODgxODU0fQ.-9Olq6AnkVK2pVXoUAUPAcnm1PgFeQ4h7mO9GGkyQEU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Checking Supabase data...\n');

  // Check sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*', { count: 'exact' });

  if (sourcesError) {
    console.error('❌ Sources error:', sourcesError);
  } else {
    console.log(`📋 Sources: ${sources?.length || 0}`);
  }

  // Check feed items
  const { data: items, error: itemsError, count } = await supabase
    .from('feed_items')
    .select('*', { count: 'exact', head: true });

  if (itemsError) {
    console.error('❌ Items error:', itemsError);
  } else {
    console.log(`📰 Feed items: ${count || 0}`);
  }

  // Check recent items
  const { data: recentItems } = await supabase
    .from('feed_items')
    .select('title_en, published_at')
    .order('published_at', { ascending: false })
    .limit(5);

  if (recentItems && recentItems.length > 0) {
    console.log('\n📰 Recent articles:');
    recentItems.forEach((item: any) => {
      const date = new Date(item.published_at * 1000).toLocaleString();
      console.log(`  - ${item.title_en} (${date})`);
    });
  }
}

main();
