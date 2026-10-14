import { test, expect } from '@playwright/test';

test('dashboard loads with correct title and sidebar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.topbar-title')).toContainText('Dashboard');
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.prototype-badge')).toContainText('Prototype');
});
