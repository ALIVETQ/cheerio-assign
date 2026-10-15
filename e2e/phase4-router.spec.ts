/**
 * Phase 4B E2E — Tests 14 and 15. Gemini never called; /api/route is mocked.
 */
import { test, expect } from '@playwright/test';

const CAMPAIGN_MSG = "I don't know how to set up my first WhatsApp campaign";

async function openRioAndSend(page: import('@playwright/test').Page, message: string) {
  await page.click('[data-testid="rio-fab"]');
  await expect(page.locator('[data-testid="rio-panel"]')).toBeVisible();
  await page.fill('[data-testid="rio-input"]', message);
  await page.keyboard.press('Enter');
}

test('Test 14 – mocked API: campaign sentence offers workflow and Start begins the flow', async ({ page }) => {
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
  await openRioAndSend(page, CAMPAIGN_MSG);

  await expect(page.locator('[data-testid="workflow-offer-card"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toContainText('WhatsApp campaign');
  await expect(page.locator('[data-testid="fallback-badge"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="step-tooltip"]')).not.toBeVisible();

  await page.click('[data-testid="offer-start-btn"]');
  await expect(page.locator('[data-testid="step-tooltip"]')).toBeVisible({ timeout: 5000 });
});

test('Test 15 – mocked API 500: same sentence still offers with fallback badge', async ({ page }) => {
  await page.route('**/api/route', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'fail' }),
    });
  });

  await page.goto('/');
  await openRioAndSend(page, CAMPAIGN_MSG);

  await expect(page.locator('[data-testid="workflow-offer-card"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="fallback-badge"]')).toBeVisible();
  await expect(page.locator('[data-testid="fallback-badge"]')).toHaveAttribute(
    'title',
    /Answered by backup mode/
  );
});
