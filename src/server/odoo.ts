import xmlrpc from 'xmlrpc';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { getProxyForUrl } from 'proxy-from-env';
import { AppError } from './errors';
import { config } from './config';
import { observeRpc } from './rpc-metrics';

export type Credentials = { uid: number; password: string };
export type Relation = [number, string] | false;
export type RecordData = Record<string, unknown> & { id: number; name?: string };
export type Field = {
  string: string;
  type: string;
  readonly?: boolean;
  selection?: [string, string][];
  relation?: string;
};
export type Fields = Record<string, Field>;

export function rpc(
  service: 'common' | 'object',
  method: string,
  args: unknown[],
): Promise<unknown> {
  const url = new URL(`/xmlrpc/2/${service}`, config().url);
  const local = ['127.0.0.1', 'localhost', 'odoo'].includes(url.hostname);
  const proxy = local ? '' : getProxyForUrl(url.href);
  const agent = proxy
    ? url.protocol === 'https:'
      ? new HttpsProxyAgent(proxy)
      : new HttpProxyAgent(proxy)
    : undefined;
  const options = {
    host: url.hostname,
    port: Number(url.port) || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    agent,
    signal: AbortSignal.timeout(15000),
  };
  const client =
    url.protocol === 'https:' ? xmlrpc.createSecureClient(options) : xmlrpc.createClient(options);
  return observeRpc(
    () =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(
              new AppError(
                504,
                'ODOO_TIMEOUT',
                'Odoo chưa phản hồi. Nếu vừa gửi thay đổi, hãy tải lại dữ liệu trước khi thử lại.',
              ),
            ),
          17000,
        );
        client.methodCall(method, args, (error, value) => {
          clearTimeout(timer);
          if (error) {
            const fault = error as {
              message?: string;
              faultCode?: number;
              faultString?: string;
              code?: string;
            };
            if (fault.code === 'ABORT_ERR')
              return reject(
                new AppError(
                  504,
                  'ODOO_TIMEOUT',
                  'Odoo chưa phản hồi. Hãy kiểm tra dữ liệu trước khi gửi lại thao tác ghi.',
                ),
              );
            const text = `${fault.message || ''} ${fault.faultString || ''}`;
            // Odoo 17's /xmlrpc/2 endpoints use numeric codes and human-readable fault strings.
            if (
              fault.faultCode === 3 ||
              fault.faultCode === 4 ||
              /AccessError|AccessDenied/.test(text)
            )
              return reject(
                new AppError(
                  403,
                  'ACCESS_DENIED',
                  'Odoo từ chối truy cập. Kiểm tra quyền hoặc đăng nhập lại.',
                ),
              );
            if (/MissingError/.test(text))
              return reject(
                new AppError(
                  404,
                  'NOT_FOUND',
                  'Bản ghi không còn tồn tại hoặc bạn không còn quyền xem.',
                ),
              );
            if (/WORKSPACE_CONFLICT/.test(text))
              return reject(
                new AppError(
                  409,
                  'CONFLICT',
                  'Nhiệm vụ đã được người khác sửa. Tải lại trước khi lưu.',
                ),
              );
            if (fault.faultCode === 2 || /ValidationError|UserError/.test(text))
              return reject(
                new AppError(
                  422,
                  'ODOO_VALIDATION',
                  'Odoo không chấp nhận thao tác. Kiểm tra các giá trị, quan hệ và quyền.',
                ),
              );
            return reject(
              new AppError(
                502,
                'ODOO_UNAVAILABLE',
                'Không thể hoàn tất yêu cầu với Odoo. Kiểm tra kết nối và cấu hình API.',
              ),
            );
          }
          resolve(value);
        });
      }),
  );
}

export class Odoo {
  private metadata = new Map<string, Promise<Fields>>();
  constructor(public credentials: Credentials) {}
  async call<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    return (await rpc('object', 'execute_kw', [
      config().db,
      this.credentials.uid,
      this.credentials.password,
      model,
      method,
      args,
      kwargs,
    ])) as T;
  }
  fields(model: string) {
    let pending = this.metadata.get(model);
    if (!pending) {
      pending = this.call<Fields>(model, 'fields_get', [], {
        attributes: ['string', 'type', 'readonly', 'selection', 'relation'],
      }).catch((error) => {
        this.metadata.delete(model);
        throw error;
      });
      this.metadata.set(model, pending);
    }
    return pending;
  }
  async search(
    model: string,
    domain: unknown[],
    fields: string[],
    limit = 40,
    offset = 0,
    order = 'id desc',
  ) {
    return this.call<RecordData[]>(model, 'search_read', [domain], {
      fields,
      limit,
      offset,
      order,
    });
  }
  async read(model: string, id: number, fields: string[]) {
    const rows = await this.call<RecordData[]>(model, 'read', [[id]], { fields });
    if (!rows.length)
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy bản ghi hoặc không có quyền truy cập.');
    return rows[0];
  }
  async requireRecord(model: string, id: number) {
    return this.read(model, id, ['id']);
  }
  async version() {
    const value = (await rpc('common', 'version', [])) as {
      server_version: string;
      server_version_info: unknown[];
    };
    if (Number(value.server_version_info?.[0]) !== 17)
      throw new AppError(409, 'VERSION_MISMATCH', 'Ứng dụng này yêu cầu Odoo 17.');
    return value;
  }
}
export async function authenticate(login: string, password: string) {
  await new Odoo({ uid: 0, password: '' }).version();
  const uid = await rpc('common', 'authenticate', [config().db, login, password, {}]);
  if (typeof uid !== 'number' || uid < 1)
    throw new AppError(
      401,
      'INVALID_LOGIN',
      'Đăng nhập không thành công. Kiểm tra tài khoản, mật khẩu/API key và database.',
    );
  return uid;
}
export function selectFields(metadata: Fields, desired: string[]) {
  return desired.filter((f) => f in metadata);
}
export const relationId = (value: unknown): number | null =>
  Array.isArray(value) && typeof value[0] === 'number' ? value[0] : null;
