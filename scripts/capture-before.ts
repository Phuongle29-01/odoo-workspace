// Initial audit only: preserve the original screenshots at commit 63a80af.
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { mockWorkspace, views } from '../tests/fixtures/workspace';
if (
  existsSync('.artifacts/ui-before') ||
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !==
    '63a80af92651a5e3153df1dc35aa71442943c481'
)
  throw new Error(
    'Original before capture is preserved in docs/ui-before. Do not overwrite it with a later UI.',
  );
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const [device, width, height] of [
    ['desktop', 1440, 900],
    ['laptop', 1366, 768],
    ['mobile', 390, 844],
  ] as const) {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: 'vi-VN',
      timezoneId: 'Asia/Ho_Chi_Minh',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await mockWorkspace(page);
    await mkdir(`.artifacts/ui-before/${device}`, { recursive: true });
    for (const view of views) {
      await page.goto(`http://localhost:3000${view.url}`);
      await page.getByRole('heading', { name: view.ready, exact: true }).waitFor();
      await expect(page.locator('.skeleton')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `.artifacts/ui-before/${device}/${view.name}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log('Captured 21 before screenshots with fixed browser-only fixtures.');
