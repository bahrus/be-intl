import { test, expect } from '@playwright/test';

test('test1', async ({ page }) => {
    page.on('console', msg => { if (msg.type() === 'error') console.log(`[page error] ${msg.text()}`); });
    page.on('pageerror', err => console.log(`[pageerror] ${err.stack || err.message}`));

    await page.goto('./tests/test1.html');

    try {
        await expect(page.locator('data').first()).toHaveText('12,345', { timeout: 20_000 });
    } catch (e) {
        console.log('--- element / inferencer probe ---\n' + await page.evaluate(() => {
            return [...document.querySelectorAll('data, time')].map((el, i) => {
                const enh = el.enh || {};
                const inf = enh.inferencer;
                const vm = enh.BeIntl;
                let infValue, infLang;
                try { infValue = JSON.stringify(inf && inf.value); } catch (err) { infValue = 'throw:' + err; }
                try { infLang = JSON.stringify(inf && inf.lang); } catch (err) { infLang = 'throw:' + err; }
                return [
                    `#${i} <${el.tagName.toLowerCase()}> ctor=${el.constructor.name} text=${JSON.stringify(el.textContent)}`,
                    `   outerHTML=${el.outerHTML}`,
                    `   getAttribute(value)=${JSON.stringify(el.getAttribute('value'))} .value=${JSON.stringify(el.value)}`,
                    `   getAttribute(datetime)=${JSON.stringify(el.getAttribute('datetime'))} .dateTime=${JSON.stringify(el.dateTime)}`,
                    `   getAttribute(lang)=${JSON.stringify(el.getAttribute('lang'))}`,
                    `   inferencer present=${!!inf}  inf.value=${infValue}  inf.lang=${infLang}`,
                    `   vm: initialized=${vm && JSON.stringify(vm.initialized)} value=${vm && JSON.stringify(vm.value)} locale=${vm && JSON.stringify(vm.locale)}`,
                ].join('\n');
            }).join('\n');
        }));
        throw e;
    }

    await expect(page.locator('data').nth(1)).toContainText('123.456,79');
    await expect(page.locator('time')).toContainText('٢٠١١');
});
