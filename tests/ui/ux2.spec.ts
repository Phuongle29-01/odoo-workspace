import { test, expect } from '../fixtures/diagnostics';
import { mockWorkspace, tasks, messages, channels } from '../fixtures/workspace';
import { testPdf, testPng } from '../fixtures/documents';

test('1100-task continuation distinguishes incomplete empty, appends, and restores pages/filters on Back', async ({
  page,
}) => {
  await mockWorkspace(page);
  const cursors: number[] = [];
  await page.route('**/api/tasks?**', (route) => {
    const cursor = Number(new URL(route.request().url()).searchParams.get('cursor') || 0);
    cursors.push(cursor);
    return route.fulfill({
      json: {
        items: cursor ? [tasks[1], tasks[3]] : [],
        nextCursor: cursor ? null : 1000,
        scanned: cursor ? 100 : 1000,
        scanLimited: !cursor,
      },
    });
  });
  await page.goto('/search?q=kiem%20tra&project=12&description=true');
  await expect(page.getByRole('heading', { name: 'Chưa thấy trong phần đã tìm' })).toBeVisible();
  await page.getByRole('button', { name: 'Tìm tiếp', exact: true }).click();
  await expect(
    page.getByRole('listbox', { name: 'Kết quả tìm kiếm' }).getByRole('option'),
  ).toHaveCount(2);
  await expect(page).toHaveURL(/pages=2/);
  await page.getByRole('option', { name: /Kiểm tra hồ sơ thiết kế/ }).click();
  await expect(page).toHaveURL(/focus=1/);
  await expect(page.locator('#task-navigation-panel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toàn bộ bối cảnh' }).click();
  await expect(page.locator('#task-navigation-panel')).toContainText('Rà soát hồ sơ');
  await page.goBack();
  await expect(page).toHaveURL(/project=12/);
  await expect(
    page.getByRole('listbox', { name: 'Kết quả tìm kiếm' }).getByRole('option'),
  ).toHaveCount(2);
  await expect(page.getByRole('combobox', { name: 'Dự án', exact: true })).toHaveValue('12');
  await page.reload();
  await expect(
    page.getByRole('listbox', { name: 'Kết quả tìm kiếm' }).getByRole('option'),
  ).toHaveCount(2);
  expect(cursors).toContain(1000);
});

test('changing search filters during continuation discards stale response and offers scoped suggestions', async ({
  page,
}) => {
  await mockWorkspace(page);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/tasks?**', async (route) => {
    const p = new URL(route.request().url()).searchParams;
    if (p.get('cursor') === '1000') {
      await gate;
      return route.fulfill({ json: { items: [tasks[3]], nextCursor: null } }).catch(() => {});
    }
    return route.fulfill({
      json: {
        items: p.get('project') ? [tasks[1]] : [],
        nextCursor: p.get('project') ? null : 1000,
        scanLimited: true,
      },
    });
  });
  await page.goto('/search?q=kiem');
  await page.getByRole('button', { name: 'Tìm tiếp', exact: true }).click();
  await page.getByRole('combobox', { name: 'Dự án', exact: true }).selectOption('12');
  release();
  await expect(
    page.getByRole('listbox', { name: 'Kết quả tìm kiếm' }).getByRole('option'),
  ).toHaveCount(1);
  await expect(
    page.getByRole('listbox', { name: 'Kết quả tìm kiếm' }).getByRole('option'),
  ).toContainText('thiết kế');
  await page.getByRole('combobox', { name: 'Từ khóa tìm nhiệm vụ' }).fill('nha may');
  await page.getByRole('button', { name: 'Dự án: Nhà máy B', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Từ khóa tìm nhiệm vụ' })).toHaveValue('');
  await expect(page).not.toHaveURL(/[?&]q=/);
});

