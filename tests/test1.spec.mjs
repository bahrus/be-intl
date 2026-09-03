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

    // `be-intl-announce`: element becomes a polite live region *after* its first
    // render, so re-formats are announced but the initial value is not.
    const announced = page.locator('data').nth(2);
    await expect(announced).toHaveText('500');
    await expect(announced).toHaveAttribute('aria-live', 'polite');
    await expect(announced).toHaveAttribute('aria-atomic', 'true');

    // Elements that didn't opt in are left untouched.
    await expect(page.locator('data').first()).not.toHaveAttribute('aria-live', /.*/);
});
