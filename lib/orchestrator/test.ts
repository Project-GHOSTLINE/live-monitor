/**
 * Orchestrator Pipeline Test Script
 *
 * Test the orchestrator pipeline with sample data
 * Run with: npx tsx lib/orchestrator/test.ts
 */

import { processFeedItem, calculatePipelineStats } from './pipeline';
import type { PipelineInput } from './pipeline';

// Test data: Sample feed items
const testFeedItems: PipelineInput[] = [
  {
    feedItem: {
      source_id: 1,
      source_name: 'Test Source',
      source_url: 'https://test.com/article-1',
      canonical_url: 'https://test.com/article-1',
      published_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      title_original: 'Missile strike reported in Gaza City',
      content_original:
        'Multiple missile strikes were reported in Gaza City early this morning. At least 5 people were killed and 12 wounded in the attack. Israeli forces confirmed the operation targeting Hamas infrastructure.',
      lang: 'en',
      reliability: 4,
      entity_places: ['Gaza City', 'Gaza'],
      entity_orgs: ['Hamas', 'Israeli forces'],
      tags: ['Military', 'Conflict'],
    },
  },
  {
    feedItem: {
      source_id: 1,
      source_name: 'Test Source',
      source_url: 'https://test.com/article-2',
      canonical_url: 'https://test.com/article-2',
      published_at: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      title_original: 'Russian troop mobilization reported near Ukrainian border',
      content_original:
        'NATO intelligence reports significant Russian military buildup near the Ukrainian border. Hundreds of tanks and armored vehicles have been deployed in the past 48 hours.',
      lang: 'en',
      reliability: 5,
      entity_places: ['Ukraine', 'Russia'],
      entity_orgs: ['NATO', 'Russian military'],
      tags: ['Military', 'Intelligence'],
    },
  },
  {
    feedItem: {
      source_id: 1,
      source_name: 'Test Source',
      source_url: 'https://test.com/article-3',
      canonical_url: 'https://test.com/article-3',
      published_at: Math.floor(Date.now() / 1000) - 10800, // 3 hours ago
      title_original: 'Protests erupt in Tehran over economic sanctions',
      content_original:
        'Thousands of protesters took to the streets of Tehran to demonstrate against new economic sanctions. The protests remained largely peaceful.',
      lang: 'en',
      reliability: 3,
      entity_places: ['Tehran', 'Iran'],
      tags: ['Protest', 'Economic'],
    },
  },
  {
    feedItem: {
      source_id: 1,
      source_name: 'Test Source',
      source_url: 'https://test.com/article-4',
      canonical_url: 'https://test.com/article-4',
      published_at: Math.floor(Date.now() / 1000) - 14400, // 4 hours ago
      title_original: 'Drone strike targets military base in Syria',
      content_original:
        'A drone strike hit a military installation in northern Syria. The attack caused significant damage to the facility. No casualties have been reported.',
      lang: 'en',
      reliability: 4,
      entity_places: ['Syria'],
      tags: ['Military', 'Drone'],
    },
  },
  {
    feedItem: {
      source_id: 1,
      source_name: 'Test Source',
      source_url: 'https://test.com/article-5',
      canonical_url: 'https://test.com/article-5',
      published_at: Math.floor(Date.now() / 1000) - 18000, // 5 hours ago
      title_original: 'New economic sanctions imposed on North Korea',
      content_original:
        'The UN Security Council voted to impose additional economic sanctions on North Korea in response to recent nuclear tests.',
      lang: 'en',
      reliability: 5,
      entity_places: ['North Korea'],
      entity_orgs: ['UN Security Council'],
      tags: ['Sanctions', 'Diplomatic'],
    },
  },
];

async function runTests() {
  console.log('🚀 Orchestrator Pipeline Test Suite\n');
  console.log('=' .repeat(60));

  // Check if orchestrator is enabled
  const { isOrchestratorEnabled } = await import('./pipeline');
  const enabled = isOrchestratorEnabled();

  console.log(`Orchestrator Status: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`Environment: ORCH_ENABLED=${process.env.ORCH_ENABLED}`);
  console.log('=' .repeat(60));
  console.log('');

  if (!enabled) {
    console.log('⚠️  Set ORCH_ENABLED=true to run full pipeline tests');
    console.log('   Current mode: Ingestion only (event processing skipped)\n');
  }

  // Process each test item
  const results = [];
  for (let i = 0; i < testFeedItems.length; i++) {
    const item = testFeedItems[i];
    console.log(`\n📝 Processing Item ${i + 1}/${testFeedItems.length}:`);
    console.log(`   Title: ${item.feedItem.title_original}`);
    console.log(`   Places: ${item.feedItem.entity_places?.join(', ') || 'None'}`);

    const result = await processFeedItem(item);
    results.push(result);

    console.log(`   Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (result.is_duplicate) {
      console.log(`   Status: Duplicate (ID: ${result.duplicate_of})`);
    } else {
      console.log(`   Feed Item ID: ${result.feed_item_id}`);
      if (result.event_frame_id) {
        console.log(`   Event Frame ID: ${result.event_frame_id}`);
      }
      if (result.signal_activations && result.signal_activations.length > 0) {
        console.log(`   Signals: ${result.signal_activations.length} activated`);
      }
    }
    console.log(`   Duration: ${result.duration_ms}ms`);

    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  }

  // Calculate statistics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Pipeline Statistics:\n');

  const stats = calculatePipelineStats(results);
  console.log(`   Total Processed:     ${stats.total_processed}`);
  console.log(`   Successful:          ${stats.successful}`);
  console.log(`   Failed:              ${stats.failed}`);
  console.log(`   Duplicates:          ${stats.duplicates}`);
  console.log(`   Events Created:      ${stats.events_created}`);
  console.log(`   Signals Activated:   ${stats.signals_activated}`);
  console.log(`   Avg Duration:        ${Math.round(stats.avg_duration_ms)}ms`);

  console.log('\n' + '='.repeat(60));

  // Summary
  const successRate = (stats.successful / stats.total_processed) * 100;
  console.log('\n✨ Test Summary:');
  console.log(`   Success Rate: ${successRate.toFixed(1)}%`);

  if (stats.failed > 0) {
    console.log(`   ⚠️  ${stats.failed} item(s) failed processing`);
  }

  if (!enabled) {
    console.log('\n💡 Tip: Set ORCH_ENABLED=true to test full event extraction and signal mapping');
  }

  console.log('');
}

// Run tests
runTests()
  .then(() => {
    console.log('✅ Tests completed\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
