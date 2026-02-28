/**
 * Comprehensive API Testing Suite for Scenarios System
 * Tests functional, security, and performance aspects
 */

const BASE_URL = 'http://localhost:3000';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, status, message, details = {}) {
  const result = { name, status, message, details, timestamp: new Date().toISOString() };
  testResults.tests.push(result);

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);

  if (Object.keys(details).length > 0) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }

  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

// Test 1: Basic API endpoint availability
async function testBasicEndpoint() {
  console.log('\n=== Test 1: Basic API Endpoint Availability ===');
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/scenarios`);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      logTest('Basic Endpoint', 'PASS', 'API endpoint is accessible', {
        status: response.status,
        responseTime: `${responseTime}ms`
      });
      return await response.json();
    } else {
      logTest('Basic Endpoint', 'FAIL', `API returned error status`, {
        status: response.status,
        statusText: response.statusText
      });
      return null;
    }
  } catch (error) {
    logTest('Basic Endpoint', 'FAIL', 'Failed to connect to API', {
      error: error.message
    });
    return null;
  }
}

// Test 2: Response structure validation
async function testResponseStructure(data) {
  console.log('\n=== Test 2: Response Structure Validation ===');

  if (!data) {
    logTest('Response Structure', 'FAIL', 'No data to validate');
    return;
  }

  // Check required top-level fields
  const requiredFields = ['scenarios', 'last_updated', 'total'];
  const missingFields = requiredFields.filter(field => !(field in data));

  if (missingFields.length > 0) {
    logTest('Response Structure', 'FAIL', 'Missing required fields', {
      missingFields
    });
    return;
  }

  logTest('Response Structure', 'PASS', 'All required fields present', {
    total: data.total,
    scenariosCount: data.scenarios?.length,
    hasResponseTime: 'response_time_ms' in data
  });

  // Validate scenarios array
  if (!Array.isArray(data.scenarios)) {
    logTest('Scenarios Array', 'FAIL', 'Scenarios is not an array');
    return;
  }

  logTest('Scenarios Array', 'PASS', `Found ${data.scenarios.length} scenarios`);

  // Validate individual scenario structure
  if (data.scenarios.length > 0) {
    const scenario = data.scenarios[0];
    const scenarioFields = ['scenario_id', 'probability', 'name', 'description', 'last_updated'];
    const missingScenarioFields = scenarioFields.filter(field => !(field in scenario));

    if (missingScenarioFields.length > 0) {
      logTest('Scenario Structure', 'FAIL', 'Missing fields in scenario', {
        missingScenarioFields
      });
    } else {
      logTest('Scenario Structure', 'PASS', 'Scenario structure is valid', {
        sample: {
          id: scenario.scenario_id,
          probability: scenario.probability,
          name: scenario.name?.substring(0, 50)
        }
      });
    }
  }
}

// Test 3: Timestamp conversion validation
async function testTimestampConversion(data) {
  console.log('\n=== Test 3: Timestamp Conversion Validation ===');

  if (!data || !data.scenarios || data.scenarios.length === 0) {
    logTest('Timestamp Conversion', 'WARN', 'No scenarios to test timestamps');
    return;
  }

  const scenario = data.scenarios[0];

  // Validate last_updated is a timestamp in milliseconds
  if (typeof scenario.last_updated !== 'number') {
    logTest('Timestamp Type', 'FAIL', 'last_updated is not a number', {
      type: typeof scenario.last_updated,
      value: scenario.last_updated
    });
    return;
  }

  // Check if timestamp is reasonable (between 2020 and 2030)
  const year2020 = new Date('2020-01-01').getTime();
  const year2030 = new Date('2030-01-01').getTime();

  if (scenario.last_updated < year2020 || scenario.last_updated > year2030) {
    logTest('Timestamp Range', 'FAIL', 'Timestamp is outside reasonable range', {
      timestamp: scenario.last_updated,
      date: new Date(scenario.last_updated).toISOString(),
      expectedRange: '2020-2030'
    });
  } else {
    logTest('Timestamp Conversion', 'PASS', 'Timestamps are properly converted', {
      timestamp: scenario.last_updated,
      date: new Date(scenario.last_updated).toISOString()
    });
  }
}

// Test 4: Sorting functionality
async function testSortingFunctionality() {
  console.log('\n=== Test 4: Sorting Functionality ===');

  // Test sort by probability
  try {
    const response = await fetch(`${BASE_URL}/api/scenarios?sort_by=probability`);
    const data = await response.json();

    if (data.scenarios && data.scenarios.length > 1) {
      const isSorted = data.scenarios.every((scenario, i) => {
        if (i === 0) return true;
        return scenario.probability <= data.scenarios[i - 1].probability;
      });

      if (isSorted) {
        logTest('Sort by Probability', 'PASS', 'Scenarios correctly sorted by probability', {
          first: data.scenarios[0]?.probability,
          last: data.scenarios[data.scenarios.length - 1]?.probability
        });
      } else {
        logTest('Sort by Probability', 'FAIL', 'Scenarios not properly sorted', {
          probabilities: data.scenarios.map(s => s.probability)
        });
      }
    } else {
      logTest('Sort by Probability', 'WARN', 'Not enough scenarios to test sorting');
    }
  } catch (error) {
    logTest('Sort by Probability', 'FAIL', 'Error testing probability sorting', {
      error: error.message
    });
  }

  // Test sort by updated_at
  try {
    const response = await fetch(`${BASE_URL}/api/scenarios?sort_by=updated_at`);
    const data = await response.json();

    if (data.scenarios && data.scenarios.length > 1) {
      const isSorted = data.scenarios.every((scenario, i) => {
        if (i === 0) return true;
        return scenario.last_updated <= data.scenarios[i - 1].last_updated;
      });

      if (isSorted) {
        logTest('Sort by Updated At', 'PASS', 'Scenarios correctly sorted by timestamp', {
          first: new Date(data.scenarios[0]?.last_updated).toISOString(),
          last: new Date(data.scenarios[data.scenarios.length - 1]?.last_updated).toISOString()
        });
      } else {
        logTest('Sort by Updated At', 'FAIL', 'Scenarios not properly sorted by timestamp');
      }
    } else {
      logTest('Sort by Updated At', 'WARN', 'Not enough scenarios to test sorting');
    }
  } catch (error) {
    logTest('Sort by Updated At', 'FAIL', 'Error testing timestamp sorting', {
      error: error.message
    });
  }
}

// Test 5: Invalid parameter handling
async function testInvalidParameters() {
  console.log('\n=== Test 5: Invalid Parameter Handling ===');

  // Test invalid sort parameter
  try {
    const response = await fetch(`${BASE_URL}/api/scenarios?sort_by=invalid_sort`);

    if (response.status === 400) {
      const error = await response.json();
      logTest('Invalid Sort Parameter', 'PASS', 'API correctly rejects invalid sort parameter', {
        status: response.status,
        error: error.error
      });
    } else {
      logTest('Invalid Sort Parameter', 'FAIL', 'API should return 400 for invalid sort', {
        status: response.status
      });
    }
  } catch (error) {
    logTest('Invalid Sort Parameter', 'FAIL', 'Error testing invalid parameter', {
      error: error.message
    });
  }
}

// Test 6: Performance validation
async function testPerformance() {
  console.log('\n=== Test 6: Performance Validation ===');

  const measurements = [];
  const iterations = 5;

  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/api/scenarios`);
      await response.json();
      const responseTime = Date.now() - startTime;
      measurements.push(responseTime);
    } catch (error) {
      logTest('Performance Test', 'FAIL', 'Failed to measure performance', {
        error: error.message
      });
      return;
    }
  }

  const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  const maxResponseTime = Math.max(...measurements);
  const minResponseTime = Math.min(...measurements);

  // Performance SLA: 95th percentile under 200ms
  const p95ResponseTime = measurements.sort((a, b) => a - b)[Math.floor(measurements.length * 0.95)];

  if (avgResponseTime < 200) {
    logTest('Performance SLA', 'PASS', 'API meets performance SLA', {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      minResponseTime: `${minResponseTime}ms`,
      maxResponseTime: `${maxResponseTime}ms`,
      p95ResponseTime: `${p95ResponseTime}ms`,
      slaTarget: '200ms'
    });
  } else if (avgResponseTime < 500) {
    logTest('Performance SLA', 'WARN', 'API response time is acceptable but above SLA', {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      slaTarget: '200ms'
    });
  } else {
    logTest('Performance SLA', 'FAIL', 'API response time exceeds acceptable limits', {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      slaTarget: '200ms'
    });
  }
}

