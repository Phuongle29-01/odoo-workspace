/** Measured against the production server and disposable local Odoo only. */
import { pool } from '../src/server/db';
import { authenticate, Odoo } from '../src/server/odoo';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { randomUUID } from 'node:crypto';
if (
  !['localhost', '127.0.0.1'].includes(
    new URL(process.env.ODOO_URL || 'https://invalid').hostname,
  ) ||
  process.env.ODOO_DB !== 'workspace_test'
)
  throw new Error('Measurements may create fixtures in local workspace_test only.');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync('/workspace/.cache/ms-playwright'))
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/workspace/.cache/ms-playwright';
const { chromium, expect } = await import('@playwright/test');
const base = process.env.APP_ORIGIN || 'http://localhost:3000';
const admin = new Odoo({
  uid: await authenticate('admin', process.env.LOCAL_ODOO_ADMIN_PASSWORD!),
  password: process.env.LOCAL_ODOO_ADMIN_PASSWORD!,
});
const fixture = JSON.parse(
  await admin.call<string>('ir.config_parameter', 'get_param', ['workspace.fixture']),
);
// Reset only disposable test login limits before repeated local measurements. Runtime limits stay enabled.
await pool().query("DELETE FROM workspace_limits WHERE key LIKE 'login:%'");
const taskBefore = await admin.read('project.task', fixture.child, ['name']);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({
  baseURL: base,
  viewport: { width: 1440, height: 900 },
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
});
const page = await context.newPage();
const jsErrors: string[] = [],
  networkFailures: { path: string; type: string; reason?: string; prefetch: boolean }[] = [],
  httpErrors: { path: string; status: number }[] = [];
