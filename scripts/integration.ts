import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { authenticate, Odoo } from '../src/server/odoo';
import { pool } from '../src/server/db';
import { hash } from '../src/server/crypto';

if (
  !['127.0.0.1', 'localhost'].includes(
    new URL(process.env.ODOO_URL || 'https://invalid').hostname,
  ) ||
  process.env.ODOO_DB !== 'workspace_test' ||
  process.env.ODOO_WRITE_ENABLED !== 'true'
) {
  throw new Error(
    'Integration suite only runs against the disposable local workspace_test database.',
  );
}
const base = process.env.APP_ORIGIN || 'http://localhost:3000';
let passed = 0;
async function check(name: string, run: () => Promise<void>) {
  await run();
  passed++;
  console.log(`PASS ${name}`);
}
type Client = { cookie: string; uid: number; odoo: Odoo };
async function request(
  client: Client | null,
  path: string,
  method = 'GET',
  data?: unknown,
  key?: string,
  origin = base,
) {
  return fetch(`${base}/api/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      'X-Workspace-Request': '1',
      ...(client ? { Cookie: client.cookie } : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
async function json(client: Client, path: string, method = 'GET', data?: unknown, key?: string) {
  const response = await request(client, path, method, data, key);
  const result = await response.json();
  assert.equal(response.status, 200, `${path}: ${response.status} ${result.error?.code || ''}`);
  return result;
}
async function login(letter: 'A' | 'B'): Promise<Client> {
  const password = process.env[`LOCAL_TEST_PASSWORD_${letter}`]!;
  const response = await request(null, 'auth/login', 'POST', {
    login: `workspace.${letter.toLowerCase()}@example.test`,
    password,
  });
  assert.equal(response.status, 200);
  const cookie = response.headers
    .getSetCookie()
    .find((s) => s.startsWith('workspace_session='))
    ?.split(';')[0];
  assert.ok(cookie);
  const uid = await authenticate(`workspace.${letter.toLowerCase()}@example.test`, password);
  return { cookie, uid, odoo: new Odoo({ uid, password }) };
}
try {
  await pool().query("DELETE FROM workspace_limits WHERE key LIKE 'login:%'");
  const adminUid = await authenticate('admin', process.env.LOCAL_ODOO_ADMIN_PASSWORD!);
  const admin = new Odoo({ uid: adminUid, password: process.env.LOCAL_ODOO_ADMIN_PASSWORD! });
  const ids = JSON.parse(
    await admin.call<string>('ir.config_parameter', 'get_param', ['workspace.fixture']),
  );
  let a: Client, b: Client;
  await check('health and database', async () => {
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
  });
  await check('invalid authentication is rejected', async () => {
    assert.equal(
      (
        await request(null, 'auth/login', 'POST', {
          login: 'workspace.invalid@example.test',
          password: 'not-valid',
        })
      ).status,
      401,
    );
  });
  await check('two independent Odoo users authenticate', async () => {
    a = await login('A');
    b = await login('B');
    assert.notEqual(a.uid, b.uid);
    assert.equal((await json(a, 'me')).user.id, a.uid);
    assert.equal((await json(b, 'me')).user.id, b.uid);
  });
  const A = a!,
    B = b!;
  await check(
    'employee view preferences are isolated, validated and survive a new session',
    async () => {
      const beforeA = await json(A, 'ui-preferences'),
        beforeB = await json(B, 'ui-preferences');
      try {
        await json(A, 'ui-preferences', 'POST', { view: 'kanban', navWidth: 196 });
        const second = await login('A');
        assert.equal((await json(second, 'ui-preferences')).view, 'kanban');
        assert.deepEqual(await json(B, 'ui-preferences'), beforeB);
        assert.equal(
          (await request(A, 'ui-preferences', 'POST', { identity: 'other', view: 'tree' })).status,
          400,
        );
        assert.equal((await request(A, 'ui-preferences', 'POST', { navWidth: 5000 })).status, 400);
      } finally {
        await json(A, 'ui-preferences', 'POST', {
          view: beforeA.view || 'list',
          navWidth: beforeA.navWidth || 180,
        });
      }
    },
  );
  await check(
    'dashboard counts and decorated search results come from the current Odoo identity',
    async () => {
      const result = await json(A, 'dashboard');
      assert.equal(
        result.counts.projects,
        await A.odoo.call('project.project', 'search_count', [[]]),
      );
      assert.equal(
        result.counts.mine,
        await A.odoo.call('project.task', 'search_count', [
          [
            ['user_ids', 'in', [A.uid]],
            ['state', 'not in', ['1_done', '1_canceled']],
          ],
        ]),
      );
      const rows = (await json(A, `tasks?assignee=${A.uid}&project=${ids.projects[1]}`)).items;
      assert.ok(rows.some((t: { id: number }) => t.id === ids.child));
      for (const row of rows) {
        assert.ok(row.user_ids.includes(A.uid));
        assert.ok(row.stateLabel);
        assert.ok(
          row.assignees.some((u: { id: number; name: string }) => u.id === A.uid && u.name),
        );
      }
      assert.equal((await request(A, 'tasks?state=unknown')).status, 400);
      const options = await json(B, 'task-options');
      assert.ok(!options.projects.some((p: { name: string }) => p.name === 'Hồ sơ hạn chế'));
    },
  );
  await check('multilevel child retains every ancestor across projects', async () => {
    const grandchild = await admin.call<number>('project.task', 'create', [
      {
        name: 'Temporary multilevel acceptance',
        parent_id: ids.child,
        project_id: ids.projects[0],
      },
    ]);
    try {
      const detail = await json(A, `tasks/${grandchild}`);
      assert.deepEqual(
        detail.ancestors.map((a: { id: number }) => a.id),
        [ids.parent, ids.child],
      );
      assert.equal(detail.task.project_id[0], ids.projects[0]);
    } finally {
      await admin.call('project.task', 'unlink', [[grandchild]]);
    }
  });
  await check('no unauthenticated task access', async () => {
    assert.equal((await request(null, `tasks/${ids.child}`)).status, 401);
  });
  await check(
    'global title, partial, Vietnamese unaccented, project and numeric search',
    async () => {
      for (const q of [
        'kiểm',
        'tra hồ sơ',
        'kiem tra ho so',
        'thiet ke',
        'Nhà máy B',
        String(ids.child),
      ]) {
        const result = await json(A, `tasks?q=${encodeURIComponent(q)}`);
        assert.ok(
          result.items.some((r: { id: number }) => r.id === ids.child),
          q,
        );
      }
    },
  );
  await check('duplicate names retain project context', async () => {
    const rows = (await json(A, 'tasks?q=kiem%20tra%20ho%20so')).items;
    for (const id of ids.duplicates) {
      const item = rows.find((r: { id: number }) => r.id === id);
      assert.ok(item.project_id);
    }
  });
  await check('cross-project subtask, breadcrumb and sibling data', async () => {
    const detail = await json(A, `tasks/${ids.child}`);
    assert.equal(detail.task.parent_id[0], ids.parent);
    assert.equal(detail.task.project_id[0], ids.projects[1]);
    assert.equal(detail.ancestors[0].project_id[0], ids.projects[0]);
    assert.ok(detail.canAtomicEdit);
  });
  await check('record rules prevent direct and search leaks to user B', async () => {
    assert.equal((await request(B, `tasks/${ids.secret}`)).status, 403);
    assert.ok(
      !(await json(B, 'tasks?q=ho%20so%20mat')).items.some(
        (r: { id: number }) => r.id === ids.secret,
      ),
    );
    assert.ok(
      (await json(A, 'tasks?q=ho%20so%20mat')).items.some(
        (r: { id: number }) => r.id === ids.secret,
      ),
    );
  });
  await check('backend rejects CSRF and unknown write fields', async () => {
    assert.equal(
      (await request(A, `tasks/${ids.child}`, 'PATCH', {}, randomUUID(), 'https://evil.example'))
        .status,
      403,
    );
    assert.equal(
      (
        await request(
          A,
          `tasks/${ids.child}`,
          'PATCH',
          { expectedRevision: 'x', values: { project_id: 123 } },
          randomUUID(),
        )
      ).status,
      400,
    );
  });
  await check('stage, state, assignee, deadline and priority roundtrip', async () => {
    const before = await json(A, `tasks/${ids.child}`);
    const stage = await admin.call<number>('project.task.type', 'create', [
      { name: 'Temporary acceptance stage', project_ids: [[6, 0, [ids.projects[1]]]] },
    ]);
    const state = before.fields.state.selection.find(
      ([key]: [string, string]) => key !== before.task.state,
    )[0];
    try {
      await json(
        A,
        `tasks/${ids.child}`,
        'PATCH',
        {
          expectedRevision: before.task.workspace_revision,
          values: {
            stage_id: stage,
            state,
            user_ids: [B.uid],
            date_deadline: '2026-11-01',
            priority: '1',
          },
        },
        randomUUID(),
      );
      const after = await json(B, `tasks/${ids.child}`);
      assert.equal(after.task.stage_id[0], stage);
      assert.equal(after.task.state, state);
      assert.deepEqual(after.task.user_ids, [B.uid]);
      assert.match(after.task.date_deadline, /^2026-11-01/);
      assert.equal(after.task.priority, '1');
    } finally {
      await A.odoo.call('project.task', 'write', [
        [ids.child],
        {
          stage_id: before.task.stage_id[0],
          state: before.task.state,
          user_ids: [[6, 0, before.task.user_ids]],
          date_deadline: before.task.date_deadline,
          priority: before.task.priority,
        },
      ]);
      await admin.call('project.task.type', 'unlink', [[stage]]);
    }
  });
  await check('atomic update and stale revision reject lost updates', async () => {
    const before = await json(A, `tasks/${ids.child}`);
    await json(
      A,
      `tasks/${ids.child}`,
      'PATCH',
      {
        expectedRevision: before.task.workspace_revision,
        values: { description: '<p>Integration update</p>', priority: '1' },
      },
      randomUUID(),
    );
    const stale = await request(
      B,
      `tasks/${ids.child}`,
      'PATCH',
      { expectedRevision: before.task.workspace_revision, values: { name: 'Must not overwrite' } },
      randomUUID(),
    );
    assert.equal(stale.status, 409);
    const after = await json(A, `tasks/${ids.child}`);
    assert.equal(after.task.name, before.task.name);
    assert.equal(after.task.priority, '1');
    await json(
      A,
      `tasks/${ids.child}`,
      'PATCH',
      {
        expectedRevision: after.task.workspace_revision,
        values: { description: before.task.description, priority: before.task.priority },
      },
      randomUUID(),
    );
  });
  await check('native Odoo edit is visible and invalidates old revision', async () => {
    const before = await json(A, `tasks/${ids.child}`);
    await A.odoo.call('project.task', 'write', [
      [ids.child],
      { description: '<p>Direct Odoo edit</p>' },
    ]);
    const after = await json(A, `tasks/${ids.child}`);
    assert.match(after.task.description, /Direct Odoo edit/);
    assert.equal(
      (
        await request(
          A,
          `tasks/${ids.child}`,
          'PATCH',
          { expectedRevision: before.task.workspace_revision, values: { priority: '1' } },
          randomUUID(),
        )
      ).status,
      409,
    );
    await A.odoo.call('project.task', 'write', [
      [ids.child],
      { description: before.task.description },
    ]);
  });
  await check('concurrent editors cannot silently overwrite the same revision', async () => {
    const before = await json(A, `tasks/${ids.child}`);
    const results = await Promise.all([
      request(
        A,
        `tasks/${ids.child}`,
        'PATCH',
        {
          expectedRevision: before.task.workspace_revision,
          values: { description: '<p>Concurrent A</p>' },
        },
        randomUUID(),
      ),
      request(
        B,
        `tasks/${ids.child}`,
        'PATCH',
        {
          expectedRevision: before.task.workspace_revision,
          values: { description: '<p>Concurrent B</p>' },
        },
        randomUUID(),
      ),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    await A.odoo.call('project.task', 'write', [
      [ids.child],
      { description: before.task.description },
    ]);
  });
  await check('comment creation is idempotent and visible to another user', async () => {
    const key = randomUUID(),
      text = `Integration comment ${key}`;
    const first = await json(
      A,
      `tasks/${ids.child}/messages`,
      'POST',
      { text, internal: false },
      key,
    );
    const second = await json(
      A,
      `tasks/${ids.child}/messages`,
      'POST',
      { text, internal: false },
      key,
    );
    assert.equal(first.id, second.id);
    const messages = await json(B, `tasks/${ids.child}/messages`);
    assert.equal(messages.filter((m: { id: number }) => m.id === first.id).length, 1);
  });
  await check('attachment roundtrip and task/attachment ID checks', async () => {
    const text = 'Safe local attachment',
      data = Buffer.from(text).toString('base64');
    const f = await json(
      A,
      `tasks/${ids.child}/attachments`,
      'POST',
      { name: 'integration.txt', data },
      randomUUID(),
    );
    const res = await request(B, `tasks/${ids.child}/attachments/${f.id}`);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), text);
    assert.match(res.headers.get('content-disposition') || '', /^attachment/);
    assert.equal((await request(B, `tasks/${ids.parent}/attachments/${f.id}`)).status, 403);
    const privateFile = await json(
      A,
      `tasks/${ids.secret}/attachments`,
      'POST',
      { name: 'private.txt', data },
      randomUUID(),
    );
    assert.equal(
      (await request(B, `tasks/${ids.secret}/attachments/${privateFile.id}`)).status,
      403,
    );
  });
  await check('subtask creation uses real Odoo relation and single request key', async () => {
    const key = randomUUID();
    const result = await json(
      A,
      `tasks/${ids.parent}/children`,
      'POST',
      { name: `Local integration subtask ${key}` },
      key,
    );
    const again = await json(
      A,
      `tasks/${ids.parent}/children`,
      'POST',
      { name: `Local integration subtask ${key}` },
      key,
    );
    assert.equal(result.id, again.id);
    const task = await json(A, `tasks/${result.id}`);
    assert.equal(task.task.parent_id[0], ids.parent);
    await A.odoo.call('project.task', 'unlink', [[result.id]]);
  });
  await check('bookmark permissions are revalidated after access revocation', async () => {
    const partner = await admin.read('res.users', B.uid, ['partner_id']);
    const project = await admin.call<number>('project.project', 'create', [
      { name: `Temporary permission test ${randomUUID()}`, privacy_visibility: 'followers' },
    ]);
    let task: number | undefined;
    try {
      await admin.call('project.project', 'message_subscribe', [[project]], {
        partner_ids: [(partner.partner_id as number[])[0]],
      });
      task = await admin.call<number>('project.task', 'create', [
        { name: 'Temporary access revocation task', project_id: project, user_ids: [[6, 0, []]] },
      ]);
      await json(B, 'preferences', 'POST', { taskId: task, bookmarked: true });
      assert.ok(
        (await json(B, 'preferences?bookmarked=true')).items.some(
          (t: { id: number }) => t.id === task,
        ),
      );
      // Project subscriptions can also subscribe partners to its tasks. Revoke both paths.
      for (const [model, id] of [
        ['project.project', project],
        ['project.task', task],
      ] as const) {
        const followers = await admin.search(
          'mail.followers',
          [
            ['res_model', '=', model],
            ['res_id', '=', id],
            ['partner_id', '=', (partner.partner_id as number[])[0]],
          ],
          ['id'],
        );
        if (followers.length)
          await admin.call(model, 'write', [
            [id],
            { message_follower_ids: followers.map((f) => [2, f.id, 0]) },
          ]);
      }
      assert.ok(
        !(await json(B, 'preferences?bookmarked=true')).items.some(
          (t: { id: number }) => t.id === task,
        ),
      );
      assert.equal((await request(B, `tasks/${task}`)).status, 403);
    } finally {
      await admin.call('project.project', 'unlink', [[project]]);
      if (task) await pool().query('DELETE FROM workspace_preferences WHERE task_id=$1', [task]);
    }
  });
  await check('internal note writes the actual Odoo note subtype', async () => {
    const result = await json(
      A,
      `tasks/${ids.child}/messages`,
      'POST',
      { text: 'Local acceptance internal note', internal: true },
      randomUUID(),
    );
    const messages = await json(B, `tasks/${ids.child}/messages`);
    const note = messages.find((m: { id: number }) => m.id === result.id);
    assert.ok(note);
    assert.ok(note.subtype_id);
    const expected = await admin.call<number[]>(
      'ir.model.data',
      'search_read',
      [
        [
          ['module', '=', 'mail'],
          ['name', '=', 'mt_note'],
        ],
      ],
      { fields: ['res_id'], limit: 1 },
    );
    assert.equal(note.subtype_id[0], (expected[0] as unknown as { res_id: number }).res_id);
  });
  await check('notification task/comment deep link and read state', async () => {
    const user = await B.odoo.read('res.users', B.uid, ['partner_id']);
    const messageId = await A.odoo.call<number>('project.task', 'message_post', [[ids.child]], {
      body: 'Local targeted notification',
      message_type: 'comment',
      subtype_xmlid: 'mail.mt_comment',
      partner_ids: [(user.partner_id as number[])[0]],
    });
    const result = await json(B, 'notifications');
    assert.equal(result.available, true);
    const item = result.items.find((n: { message: { id: number } }) => n.message.id === messageId);
    assert.ok(item);
    assert.equal(item.href, `/tasks/${ids.child}?tab=discussion&message=${messageId}`);
    await json(B, `notifications/${item.id}`, 'POST', {}, randomUUID());
    assert.equal(
      (await json(B, 'notifications')).items.find((n: { id: number }) => n.id === item.id).is_read,
      true,
    );
    assert.equal(
      (await request(A, `notifications/${item.id}`, 'POST', {}, randomUUID())).status,
      403,
    );
  });
  await check('Discuss membership, message roundtrip, search and message deep link', async () => {
    const userA = await admin.read('res.users', A.uid, ['partner_id']),
      userB = await admin.read('res.users', B.uid, ['partner_id']);
    const channel = await admin.call<number>('discuss.channel', 'create', [
      {
        name: 'Local acceptance discussion',
        channel_type: 'group',
        channel_member_ids: [
          [0, 0, { partner_id: (userA.partner_id as number[])[0] }],
          [0, 0, { partner_id: (userB.partner_id as number[])[0] }],
        ],
      },
    ]);
    const privateChannel = await admin.call<number>('discuss.channel', 'create', [
      {
        name: 'Local private discussion',
        channel_type: 'group',
        channel_member_ids: [[0, 0, { partner_id: (userA.partner_id as number[])[0] }]],
      },
    ]);
    try {
      const key = randomUUID(),
        text = `Discussion acceptance ${key}`;
      assert.ok((await json(B, 'discuss')).items.some((c: { id: number }) => c.id === channel));
      const first = await json(A, `discuss/${channel}/messages`, 'POST', { text }, key);
      const second = await json(A, `discuss/${channel}/messages`, 'POST', { text }, key);
      assert.equal(first.id, second.id);
      assert.ok(
        (await json(B, `discuss/${channel}?q=${key}`)).items.some(
          (m: { id: number }) => m.id === first.id,
        ),
      );
      assert.equal((await json(B, `discuss/${channel}?message=${first.id}`)).focused.id, first.id);
      assert.equal((await request(B, `discuss/${privateChannel}`)).status, 403);
      assert.equal(
        (
          await request(
            B,
            `discuss/${privateChannel}/messages`,
            'POST',
            { text: 'Must not post' },
            randomUUID(),
          )
        ).status,
        403,
      );
      assert.equal((await request(A, `discuss/${privateChannel}?message=${first.id}`)).status, 403);
    } finally {
      await admin.call('discuss.channel', 'unlink', [[channel, privateChannel]]);
    }
  });
  await check('uncertain mutation keys are never retried upstream', async () => {
    const key = randomUUID(),
      data = { task: ids.child, text: 'Must not be posted', internal: false };
    const { rows } = await pool().query(
      'SELECT instance FROM workspace_sessions WHERE token_hash=$1',
      [hash(A.cookie.split('=')[1])],
    );
    await pool().query(
      'INSERT INTO workspace_mutations(identity,key,fingerprint,status) VALUES($1,$2,$3,$4)',
      [`${rows[0].instance}:${A.uid}`, key, hash(JSON.stringify(data)), 'unknown'],
    );
    const response = await request(
      A,
      `tasks/${ids.child}/messages`,
      'POST',
      { text: data.text, internal: false },
      key,
    );
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error.code, 'RESULT_UNKNOWN');
  });
  await check('upstream timeout is bounded and connection recovers', async () => {
    const container = 'odoo-smart-workspace-odoo-1';
    execFileSync('docker', ['pause', container], { stdio: 'ignore' });
    try {
      assert.equal((await request(B, 'tasks')).status, 504);
    } finally {
      execFileSync('docker', ['unpause', container], { stdio: 'ignore' });
    }
    assert.ok(Array.isArray((await json(B, 'tasks')).items));
  });
  await check('logout revokes server-side session', async () => {
    await json(A, 'auth/logout', 'POST');
    assert.equal((await request(A, 'me')).status, 401);
  });
  await check('expired session is rejected', async () => {
    const client = await login('A');
    const token = client.cookie.split('=')[1];
    await pool().query(
      "UPDATE workspace_sessions SET expires_at=now()-interval '1 minute' WHERE token_hash=$1",
      [hash(token)],
    );
    assert.equal((await request(client, 'me')).status, 401);
  });
  console.log(`Integration: ${passed} passed, 0 skipped (real local Odoo 17 + PostgreSQL).`);
} finally {
  await pool().end();
}
