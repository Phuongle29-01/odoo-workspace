import { AppError } from './errors';

export function config() {
  const raw = process.env.ODOO_URL;
  if (!raw || !process.env.ODOO_DB)
    throw new AppError(503, 'NOT_CONFIGURED', 'Quản trị viên chưa cấu hình URL và database Odoo.');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError(503, 'CONFIG_ERROR', 'URL Odoo không hợp lệ.');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new AppError(
      503,
      'CONFIG_ERROR',
      'ODOO_URL phải là địa chỉ gốc, không chứa thông tin đăng nhập hoặc đường dẫn.',
    );
  }
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && process.env.ODOO_ALLOW_HTTP === 'true')
  ) {
    throw new AppError(
      503,
      'HTTPS_REQUIRED',
      'Kết nối Odoo yêu cầu HTTPS. HTTP chỉ được bật rõ ràng cho môi trường test riêng.',
    );
  }
  const key = process.env.ENCRYPTION_KEY || '';
  const publicUrl = new URL(process.env.ODOO_PUBLIC_URL || url.origin);
  if (
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.pathname !== '/' ||
    !(
      publicUrl.protocol === 'https:' ||
      (publicUrl.protocol === 'http:' && process.env.ODOO_ALLOW_HTTP === 'true')
    )
  ) {
    throw new AppError(
      503,
      'CONFIG_ERROR',
      'ODOO_PUBLIC_URL phải là URL gốc hợp lệ, không chứa thông tin đăng nhập.',
    );
  }
  if (!/^[0-9a-f]{64}$/i.test(key))
    throw new AppError(503, 'CONFIG_ERROR', 'Chưa cấu hình khóa mã hóa phiên hợp lệ.');
  return {
    url: url.origin,
    publicUrl: publicUrl.origin,
    db: process.env.ODOO_DB!,
    key,
    origin: process.env.APP_ORIGIN || 'http://localhost:3000',
    write: process.env.ODOO_WRITE_ENABLED === 'true',
    authMode: process.env.ODOO_AUTH_MODE === 'api_key' ? 'api_key' : 'password',
    hosting: process.env.ODOO_HOSTING || 'unknown',
  };
}
