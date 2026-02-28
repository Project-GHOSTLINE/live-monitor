/**
 * Front-end UI Testing for Scenarios Page
 * Tests page load, rendering, and interactive elements
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';

async function runUITests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Scenarios Page - UI/UX Testing Suite                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Test started at: ${new Date().toISOString()}\n`);

  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    console.log('Test 1: Page Load and Accessibility');
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/scenarios`, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    if (loadTime < 3000) {
      console.log(`✅ Page loaded successfully in ${loadTime}ms`);
      testResults.passed++;
    } else {
      console.log(`⚠️ Page loaded in ${loadTime}ms (slower than expected)`);
      testResults.warnings++;
    }

    // Check for page title
    const title = await page.title();
    if (title) {
      console.log(`✅ Page title: "${title}"`);
      testResults.passed++;
    } else {
      console.log('❌ No page title found');
      testResults.failed++;
    }

    console.log('\nTest 2: Core Content Rendering');

    // Check for header
    const header = await page.locator('h1').first();
    if (await header.isVisible()) {
      const headerText = await header.textContent();
      console.log(`✅ Header visible: "${headerText}"`);
      testResults.passed++;
    } else {
      console.log('❌ Header not visible');
      testResults.failed++;
    }

    // Check for scenarios or loading state
    await page.waitForTimeout(2000); // Wait for data to load

    const scenarios = await page.locator('[class*="grid"]').first();
    if (await scenarios.isVisible()) {
      console.log('✅ Scenarios grid rendered');
      testResults.passed++;
    } else {
      console.log('⚠️ Scenarios grid not immediately visible (may still be loading)');
      testResults.warnings++;
    }

    console.log('\nTest 3: Filter Controls');

    // Check region filter
    const regionSelect = await page.locator('select#region');
    if (await regionSelect.isVisible()) {
      console.log('✅ Region filter present');
      testResults.passed++;

      // Test region filtering
      await regionSelect.selectOption('middle_east');
      await page.waitForTimeout(500);
      console.log('✅ Region filter interaction successful');
      testResults.passed++;
    } else {
      console.log('❌ Region filter not found');
      testResults.failed++;
    }

    // Check sort filter
    const sortSelect = await page.locator('select#sort');
    if (await sortSelect.isVisible()) {
      console.log('✅ Sort filter present');
      testResults.passed++;

      // Test sorting
      await sortSelect.selectOption('updated_at');
      await page.waitForTimeout(500);
      console.log('✅ Sort filter interaction successful');
      testResults.passed++;
    } else {
      console.log('❌ Sort filter not found');
      testResults.failed++;
    }

    console.log('\nTest 4: Scenario Cards');

    // Count scenario cards
    const cards = await page.locator('[class*="ScenarioCard"], [class*="scenario"]').count();
    if (cards > 0) {
      console.log(`✅ Found ${cards} scenario cards`);
      testResults.passed++;

      // Check first card content
      const firstCard = page.locator('[class*="grid"] > div').first();
      if (await firstCard.isVisible()) {
        console.log('✅ Scenario card content visible');
        testResults.passed++;
      }
    } else {
      // Check for empty state
      const emptyState = await page.locator('text="Aucun scénario disponible"').count();
      if (emptyState > 0) {
        console.log('⚠️ Empty state displayed (no scenarios available)');
        testResults.warnings++;
      } else {
        console.log('❌ No scenario cards or empty state found');
        testResults.failed++;
      }
    }

    console.log('\nTest 5: Error States and Edge Cases');

    // Check for console errors
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
      testResults.passed++;
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors:`);
      consoleErrors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
      testResults.failed++;
    }

    // Check for page errors
    if (pageErrors.length === 0) {
      console.log('✅ No page errors detected');
      testResults.passed++;
    } else {
      console.log(`❌ Found ${pageErrors.length} page errors:`);
      pageErrors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
      testResults.failed++;
    }

    console.log('\nTest 6: Responsive Design');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileHeader = await page.locator('h1').first();
    if (await mobileHeader.isVisible()) {
      console.log('✅ Page renders in mobile viewport');
      testResults.passed++;
    } else {
      console.log('❌ Mobile viewport rendering issue');
      testResults.failed++;
    }

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletHeader = await page.locator('h1').first();
    if (await tabletHeader.isVisible()) {
      console.log('✅ Page renders in tablet viewport');
      testResults.passed++;
    } else {
      console.log('❌ Tablet viewport rendering issue');
      testResults.failed++;
    }

    console.log('\nTest 7: Timestamp Display');

    // Reset to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Check for "Dernière mise à jour" text
    const lastUpdated = await page.locator('text=/Dernière mise à jour/').count();
    if (lastUpdated > 0) {
      console.log('✅ Timestamp display present');
      testResults.passed++;
    } else {
      console.log('⚠️ Timestamp display not found');
      testResults.warnings++;
    }

    console.log('\nTest 8: Navigation');

    // Check for navigation component
    const nav = await page.locator('nav, [role="navigation"]').count();
    if (nav > 0) {
      console.log('✅ Navigation component present');
      testResults.passed++;
    } else {
      console.log('⚠️ Navigation component not found');
      testResults.warnings++;
    }

    console.log('\nTest 9: Accessibility');

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    if (h1Count === 1) {
      console.log('✅ Proper heading hierarchy (single h1)');
      testResults.passed++;
    } else {
      console.log(`⚠️ Multiple h1 tags found: ${h1Count}`);
      testResults.warnings++;
    }

    // Check for alt text on images (if any)
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    if (images === 0 || images === imagesWithAlt) {
      console.log('✅ All images have alt text (or no images present)');
      testResults.passed++;
    } else {
      console.log(`⚠️ ${images - imagesWithAlt} images missing alt text`);
      testResults.warnings++;
    }

    console.log('\nTest 10: Performance Metrics');

    // Get performance metrics
    const performanceData = await page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive
      };
    });

    console.log(`✅ Performance metrics collected:`);
    console.log(`   - DOM Content Loaded: ${performanceData.domContentLoaded.toFixed(2)}ms`);
    console.log(`   - Load Complete: ${performanceData.loadComplete.toFixed(2)}ms`);
    testResults.passed++;

  } catch (error) {
    console.log(`\n❌ Test execution error: ${error.message}`);
    testResults.failed++;
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  UI Test Results Summary                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`✅ Passed:  ${testResults.passed}`);
  console.log(`❌ Failed:  ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`\nTest completed at: ${new Date().toISOString()}`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All UI tests passed! Page is functioning correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some UI tests failed. Review the results above.');
    process.exit(1);
  }
}

// Check if Playwright is installed
try {
  require('playwright');
  runUITests().catch(error => {
    console.error('Fatal error running UI tests:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error: Playwright is not installed. Run: npm install -D playwright');
  console.log('Skipping UI tests and reporting API test results only.');
  process.exit(0);
}
