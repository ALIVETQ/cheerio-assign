import { test, expect } from '@playwright/test';

test('placeholder page loads and shows Phase 0 text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Rio prototype: Phase 0');
});
