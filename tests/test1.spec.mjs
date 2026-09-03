import { test, expect } from '@playwright/test';

test('test1', async ({ page }) => {
    // Surface page-side errors in the CI log if this ever regresses.
    page.on('console', msg => { if (msg.type() === 'error') console.log(`[page error] ${msg.text()}`); });
    page.on('pageerror', err => console.log(`[pageerror] ${err.stack || err.message}`));

    await page.goto('./tests/test1.html');

    // Locale/timezone are pinned in playwright.config.ts, so these outputs are
    // deterministic across machines. Web-first assertions retry until be-intl
    // has upgraded the elements.
    await expect(page.locator('data').first()).toHaveText('12,345', { timeout: 15_000 });
    await expect(page.locator('data').nth(1)).toContainText('123.456,79');
    await expect(page.locator('time')).toContainText('٢٠١١');
});
