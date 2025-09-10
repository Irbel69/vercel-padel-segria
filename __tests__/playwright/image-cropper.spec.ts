import { test, expect } from '@playwright/test';

// Basic smoke test to open the battle pass admin page and (if possible) trigger the image cropper UI.
// NOTE: This does not authenticate. If auth is required, extend with login helper.

test.describe('Image Cropper', () => {
  test('opens battle pass page (manual crop verification)', async ({ page }) => {
    await page.goto('/dashboard/admin/battle-pass');

    // If a button to add a prize exists, click it (best-effort heuristics)
    const addButton = page.locator('button:has-text("Afegir")');
    if (await addButton.first().isVisible().catch(() => false)) {
      await addButton.first().click();
    }

    // Look for an upload input to trigger cropper
    const fileInput = page.locator('input[type=file]').first();
    if (await fileInput.isVisible().catch(() => false)) {
      // We don't have a fixture image path here; skipping automatic upload.
      // This test mainly ensures page loads without crashing after cropper refactor.
    }

    await expect(page).toHaveTitle(/Padel|Battle/i, { timeout: 5000 });

    // Capture screenshot for manual inspection (saved in test artifacts)
    await page.screenshot({ path: 'test-results/image-cropper-page.png', fullPage: true });
  });
});
