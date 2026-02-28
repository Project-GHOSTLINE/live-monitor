// Pipeline Integration Tests
// Tests the complete 4-step pipeline with mock data

import { FeedItem } from '@/types/feed';
import { runPipeline, generatePipelineSummary, DEFAULT_CONFIG } from '../pipeline';

/**
 * Create mock feed items for testing
 */
function createMockFeedItems(): FeedItem[] {
  const now = Date.now();

  return [
    {
      id: 1,
      source_id: 1,
      source_name: 'Reuters',
      source_url: 'https://reuters.com/feed',
      canonical_url: 'https://reuters.com/article1',
      published_at: now - 3600000, // 1 hour ago
      fetched_at: now,
      title_original: 'US strikes Houthi targets in Yemen',
      title_en: 'US strikes Houthi targets in Yemen',
      summary_en: 'US military conducted airstrikes against Houthi positions in Yemen following attacks on shipping.',
      content_original: 'US military conducted airstrikes against Houthi positions in Yemen following attacks on shipping.',
      lang: 'en',
      tags: ['Military', 'Security'],
      entity_places: ['Yemen'],
      entity_orgs: ['US Military', 'Houthis'],
      reliability: 0.9,
      is_duplicate: false,
      created_at: now,
    },
    {
      id: 2,
      source_id: 1,
      source_name: 'Reuters',
      source_url: 'https://reuters.com/feed',
      canonical_url: 'https://reuters.com/article2',
      published_at: now - 7200000, // 2 hours ago
      fetched_at: now,
      title_original: 'Iran announces new military exercises',
      title_en: 'Iran announces new military exercises',
      summary_en: 'Iranian military announces major troop movements and exercises near strategic waterways.',
      content_original: 'Iranian military announces major troop movements and exercises near strategic waterways.',
      lang: 'en',
      tags: ['Military'],
      entity_places: ['Iran', 'Persian Gulf'],
      entity_orgs: ['Iranian Military'],
      reliability: 0.85,
      is_duplicate: false,
      created_at: now,
    },
    {
      id: 3,
      source_id: 2,
      source_name: 'Al Jazeera',
      source_url: 'https://aljazeera.com/feed',
      canonical_url: 'https://aljazeera.com/article3',
      published_at: now - 10800000, // 3 hours ago
      fetched_at: now,
      title_original: 'Civilian casualties reported in Gaza strikes',
      title_en: 'Civilian casualties reported in Gaza strikes',
      summary_en: 'Israeli airstrikes in Gaza result in multiple civilian deaths and infrastructure damage.',
      content_original: 'Israeli airstrikes in Gaza result in multiple civilian deaths and infrastructure damage.',
      lang: 'en',
      tags: ['Humanitarian', 'Civilian Impact'],
      entity_places: ['Gaza'],
      entity_orgs: ['Israeli Military'],
      reliability: 0.8,
      is_duplicate: false,
      created_at: now,
    },
    {
      id: 4,
      source_id: 3,
      source_name: 'BBC',
      source_url: 'https://bbc.com/feed',
      canonical_url: 'https://bbc.com/article4',
      published_at: now - 14400000, // 4 hours ago
      fetched_at: now,
      title_original: 'US announces new sanctions on Iran',
      title_en: 'US announces new sanctions on Iran',
      summary_en: 'United States imposes additional economic sanctions targeting Iranian energy sector.',
      content_original: 'United States imposes additional economic sanctions targeting Iranian energy sector.',
      lang: 'en',
      tags: ['Economy', 'Politics'],
      entity_places: ['US', 'Iran'],
      entity_orgs: ['US Government'],
      reliability: 0.9,
      is_duplicate: false,
      created_at: now,
    },
    {
      id: 5,
      source_id: 4,
      source_name: 'France24',
      source_url: 'https://france24.com/feed',
      canonical_url: 'https://france24.com/article5',
      published_at: now - 18000000, // 5 hours ago
      fetched_at: now,
      title_original: 'Protests erupt in multiple cities',
      title_en: 'Protests erupt in multiple cities',
      summary_en: 'Large demonstrations reported in Israel and Lebanon calling for ceasefire.',
      content_original: 'Large demonstrations reported in Israel and Lebanon calling for ceasefire.',
      lang: 'en',
      tags: ['Protests', 'Politics'],
      entity_places: ['Israel', 'Lebanon'],
      entity_orgs: [],
      reliability: 0.75,
      is_duplicate: false,
      created_at: now,
    },
    {
      id: 6,
      source_id: 5,
      source_name: 'UN News',
      source_url: 'https://un.org/feed',
      canonical_url: 'https://un.org/article6',
      published_at: now - 21600000, // 6 hours ago
      fetched_at: now,
      title_original: 'Humanitarian aid convoy blocked',
      title_en: 'Humanitarian aid convoy blocked',
      summary_en: 'UN humanitarian convoy prevented from entering Gaza, exacerbating humanitarian crisis.',
      content_original: 'UN humanitarian convoy prevented from entering Gaza, exacerbating humanitarian crisis.',
      lang: 'en',
      tags: ['Humanitarian'],
      entity_places: ['Gaza'],
      entity_orgs: ['UN', 'Israeli Military'],
      reliability: 0.95,
      is_duplicate: false,
      created_at: now,
    },
    {
      id: 7,
      source_id: 1,
      source_name: 'Reuters',
      source_url: 'https://reuters.com/feed',
      canonical_url: 'https://reuters.com/article7',
      published_at: now - 25200000, // 7 hours ago
      fetched_at: now,
      title_original: 'Cyber attacks target critical infrastructure',
      title_en: 'Cyber attacks target critical infrastructure',
      summary_en: 'Series of cyber attacks reported against energy facilities in multiple countries.',
      content_original: 'Series of cyber attacks reported against energy facilities in multiple countries.',
      lang: 'en',
      tags: ['Security'],
      entity_places: ['Israel', 'US'],
      entity_orgs: [],
      reliability: 0.85,
      is_duplicate: false,
      created_at: now,
    },
    {
      id: 8,
      source_id: 3,
      source_name: 'BBC',
      source_url: 'https://bbc.com/feed',
      canonical_url: 'https://bbc.com/article8',
      published_at: now - 28800000, // 8 hours ago
      fetched_at: now,
      title_original: 'Diplomatic talks scheduled',
      title_en: 'Diplomatic talks scheduled',
      summary_en: 'Regional leaders to meet for ceasefire negotiations next week.',
      content_original: 'Regional leaders to meet for ceasefire negotiations next week.',
      lang: 'en',
      tags: ['Diplomacy'],
      entity_places: ['Qatar'],
      entity_orgs: [],
      reliability: 0.9,
      is_duplicate: false,
      created_at: now,
    },
  ];
}

