import { test, expect } from '../fixtures/diagnostics';

test.beforeAll(() => {
  if (
    !['127.0.0.1', 'localhost'].includes(
      new URL(process.env.ODOO_URL || 'https://invalid').hostname,
    ) ||
    process.env.ODOO_DB !== 'workspace_test'
  )
    throw new Error('Browser tests require disposable local Odoo.');
});
test('login, unaccented search, cross-project navigation, refresh and back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/login');
  await page.getByLabel('Email hoặc tên đăng nhập').fill('workspace.a@example.test');
  await page.getByLabel('Mật khẩu hoặc API key cá nhân').fill(process.env.LOCAL_TEST_PASSWORD_A!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Chào Anh/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Kiểm tra hồ sơ thiết kế/ }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/desktop-workspace.png', fullPage: true });
  await page.getByRole('link', { name: 'Tìm nhiệm vụ', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Từ khóa tìm nhiệm vụ' })
    .fill('kiem tra ho so thiet ke');
  await page
    .getByRole('option', { name: /Kiểm tra hồ sơ thiết kế/ })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Kiểm tra hồ sơ thiết kế', exact: true }),
  ).toBeVisible();
  const taskUrl = page.url();
  await expect(page.getByRole('navigation', { name: 'Đường dẫn nhiệm vụ' })).toContainText(
    'Nhà máy B',
  );
  await expect(page.getByRole('navigation', { name: 'Đường dẫn nhiệm vụ' })).toContainText(
    'Rà soát hồ sơ',
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Kiểm tra hồ sơ thiết kế', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Đường dẫn nhiệm vụ' })
    .getByRole('link', { name: 'Rà soát hồ sơ' })
    .click();
  await expect(page.getByRole('heading', { name: 'Rà soát hồ sơ', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(taskUrl);
  await expect(
    page.getByRole('heading', { name: 'Kiểm tra hồ sơ thiết kế', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Tài liệu', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Tài liệu nhiệm vụ' })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(errors).toEqual([]);
});
test('mobile layout, theme and keyboard search', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByLabel('Email hoặc tên đăng nhập').fill('workspace.b@example.test');
  await page.getByLabel('Mật khẩu hoặc API key cá nhân').fill(process.env.LOCAL_TEST_PASSWORD_B!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Chào Bảo/ })).toBeVisible();
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await page.getByRole('link', { name: 'Dự án', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Cùng đội ngũ tiến về phía trước' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Chế độ tối' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('combobox', { name: 'Tìm kiếm toàn cục' })).toBeFocused();
  await page.getByRole('combobox', { name: 'Tìm kiếm toàn cục' }).fill('ho so mat');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Chưa có nhiệm vụ phù hợp' })).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-workspace.png', fullPage: true });
});

test('task edits, chatter draft and file upload reach real Odoo', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email hoặc tên đăng nhập').fill('workspace.a@example.test');
  await page.getByLabel('Mật khẩu hoặc API key cá nhân').fill(process.env.LOCAL_TEST_PASSWORD_A!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Chào Anh/ })).toBeVisible();
  await page
    .getByRole('link', { name: /Kiểm tra hồ sơ thiết kế/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  const original = await page.getByRole('textbox', { name: 'Mô tả công việc' }).innerHTML();
  const marker = `Browser acceptance ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Mô tả công việc' }).fill(marker);
  await page.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
  await expect(page.getByText(marker, { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Nội dung trao đổi' }).fill(marker);
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nội dung trao đổi' })).toHaveValue('');
  await page.getByRole('link', { name: 'Tài liệu', exact: true }).last().click();
  await page.getByLabel('Tải tệp đính kèm').setInputFiles({
    name: 'browser-acceptance.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(marker),
  });
  await expect(page.getByRole('link', { name: /browser-acceptance.txt/ }).first()).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true }).click();
  await page.getByRole('textbox', { name: 'Mô tả công việc' }).evaluate((el, html) => {
    el.innerHTML = html;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  }, original);
  await page.getByRole('button', { name: 'Lưu vào Odoo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa nhiệm vụ', exact: true })).toBeVisible();
});
