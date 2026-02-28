# Scenario System Tests

Comprehensive test suite for the event extraction, signal mapping, and scenario scoring system.

## Test Structure

### 1. Event Extractor Tests (`event-extractor.test.ts`)
Tests the extraction of structured event data from feed items.

**Coverage:**
- Event type detection (strikes, protests, sanctions, etc.)
- Multi-language support (English, French, Arabic)
- Actor extraction from text and entities
- Location detection
- Severity classification
- Confidence calculation based on source reliability
- Edge cases (malformed data, missing fields, short content)

**Key Validations:**
- Events extracted with correct structure
- Actors properly identified and normalized
- Severity levels assigned appropriately
- Confidence increases with high-reliability sources
- Multi-language patterns detected correctly

### 2. Signal Mapper Tests (`signal-mapper.test.ts`)
Tests the conversion of EventFrames to Signals with weighting and decay.

**Coverage:**
- EventFrame to Signal conversion
- Signal ID generation and normalization
- Weight calculation (event type + severity)
- Time-based recency decay (exponential)
- Signal aggregation and merging
- Batch processing
- Filtering by confidence threshold

**Key Validations:**
- Signals have consistent IDs for same event characteristics
- Weights properly calculated from event type and severity
- Recency factor decays exponentially over time
- Duplicate signals merged correctly
- Source reliability properly incorporated

### 3. Scenario Scorer Tests (`scenario-scorer.test.ts`)
Tests scenario probability calculation and trend detection.

**Coverage:**
- Probability score calculation
- Pattern matching (required, boost, inhibit signals)
- Confidence calculation from signal quality
- Trend detection (rising, stable, falling)
- Significant change detection
- Probability normalization
- Wildcard pattern matching

**Key Validations:**
- Probabilities between 0 and 1
- Required signals enforced
- Boost signals increase probability
- Inhibit signals decrease probability
- Trends detected correctly over time
- Changes above threshold identified

### 4. Integration Tests (`scenarios-integration.test.ts`)
Tests the complete pipeline from feed items to scenario scores.

**Coverage:**
- Full pipeline: FeedItem → EventFrame → Signal → ScenarioScore
- Data quality and traceability
- Multi-language processing
- Source reliability weighting
- Performance with large batches
- Scenario-specific validation

**Key Validations:**
- All impacts have source traceability
- No hallucinations (all signals backed by feed items)
- Timestamps coherent throughout pipeline
- Probabilities valid across all scenarios
- System handles 100+ feed items efficiently
- Specific scenarios respond to relevant signals

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx tsx tests/event-extractor.test.ts
npx tsx tests/signal-mapper.test.ts
npx tsx tests/scenario-scorer.test.ts
npx tsx tests/scenarios-integration.test.ts
```

### Run with Coverage (requires jest or vitest)
```bash
npm run test:coverage
```

## Seed Test Data

Populate database with realistic test scenarios:

```bash
npm run seed:scenarios
# or
npx tsx scripts/seed-test-scenarios.ts
```

This creates:
- 4 test sources (varying reliability)
- 15 feed items (multiple event types)
- Events extracted and processed
- Signals mapped and aggregated
- Scenarios scored with probabilities

## Test Data Scenarios

The seed script creates realistic test data covering:

1. **Limited Escalation**
   - Tit-for-tat strikes between Israel and Hamas
   - Multiple retaliatory attacks
   - Expected outcome: High probability for "limited_escalation" scenario

2. **Civilian Impact**
   - Civilian casualties reported
   - Hospital damage
   - Expected outcome: High severity signals

3. **Infrastructure Targeting**
   - Power plant damage
   - Water crisis
   - Expected outcome: "infrastructure_attacks" scenario activated

4. **Economic/Sanctions**
   - EU sanctions on Iran
   - Oil price surge
   - Expected outcome: "economic_energy_shock" scenario boosted

5. **Diplomatic Efforts**
   - UN ceasefire calls
   - Egyptian mediation
   - Expected outcome: De-escalation signals (inhibit escalation scenarios)

6. **Regional Protests**
   - Demonstrations across Europe and Middle East
   - Expected outcome: "protest_wave" scenario activated

7. **Multi-actor Involvement**
   - US naval deployment
   - Iranian warnings
   - Expected outcome: "multi_actor_escalation" scenario boosted

## Validation Metrics

### Data Quality Checks
- ✅ All signals have source feed items
- ✅ All feed items have valid timestamps
- ✅ All probabilities between 0 and 1
- ✅ All confidences between 0 and 1
- ✅ No orphaned signals (without sources)

### Performance Benchmarks
- Event extraction: < 1ms per item
- Signal mapping: < 5ms per batch
- Scenario scoring: < 10ms for all scenarios
- Full pipeline (100 items): < 5 seconds

### Traceability Requirements
Every scenario impact must be traceable to:
1. One or more Signals
2. Each Signal backed by EventFrames
3. Each EventFrame linked to FeedItem(s)
4. Each FeedItem from a known Source

## Continuous Testing

### Watch Mode (development)
```bash
npm run test:watch
```

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm test
```

### CI/CD Integration
Example GitHub Actions:
```yaml
- name: Run Scenario Tests
  run: |
    npm install
    npm test
    npm run seed:scenarios
```

## Debugging Tests

### Enable Verbose Output
```bash
DEBUG=* npx tsx tests/scenarios-integration.test.ts
```

### Inspect Generated Data
```typescript
// Add to test file
import { writeFileSync } from 'fs';

test('debug signals', () => {
  const signals = mapSignals(events, reliabilityMap);
  writeFileSync('debug-signals.json', JSON.stringify(signals, null, 2));
});
```

### Check Database State
```bash
# SQLite
sqlite3 data/ww3.db "SELECT * FROM feed_items ORDER BY published_at DESC LIMIT 10;"

# Supabase
# Use Supabase Studio or psql
```

## Test Maintenance

### Adding New Event Types
1. Add pattern to `event-extractor.ts`
2. Add test cases in `event-extractor.test.ts`
3. Update weight in `types/scenario.ts`
4. Add signal mapper test
5. Create scenario template if needed

### Adding New Scenarios
1. Define template in `types/scenario.ts`
2. Add test case in `scenario-scorer.test.ts`
3. Add integration test validation
4. Update seed script with relevant test data

### Updating Test Data
Modify `scripts/seed-test-scenarios.ts`:
- Add new feed items
- Adjust timestamps
- Update reliability scores
- Add new event patterns

## Troubleshooting

### Tests Failing After Code Changes
1. Check if event patterns changed
2. Verify weight calculations updated
3. Ensure signal IDs remain consistent
4. Validate probability calculations

### Inconsistent Results
1. Check timestamp handling
2. Verify random seed (if using randomization)
3. Ensure database state clean between tests
4. Validate time-based decay calculations

### Performance Issues
1. Profile with Node.js --inspect
2. Check for N+1 database queries
3. Verify signal aggregation efficiency
4. Consider batching operations

## Contributing

When adding tests:
1. Follow existing test structure
2. Use descriptive test names
3. Include edge cases
4. Verify data quality (no hallucinations)
5. Ensure traceability
6. Add performance benchmarks for new features

## References

- Event Extractor: `/lib/scenarios/event-extractor.ts`
- Signal Mapper: `/lib/scenarios/signal-mapper.ts`
- Scenario Scorer: `/lib/scenarios/scenario-scorer.ts`
- Type Definitions: `/types/scenario.ts`
- Integration Example: `/tests/scenarios-integration.test.ts`
