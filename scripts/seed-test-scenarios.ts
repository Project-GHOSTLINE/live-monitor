#!/usr/bin/env tsx
/**
 * Seed script for scenario system testing
 * Creates realistic test data for validating the scenario pipeline
 */

import { getDB } from '../lib/db/adapter';
import { FeedItem, RSSSource } from '../types/feed';
import { extractEvents } from '../lib/scenarios/event-extractor';
import { mapSignals } from '../lib/scenarios/signal-mapper';
import { scoreAllScenarios } from '../lib/scenarios/scenario-scorer';

// Test sources with varying reliability
const testSources: Omit<RSSSource, 'id'>[] = [
  {
    name: 'Reuters Test',
    url: 'https://reuters.com/test',
    source_type: 'mainstream',
    reliability: 5,
    language: 'en',
    rate_limit_seconds: 300,
    is_active: true,
  },
  {
    name: 'Al Jazeera Test',
    url: 'https://aljazeera.com/test',
    source_type: 'regional',
    reliability: 4,
    language: 'en',
    rate_limit_seconds: 300,
    is_active: true,
  },
  {
    name: 'BBC Test',
    url: 'https://bbc.com/test',
    source_type: 'mainstream',
    reliability: 5,
    language: 'en',
    rate_limit_seconds: 300,
    is_active: true,
  },
  {
    name: 'Le Monde Test',
    url: 'https://lemonde.fr/test',
    source_type: 'mainstream',
    reliability: 4,
    language: 'fr',
    rate_limit_seconds: 300,
    is_active: true,
  },
];

// Test feed items representing realistic news scenarios
const now = Date.now();
const oneHourAgo = now - 60 * 60 * 1000;
const threeHoursAgo = now - 3 * 60 * 60 * 1000;
const sixHoursAgo = now - 6 * 60 * 60 * 1000;
const twelvHoursAgo = now - 12 * 60 * 60 * 1000;
const oneDayAgo = now - 24 * 60 * 60 * 1000;

