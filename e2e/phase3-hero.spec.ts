/**
 * Phase 3B E2E Tests (Tests 13 and 14)
 *
 * Test 13 — Open Rio, send a message, see the offer, click Start,
 *            complete the entire hero flow, see the success state.
 * Test 14 — Not now: no spotlight ever appears.
 */

import { test, expect } from '@playwright/test';

// Helper: open the Rio panel and send a message
async function openRioAndSend(page: import('@playwright/test').Page, message: string) {
  await page.click('[data-testid="rio-fab"]');
  await expect(page.locator('[data-testid="rio-panel"]')).toBeVisible();
  await page.fill('[data-testid="rio-input"]', message);
  await page.keyboard.press('Enter');
}

// ─── Test 13: Full hero flow ──────────────────────────────────────────────────
test('Test 13 – open Rio, send message, see offer, click Start, complete hero flow, see success', async ({ page }) => {
  await page.route('**/api/route', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workflowId: 'wf-first-campaign',
        confidence: 0.94,
        reason: 'You want to set up your first WhatsApp campaign.',
        source: 'gemini',
        fallbackCause: null,
      }),
    });
  });
  await page.goto('/');

  // Open Rio and send a message
  await openRioAndSend(page, "I don't know how to set up my first WhatsApp campaign");

  // Offer card appears
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toContainText('WhatsApp campaign');

  // Dashboard has NOT changed yet — no spotlight tooltip
  await expect(page.locator('[data-testid="step-tooltip"]')).not.toBeVisible();

  // Click Start — panel auto-collapses to compact pill
  await page.click('[data-testid="offer-start-btn"]');

  // Panel is gone; compact pill appears instead
  await expect(page.locator('[data-testid="rio-panel"]')).not.toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="rio-compact-pill"]')).toBeVisible({ timeout: 3000 });

  // Spotlight/tooltip appears
  await expect(page.locator('[data-testid="step-tooltip"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="step-tooltip"]')).toBeVisible();

  // Step 1: click the setup-channel-accordion
  await page.click('[data-tour="setup-channel-accordion"]');

  // Step 2: manualConfirm — click Continue in tooltip
  await expect(page.locator('[data-testid="tooltip-confirm"]')).toBeVisible({ timeout: 3000 });
  await page.click('[data-testid="tooltip-confirm"]');

  // Step 3: click build-audience-accordion
  await page.click('[data-tour="build-audience-accordion"]');

  // Step 4: manualConfirm
  await expect(page.locator('[data-testid="tooltip-confirm"]')).toBeVisible({ timeout: 3000 });
  await page.click('[data-testid="tooltip-confirm"]');

  // Step 5: click create-content-accordion
  await page.click('[data-tour="create-content-accordion"]');

  // Step 6: click new-campaign-btn
  await page.click('[data-tour="new-campaign-btn"]');

  // Step 7: campaign name input is prefilled; fill it to trigger inputFilled
  const nameInput = page.locator('[data-tour="campaign-name"]');
  await expect(nameInput).toBeVisible({ timeout: 3000 });
  await nameInput.fill('My First WhatsApp Campaign');
  await nameInput.dispatchEvent('change');

  // Step 8: select a segment
  const segmentSelect = page.locator('[data-tour="campaign-segment"]');
  await expect(segmentSelect).toBeVisible({ timeout: 3000 });
  await segmentSelect.selectOption({ index: 1 });

  // Step 9: manualConfirm (channel selection)
  await expect(page.locator('[data-testid="tooltip-confirm"]')).toBeVisible({ timeout: 3000 });
  await page.click('[data-testid="tooltip-confirm"]');

  // Step 10: click Next button
  await page.click('[data-tour="campaign-next-btn"]');

  // Spotlight/tooltip should disappear (engine completed after step 10)
  await expect(page.locator('[data-testid="step-tooltip"]')).not.toBeVisible({ timeout: 5000 });

  // Campaign review screen appears (ASSUMED UI)
  await expect(page.locator('[data-tour="campaign-review-section"]')).toBeVisible({ timeout: 3000 });

  // Click Send Now
  await page.click('[data-tour="campaign-send-btn"]');

  // Success screen
  await expect(page.locator('[data-tour="campaign-success-screen"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-tour="campaign-success-screen"]')).toContainText('Campaign Sent');
});

// ─── Test 14: Not now → no spotlight ever ────────────────────────────────────
test('Test 14 – Not now: no spotlight ever appears', async ({ page }) => {
  await page.route('**/api/route', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workflowId: 'wf-first-campaign',
        confidence: 0.9,
        reason: 'campaign',
        source: 'gemini',
        fallbackCause: null,
      }),
    });
  });
  await page.goto('/');

  await openRioAndSend(page, 'I want to create a campaign');

  // Offer card appears
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toBeVisible({ timeout: 5000 });

  // Click Not now
  await page.click('[data-testid="offer-not-now-btn"]');

  // Offer is dismissed
  await expect(page.locator('[data-testid="offer-dismissed"]')).toBeVisible();

  // No spotlight at any point
  await expect(page.locator('[data-testid="step-tooltip"]')).not.toBeVisible();

  // Wait a bit and confirm still no spotlight tooltip
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="step-tooltip"]')).not.toBeVisible();
});
