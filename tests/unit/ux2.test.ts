import { describe, it, expect, vi } from 'vitest';
import { previewType } from '../../src/server/preview';
import { withRpcMetrics, observeRpc, rpcTiming } from '../../src/server/rpc-metrics';
import { taskList } from '../../src/server/workspace';
import type { Odoo } from '../../src/server/odoo';

describe('document preview boundary', () => {
  it('recognizes bytes independently of a filename or declared MIME', () => {
    expect(previewType(Buffer.from('%PDF-1.7\n'))).toBe('application/pdf');
    expect(previewType(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
    expect(previewType(Uint8Array.from([255, 216, 255]))).toBe('image/jpeg');
    expect(previewType(Buffer.from('GIF89a'))).toBe('image/gif');
    expect(previewType(Buffer.from('RIFF1234WEBP'))).toBe('image/webp');
  });
  it('rejects HTML, SVG, empty and oversized files', () => {
    for (const bytes of [
      Buffer.from('<svg onload="evil()"/>'),
      Buffer.from('<html>'),
      Buffer.alloc(0),
    ])
      expect(() => previewType(bytes)).toThrow('chỉ hỗ trợ tải xuống');
    expect(() => previewType(Buffer.alloc(5 * 1024 * 1024 + 1))).toThrow('5 MB');
  });
});
it('RPC metrics remain isolated across simultaneous requests and count rejected calls', async () => {
  const results = await Promise.all(
    [1, 3].map((count) =>
      withRpcMetrics(async () => {
        await Promise.all(
          Array.from({ length: count }, () => observeRpc(async () => Promise.resolve())),
        );
        try {
          await observeRpc(async () => {
            throw new Error('test');
          });
        } catch {}
        return rpcTiming();
      }),
    ),
  );
  expect(results[0]).toContain('"2 RPC"');
  expect(results[1]).toContain('"4 RPC"');
  expect(rpcTiming()).toBeUndefined();
});
it('indexed task search escapes wildcards and keeps employee filters in the ORM domain', async () => {
  const search = vi.fn().mockResolvedValue([]);
  const odoo = {
    fields: vi.fn().mockResolvedValue({ workspace_search_name: {}, project_id: {} }),
    search,
  } as unknown as Odoo;
  const result = await taskList(odoo, new URLSearchParams('q=HỒ%25_&project=12'), 6);
  expect(result.mode).toBe('indexed-orm');
  expect(search.mock.calls[1][1]).toEqual([
    ['project_id', '=', 12],
    ['workspace_search_name', 'ilike', 'ho\\%\\_'],
  ]);
});
it('description search uses bounded continuation even when the optional index exists', async () => {
  const search = vi
    .fn()
    .mockImplementation(async (_model, _domain, _fields, _limit, offset) =>
      Array.from({ length: 100 }, (_, i) => ({
        id: offset + i + 1,
        name: 'ordinary',
        description: 'nothing',
      })),
    );
  const odoo = {
    fields: vi.fn().mockResolvedValue({ workspace_search_name: {}, description: {} }),
    search,
  } as unknown as Odoo;
  const result = await taskList(odoo, new URLSearchParams('q=absent&description=true'), 6);
  expect(result.items).toEqual([]);
  expect(result.nextCursor).toBe(1000);
  expect(result.scanLimited).toBe(true);
  expect(search).toHaveBeenCalledTimes(10);
});
