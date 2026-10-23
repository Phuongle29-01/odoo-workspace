import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { randomUUID } from 'node:crypto';
import { config } from './config';
import { AppError } from './errors';
export async function endpoint(run: () => Promise<unknown>) {
  const requestId = randomUUID();
  try {
    return NextResponse.json(await run(), {
      headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId },
    });
  } catch (e) {
    const err =
      e instanceof AppError
        ? e
        : e instanceof ZodError
          ? new AppError(400, 'INVALID_INPUT', 'Thông tin gửi lên không hợp lệ.')
          : new AppError(
              503,
              'SERVICE_UNAVAILABLE',
              'Dịch vụ tạm thời không sẵn sàng. Vui lòng thử lại.',
            );
    // Never log RPC arguments, credentials, database URLs or upstream tracebacks.
    console.error(JSON.stringify({ requestId, code: err.code, status: err.status }));
    return NextResponse.json(
      { error: { code: err.code, message: err.message, requestId } },
      { status: err.status, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } },
    );
  }
}
export function csrf(request: Request) {
  if (
    request.headers.get('origin') !== config().origin ||
    request.headers.get('x-workspace-request') !== '1'
  ) {
    throw new AppError(403, 'CSRF', 'Yêu cầu không hợp lệ. Hãy tải lại trang và thử lại.');
  }
}
export async function body(request: Request, maxBytes = 32768) {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new AppError(415, 'CONTENT_TYPE', 'Yêu cầu phải dùng JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, 'INVALID_INPUT', 'Thiếu nội dung yêu cầu.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new AppError(413, 'BODY_TOO_LARGE', 'Nội dung vượt quá giới hạn.');
    }
    chunks.push(part.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AppError(400, 'INVALID_JSON', 'JSON không hợp lệ.');
  }
}
export function requireWrites() {
  if (!config().write)
    throw new AppError(
      403,
      'READ_ONLY',
      'Môi trường đang ở chế độ chỉ đọc. Quản trị viên cần cho phép ghi sau khi xác nhận đúng môi trường Odoo.',
    );
}
export function positiveId(value: unknown) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new AppError(400, 'INVALID_ID', 'ID không hợp lệ.');
  return n;
}
