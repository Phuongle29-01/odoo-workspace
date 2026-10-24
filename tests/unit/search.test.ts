import { describe, it, expect, vi, afterEach } from 'vitest';
import { highlightRanges, normalizeText } from '../../src/lib/search';
import { taskDomain } from '../../src/server/workspace';
import { Odoo, type Fields } from '../../src/server/odoo';
const metadata = {
  state: {
    string: 'State',
    type: 'selection',
    selection: [
      ['01_in_progress', 'Đang làm'],
      ['1_done', 'Xong'],
      ['1_canceled', 'Hủy'],
    ],
  },
  date_deadline: { string: 'Deadline', type: 'date' },
} as Fields;
afterEach(() => vi.useRealTimers());
describe('Vietnamese search highlighting', () => {
  it('finds accentless partial matches and preserves original glyphs', () => {
    const text = 'Đối chiếu hồ sơ, kiểm tra HỒ SƠ';
    expect(highlightRanges(text, 'ho so').map(([a, b]) => text.slice(a, b))).toEqual([
      'hồ sơ',
      'HỒ SƠ',
    ]);
    expect(normalizeText('ĐƯỜNG dẫn')).toBe('duong dan');
  });
  it('does not split decomposed accents or emoji graphemes', () => {
    const text = '📐 Hồ sơ';
    const ranges = highlightRanges(text, 'ho so');
    expect(ranges).toEqual([[3, text.length]]);
    expect(text.slice(...ranges[0])).toBe('Hồ sơ');
    expect(highlightRanges(text, '')).toEqual([]);
    expect(highlightRanges(text, 'absent')).toEqual([]);
  });
});
describe('task filter boundaries', () => {
  it('uses the employee timezone for overdue and excludes terminal states', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T18:00:00Z'));
    const odoo = { read: vi.fn().mockResolvedValue({ tz: 'Asia/Ho_Chi_Minh' }) } as unknown as Odoo;
    const domain = await taskDomain(
      odoo,
      new URLSearchParams('mine=true&overdue=true&assignee=7'),
      6,
      metadata,
    );
    expect(domain).toContainEqual(['date_deadline', '<', '2026-10-23']);
    expect(domain).toContainEqual(['user_ids', 'in', [6]]);
    expect(domain).toContainEqual(['user_ids', 'in', [7]]);
    expect(domain).toContainEqual(['state', 'not in', ['1_done', '1_canceled']]);
  });
  it('rejects invalid relations and states before querying Odoo', async () => {
    const odoo = {} as Odoo;
    for (const query of ['project=-1', 'stage=bad', 'assignee=0', 'state=admin'])
      await expect(taskDomain(odoo, new URLSearchParams(query), 6, metadata)).rejects.toThrow();
  });
});
