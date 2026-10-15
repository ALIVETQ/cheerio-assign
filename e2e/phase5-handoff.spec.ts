/**
 * Phase 5 E2E tests 10 and 11. Gemini never called.
 */
import { test, expect } from '@playwright/test';

async function mockApis(page: import('@playwright/test').Page, routeBody: object) {
  await page.route('**/api/route', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(routeBody),
    });
  });
  await page.route('**/api/summarize', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        problem: 'E2E summary',
        stepsTried: [],
        blocker: null,
        suggestedNextAction: 'Follow up',
        source: 'gemini',
      }),
    });
  });
}

test('Test 10 – handoff in tab A appears live in /support in tab B', async ({ context }) => {
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  await mockApis(pageA, {
    workflowId: 'wf-first-campaign',
    confidence: 0.9,
    reason: 'campaign',
    source: 'gemini',
    fallbackCause: null,
  });
  await mockApis(pageB, {
    workflowId: null,
    confidence: 0,
    reason: 'none',
    source: 'gemini',
    fallbackCause: null,
  });

  await pageB.goto('/support');
  await expect(pageB.locator('[data-testid="support-empty"]')).toBeVisible();

  await pageA.goto('/');
  await pageA.click('[data-testid="rio-fab"]');
  await expect(pageA.locator('[data-testid="rio-panel"]')).toBeVisible();
  await pageA.click('[data-testid="rio-human-btn"]');
  await expect(pageA.locator('[data-testid="handoff-confirmation"]')).toBeVisible({ timeout: 8000 });

  await expect(pageB.locator('[data-testid="ticket-row"]')).toBeVisible({ timeout: 5000 });
  await expect(pageB.locator('[data-testid="ticket-reason"]')).toHaveText('user_requested');
});

test('Test 11 – no-match Talk to a human creates ticket with reason no_match', async ({ page }) => {
  await mockApis(page, {
    workflowId: null,
    confidence: 0,
    reason: 'none',
    source: 'gemini',
    fallbackCause: null,
  });

  await page.goto('/');
  await page.click('[data-testid="rio-fab"]');
  await page.fill('[data-testid="rio-input"]', 'I want a refund for my plan');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="rio-no-match"]')).toBeVisible({ timeout: 5000 });
  await page.click('[data-testid="rio-no-match-human-btn"]');
  await expect(page.locator('[data-testid="handoff-confirmation"]')).toBeVisible({ timeout: 8000 });

  await page.goto('/support');
  await expect(page.locator('[data-testid="ticket-row"]')).toBeVisible();
  await expect(page.locator('[data-testid="ticket-reason"]')).toHaveText('no_match');
});
