/**
 * Phase 6 E2E — Full demo script (ARCHITECTURE.md §16) with all APIs mocked.
 *
 * Covers every step required in the demo:
 *   1. Dashboard loads with Prototype badge
 *   2. Open Rio, describe campaign problem → offer card, dashboard untouched
 *   3. Click Start → guide begins (spotlight visible)
 *   4. Vague message → no-match → Talk to human → ticket in /support
 *   5. Template-rejected message → offer → Start → guide begins
 *   6. API failure → fallback badge with tooltip
 *
 * Also asserts: no console errors during the entire run.
 */
import { test, expect, type Page } from '@playwright/test';

const consoleErrors: string[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function mockRoute(page: Page, body: object) {
  await page.route('**/api/route', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

async function mockSummarize(page: Page) {
  await page.route('**/api/summarize', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        problem: 'User wants help with campaign',
        stepsTried: [],
        blocker: null,
        suggestedNextAction: 'Guide the user',
        source: 'gemini',
      }),
    })
  );
}

async function openRioAndSend(page: Page, message: string) {
  const fab = page.locator('[data-testid="rio-fab"]');
  if (await fab.isVisible()) await fab.click();
  else await page.locator('[data-testid="rio-compact-pill"]').click();
  await expect(page.locator('[data-testid="rio-panel"]')).toBeVisible();
  await page.fill('[data-testid="rio-input"]', message);
  await page.keyboard.press('Enter');
}

// ── Test: Full §16 Demo Script ────────────────────────────────────────────────

test('Phase 6 – full demo script (§16)', async ({ page, context }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // ── Step 1: Dashboard loads with Prototype badge ──────────────────────────
  await mockRoute(page, { workflowId: 'wf-first-campaign', confidence: 0.95, reason: 'Campaign guide', source: 'gemini', fallbackCause: null });
  await mockSummarize(page);
  await page.goto('/');

  await expect(page.locator('text=Prototype')).toBeVisible();
  await expect(page.locator('[data-testid="reset-demo-btn"]')).toBeVisible();

  // ── Step 2: Open Rio, describe campaign problem ───────────────────────────
  await openRioAndSend(page, "I don't know how to set up my first WhatsApp campaign");

  await expect(page.locator('[data-testid="workflow-offer-card"]')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toContainText('WhatsApp campaign');

  // Dashboard must not have changed yet — no spotlight
  await expect(page.locator('[data-testid="step-tooltip"]')).not.toBeVisible();
  // No fallback badge (Gemini succeeded)
  await expect(page.locator('[data-testid="fallback-badge"]')).toHaveCount(0);

  // ── Step 3: Click Start → guide begins ───────────────────────────────────
  await page.click('[data-testid="offer-start-btn"]');
  // Panel collapses to compact pill
  await expect(page.locator('[data-testid="rio-panel"]')).not.toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="rio-compact-pill"]')).toBeVisible({ timeout: 3000 });
  // Spotlight appears
  await expect(page.locator('[data-testid="step-tooltip"]')).toBeVisible({ timeout: 3000 });

  // ── Step 4: Vague message → no-match → Talk to human → ticket in /support ─
  // Re-route to no-match
  await page.unroute('**/api/route');
  await mockRoute(page, { workflowId: null, confidence: 0, reason: 'No match', source: 'gemini', fallbackCause: null });

  // Expand panel via compact pill
  await page.locator('[data-testid="rio-compact-pill"]').click();
  await expect(page.locator('[data-testid="rio-panel"]')).toBeVisible();

  await page.fill('[data-testid="rio-input"]', 'nothing is working');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="rio-no-match"]')).toBeVisible({ timeout: 6000 });

  // Talk to human via no-match button
  await page.click('[data-testid="rio-no-match-human-btn"]');
  await expect(page.locator('[data-testid="handoff-confirmation"]')).toBeVisible({ timeout: 8000 });

  // Open support view and verify ticket
  const supportPage = await context.newPage();
  await supportPage.goto('/support');
  await expect(supportPage.locator('[data-testid="ticket-row"]')).toBeVisible({ timeout: 5000 });
  await supportPage.close();

  // ── Step 5: Template-rejected message → offer → Start ────────────────────
  await page.unroute('**/api/route');
  await mockRoute(page, { workflowId: 'wf-template-rejected', confidence: 0.9, reason: 'Template fix guide', source: 'gemini', fallbackCause: null });

  // Close and re-open panel fresh
  await page.fill('[data-testid="rio-input"]', 'my template got rejected');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toContainText('template');

  await page.click('[data-testid="offer-start-btn"]');
  // Guide starts (panel may collapse or tooltip appears)
  await expect(page.locator('[data-testid="step-tooltip"]')).toBeVisible({ timeout: 5000 });

  // ── Step 6: API failure → fallback badge ─────────────────────────────────
  // Navigate back to a fresh state
  await page.goto('/');
  await page.unroute('**/api/route');
  await page.route('**/api/route', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'fail' }) })
  );

  await openRioAndSend(page, "I don't know how to set up my first WhatsApp campaign");
  await expect(page.locator('[data-testid="workflow-offer-card"]')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('[data-testid="fallback-badge"]')).toBeVisible();
  await expect(page.locator('[data-testid="fallback-badge"]')).toHaveAttribute('title', /Answered by backup mode/);

  // ── Final: No console errors ──────────────────────────────────────────────
  // Ignore known acceptable warnings (e.g. [Rio fallback] console.warn is expected)
  const realErrors = errors.filter((e) => !e.includes('[Rio fallback]'));
  expect(realErrors, `Unexpected console errors: ${realErrors.join('\n')}`).toHaveLength(0);
});
