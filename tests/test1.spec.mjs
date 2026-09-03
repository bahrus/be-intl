import { test, expect } from '@playwright/test';

test('test1', async ({ page }) => {
    /** @type {string[]} */
    const logs = [];

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
        logs.push(`[response ${res.status()}] ${res.url()}`));

    await page.goto('./tests/test1.html');

    const firstData = page.locator('data').first();
    try {
        await expect(firstData).toHaveText('12,345', { timeout: 30_000 });
    } catch (e) {
        console.log('--- captured page events ---\n' + (logs.join('\n') || '(none)'));
        // Introspect the be-intl view-model on each element to see which stage of the
        // roundabout reactive pipeline (init -> hydrate -> onFormattingChange -> formatNumber)
        // actually completed on this runner.
        console.log('--- be-intl vm state ---\n' + await page.evaluate(() => {
            const pick = vm => {
                if (!vm) return '(no vm)';
                const g = k => { try { return JSON.stringify(vm[k]); } catch { return '<throw>'; } };
                return [
                    'initialized=' + g('initialized'),
                    'locale=' + g('locale'),
                    'value=' + g('value'),
                    'resolved=' + g('resolved'),
                    'hasFormat=' + (vm.format !== undefined),
                    'intlNumberFormat=' + (vm.intlNumberFormat ? 'set' : String(vm.intlNumberFormat)),
                    'intlDateFormat=' + (vm.intlDateFormat ? 'set' : String(vm.intlDateFormat)),
                    '__roundaboutReactions=' + (vm.__roundaboutReactions ? [...vm.__roundaboutReactions.keys()].join(',') : 'none'),
                ].join('  ');
            };
            return [...document.querySelectorAll('data, time')].map((el, i) => {
                const enh = el.enh || {};
                const vm = enh.BeIntl || enh['be-intl'] || Object.values(enh).find(v => v && 'initialized' in v);
                return `#${i} ${el.tagName} text=${JSON.stringify(el.textContent)}\n     enhKeys=[${Object.keys(enh).join(',')}]\n     ${pick(vm)}`;
            }).join('\n');
        }));
        throw e;
    }

    await expect(page.locator('data').nth(1)).toContainText('123.456,79');
    await expect(page.locator('time')).toContainText('٢٠١١');
});