page.on('pageerror', (e) => jsErrors.push(e.message));
page.on('requestfailed', (r) => {
  const url = new URL(r.url());
  networkFailures.push({
    path: url.pathname,
    type: r.resourceType(),
    reason: r.failure()?.errorText,
    prefetch: url.searchParams.has('_rsc'),
  });
});
page.on('response', (r) => {
  if (r.status() >= 400) httpErrors.push({ path: new URL(r.url()).pathname, status: r.status() });
});
const summary = (samples: number[]) => {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    samples: samples.map((n) => Math.round(n)),
    medianMs: Math.round(sorted[Math.floor(sorted.length / 2)]),
    maxMs: Math.round(sorted.at(-1)!),
  };
};
const report: Record<string, unknown> = {
  date: new Date().toISOString(),
  runtime:
    process.env.PERFORMANCE_RUNTIME ||
    'Production Next standalone on shared cloud Linux; real local Odoo17/Postgres16; Chromium156; one client; warm runs; no staging SLA claim',
};
let project: number | undefined;
try {
  await page.goto('/login');
  await page.getByLabel('Email hoặc tên đăng nhập').fill('workspace.a@example.test');
  await page.getByLabel('Mật khẩu hoặc API key cá nhân').fill(process.env.LOCAL_TEST_PASSWORD_A!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Chào Anh/ })).toBeVisible();
  const timings: Record<string, unknown> = {};
  for (const [name, path, heading] of [
    ['dashboard', '/', /Chào Anh/],
    ['task', `/tasks/${fixture.child}`, /^Kiểm tra hồ sơ thiết kế$/],
    ['search', '/search?q=kiem%20tra%20ho%20so', /^Tìm đúng việc/],
  ] as const) {
    const samples: number[] = [];
    for (let n = 0; n < 5; n++) {
      const started = performance.now();
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await expect(page.locator('.skeleton')).toHaveCount(0);
      if (name === 'search')
        await expect(
          page.getByRole('listbox', { name: 'Kết quả tìm kiếm' }).getByRole('option').first(),
        ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      samples.push(performance.now() - started);
    }
    timings[name] = summary(samples);
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Chào Anh/ })).toBeVisible();
  await expect(page.locator('.skeleton')).toHaveCount(0);
  report.dashboardResourceBytes = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {
      jsDecoded: entries
        .filter((e) => new URL(e.name).pathname.endsWith('.js'))
        .reduce((n, e) => n + e.decodedBodySize, 0),
      jsTransfer: entries
        .filter((e) => new URL(e.name).pathname.endsWith('.js'))
        .reduce((n, e) => n + e.transferSize, 0),
      cssDecoded: entries
        .filter((e) => new URL(e.name).pathname.endsWith('.css'))
        .reduce((n, e) => n + e.decodedBodySize, 0),
    };
  });
  await page.goto(`/tasks/${fixture.child}`);
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Mô tả công việc' })).toBeVisible();
  const originalName = await page.getByLabel('Tên nhiệm vụ', { exact: true }).inputValue();
  // A reversible write with the original value restored through the UI.
  const saved: number[] = [];
  for (let n = 0; n < 3; n++) {
    if (n) await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
    await page.getByLabel('Tên nhiệm vụ', { exact: true }).fill(`${originalName} · đo ${n}`);
    const start = performance.now();
    await page.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: `${originalName} · đo ${n}`, exact: true }),
    ).toBeVisible();
    saved.push(performance.now() - start);
  }
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  await page.getByLabel('Tên nhiệm vụ', { exact: true }).fill(originalName);
  await page.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
  await expect(page.getByRole('heading', { name: originalName, exact: true })).toBeVisible();
  timings.saveTask = summary(saved);
  report.browser = timings;
  const apis: Record<string, unknown> = {};
  for (const path of [
    'dashboard',
    'tasks?q=kiem%20tra%20ho%20so',
    `tasks/${fixture.child}`,
    'notifications',
  ]) {
    const samples: number[] = [];
    for (let n = 0; n < 5; n++) {
      const start = performance.now();
      const response = await context.request.get(`/api/${path}`);
      if (!response.ok()) throw new Error(`Measurement ${path} HTTP ${response.status()}`);
      await response.body();
      samples.push(performance.now() - start);
    }
    apis[path] = summary(samples);
  }
  report.api = apis;
  await mkdir('.artifacts', { recursive: true });
  await writeFile('.artifacts/performance.partial.json', JSON.stringify(report, null, 2));
  await page.close(); // stop UI polling during the synthetic read-growth experiment

  const tag = `Workspace performance ${randomUUID()}`;
  project = await admin.call<number>('project.project', 'create', [
    { name: tag, privacy_visibility: 'employees' },
  ]);
  const growth: unknown[] = [];
  let size = 0;
  for (const target of [0, 100, 500, 1100]) {
    for (let offset = size; offset < target; offset += 50) {
      await admin.call(
        'project.task',
        'create',
        [
          Array.from({ length: Math.min(50, target - offset) }, (_, n) => ({
            name: `${tag} row ${offset + n}`,
            project_id: project,
            user_ids: [[6, 0, [fixture.users[0]]]],
          })),
        ],
        { context: { tracking_disable: true, mail_create_nosubscribe: true } },
      );
    }
    size = target;
    const samples: number[] = [];
    let result: { scanned: number; scanLimited: boolean; nextCursor: number | null } | undefined;
    for (let n = 0; n < 5; n++) {
      const start = performance.now();
      const response = await context.request.get(
        `/api/tasks?project=${project}&q=absent-measurement-needle`,
      );
      if (!response.ok()) throw new Error('Growth query failed');
      result = await response.json();
      samples.push(performance.now() - start);
    }
    growth.push({
      tasks: target,
      ...summary(samples),
      scanned: result!.scanned,
      scanLimited: result!.scanLimited,
      nextCursor: result!.nextCursor,
    });
  }
  report.growth = growth;
  const files = await readdir('.next/static/chunks', { recursive: true });
  let raw = 0,
    gzip = 0,
    count = 0;
  for (const file of files) {
    if (file.endsWith('.js')) {
      const bytes = await readFile(`.next/static/chunks/${file}`);
      raw += bytes.length;
      gzip += gzipSync(bytes).length;
      count++;
    }
  }
  report.allClientChunks = {
    files: count,
    rawBytes: raw,
    gzipBytes: gzip,
    note: 'All generated client chunks, including lazily loaded editor and routes; not initial transfer.',
  };
  report.jsErrors = jsErrors;
  report.failedRequests = networkFailures;
  report.httpErrors = httpErrors;
  report.networkSummary = {
    aborted: networkFailures.filter((r) => r.reason === 'net::ERR_ABORTED').length,
    otherFailures: networkFailures.filter((r) => r.reason !== 'net::ERR_ABORTED').length,
    prefetchAborts: networkFailures.filter((r) => r.prefetch && r.reason === 'net::ERR_ABORTED')
      .length,
  };
  await mkdir('.artifacts', { recursive: true });
  await writeFile(
    process.env.PERFORMANCE_OUTPUT || '.artifacts/performance.json',
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (project) {
    while (true) {
      const rows = await admin.search('project.task', [['project_id', '=', project]], ['id'], 50);
      if (!rows.length) break;
      await admin.call('project.task', 'unlink', [rows.map((row) => row.id)]);
    }
    await admin.call('project.project', 'unlink', [[project]]);
  }
  await admin.call('project.task', 'write', [[fixture.child], { name: taskBefore.name }]);
  await browser.close();
  await pool().end();
}
