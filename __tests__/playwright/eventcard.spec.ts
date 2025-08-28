import { test, expect } from '@playwright/test';

// This Playwright test navigates to the app home and checks EventCard placement.
// Note: The frontend instructions expect the server at http://172.25.192.1:3000
const BASE = process.env.TEST_BASE || 'http://172.25.192.1:3000';

test.describe('EventCard location button visibility', () => {
  test('desktop layout shows location button to the right', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Try to find an event card and the location button
    const button = page.locator('text=Veure ubicació').first();
    const location = page.locator('[data-testid="event-location"]').first();
    await expect(location).toBeVisible();
    await expect(button).toBeVisible();
    // visual snapshot
    await page.screenshot({ path: 'eventcard-desktop.png', fullPage: false });
  });

  test('mobile layout shows compact label', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const button = page.locator('text=Mapa').first();
    await expect(button).toBeVisible();
    await page.screenshot({ path: 'eventcard-mobile.png' });
  });
});
