#!/usr/bin/env tsx

import { ingestAllSources } from '../lib/rss/fetcher';

console.log('🚀 Testing RSS ingestion...\n');

async function main() {
  try {
    const result = await ingestAllSources();

    console.log('\n\n📊 Ingestion Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Sources Processed: ${result.sources_processed}`);
    console.log(`Items Fetched: ${result.items_fetched}`);
    console.log(`Items New: ${result.items_new}`);
    console.log(`Items Duplicate: ${result.items_duplicate}`);
    console.log(`Duration: ${result.duration_ms}ms`);
    console.log(`Success: ${result.success ? '✅' : '❌'}`);

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n✅ Test complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
