#!/usr/bin/env tsx

import { ingestAllSources } from '../lib/rss/fetcher';

console.log('🚀 Démarrage de l\'ingestion manuelle...\n');

async function main() {
  try {
    const result = await ingestAllSources();

    console.log('\n✅ Ingestion terminée !');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();
