import { test, expect, type Page } from '@playwright/test';
import { authenticate, Odoo } from '../../src/server/odoo';
async function signIn(page: Page, user: 'A' | 'B') {
  await page.goto('/login');
  await page
    .getByLabel('Email hoặc tên đăng nhập')
    .fill(`workspace.${user.toLowerCase()}@example.test`);
  await page
    .getByLabel('Mật khẩu hoặc API key cá nhân')
    .fill(process.env[`LOCAL_TEST_PASSWORD_${user}`]!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: user === 'A' ? /Chào Anh/ : /Chào Bảo/ }),
  ).toBeVisible();
}
test('two employees: private ACL, notification, polling sync, stale edit conflict and independent sessions', async ({
  browser,
}) => {
  test.setTimeout(100000);
  if (
    !['localhost', '127.0.0.1'].includes(
      new URL(process.env.ODOO_URL || 'https://invalid').hostname,
    ) ||
    process.env.ODOO_DB !== 'workspace_test'
  )
    throw new Error('Requires isolated local workspace_test.');
  const admin = new Odoo({
    uid: await authenticate('admin', process.env.LOCAL_ODOO_ADMIN_PASSWORD!),
    password: process.env.LOCAL_ODOO_ADMIN_PASSWORD!,
  });
  const ids = JSON.parse(
    await admin.call<string>('ir.config_parameter', 'get_param', ['workspace.fixture']),
  );
  const contexts = await Promise.all([
    browser.newContext({
      baseURL: process.env.APP_ORIGIN || 'http://localhost:3000',
      viewport: { width: 1366, height: 768 },
    }),
    browser.newContext({
      baseURL: process.env.APP_ORIGIN || 'http://localhost:3000',
      viewport: { width: 1366, height: 768 },
    }),
  ]);
  const [a, b] = await Promise.all(contexts.map((c) => c.newPage()));
  const errors: string[] = [];
  a.on('pageerror', (e) => errors.push(e.message));
  b.on('pageerror', (e) => errors.push(e.message));
  const original = await admin.read('project.task', ids.child, ['description']);
  try {
    await signIn(a, 'A');
    await signIn(b, 'B');
    const [meA, meB] = await Promise.all([a.request.get('/api/me'), b.request.get('/api/me')]);
    expect((await meA.json()).user.id).not.toBe((await meB.json()).user.id);
    await a.goto(`/tasks/${ids.secret}`);
    await expect(a.getByRole('heading', { name: 'Kiểm tra hồ sơ mật', exact: true })).toBeVisible();
    await b.goto('/search?q=ho%20so%20mat');
    await expect(b.getByRole('heading', { name: 'Chưa có nhiệm vụ phù hợp' })).toBeVisible();
    await b.goto(`/tasks/${ids.secret}`);
    await expect(b.locator('.error-box[role=alert]')).toContainText('Odoo từ chối truy cập');
    await a.goto(`/tasks/${ids.child}?tab=discussion`);
    await b.goto(`/tasks/${ids.child}?tab=discussion`);
    const marker = `Collaboration ${Date.now()}`;
    await b.getByRole('textbox', { name: 'Nội dung trao đổi' }).fill(marker);
    await b.getByRole('button', { name: 'Gửi', exact: true }).click();
    await expect(b.getByRole('textbox', { name: 'Nội dung trao đổi' })).toHaveValue('');
    // Wait for the actual 30-second query interval on employee A's page.
    await expect(a.locator('.messages')).toContainText(marker, { timeout: 35000 });
    const aUser = await admin.read('res.users', ids.users[0], ['partner_id']);
    const bOdoo = new Odoo({ uid: ids.users[1], password: process.env.LOCAL_TEST_PASSWORD_B! });
    const message = await bOdoo.call<number>('project.task', 'message_post', [[ids.child]], {
      body: `Targeted ${marker}`,
      message_type: 'comment',
      subtype_xmlid: 'mail.mt_comment',
      partner_ids: [(aUser.partner_id as number[])[0]],
    });
    await a.goto('/notifications');
    const target = a.locator(`a[href="/tasks/${ids.child}?tab=discussion&message=${message}"]`);
    await expect(target).toBeVisible();
    await target.click();
    await expect(a.locator(`#message-${message}`)).toHaveClass(/highlighted/);
    const reply = `Reply ${marker}`;
    await a.getByRole('textbox', { name: 'Nội dung trao đổi' }).fill(reply);
    await a.getByRole('button', { name: 'Gửi', exact: true }).click();
    await expect(b.locator('.messages')).toContainText(reply, { timeout: 35000 });
    await a.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
    await b.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
    await a.getByRole('textbox', { name: 'Mô tả công việc' }).fill(`Edit A ${marker}`);
    await b.getByRole('textbox', { name: 'Mô tả công việc' }).fill(`Edit B ${marker}`);
    await a.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
    await expect(a.getByText(`Edit A ${marker}`, { exact: true })).toBeVisible();
    await b.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
    await expect(b.getByRole('status')).toContainText('đã được người khác sửa');
    await expect(b.getByRole('textbox', { name: 'Mô tả công việc' })).toContainText(
      `Edit B ${marker}`,
    );
    expect(
      String((await admin.read('project.task', ids.child, ['description'])).description),
    ).toContain(`Edit A ${marker}`);
    const tab = await contexts[0].newPage();
    await tab.goto(`/tasks/${ids.child}`);
    await expect(
      tab.getByRole('heading', { name: 'Kiểm tra hồ sơ thiết kế', exact: true }),
    ).toBeVisible();
    await expect(tab.getByRole('navigation', { name: 'Đường dẫn nhiệm vụ' })).toContainText(
      'Rà soát hồ sơ',
    );
    await tab.reload();
    await expect(tab.getByText(`Edit A ${marker}`, { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await admin.call('project.task', 'write', [[ids.child], { description: original.description }]);
    await Promise.all(contexts.map((c) => c.close()));
  }
});