function createTestFeedItems(sourceIds: Map<string, number>): Omit<FeedItem, 'id'>[] {
  const reutersId = sourceIds.get('Reuters Test')!;
  const alJazeeraId = sourceIds.get('Al Jazeera Test')!;
  const bbcId = sourceIds.get('BBC Test')!;
  const leMondeId = sourceIds.get('Le Monde Test')!;

  return [
    // Scenario 1: Limited Escalation - Tit-for-tat strikes
    {
      source_id: reutersId,
      source_name: 'Reuters Test',
      source_url: 'https://reuters.com',
      canonical_url: 'https://reuters.com/test/article-1',
      published_at: oneDayAgo,
      fetched_at: now,
      title_original: 'Israeli airstrike targets Hamas positions',
      content_original: 'Israeli Defense Forces conducted precision strikes on Hamas military infrastructure in northern Gaza',
      lang: 'en',
      title_en: 'Israeli airstrike targets Hamas positions in Gaza',
      summary_en: 'IDF reports successful strike on military targets with minimal collateral damage',
      tags: ['military', 'strike', 'Gaza'],
      entity_places: ['Gaza', 'Israel'],
      entity_orgs: ['Israel', 'IDF', 'Hamas'],
      reliability: 5,
      is_duplicate: false,
    },
    {
      source_id: alJazeeraId,
      source_name: 'Al Jazeera Test',
      source_url: 'https://aljazeera.com',
      canonical_url: 'https://aljazeera.com/test/article-2',
      published_at: twelvHoursAgo,
      fetched_at: now,
      title_original: 'Retaliatory rockets fired from Gaza',
      lang: 'en',
      title_en: 'Hamas launches rockets in response to Israeli strikes',
      summary_en: 'Over 30 rockets fired towards Israeli territory, most intercepted by Iron Dome',
      tags: ['military', 'retaliation'],
      entity_places: ['Gaza', 'Israel'],
      entity_orgs: ['Hamas', 'Israel'],
      reliability: 4,
      is_duplicate: false,
    },
    {
      source_id: bbcId,
      source_name: 'BBC Test',
      source_url: 'https://bbc.com',
      canonical_url: 'https://bbc.com/test/article-3',
      published_at: sixHoursAgo,
      fetched_at: now,
      title_original: 'Cycle of violence continues',
      lang: 'en',
      title_en: 'Multiple strikes reported as tensions escalate',
      summary_en: 'Pattern of attack and retaliation continues for third consecutive day',
      tags: ['conflict', 'escalation'],
      entity_places: ['Gaza', 'Israel'],
      entity_orgs: ['Israel', 'Hamas', 'UN'],
      reliability: 5,
      is_duplicate: false,
    },

    // Scenario 2: Civilian Impact
    {
      source_id: bbcId,
      source_name: 'BBC Test',
      source_url: 'https://bbc.com',
      canonical_url: 'https://bbc.com/test/article-4',
      published_at: threeHoursAgo,
      fetched_at: now,
      title_original: 'Civilian casualties mount in Gaza',
      lang: 'en',
      title_en: '27 civilians killed in latest bombardment',
      summary_en: 'Health Ministry reports significant civilian casualties including 12 children in overnight strikes',
      tags: ['humanitarian', 'casualties', 'civilian'],
      entity_places: ['Gaza'],
      entity_orgs: ['WHO', 'UN', 'Red Crescent'],
      reliability: 5,
      is_duplicate: false,
    },
    {
      source_id: reutersId,
      source_name: 'Reuters Test',
      source_url: 'https://reuters.com',
      canonical_url: 'https://reuters.com/test/article-5',
      published_at: oneHourAgo,
      fetched_at: now,
      title_original: 'Hospital damaged in bombing',
      lang: 'en',
      title_en: 'Gaza hospital partially destroyed in airstrike',
      summary_en: 'Al-Shifa Hospital wing damaged, medical services disrupted',
      tags: ['infrastructure', 'hospital', 'humanitarian'],
      entity_places: ['Gaza'],
      entity_orgs: ['WHO', 'MSF'],
      reliability: 5,
      is_duplicate: false,
    },

    // Scenario 3: Infrastructure Targeting
    {
      source_id: reutersId,
      source_name: 'Reuters Test',
      source_url: 'https://reuters.com',
      canonical_url: 'https://reuters.com/test/article-6',
      published_at: twelvHoursAgo,
      fetched_at: now,
      title_original: 'Power plant hit in strike',
      lang: 'en',
      title_en: 'Major power infrastructure damaged in Gaza',
      summary_en: 'Only power plant in Gaza Strip suffers significant damage, affecting water supply',
      tags: ['infrastructure', 'energy'],
      entity_places: ['Gaza'],
      reliability: 5,
      is_duplicate: false,
    },
    {
      source_id: alJazeeraId,
      source_name: 'Al Jazeera Test',
      source_url: 'https://aljazeera.com',
      canonical_url: 'https://aljazeera.com/test/article-7',
      published_at: sixHoursAgo,
      fetched_at: now,
      title_original: 'Water crisis deepens',
      lang: 'en',
      title_en: 'Infrastructure damage causes severe water shortage',
      summary_en: 'Damage to power and water facilities leaves 1.2 million without clean water',
      tags: ['infrastructure', 'humanitarian', 'water'],
      entity_places: ['Gaza'],
      entity_orgs: ['UN', 'UNICEF'],
      reliability: 4,
      is_duplicate: false,
    },

    // Scenario 4: Economic/Sanctions
    {
      source_id: reutersId,
      source_name: 'Reuters Test',
      source_url: 'https://reuters.com',
      canonical_url: 'https://reuters.com/test/article-8',
      published_at: oneDayAgo,
      fetched_at: now,
      title_original: 'New EU sanctions on Iran',
      lang: 'en',
      title_en: 'European Union expands Iran sanctions',
      summary_en: 'EU announces comprehensive sanctions targeting Iranian oil exports and financial institutions',
      tags: ['economy', 'sanctions', 'Iran'],
      entity_places: ['Brussels', 'Iran'],
      entity_orgs: ['EU', 'Iran'],
      reliability: 5,
      is_duplicate: false,
    },
    {
      source_id: bbcId,
      source_name: 'BBC Test',
      source_url: 'https://bbc.com',
      canonical_url: 'https://bbc.com/test/article-9',
      published_at: twelvHoursAgo,
      fetched_at: now,
      title_original: 'Oil prices surge',
      lang: 'en',
      title_en: 'Oil markets react to Middle East tensions',
      summary_en: 'Crude prices jump 8% amid supply disruption fears',
      tags: ['economy', 'energy', 'oil'],
      entity_places: ['Middle East'],
      reliability: 5,
      is_duplicate: false,
    },

    // Scenario 5: Diplomatic Efforts (De-escalation signals)
    {
      source_id: reutersId,
      source_name: 'Reuters Test',
      source_url: 'https://reuters.com',
      canonical_url: 'https://reuters.com/test/article-10',
      published_at: threeHoursAgo,
      fetched_at: now,
      title_original: 'UN calls for immediate ceasefire',
      lang: 'en',
      title_en: 'Security Council debates ceasefire resolution',
      summary_en: 'UN Security Council holds emergency session, France and UK push for immediate ceasefire',
      tags: ['diplomacy', 'ceasefire', 'UN'],
      entity_places: ['New York'],
      entity_orgs: ['UN', 'Security Council', 'France', 'UK'],
      reliability: 5,
      is_duplicate: false,
    },
    {
      source_id: alJazeeraId,
      source_name: 'Al Jazeera Test',
      source_url: 'https://aljazeera.com',
      canonical_url: 'https://aljazeera.com/test/article-11',
      published_at: sixHoursAgo,
      fetched_at: now,
      title_original: 'Egypt mediates talks',
      lang: 'en',
      title_en: 'Cairo hosts ceasefire negotiations',
      summary_en: 'Egyptian intelligence chief meets with Israeli and Hamas representatives',
      tags: ['diplomacy', 'negotiation', 'ceasefire'],
      entity_places: ['Cairo', 'Egypt'],
      entity_orgs: ['Egypt', 'Hamas', 'Israel'],
      reliability: 4,
      is_duplicate: false,
    },

    // Scenario 6: Regional Protests
    {
      source_id: leMondeId,
      source_name: 'Le Monde Test',
      source_url: 'https://lemonde.fr',
      canonical_url: 'https://lemonde.fr/test/article-12',
      published_at: sixHoursAgo,
      fetched_at: now,
      title_original: 'Manifestations massives en Europe',
      lang: 'fr',
      title_en: 'Massive protests across Europe',
      summary_en: 'Tens of thousands march in Paris, London, Berlin demanding end to violence',
      tags: ['protest', 'demonstrations'],
      entity_places: ['Paris', 'London', 'Berlin'],
      reliability: 4,
      is_duplicate: false,
    },
    {
      source_id: alJazeeraId,
      source_name: 'Al Jazeera Test',
      source_url: 'https://aljazeera.com',
      canonical_url: 'https://aljazeera.com/test/article-13',
      published_at: threeHoursAgo,
      fetched_at: now,
      title_original: 'Regional protests intensify',
      lang: 'en',
      title_en: 'Demonstrations spread across Middle East',
      summary_en: 'Large protests in Jordan, Lebanon, and Egypt against escalating violence',
      tags: ['protest', 'regional'],
      entity_places: ['Amman', 'Beirut', 'Cairo'],
      reliability: 4,
      is_duplicate: false,
    },

    // Scenario 7: Multi-actor involvement
    {
      source_id: reutersId,
      source_name: 'Reuters Test',
      source_url: 'https://reuters.com',
      canonical_url: 'https://reuters.com/test/article-14',
      published_at: sixHoursAgo,
      fetched_at: now,
      title_original: 'US deploys naval assets',
      lang: 'en',
      title_en: 'US aircraft carrier group moves to Eastern Mediterranean',
      summary_en: 'Pentagon announces deployment in show of support for Israel',
      tags: ['military', 'deployment', 'US'],
      entity_places: ['Mediterranean', 'Middle East'],
      entity_orgs: ['US', 'Pentagon', 'US Navy'],
      reliability: 5,
      is_duplicate: false,
    },
    {
      source_id: bbcId,
      source_name: 'BBC Test',
      source_url: 'https://bbc.com',
      canonical_url: 'https://bbc.com/test/article-15',
      published_at: threeHoursAgo,
      fetched_at: now,
      title_original: 'Iran warns of consequences',
      lang: 'en',
      title_en: 'Iranian officials issue stern warning',
      summary_en: 'Tehran threatens response if conflict expands, warns regional actors',
      tags: ['warning', 'Iran', 'diplomacy'],
      entity_places: ['Tehran', 'Iran'],
      entity_orgs: ['Iran'],
      reliability: 5,
      is_duplicate: false,
    },
  ];
}

