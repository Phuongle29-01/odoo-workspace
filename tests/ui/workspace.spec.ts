import { test, expect } from '../fixtures/diagnostics';
import AxeBuilder from '@axe-core/playwright';
import { mockWorkspace, views } from '../fixtures/workspace';

test('accentless keyboard search carries cross-project and duplicate-name context', async ({
  page,
}) => {
  await mockWorkspace(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Chào Anh/ })).toBeVisible();
  await page.keyboard.press('Control+k');
  const search = page.getByRole('combobox', { name: 'Tìm kiếm toàn cục' });
  await expect(search).toBeFocused();
  await search.fill('kiem tra ho so');
  const list = page.getByRole('listbox', { name: 'Gợi ý nhiệm vụ' });
  await expect(list).toBeVisible();
  await expect(list.getByRole('option')).toHaveCount(3);
  await expect(list).toContainText('Nhà máy B');
  await expect(list).toContainText('Tòa nhà A');
  await expect(list.locator('mark').first()).toHaveText('Kiểm tra hồ sơ');
  await search.press('ArrowDown');
  await expect(search).toHaveAttribute('aria-activedescendant', 'quick-result-0');
  await search.press('Enter');
  await expect(page).toHaveURL(/\/tasks\/102$/);
  const crumbs = page.getByRole('navigation', { name: 'Đường dẫn nhiệm vụ' });
  await expect(crumbs).toContainText('Nhà máy B');
  await expect(crumbs).toContainText('Rà soát hồ sơ');
});
test('URL filters, persisted employee view, and nested task routes survive refresh and new tab', async ({
  page,
  context,
}) => {
  await mockWorkspace(page);
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Kanban', exact: true }).click();
  await expect(page.locator('.kanban')).toBeVisible();
  await page.reload();
  await expect(page.locator('.kanban')).toBeVisible();
  await page.goto('/my-tasks');
  await expect(page.getByRole('button', { name: 'Kanban', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('combobox', { name: 'Dự án', exact: true }).selectOption('12');
  await expect(page).toHaveURL(/project=12/);
  await expect(page.locator('.kanban-card')).toHaveCount(1);
  await page.goto('/tasks/103');
  const crumbs = page.getByRole('navigation', { name: 'Đường dẫn nhiệm vụ' });
  await expect(crumbs).toContainText('Rà soát hồ sơ');
  await expect(crumbs).toContainText('Kiểm tra hồ sơ thiết kế');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Đối chiếu bản vẽ kết cấu', exact: true }),
  ).toBeVisible();
  const other = await context.newPage();
  await mockWorkspace(other);
  await other.goto('/tasks/103');
  await expect(
    other.getByRole('heading', { name: 'Đối chiếu bản vẽ kết cấu', exact: true }),
  ).toBeVisible();
  await crumbs.getByRole('link', { name: 'Rà soát hồ sơ', exact: true }).click();
  await expect(page).toHaveURL(/\/tasks\/101$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/tasks\/103$/);
});
test('notification read/type filters and exact comment/channel deep links', async ({ page }) => {
  await mockWorkspace(page);
  await page.goto('/notifications?read=unread');
  await expect(page.locator('.notification-list article')).toHaveCount(1);
  await page.getByRole('link', { name: /Kiểm tra hồ sơ thiết kế/ }).click();
  await expect(page).toHaveURL(/message=302/);
  await expect(page.locator('#message-302')).toHaveClass(/highlighted/);
  await page.goto('/notifications?read=unread');
  await page.getByRole('button', { name: 'Đánh dấu đã đọc' }).click();
  await expect(
    page.getByRole('heading', { name: 'Chưa có thông báo liên quan đến nhiệm vụ hoặc hội thoại' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Đã đọc', exact: true }).click();
  await expect(page.locator('.notification-list article')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Loại thông báo' }).selectOption('channel');
  await expect(page.locator('.notification-list article')).toHaveCount(1);
  await page.getByRole('link', { name: /Đội thiết kế/ }).click();
  await expect(page).toHaveURL(/\/discuss\/41\?message=301/);
  await expect(page.locator('#discuss-message-301')).toHaveClass(/highlighted/);
});
test('pane separators support keyboard, saved collapse, and mobile tabs without overflow', async ({
  page,
}) => {
  await mockWorkspace(page);
  await page.goto('/tasks/102');
  const separator = page.getByRole('separator', { name: 'Độ rộng điều hướng' });
  await expect(separator).toHaveAttribute('aria-valuenow', '180');
  await separator.focus();
  await separator.press('ArrowRight');
  await expect(separator).toHaveAttribute('aria-valuenow', '196');
  await page.reload();
  await expect(separator).toHaveAttribute('aria-valuenow', '196');
  await page.getByRole('button', { name: 'Điều hướng', exact: true }).click();
  await expect(separator).toHaveCount(0);
  await page.reload();
  await expect(separator).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('navigation', { name: 'Nội dung nhiệm vụ' })
    .getByRole('link', { name: 'Thảo luận', exact: true })
    .click();
  await expect(page.getByRole('textbox', { name: 'Nội dung trao đổi' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Mở menu' })).toBeFocused();
});
test('offline edit keeps draft, reconnect permits explicit save, and errors never claim success', async ({
  page,
  context,
}) => {
  const state = await mockWorkspace(page);
  await page.goto('/tasks/102');
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  await page.getByRole('textbox', { name: 'Mô tả công việc' }).fill('Bản nháp khi mất mạng');
  await context.setOffline(true);
  await expect(page.getByText(/Đang ngoại tuyến/)).toBeVisible();
  // Fixture routes can fulfill offline requests; force the mutation to fail as a real disconnected network would.
  await page.route('**/api/tasks/102', (r) =>
    r.request().method() === 'PATCH' ? r.abort('internetdisconnected') : r.fallback(),
  );
  await page.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /Không thể kết nối/ })).toBeVisible();
  expect(state.tasks.find((t) => t.id === 102)?.description).not.toContain('Bản nháp khi mất mạng');
  await page.getByRole('button', { name: 'Đóng, giữ bản nháp' }).click();
  await context.setOffline(false);
  await page.reload();
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Mô tả công việc' })).toContainText(
    'Bản nháp khi mất mạng',
  );
  await page.unroute('**/api/tasks/102');
  await page.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
  await expect(page.getByText('Bản nháp khi mất mạng', { exact: true })).toBeVisible();
  expect(state.tasks.find((t) => t.id === 102)?.description).toContain('Bản nháp khi mất mạng');
});
test('search error and loading states, theme persistence', async ({ page }) => {
  await mockWorkspace(page);
  await page.route('**/api/tasks?**', async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await r.fulfill({
      status: 502,
      json: { error: { code: 'ODOO_UNAVAILABLE', message: 'Kết nối Odoo đang gián đoạn.' } },
    });
  });
  await page.goto('/search?q=kiem');
  await expect(page.getByRole('status', { name: 'Đang tải dữ liệu' })).toBeVisible();
  await expect(page.getByText('Kết nối Odoo đang gián đoạn.')).toBeVisible();
  await page.getByRole('button', { name: 'Chế độ tối' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
for (const view of views) {
  test(`WCAG A/AA automated checks: ${view.name}`, async ({ page }) => {
    await mockWorkspace(page);
    await page.goto(view.url);
    await expect(page.getByRole('heading', { name: view.ready, exact: true })).toBeVisible();
    await expect(page.locator('.skeleton')).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    if (view.name !== 'login')
      await expect(page.locator('#workspace-sidebar')).toHaveAttribute('inert', '');
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      const mobile = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(mobile.violations, `mobile ${theme}`).toEqual([]);
    }
  });
}

test('rich editor formatting, safe saved HTML, and explicit draft discard', async ({ page }) => {
  const state = await mockWorkspace(page);
  await page.goto('/tasks/102');
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Mô tả công việc' });
  await editor.fill('Nội dung định dạng');
  await editor.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'In đậm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'In đậm', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
  await expect(page.locator('.task-main .rich-text strong')).toHaveText('Nội dung định dạng');
  expect(state.tasks.find((t) => t.id === 102)?.description).toContain('<strong>');
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  await editor.fill('Bỏ nội dung này');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Bỏ bản nháp' }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  await expect(editor).toContainText('Nội dung định dạng');
  await expect(editor).not.toContainText('Bỏ nội dung này');
});