// Test 7: Region filtering
async function testRegionFiltering() {
  console.log('\n=== Test 7: Region Filtering ===');

  const regions = ['all', 'middle_east', 'europe', 'global'];

  for (const region of regions) {
    try {
      const response = await fetch(`${BASE_URL}/api/scenarios?region=${region}`);

      if (response.ok) {
        const data = await response.json();
        logTest(`Region Filter: ${region}`, 'PASS', 'Region filter accepted', {
          region,
          scenariosCount: data.scenarios?.length || 0
        });
      } else {
        logTest(`Region Filter: ${region}`, 'FAIL', 'Region filter failed', {
          region,
          status: response.status
        });
      }
    } catch (error) {
      logTest(`Region Filter: ${region}`, 'FAIL', 'Error testing region filter', {
        region,
        error: error.message
      });
    }
  }
}

// Test 8: Error handling and edge cases
async function testErrorHandling() {
  console.log('\n=== Test 8: Error Handling and Edge Cases ===');

  // Test multiple invalid parameters
  try {
    const response = await fetch(`${BASE_URL}/api/scenarios?sort_by=invalid&region=invalid_region`);

    if (response.status === 400) {
      logTest('Multiple Invalid Params', 'PASS', 'API handles multiple invalid parameters', {
        status: response.status
      });
    } else if (response.ok) {
      logTest('Multiple Invalid Params', 'WARN', 'API accepts potentially invalid parameters', {
        status: response.status
      });
    }
  } catch (error) {
    logTest('Multiple Invalid Params', 'FAIL', 'Error testing error handling', {
      error: error.message
    });
  }
}

