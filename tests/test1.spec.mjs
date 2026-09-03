import { test, expect } from '@playwright/test';

test('test1', async ({ page }) => {
    /** @type {string[]} */
    const logs = [];
    page.on('console', msg => logs.push(`[console.${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[pageerror] ${err.stack || err.message}`));
    page.on('requestfailed', req =>
        logs.push(`[requestfailed] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`));
    page.on('response', res => {
        if (res.status() >= 400) logs.push(`[response ${res.status()}] ${res.url()}`);
    });

    await page.goto('./tests/test1.html');

    const firstData = page.locator('data').first();
    try {
        // Locale/timezone are pinned in playwright.config.ts, so this output is
        // deterministic across machines. Web-first assertion retries until
        // be-intl has upgraded the element.
        await expect(firstData).toHaveText('12,345', { timeout: 15_000 });
    } catch (e) {
        const html = await page.content();
        console.log('--- captured page events ---\n' + (logs.join('\n') || '(none)'));
        console.log('--- rendered <data>/<time> ---\n' +
            await page.locator('data, time').evaluateAll(
                els => els.map(el => `${el.tagName} be-intl=${el.hasAttribute('be-intl')} => ${JSON.stringify(el.textContent)}`).join('\n')));
        console.log('--- import map present? ---', html.includes('type=importmap') || html.includes('type="importmap"'));
        throw e;
    }

    // Secondary, locale-specific checks (deterministic given the pinned locale).
    await expect(page.locator('data').nth(1)).toContainText('123.456,79');
    await expect(page.locator('time')).toContainText('٢٠١١');
});
