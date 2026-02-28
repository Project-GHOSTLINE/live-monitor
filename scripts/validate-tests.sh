#!/bin/bash
# Validation script to check all test files are in place

echo "🔍 Validating Scenario System Tests..."
echo ""

ERRORS=0

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📋 Test Files:"
check_file "tests/event-extractor.test.ts"
check_file "tests/signal-mapper.test.ts"
check_file "tests/scenario-scorer.test.ts"
check_file "tests/scenarios-integration.test.ts"

echo ""
echo "🛠️  Test Infrastructure:"
check_file "tests/test-framework.ts"
check_file "tests/run-tests.ts"
check_file "tests/README.md"

echo ""
echo "📜 Scripts:"
check_file "scripts/seed-test-scenarios.ts"

echo ""
echo "📚 Documentation:"
check_file "SCENARIO_TESTS_SUMMARY.md"
check_file "QUICK_START_TESTS.md"
check_file "TESTS_COMPLETE.md"

echo ""
echo "🎯 Implementation:"
check_file "lib/scenarios/calculator.ts"
check_file "types/scenario.ts"

echo ""
echo "───────────────────────────────────────────"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All files present!"
    echo ""
    echo "Next steps:"
    echo "  1. npm test              # Run all tests"
    echo "  2. npm run seed:scenarios # Generate test data"
    echo "  3. npm run dev           # View in monitor"
    exit 0
else
    echo "❌ $ERRORS file(s) missing"
    exit 1
fi
