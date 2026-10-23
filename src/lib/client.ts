'use client';
import { useQuery } from '@tanstack/react-query';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const pendingKeys = new Map<string, string>();
export function clearClientState() {
  pendingKeys.clear();
  for (const key of Object.keys(sessionStorage))
    if (key.startsWith('workspace-draft:')) sessionStorage.removeItem(key);
}
export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      ...options,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-Request': '1',
        ...options.headers,
      },
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(
      0,
      'OFFLINE',
      'Không thể kết nối. Bản nháp vẫn được giữ; kiểm tra mạng rồi thử lại.',
    );
  }
  const data = await res.json();
  if (!res.ok)
    throw new ApiError(
      res.status,
      data.error?.code || 'ERROR',
      data.error?.message || 'Không thể hoàn tất yêu cầu.',
    );
  return data;
}
export async function write<T = unknown>(path: string, data: unknown, method = 'POST'): Promise<T> {
  const fingerprint = `${method}:${path}:${JSON.stringify(data)}`;
  const key = pendingKeys.get(fingerprint) || crypto.randomUUID();
  pendingKeys.set(fingerprint, key);
  const result = await api<T>(path, {
    method,
    body: JSON.stringify(data),
    headers: { 'Idempotency-Key': key },
  });
  pendingKeys.delete(fingerprint);
  return result;
}
export function useData<T>(path: string, enabled = true, interval: number | false = 30000) {
  return useQuery<T, ApiError>({
    queryKey: [path],
    queryFn: ({ signal }) => api<T>(path, { signal }),
    enabled,
    retry: false,
    staleTime: 0,
    refetchInterval: interval,
    refetchOnWindowFocus: true,
  });
}
export type Row = { id: number; name?: string; [key: string]: unknown };
export const label = (value: unknown) =>
  Array.isArray(value) ? String(value[1]) : typeof value === 'string' ? value : '';
export const rid = (value: unknown) => (Array.isArray(value) ? Number(value[0]) : null);
export const dateLabel = (value: unknown) =>
  typeof value === 'string' && value
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(
        new Date(
          value.includes('T')
            ? value
            : value.replace(' ', 'T') + (value.length > 10 ? 'Z' : 'T00:00:00Z'),
        ),
      )
    : 'Chưa đặt hạn';
