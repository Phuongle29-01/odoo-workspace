import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';
{
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const i = line.indexOf('=');
    if (i > 0 && !process.env[line.slice(0, i)]) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.APP_ORIGIN || 'http://localhost:3000',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
        (process.env.CI === 'true' ? undefined : '/usr/bin/chromium'),
      args: ['--no-sandbox'],
    },
  },
});