async function seedTestData() {
  console.log('🌱 Seeding test data for scenario system...\n');

  const db = getDB();

  try {
    // 1. Insert test sources
    console.log('📰 Inserting test sources...');
    const sourceIds = new Map<string, number>();

    for (const source of testSources) {
      const id = await db.insert('sources', {
        ...source,
        created_at: Date.now(),
      });
      sourceIds.set(source.name, id);
      console.log(`  ✅ ${source.name} (ID: ${id}, Reliability: ${source.reliability}/5)`);
    }

    // 2. Insert test feed items
    console.log('\n📋 Inserting test feed items...');
    const feedItems = createTestFeedItems(sourceIds);
    const insertedItems: FeedItem[] = [];

    for (const item of feedItems) {
      const id = await db.insert('feed_items', {
        ...item,
        created_at: Date.now(),
      });

      insertedItems.push({
        ...item,
        id,
      });

      const timeAgo = Math.floor((Date.now() - item.published_at) / (60 * 60 * 1000));
      console.log(`  ✅ "${item.title_en?.substring(0, 50)}..." (${timeAgo}h ago)`);
    }

    console.log(`\n✅ Inserted ${insertedItems.length} test feed items`);

    // 3. Process through scenario pipeline
    console.log('\n🔄 Processing through scenario pipeline...\n');

    console.log('Step 1: Extracting events...');
    const events = extractEvents(insertedItems);
    console.log(`  ✅ Extracted ${events.length} event frames`);

    const eventTypeCounts: Record<string, number> = {};
    events.forEach(e => {
      eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1;
    });

    console.log('  Event types detected:');
    Object.entries(eventTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });

    console.log('\nStep 2: Mapping to signals...');
    const reliabilityMap = new Map(
      insertedItems.map(item => [item.id!, item.reliability / 5])
    );
    const signals = mapSignals(events, reliabilityMap);
    console.log(`  ✅ Generated ${signals.length} unique signals`);

    console.log('  Top signals:');
    signals
      .sort((a, b) => (b.weight * b.reliability) - (a.weight * a.reliability))
      .slice(0, 5)
      .forEach(signal => {
        const score = (signal.weight * signal.reliability * signal.recency_factor).toFixed(3);
        console.log(`    - ${signal.signal_id} (score: ${score}, sources: ${signal.feed_item_ids.length})`);
      });

    console.log('\nStep 3: Scoring scenarios...');
    const scores = scoreAllScenarios(signals);
    console.log(`  ✅ Scored ${scores.length} scenarios`);

    console.log('\n📊 Scenario Probabilities:\n');
    scores
      .filter(s => s.probability > 0.01)
      .sort((a, b) => b.probability - a.probability)
      .forEach(score => {
        const template = require('../types/scenario').DEFAULT_SCENARIOS.find((t: any) => t.id === score.scenario_id);
        const bar = '█'.repeat(Math.floor(score.probability * 50));
        const pct = (score.probability * 100).toFixed(1);
        const conf = (score.confidence * 100).toFixed(0);

        console.log(`  ${template?.name || score.scenario_id}`);
        console.log(`    ${bar} ${pct}% (confidence: ${conf}%)`);
        console.log(`    Trend: ${score.trend} | Active signals: ${score.active_signals.length}`);
        console.log();
      });

    // 4. Summary
    console.log('─'.repeat(60));
    console.log('✅ Test data seeded successfully!');
    console.log('─'.repeat(60));
    console.log(`
📈 Summary:
  - Sources: ${testSources.length}
  - Feed Items: ${insertedItems.length}
  - Events: ${events.length}
  - Signals: ${signals.length}
  - Scenarios: ${scores.length}

🧪 Test Coverage:
  - Multi-language content (EN, FR)
  - Multiple source types and reliability levels
  - Various event types (strikes, casualties, infrastructure, etc.)
  - Time-distributed articles (1-24 hours ago)
  - Both escalation and de-escalation signals

💡 Next Steps:
  1. Run tests: npm test tests/scenarios-integration.test.ts
  2. View monitor: npm run dev (visit http://localhost:3000/monitor)
  3. Check database: Use Supabase Studio or SQLite browser
    `);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { seedTestData };
