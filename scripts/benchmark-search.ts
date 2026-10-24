/** Isolated local ORM benchmark. Never accepts a remote Odoo or production DB. */
import { authenticate, Odoo } from '../src/server/odoo';
import { pool } from '../src/server/db';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
if (
  !['localhost', '127.0.0.1'].includes(
    new URL(process.env.ODOO_URL || 'https://invalid').hostname,
  ) ||
  process.env.ODOO_DB !== 'workspace_test'
)
  throw new Error('Local workspace_test only.');
const mode = process.argv[2] || 'before',
  base = process.env.APP_ORIGIN || 'http://localhost:3000';
const admin = new Odoo({
  uid: await authenticate('admin', process.env.LOCAL_ODOO_ADMIN_PASSWORD!),
  password: process.env.LOCAL_ODOO_ADMIN_PASSWORD!,
});
if (!['before', 'after', 'cleanup'].includes(mode))
  throw new Error('Use before, after or cleanup.');
if (mode !== 'cleanup') {
  const indexed = !!(await admin.fields('project.task')).workspace_search_name;
  if ((mode === 'before' && indexed) || (mode === 'after' && !indexed))
    throw new Error(
      'Before requires a database without the optional search addon; after requires it installed. Use a fresh disposable local database to reproduce the baseline.',
    );
}
const fixture = JSON.parse(
  await admin.call<string>('ir.config_parameter', 'get_param', ['workspace.fixture']),
);
await mkdir('.artifacts', { recursive: true });
await mkdir('.local', { recursive: true });
let state: { project: number; ids: number[]; tag: string };
if (mode === 'before') {
  const tag = `UX2 benchmark ${randomUUID()}`;
  state = {
    project: await admin.call<number>('project.project', 'create', [
      { name: tag, privacy_visibility: 'employees' },
    ]),
    ids: [],
    tag,
  };
  await writeFile('.local/ux2-benchmark-state.json', JSON.stringify(state));
} else state = JSON.parse(await readFile('.local/ux2-benchmark-state.json', 'utf8'));
async function shrink(size: number) {
  const removed = state.ids.slice(size);
  for (let n = 0; n < removed.length; n += 50)
    await admin.call('project.task', 'unlink', [removed.slice(n, n + 50)]);
  state.ids = state.ids.slice(0, size);
  await writeFile('.local/ux2-benchmark-state.json', JSON.stringify(state));
}
try {
  if (mode === 'cleanup') {
    await shrink(0);
    await admin.call('project.project', 'unlink', [[state.project]]);
    console.log('Removed this benchmark project and all its tasks.');
  } else {
    await pool().query("DELETE FROM workspace_limits WHERE key LIKE 'login:%'");
    const auth = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base, 'X-Workspace-Request': '1' },
      body: JSON.stringify({
        login: 'workspace.a@example.test',
        password: process.env.LOCAL_TEST_PASSWORD_A,
      }),
    });
    if (!auth.ok) throw new Error(`Login HTTP ${auth.status}`);
    const cookie = auth.headers
      .getSetCookie()
      .find((c) => c.startsWith('workspace_session='))!
      .split(';')[0];
    async function request(path: string) {
      const start = performance.now();
      const r = await fetch(`${base}/api/${path}`, { headers: { Cookie: cookie } });
      if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
      const data = await r.json();
      return {
        ms: Math.round(performance.now() - start),
        timing: r.headers.get('server-timing'),
        data,
      };
    }
    const report: { mode: string; runtime: string; screens: unknown[]; growth: unknown[] } = {
      mode,
      runtime:
        process.env.BENCHMARK_RUNTIME ||
        'Local API; real Odoo17/Postgres; one identity; runtime unspecified; no SLA',
      screens: [],
      growth: [],
    };
    for (const path of ['dashboard', `tasks/${fixture.child}`, 'notifications']) {
      await request(path);
      const samples = [];
      for (let n = 0; n < 3; n++) {
        const r = await request(path);
        samples.push({ ms: r.ms, timing: r.timing });
      }
      report.screens.push({ path, samples });
    }
    const sizes = mode === 'before' ? [100, 500, 1100, 5000, 10000] : [10000, 5000, 1100, 500, 100];
    for (const target of sizes) {
      if (state.ids.length > target) await shrink(target);
      while (state.ids.length < target) {
        const start = state.ids.length;
        const rows = Array.from({ length: Math.min(50, target - start) }, (_, n) => ({
          name: [95, 495, 1095, 4995, 9995].includes(start + n)
            ? `Kiểm tra hồ sơ ${state.tag}`
            : `${state.tag} row ${start + n}`,
          project_id: state.project,
          user_ids: [[6, 0, [fixture.users[0]]]],
        }));
        const ids = await admin.call<number[]>('project.task', 'create', [rows], {
          context: { tracking_disable: true, mail_create_nosubscribe: true },
        });
        state.ids.push(...ids);
        await writeFile('.local/ux2-benchmark-state.json', JSON.stringify(state));
      }
      for (const term of ['khongco-ketqua-ux2', 'kiem tra ho so']) {
        const path = `tasks?project=${state.project}&q=${encodeURIComponent(term)}`;
        await request(path);
        const samples = [];
        let last;
        for (let n = 0; n < 3; n++) {
          last = await request(path);
          samples.push({ ms: last.ms, timing: last.timing });
        }
        report.growth.push({
          tasks: target,
          query: term,
          samples,
          results: last!.data.items.length,
          scanned: last!.data.scanned,
          mode: last!.data.mode,
          nextCursor: last!.data.nextCursor,
          scanLimited: last!.data.scanLimited,
        });
      }
      await writeFile(`.artifacts/ux2-performance-${mode}.json`, JSON.stringify(report, null, 2));
      console.log(`${mode}: measured ${target} tasks`);
    }
  }
} finally {
  await pool().end();
}
