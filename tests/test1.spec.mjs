import { test, expect } from '@playwright/test';
test('test1', async ({ page }) => {
    await page.goto('./tests/test1.html');
    // Locale/timezone are pinned in playwright.config.ts, so these outputs are
    // deterministic across machines. Web-first assertions retry until be-intl
    // has upgraded the elements, so no fixed timeout is needed.
    await expect(page.locator('data').first()).toHaveText('12,345');
    await expect(page.locator('data').nth(1)).toContainText('123.456,79');
    await expect(page.locator('time')).toContainText('٢٠١١');
});
