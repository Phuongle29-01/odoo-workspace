import { defineConfig } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const i = line.indexOf('=');
    if (i > 0 && !process.env[line.slice(0, i)]) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync('/workspace/.cache/ms-playwright'))
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/workspace/.cache/ms-playwright';
if (
  process.argv.some((arg) => arg.startsWith('--update-snapshots')) &&
  process.env.UPDATE_VISUALS !== '1'
)
  throw new Error(
    'Review the UI change first. Set UPDATE_VISUALS=1 only for an intentional baseline update.',
  );
export default defineConfig({
  testDir: 'tests',
  updateSnapshots: process.env.UPDATE_VISUALS === '1' ? 'all' : 'none',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { toHaveScreenshot: { animations: 'disabled', maxDiffPixels: 50 } },
  snapshotPathTemplate: '{testDir}/visual/snapshots/{projectName}/{arg}{ext}',
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.APP_ORIGIN || 'http://localhost:3000',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: { args: ['--no-sandbox'] },
  },
  projects: [
    {
      name: 'odoo',
      testMatch: 'e2e/**/*.spec.ts',
      use: { trace: 'off', viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'ui',
      testMatch: 'ui/**/*.spec.ts',
      use: { trace: 'retain-on-failure', viewport: { width: 1440, height: 900 } },
    },
    ...(
      [
        ['desktop', 1440, 900],
        ['laptop', 1366, 768],
        ['mobile', 390, 844],
      ] as const
    ).map(([name, width, height]) => ({
      name,
      testMatch: 'visual/**/*.spec.ts',
      use: { viewport: { width, height }, trace: 'retain-on-failure' as const },
    })),
  ],
});
