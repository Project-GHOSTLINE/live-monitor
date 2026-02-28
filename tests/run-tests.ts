#!/usr/bin/env tsx
/**
 * Simple Test Runner
 * Runs all test files and reports results
 */

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const testFiles = readdirSync(__dirname)
  .filter(file => file.endsWith('.test.ts'))
  .map(file => join(__dirname, file));

console.log('🧪 Running Scenario System Tests\n');
console.log('═'.repeat(60));

let passed = 0;
let failed = 0;

for (const testFile of testFiles) {
  const testName = testFile.split('/').pop()?.replace('.test.ts', '');
  
  console.log(`\n📋 ${testName}`);
  console.log('─'.repeat(60));

  try {
    execSync(`tsx ${testFile}`, {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });
    
    console.log(`✅ ${testName} PASSED`);
    passed++;
  } catch (error) {
    console.log(`❌ ${testName} FAILED`);
    failed++;
  }
}

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 Test Results:`);
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  📈 Total: ${passed + failed}`);

if (failed > 0) {
  console.log(`\n❌ ${failed} test suite(s) failed`);
  process.exit(1);
} else {
  console.log(`\n✅ All tests passed!`);
  process.exit(0);
}