test('PDF canvas, image, denied preview, download and mobile close preserve task URL', async ({
  page,
}) => {
  await mockWorkspace(page);
  await page.route('**/api/tasks/102/attachments', (route) =>
    route.fulfill({
      json: [
        { id: 501, name: 'Demo.pdf', file_size: testPdf().length },
        { id: 502, name: 'Demo.png', file_size: testPng.length },
        { id: 503, name: 'Denied.html', file_size: 12 },
      ],
    }),
  );
  await page.route('**/api/tasks/102/attachments/*', (route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').at(-1));
    if (id === 503)
      return route.fulfill({
        status: 403,
        json: { error: { code: 'ACCESS_DENIED', message: 'Quyền xem tài liệu đã bị thu hồi.' } },
      });
    return route.fulfill({
      body: id === 501 ? testPdf() : testPng,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="demo"',
        'X-Workspace-Preview-Type': id === 501 ? 'application/pdf' : 'image/png',
      },
    });
  });
  await page.goto('/tasks/102?tab=documents&focus=1');
  const url = page.url();
  await page.getByRole('button', { name: 'Xem trước Demo.pdf', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.pdf-canvas')).toHaveJSProperty('width', 760);
  await expect(page.getByText('Đang hiển thị PDF…')).toHaveCount(0);
  await expect(page.getByText('Trang 1 / 1', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('link', { name: 'Tải xuống', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('demo');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Xem trước Demo.pdf', exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Xem trước Demo.png', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Xem trước Demo.png' })).toBeVisible();
  expect(
    await page
      .getByRole('img', { name: 'Xem trước Demo.png' })
      .evaluate((el: HTMLImageElement) => el.naturalWidth),
  ).toBe(1);
  await page.getByRole('button', { name: 'Đóng xem trước' }).click();
  await page.getByRole('button', { name: 'Xem trước Denied.html', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Quyền xem tài liệu đã bị thu hồi.');
  await expect(page).toHaveURL(url);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('large child navigation expands progressively and fetches only after cached rows are used', async ({
  page,
}) => {
  const state = await mockWorkspace(page);
  state.tasks = state.tasks.filter((t) => t.id !== 103);
  for (let i = 0; i < 121; i++)
    state.tasks.push({
      ...tasks[2],
      id: 1000 + i,
      name: `Child ${i}`,
      date_deadline: '2026-10-26',
      parent_id: [102, tasks[1].name],
    });
  let reads = 0;
  page.on('request', (r) => {
    if (r.url().includes('/children?')) reads++;
  });
  await page.goto('/tasks/102?focus=0');
  await expect(page.locator('.child-node')).toHaveCount(12);
  await page.getByRole('button', { name: /Thu gọn nhiệm vụ con/ }).click();
  await expect(page.locator('.child-node')).toHaveCount(0);
  await page.getByRole('button', { name: /Mở nhiệm vụ con/ }).click();
  for (let i = 0; i < 8; i++)
    await page.getByRole('button', { name: 'Tải thêm nhiệm vụ con', exact: true }).click();
  await expect(page.locator('.child-node')).toHaveCount(100);
  expect(reads).toBe(0);
  await page.getByRole('button', { name: 'Tải thêm nhiệm vụ con', exact: true }).click();
  await expect(page.locator('.child-node')).toHaveCount(120);
  expect(reads).toBe(1);
});

test('notification pagination deduplicates, needs/date/project filters and failed read stay truthful', async ({
  page,
}) => {
  await mockWorkspace(page);
  const row = (id: number) => ({
    id,
    is_read: false,
    kind: 'task',
    targetName: tasks[1].name,
    task: tasks[1],
    message: messages[1],
    href: '/tasks/102?tab=discussion&message=302',
  });
  const requests: string[] = [];
  await page.route('**/api/notifications?**', (route) => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    return route.fulfill({
      json: {
        available: true,
        items: url.searchParams.has('before') ? [row(401), row(400)] : [row(401)],
        nextCursor: url.searchParams.has('before') ? null : 401,
      },
    });
  });
  await page.route('**/api/notifications/401', (route) =>
    route.fulfill({
      status: 502,
      json: { error: { code: 'ODOO_UNAVAILABLE', message: 'Chưa lưu được trạng thái đọc.' } },
    }),
  );
  await page.goto('/notifications');
  await page.getByRole('button', { name: 'Tải thông báo cũ hơn' }).click();
  await expect(page.locator('.notification-list article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Cần xử lý', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cần xử lý', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Thông báo từ ngày').fill('2026-10-22');
  await page.getByRole('combobox', { name: 'Dự án thông báo' }).selectOption('12');
  await page.getByRole('button', { name: 'Đánh dấu đã đọc' }).first().click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Chưa lưu được trạng thái đọc.' }),
  ).toBeVisible();
  await expect(page.locator('.notification-list article').first()).toHaveClass('unread');
  expect(
    requests.some(
      (q) => q.includes('read=unread') && q.includes('kind=task') && q.includes('after='),
    ),
  ).toBe(true);
});

test('Discuss paginated history, URL search and failed send preserve the employee draft', async ({
  page,
}) => {
  await mockWorkspace(page);
  await page.route('**/api/discuss/41?**', (route) => {
    const p = new URL(route.request().url()).searchParams;
    return route.fulfill({
      json: {
        channel: channels[0],
        items: p.get('cursor') === '300' ? [messages[0], messages[1]] : [messages[1]],
        nextCursor: p.get('cursor') === '300' ? null : 300,
      },
    });
  });
  await page.route('**/api/discuss/41/messages', (r) =>
    r.fulfill({
      status: 502,
      json: { error: { code: 'ODOO_UNAVAILABLE', message: 'Chưa gửi được tin nhắn.' } },
    }),
  );
  await page.goto('/discuss/41');
  await page.getByRole('button', { name: 'Tải tin nhắn cũ hơn' }).click();
  await expect(page.locator('.chat-message')).toHaveCount(2);
  await expect(page.locator('.message-header time').first()).toContainText('08:15');
  await page.getByLabel('Tìm trong hội thoại').fill('bản vẽ');
  await expect(page).toHaveURL(/q=/);
  await page.getByLabel('Nội dung tin nhắn Discuss').fill('Nháp chưa gửi');
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Chưa gửi được tin nhắn.' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Tìm trong hội thoại')).toHaveValue('bản vẽ');
  await expect(page.getByLabel('Nội dung tin nhắn Discuss')).toHaveValue('Nháp chưa gửi');
});
