import { test, expect } from '../fixtures/diagnostics';
import { mockWorkspace, views } from '../fixtures/workspace';
for (const view of views) {
  test(`${view.name} visual`, async ({ page }, testInfo) => {
    await mockWorkspace(page);
    await page.goto(view.url);
    await expect(page.getByRole('heading', { name: view.ready, exact: true })).toBeVisible();
    await expect(page.locator('.skeleton')).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${view.name}.png`, { fullPage: true });
    await testInfo.attach('review-screenshot', {
      body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
      contentType: 'image/png',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
