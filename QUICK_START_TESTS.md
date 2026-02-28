# Quick Start - Scenario System Tests

## Run Tests (3 Commands)

### 1. Run All Tests
```bash
cd /Users/xunit/Desktop/ww3
npm test
```

### 2. Seed Test Data
```bash
npm run seed:scenarios
```

### 3. Run Individual Tests
```bash
# Event extraction tests
npm run test:event-extractor

# Signal mapping tests
npm run test:signal-mapper

# Scenario scoring tests
npm run test:scenario-scorer

# Integration tests (full pipeline)
npm run test:integration
```

## What Gets Tested

### Event Extractor (40+ tests)
- ✅ Extract events from news articles
- ✅ Detect strikes, protests, sanctions, etc.
- ✅ Handle English, French, Arabic
- ✅ Identify actors (US, Israel, Iran, etc.)
- ✅ Calculate confidence scores

### Signal Mapper (35+ tests)
- ✅ Convert events to weighted signals
- ✅ Apply time decay (exponential)
- ✅ Merge duplicate signals
- ✅ Calculate recency factors
- ✅ Detect trends (rising/stable/falling)

### Scenario Scorer (30+ tests)
- ✅ Calculate scenario probabilities
- ✅ Pattern matching (wildcards)
- ✅ Boost/inhibit signals
- ✅ Trend detection over time
- ✅ Significant change detection

### Integration (20+ tests)
- ✅ Full pipeline validation
- ✅ Data traceability
- ✅ No hallucinations
- ✅ Performance benchmarks
- ✅ Multi-language processing

## Expected Output

### Test Results
```
🧪 Running Scenario System Tests

📋 event-extractor ✅ PASSED
📋 signal-mapper ✅ PASSED
📋 scenario-scorer ✅ PASSED
📋 scenarios-integration ✅ PASSED

📊 Test Results:
  ✅ Passed: 4
  ❌ Failed: 0
  📈 Total: 4

✅ All tests passed!
```

### Seed Results
```
🌱 Seeding test data for scenario system...

📰 Sources: 4 (Reuters, Al Jazeera, BBC, Le Monde)
📋 Feed Items: 15 (strikes, casualties, infrastructure, etc.)
🔄 Events: 13 extracted
📊 Signals: 11 unique
🎯 Scenarios: 8 scored

📊 Top Scenarios:
  Escalade limitée: 64.2% ████████████████████████████████
  Infrastructures critiques: 40.1% ████████████████████
  Choc économique: 30.5% ███████████████

✅ Test data seeded successfully!
```

## Test Files Location

All test files are in `/Users/xunit/Desktop/ww3/tests/`:

- `event-extractor.test.ts` - Event extraction tests
- `signal-mapper.test.ts` - Signal mapping tests
- `scenario-scorer.test.ts` - Scenario scoring tests
- `scenarios-integration.test.ts` - Integration tests
- `test-framework.ts` - Minimal test framework
- `run-tests.ts` - Test runner
- `README.md` - Detailed documentation

## Validation Checks

The tests validate:

1. **Data Quality**
   - All signals have sources
   - All probabilities 0-1
   - All timestamps valid
   - No hallucinations

2. **Traceability**
   - ScenarioScore → Signals → Events → FeedItems → Sources
   - Every impact backed by source articles

3. **Performance**
   - Event extraction: < 1ms per item
   - Signal mapping: < 5ms per batch
   - Full pipeline (100 items): < 5s

4. **Correctness**
   - Events extracted accurately
   - Weights calculated correctly
   - Probabilities reasonable
   - Trends detected properly

## Troubleshooting

### Tests won't run
```bash
# Ensure dependencies installed
npm install

# Check Node version (need 18+)
node --version

# Try running directly
npx tsx tests/scenarios-integration.test.ts
```

### Database errors
```bash
# Setup database first
npm run setup-db
```

### Import errors
The tests use a minimal framework to avoid dependencies.
Each test file should have at the bottom:
```typescript
runTests();
```

## Next Steps

After tests pass:

1. **View in Monitor**
   ```bash
   npm run dev
   # Visit http://localhost:3000/monitor
   ```

2. **Check Database**
   ```bash
   # SQLite
   sqlite3 data/ww3.db "SELECT * FROM feed_items LIMIT 5;"
   
   # Supabase
   # Use Supabase Studio
   ```

3. **Add Real Data**
   ```bash
   npm run ingest
   ```

4. **Process Scenarios**
   Create API endpoint to run scenario pipeline on real feed data.

## Files Created

### Implementation
- `/lib/scenarios/event-extractor.ts` ✅ (already existed)
- `/lib/scenarios/signal-mapper.ts` ✅ (already existed)
- `/lib/scenarios/scenario-scorer.ts` ✅ (created)

### Tests
- `/tests/event-extractor.test.ts` ✅ (40+ tests)
- `/tests/signal-mapper.test.ts` ✅ (35+ tests)
- `/tests/scenario-scorer.test.ts` ✅ (30+ tests)
- `/tests/scenarios-integration.test.ts` ✅ (20+ tests)

### Scripts
- `/scripts/seed-test-scenarios.ts` ✅ (test data generator)
- `/tests/run-tests.ts` ✅ (test runner)

### Documentation
- `/tests/README.md` ✅ (comprehensive docs)
- `/SCENARIO_TESTS_SUMMARY.md` ✅ (technical summary)
- `/QUICK_START_TESTS.md` ✅ (this file)

## Support

For detailed information, see:
- `/tests/README.md` - Comprehensive test documentation
- `/SCENARIO_TESTS_SUMMARY.md` - Technical details and architecture

---

**Status**: ✅ Ready to Test
**Total Tests**: 120+
**Test Suites**: 4
**Coverage**: Event Extraction, Signal Mapping, Scenario Scoring, Integration
