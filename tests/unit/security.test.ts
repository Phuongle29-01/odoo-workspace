import { describe, it, expect, afterEach } from 'vitest';
import { encrypt, decrypt } from '../../src/server/crypto';
import { normalize, cleanHtml, editTaskSchema } from '../../src/server/workspace';
import { config } from '../../src/server/config';
import { csrf } from '../../src/server/http';

const previous = { ...process.env };
afterEach(() => {
  process.env = { ...previous };
});
function env() {
  process.env.ODOO_URL = 'https://odoo.example.test';
  process.env.ODOO_DB = 'staging';
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.APP_ORIGIN = 'https://workspace.example.test';
}
describe('credentials and request boundaries', () => {
  it('encrypts with fresh nonces and binds ciphertext to the user and instance', () => {
    const key = 'a'.repeat(64),
      secret = 'private-value-not-in-browser';
    const a = encrypt(secret, key, 'instance:1'),
      b = encrypt(secret, key, 'instance:1');
    expect(a).not.toBe(b);
    expect(a).not.toContain(secret);
    expect(decrypt(a, key, 'instance:1')).toBe(secret);
    expect(() => decrypt(a, key, 'instance:2')).toThrow();
    const bytes = Buffer.from(a, 'base64');
    bytes[31] ^= 1;
    expect(() => decrypt(bytes.toString('base64'), key, 'instance:1')).toThrow();
  });
  it('rejects HTTP, embedded credentials and arbitrary URL paths by default', () => {
    env();
    expect(config().write).toBe(false);
    for (const url of [
      'http://odoo.example.test',
      'https://user:pass@odoo.example.test',
      'https://odoo.example.test/web#action=1',
      'file:///etc/passwd',
    ]) {
      process.env.ODOO_URL = url;
      expect(() => config()).toThrow();
    }
  });
  it('requires both exact origin and non-simple header on mutations', () => {
    env();
    expect(() =>
      csrf(
        new Request('https://workspace.example.test/api/tasks', {
          method: 'POST',
          headers: { origin: 'https://evil.test', 'x-workspace-request': '1' },
        }),
      ),
    ).toThrow();
    expect(() =>
      csrf(
        new Request('https://workspace.example.test/api/tasks', {
          method: 'POST',
          headers: { origin: 'https://workspace.example.test' },
        }),
      ),
    ).toThrow();
    expect(() =>
      csrf(
        new Request('https://workspace.example.test/api/tasks', {
          method: 'POST',
          headers: { origin: 'https://workspace.example.test', 'x-workspace-request': '1' },
        }),
      ),
    ).not.toThrow();
  });
});
describe('Odoo content and search', () => {
  it('matches Vietnamese accents and đ consistently across case and whitespace', () => {
    expect(normalize('  KIỂM TRA HỒ SƠ  ')).toBe('kiem tra ho so');
    expect(normalize('Đối chiếu THIẾT KẾ')).toBe('doi chieu thiet ke');
    expect(normalize('<p>Kiểm tra hồ sơ</p>')).toBe('kiem tra ho so');
  });
  it('removes active HTML, event handlers, CSS and unsafe links from Odoo HTML', () => {
    const html = cleanHtml(
      '<script>alert(1)</script><img src=x onerror=alert(1)><p style="display:none" onclick="alert(1)">Text</p><a href="javascript:alert(1)">click</a><iframe src="https://evil.test"></iframe>',
    );
    expect(html).not.toMatch(/script|onerror|onclick|style=|iframe|javascript:/);
    expect(html).toContain('<p>Text</p>');
  });
  it('rejects unknown write fields and invalid dates or relations', () => {
    expect(
      editTaskSchema.safeParse({ expectedRevision: 'r', values: { name: 'test', project_id: 1 } })
        .success,
    ).toBe(false);
    expect(
      editTaskSchema.safeParse({ expectedRevision: 'r', values: { date_deadline: '2026-99-99' } })
        .success,
    ).toBe(false);
    expect(
      editTaskSchema.safeParse({ expectedRevision: 'r', values: { user_ids: [-1] } }).success,
    ).toBe(false);
  });
});
