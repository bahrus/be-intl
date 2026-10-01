import { test, expect } from '@playwright/test';
test('Programmatic>DeclarativeOutOfSequence', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('./tests/Programmatic/DeclarativeOutOfSequence.html');
    await expect(page.locator('#plain')).toHaveText('12,345', { timeout: 15_000 });
    await expect(page.locator('#euros')).toContainText('123.456,79');
    await expect(page.locator('#euros')).toContainText('€');
    await expect(page.locator('#friday')).toContainText('٢٠١١');
    expect(errors).toEqual([]);
});