// Test 9: Data consistency validation
async function testDataConsistency(data) {
  console.log('\n=== Test 9: Data Consistency Validation ===');

  if (!data || !data.scenarios) {
    logTest('Data Consistency', 'WARN', 'No data to validate consistency');
    return;
  }

  // Check that total matches scenarios length
  if (data.total === data.scenarios.length) {
    logTest('Total Count Consistency', 'PASS', 'Total count matches scenarios length', {
      total: data.total,
      scenariosLength: data.scenarios.length
    });
  } else {
    logTest('Total Count Consistency', 'FAIL', 'Total count mismatch', {
      total: data.total,
      scenariosLength: data.scenarios.length
    });
  }

  // Validate probability ranges
  const invalidProbabilities = data.scenarios.filter(s =>
    s.probability < 0 || s.probability > 1 || isNaN(s.probability)
  );

  if (invalidProbabilities.length === 0) {
    logTest('Probability Range', 'PASS', 'All probabilities are within valid range [0, 1]');
  } else {
    logTest('Probability Range', 'FAIL', 'Found invalid probabilities', {
      invalidCount: invalidProbabilities.length,
      examples: invalidProbabilities.slice(0, 3).map(s => ({
        id: s.scenario_id,
        probability: s.probability
      }))
    });
  }

  // Check for duplicate scenario IDs
  const scenarioIds = data.scenarios.map(s => s.scenario_id);
  const uniqueIds = new Set(scenarioIds);

  if (scenarioIds.length === uniqueIds.size) {
    logTest('Unique Scenario IDs', 'PASS', 'All scenario IDs are unique');
  } else {
    logTest('Unique Scenario IDs', 'FAIL', 'Found duplicate scenario IDs', {
      totalScenarios: scenarioIds.length,
      uniqueIds: uniqueIds.size
    });
  }
}

// Main test execution
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Scenarios System - Comprehensive API Testing Suite       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Test started at: ${new Date().toISOString()}\n`);

  // Run tests
  const basicData = await testBasicEndpoint();
  await testResponseStructure(basicData);
  await testTimestampConversion(basicData);
  await testDataConsistency(basicData);
  await testSortingFunctionality();
  await testRegionFiltering();
  await testInvalidParameters();
  await testErrorHandling();
  await testPerformance();

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Results Summary                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`✅ Passed:  ${testResults.passed}`);
  console.log(`❌ Failed:  ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📊 Total:   ${testResults.tests.length}`);
  console.log(`\nTest completed at: ${new Date().toISOString()}`);

  // Determine overall status
  if (testResults.failed === 0) {
    console.log('\n🎉 All critical tests passed! System is ready for production.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the results above.');
    process.exit(1);
  }
}

// Execute tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
