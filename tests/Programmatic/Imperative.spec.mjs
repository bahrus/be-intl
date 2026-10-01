import { test, expect } from '@playwright/test';
test('Programmatic>Imperative', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('./tests/Programmatic/Imperative.html');
    const price = page.locator('#price');
    // locale set programmatically wins over the inherited <html lang=en>
    await expect(price).toContainText('1.234,50', { timeout: 15_000 });
    await expect(price).toContainText('$');
    // attached with no properties at all
    await expect(page.locator('#total')).toHaveText('42');
    // a semantic prop set after the first render re-formats
    await page.click('#toEuros');
    await expect(price).toContainText('€');
    // so does assigning a new format object
    await page.evaluate(() => { price.enh.beIntl.format = {style: 'percent'}; });
    await expect(price).toContainText('123.450');
    await expect(price).toContainText('%');
    // and changing the element's value
    await page.evaluate(() => { price.value = 2; });
    await expect(price).toContainText('200');
    expect(errors).toEqual([]);
});