/**
 * Test basic pipeline execution
 */
async function testBasicPipeline() {
  console.log('\n=== Test 1: Basic Pipeline Execution ===');

  const feedItems = createMockFeedItems();
  const result = await runPipeline(feedItems, undefined, DEFAULT_CONFIG);

  console.log('✓ Pipeline completed successfully');
  console.log(`  Events extracted: ${result.stats.events_extracted}`);
  console.log(`  Signals generated: ${result.stats.signals_generated}`);
  console.log(`  Scenarios scored: ${result.stats.scenarios_scored}`);
  console.log(`  Processing time: ${result.stats.processing_time_ms}ms`);

  // Assertions
  if (result.stats.events_extracted === 0) {
    console.error('✗ FAIL: No events extracted');
    return false;
  }

  if (result.stats.signals_generated === 0) {
    console.error('✗ FAIL: No signals generated');
    return false;
  }

  if (result.stats.scenarios_scored === 0) {
    console.error('✗ FAIL: No scenarios scored');
    return false;
  }

  if (result.scores.length === 0) {
    console.error('✗ FAIL: No scenario scores returned');
    return false;
  }

  console.log('✓ All assertions passed');
  return true;
}

/**
 * Test event extraction
 */
async function testEventExtraction() {
  console.log('\n=== Test 2: Event Extraction ===');

  const feedItems = createMockFeedItems();
  const result = await runPipeline(feedItems, undefined, DEFAULT_CONFIG);

  console.log(`Extracted ${result.events.length} events:`);

  const eventTypeCount: Record<string, number> = {};
  for (const event of result.events) {
    eventTypeCount[event.event_type] = (eventTypeCount[event.event_type] || 0) + 1;
    console.log(`  - ${event.event_type} (severity: ${event.severity}, confidence: ${event.confidence.toFixed(2)})`);
  }

  console.log('\nEvent type distribution:');
  for (const [type, count] of Object.entries(eventTypeCount)) {
    console.log(`  ${type}: ${count}`);
  }

  // Check for expected event types
  const expectedTypes = ['strike', 'sanction', 'civilian_casualties'];
  const foundTypes = Object.keys(eventTypeCount);

  for (const expected of expectedTypes) {
    if (!foundTypes.includes(expected)) {
      console.warn(`⚠️  Expected event type "${expected}" not found`);
    } else {
      console.log(`✓ Found expected event type: ${expected}`);
    }
  }

  return true;
}

/**
 * Test signal mapping and merging
 */
