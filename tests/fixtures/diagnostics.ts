import { test as base, expect, type Page } from '@playwright/test';
const diagnostics = new WeakMap<
  Page,
  {
    js: string[];
    console: string[];
    network: { path: string; status?: number; failure?: string }[];
  }
>();
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const log = {
      js: [] as string[],
      console: [] as string[],
      network: [] as { path: string; status?: number; failure?: string }[],
    };
    diagnostics.set(page, log);
    page.on('pageerror', (e) => log.js.push(e.message));
    page.on('console', (message) => {
      if (message.type() === 'error') log.console.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400)
        log.network.push({ path: new URL(response.url()).pathname, status: response.status() });
    });
    page.on('requestfailed', (request) =>
      log.network.push({
        path: new URL(request.url()).pathname,
        failure: request.failure()?.errorText,
      }),
    );
    await use(page);
    await testInfo.attach('browser-diagnostics', {
      body: Buffer.from(JSON.stringify(log, null, 2)),
      contentType: 'application/json',
    });
    expect(log.js, 'Uncaught browser JavaScript errors').toEqual([]);
  },
});
export { expect };
