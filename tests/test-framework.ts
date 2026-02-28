/**
 * Minimal Test Framework
 * Simple test utilities for running tests without external dependencies
 */

interface TestContext {
  name: string;
  fn: () => void | Promise<void>;
}

interface DescribeContext {
  name: string;
  tests: TestContext[];
  beforeEachFn?: () => void | Promise<void>;
  afterEachFn?: () => void | Promise<void>;
}

const describes: DescribeContext[] = [];
let currentDescribe: DescribeContext | null = null;

export function describe(name: string, fn: () => void) {
  const desc: DescribeContext = {
    name,
    tests: [],
  };

  describes.push(desc);
  currentDescribe = desc;
  fn();
  currentDescribe = null;
}

export function test(name: string, fn: () => void | Promise<void>) {
  if (!currentDescribe) {
    throw new Error('test() must be called inside describe()');
  }

  currentDescribe.tests.push({ name, fn });
}

export function beforeEach(fn: () => void | Promise<void>) {
  if (!currentDescribe) {
    throw new Error('beforeEach() must be called inside describe()');
  }

  currentDescribe.beforeEachFn = fn;
}

export function afterEach(fn: () => void | Promise<void>) {
  if (!currentDescribe) {
    throw new Error('afterEach() must be called inside describe()');
  }

  currentDescribe.afterEachFn = fn;
}

// Assertion helpers
export const expect = (actual: any) => ({
  toBe(expected: any) {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },

  toEqual(expected: any) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  },

  toBeDefined() {
    if (actual === undefined) {
      throw new Error('Expected value to be defined');
    }
  },

  toBeNull() {
    if (actual !== null) {
      throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
    }
  },

  not: {
    toBe(expected: any) {
      if (actual === expected) {
        throw new Error(`Expected not to be ${JSON.stringify(expected)}`);
      }
    },

    toBeNull() {
      if (actual === null) {
        throw new Error('Expected not to be null');
      }
    },

    toBeDefined() {
      if (actual !== undefined) {
        throw new Error('Expected to be undefined');
      }
    },
  },

  toBeGreaterThan(expected: number) {
    if (typeof actual !== 'number' || actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },

  toBeLessThan(expected: number) {
    if (typeof actual !== 'number' || actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`);
    }
  },

  toBeGreaterThanOrEqual(expected: number) {
    if (typeof actual !== 'number' || actual < expected) {
      throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
    }
  },

  toBeLessThanOrEqual(expected: number) {
    if (typeof actual !== 'number' || actual > expected) {
      throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
    }
  },

  toContain(item: any) {
    if (!Array.isArray(actual) || !actual.includes(item)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
    }
  },

  toMatch(pattern: RegExp | string) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    if (typeof actual !== 'string' || !regex.test(actual)) {
      throw new Error(`Expected "${actual}" to match ${pattern}`);
    }
  },

  toBeCloseTo(expected: number, precision: number = 2) {
    if (typeof actual !== 'number') {
      throw new Error(`Expected ${actual} to be a number`);
    }

    const factor = Math.pow(10, precision);
    const actualRounded = Math.round(actual * factor) / factor;
    const expectedRounded = Math.round(expected * factor) / factor;

    if (actualRounded !== expectedRounded) {
      throw new Error(
        `Expected ${actual} to be close to ${expected} (precision: ${precision})`
      );
    }
  },

  toHaveLength(length: number) {
    if (!actual || typeof actual.length !== 'number') {
      throw new Error(`Expected ${JSON.stringify(actual)} to have length property`);
    }

    if (actual.length !== length) {
      throw new Error(`Expected length ${length}, got ${actual.length}`);
    }
  },
});

// Run all tests
export async function runTests() {
  let totalPassed = 0;
  let totalFailed = 0;

  for (const desc of describes) {
    console.log(`\n${desc.name}`);

    for (const test of desc.tests) {
      try {
        if (desc.beforeEachFn) {
          await desc.beforeEachFn();
        }

        await test.fn();

        if (desc.afterEachFn) {
          await desc.afterEachFn();
        }

        console.log(`  ✓ ${test.name}`);
        totalPassed++;
      } catch (error) {
        console.log(`  ✗ ${test.name}`);
        console.log(`    ${error instanceof Error ? error.message : String(error)}`);
        totalFailed++;
      }
    }
  }

  console.log(`\n${totalPassed + totalFailed} tests, ${totalPassed} passed, ${totalFailed} failed`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

// Auto-run tests if this is the main module
if (require.main === module) {
  runTests();
}
