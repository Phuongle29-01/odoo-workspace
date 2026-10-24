import { test, expect } from '../fixtures/diagnostics';
import { randomUUID } from 'node:crypto';
import { authenticate, Odoo } from '../../src/server/odoo';
import { testPdf, testPng } from '../fixtures/documents';

test('real Odoo: 1100-task fallback continuation, focus/Back and safe PDF/image reader', async ({
  page,
}) => {
  test.setTimeout(120000);
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
  const marker = `UX2 browser ${randomUUID()}`;
  const project = await admin.call<number>('project.project', 'create', [
    { name: marker, privacy_visibility: 'employees' },
  ]);
  const created: number[] = [];
  try {
    for (let start = 0; start < 1100; start += 50)
      created.push(
        ...(await admin.call<number[]>(
          'project.task',
          'create',
          [
            Array.from({ length: 50 }, (_, i) => ({
              name: start + i === 1099 ? 'Đường dẫn đích UX2' : `Ordinary ${start + i}`,
              project_id: project,
            })),
          ],
          { context: { tracking_disable: true, mail_create_nosubscribe: true } },
        )),
      );
    const target = created.at(-1)!;
    await admin.call('ir.attachment', 'create', [
      [
        {
          name: 'Real-demo.pdf',
          datas: testPdf().toString('base64'),
          res_model: 'project.task',
          res_id: target,
          mimetype: 'application/pdf',
        },
        {
          name: 'Real-demo.png',
          datas: testPng.toString('base64'),
          res_model: 'project.task',
          res_id: target,
          mimetype: 'image/png',
        },
      ],
    ]);
    await page.goto('/login');
    await page.getByLabel('Email hoặc tên đăng nhập').fill('workspace.a@example.test');
    await page.getByLabel('Mật khẩu hoặc API key cá nhân').fill(process.env.LOCAL_TEST_PASSWORD_A!);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Chào Anh/ })).toBeVisible();
    await page.goto(`/search?q=duong%20dan%20dich&project=${project}&description=true`);
    await expect(page.getByRole('heading', { name: 'Chưa thấy trong phần đã tìm' })).toBeVisible();
    await page.getByRole('button', { name: 'Tìm tiếp', exact: true }).click();
    await expect(
      page.getByRole('listbox', { name: 'Kết quả tìm kiếm' }).getByRole('option'),
    ).toHaveCount(1);
    await page.getByRole('option', { name: /Đường dẫn đích UX2/ }).click();
    await expect(page).toHaveURL(new RegExp(`/tasks/${target}\\?focus=1`));
    await expect(page.getByRole('button', { name: 'Toàn bộ bối cảnh' })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/pages=2/);
    await expect(page.getByRole('combobox', { name: 'Dự án', exact: true })).toHaveValue(
      String(project),
    );
    await expect(page.getByRole('option', { name: /Đường dẫn đích UX2/ })).toBeVisible();
    await page.reload();
    await page.getByRole('option', { name: /Đường dẫn đích UX2/ }).click();
    await page
      .getByRole('navigation', { name: 'Nội dung nhiệm vụ' })
      .getByRole('link', { name: 'Tài liệu', exact: true })
      .click();
    await page.getByRole('button', { name: 'Xem trước Real-demo.pdf', exact: true }).click();
    await expect(page.getByText('Trang 1 / 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Đang hiển thị PDF…')).toHaveCount(0);
    expect(
      await page
        .locator('.pdf-canvas')
        .evaluate((el: HTMLCanvasElement) => el.width > 0 && el.height > 0),
    ).toBe(true);
    await page.screenshot({ path: 'test-results/ux2-real-pdf.png', fullPage: true });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Xem trước Real-demo.png', exact: true }).click();
    await expect(page.getByRole('img', { name: 'Xem trước Real-demo.png' })).toBeVisible();
    await page.screenshot({ path: 'test-results/ux2-real-mobile-image.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    if (created.length) await admin.call('project.task', 'unlink', [created]);
    await admin.call('project.project', 'unlink', [[project]]);
  }
});