async function testSignalMapping() {
  console.log('\n=== Test 3: Signal Mapping ===');

  const feedItems = createMockFeedItems();
  const result = await runPipeline(feedItems, undefined, DEFAULT_CONFIG);

  console.log(`Generated ${result.signals.length} signals:`);

  for (const signal of result.signals.slice(0, 10)) {
    const score = (signal.weight * signal.reliability * signal.recency_factor).toFixed(3);
    console.log(`  ${signal.signal_id}: score=${score}, sources=${signal.feed_item_ids.length}`);
  }

  // Check signal properties
  for (const signal of result.signals) {
    if (signal.feed_item_ids.length === 0) {
      console.error(`✗ FAIL: Signal ${signal.signal_id} has no source links`);
      return false;
    }

    if (signal.weight < 0 || signal.weight > 1) {
      console.error(`✗ FAIL: Signal ${signal.signal_id} has invalid weight: ${signal.weight}`);
      return false;
    }
  }

  console.log('✓ All signals have valid properties');
  return true;
}

/**
 * Test scenario scoring
 */
async function testScenarioScoring() {
  console.log('\n=== Test 4: Scenario Scoring ===');

  const feedItems = createMockFeedItems();
  const result = await runPipeline(feedItems, undefined, DEFAULT_CONFIG);

  console.log(`Scored ${result.scores.length} scenarios:`);

  for (const score of result.scores) {
    const prob = (score.probability * 100).toFixed(1);
    const conf = (score.confidence * 100).toFixed(0);
    console.log(`  ${score.scenario_id}:`);
    console.log(`    Probability: ${prob}%, Confidence: ${conf}%`);
    console.log(`    Active signals: ${score.active_signals.length}, Trend: ${score.trend}`);
  }

  // Check probability range
  for (const score of result.scores) {
    if (score.probability < 0 || score.probability > 1) {
      console.error(`✗ FAIL: Invalid probability for ${score.scenario_id}: ${score.probability}`);
      return false;
    }
  }

  console.log('✓ All probabilities in valid range [0, 1]');
  return true;
}

/**
 * Test impact calculation
 */
async function testImpactCalculation() {
  console.log('\n=== Test 5: Impact Calculation ===');

  const feedItems = createMockFeedItems();
  const result = await runPipeline(feedItems, undefined, DEFAULT_CONFIG);

  console.log(`Calculated impacts for ${result.impacts.length} scenarios:`);

  for (const impact of result.impacts) {
    console.log(`\n  ${impact.scenario_id} (severity: ${impact.overall_severity}):`);

    for (const domain of impact.impacts) {
      console.log(`    ${domain.domain}: ${domain.level}`);
      console.log(`      Reasoning: ${domain.reasoning}`);
      console.log(`      Sources: ${domain.source_links.length}`);
    }
  }

  // Validation check
  for (const impact of result.impacts) {
    for (const domain of impact.impacts) {
      if (domain.source_links.length === 0) {
        console.error(`✗ FAIL: Impact ${impact.scenario_id}/${domain.domain} has no sources`);
        return false;
      }
    }
  }

  console.log('✓ All impacts have source links (anti-hallucination check)');
  return true;
}

/**
 * Test validation and anti-hallucination
 */
async function testValidation() {
  console.log('\n=== Test 6: Validation & Anti-Hallucination ===');

  const feedItems = createMockFeedItems();
  const result = await runPipeline(feedItems, undefined, DEFAULT_CONFIG);

  console.log(`Validation errors: ${result.validation_errors.length}`);

  if (result.validation_errors.length > 0) {
    console.log('Validation errors found:');
    for (const error of result.validation_errors) {
      console.log(`  ⚠️  ${error}`);
    }
  } else {
    console.log('✓ No validation errors');
  }

  return true;
}

/**
 * Test summary generation
 */
async function testSummaryGeneration() {
  console.log('\n=== Test 7: Summary Generation ===');

  const feedItems = createMockFeedItems();
  const result = await runPipeline(feedItems, undefined, DEFAULT_CONFIG);

  const summary = generatePipelineSummary(result);
  console.log('\n' + summary);

  console.log('✓ Summary generated successfully');
  return true;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Scenario Pipeline Integration Tests  ║');
  console.log('╚════════════════════════════════════════╝');

  const tests = [
    { name: 'Basic Pipeline', fn: testBasicPipeline },
    { name: 'Event Extraction', fn: testEventExtraction },
    { name: 'Signal Mapping', fn: testSignalMapping },
    { name: 'Scenario Scoring', fn: testScenarioScoring },
    { name: 'Impact Calculation', fn: testImpactCalculation },
    { name: 'Validation', fn: testValidation },
    { name: 'Summary Generation', fn: testSummaryGeneration },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result !== false) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`✗ Test "${test.name}" threw error:`, error);
      failed++;
    }
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log(`║  Tests Complete: ${passed} passed, ${failed} failed  ║`);
  console.log('╚════════════════════════════════════════╝\n');
}

// Export for use in test runners
export { runAllTests, createMockFeedItems };

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
