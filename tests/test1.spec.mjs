import { test, expect } from '@playwright/test';

test('test1', async ({ page }) => {
    /** @type {string[]} */
    const logs = [];

    // Playwright's `pageerror` does NOT fire for unhandled promise rejections,
    // and be-intl's enhancement chain is almost entirely async — so surface
    // those explicitly from inside the page.
    await page.addInitScript(() => {
        addEventListener('unhandledrejection', e => {
            // eslint-disable-next-line no-console
            console.error('[unhandledrejection] ' + (e.reason && (e.reason.stack || e.reason.message || String(e.reason))));
        });
        addEventListener('error', e => {
            // eslint-disable-next-line no-console
            console.error('[window.error] ' + (e.error && (e.error.stack || e.error.message)) + ' @ ' + e.filename + ':' + e.lineno);
        });
    });

    page.on('console', msg => logs.push(`[console.${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[pageerror] ${err.stack || err.message}`));
    page.on('requestfailed', req =>
        logs.push(`[requestfailed] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`));
    page.on('response', res =>
        logs.push(`[response ${res.status()}] ${res.headers()['content-type'] || '?'}  ${res.url()}`));

    await page.goto('./tests/test1.html');

    const firstData = page.locator('data').first();
    try {
        await expect(firstData).toHaveText('12,345', { timeout: 15_000 });
    } catch (e) {
        console.log('--- captured page events ---\n' + (logs.join('\n') || '(none)'));
        console.log('--- rendered <data>/<time> ---\n' +
            await page.locator('data, time').evaluateAll(
                els => els.map(el => `${el.tagName} be-intl=${el.hasAttribute('be-intl')} enh=${'enh' in el} => ${JSON.stringify(el.textContent)}`).join('\n')));
        // Probe the enhancement gateway / inferencer directly.
        console.log('--- gateway probe ---\n' + await page.evaluate(async () => {
            const el = document.querySelector('data');
            const out = [];
            out.push('customElements be-hive defined? ' + !!customElements.get('be-hive'));
            out.push('el.enh: ' + typeof (el && el.enh));
            try {
                const mod = await import('inferencer/inferencer.js');
                out.push('inferencer import ok, registryItem: ' + typeof mod.registryItem);
            } catch (err) { out.push('inferencer import FAILED: ' + err); }
            try {
                await import('inferencer/InferencedPropagator.js');
                out.push('InferencedPropagator import ok');
            } catch (err) { out.push('InferencedPropagator import FAILED: ' + err); }
            try {
                await import('roundabout-lib/roundabout.js');
                out.push('roundabout import ok');
            } catch (err) { out.push('roundabout import FAILED: ' + err); }
            return out.join('\n');
        }));
        throw e;
    }

    await expect(page.locator('data').nth(1)).toContainText('123.456,79');
    await expect(page.locator('time')).toContainText('٢٠١١');
});
