import { AppError, denied } from './errors';
import { type Odoo, selectFields } from './odoo';
import { cleanHtml } from './workspace';

export async function channels(odoo: Odoo) {
  try {
    const meta = await odoo.fields('discuss.channel');
    if (!meta.is_member || !meta.channel_type)
      return {
        available: false,
        items: [],
        reason: 'Metadata Discuss chưa tương thích. Hãy dùng Odoo gốc.',
      };
    const items = await odoo.search(
      'discuss.channel',
      [['is_member', '=', true]],
      selectFields(meta, ['name', 'channel_type', 'is_member', 'member_count']),
      100,
      0,
      'id desc',
    );
    return { available: true, items };
  } catch (error) {
    if (error instanceof AppError && error.status === 403)
      return {
        available: false,
        items: [],
        reason: 'Odoo không cho phép đọc Discuss qua API bằng tài khoản này.',
      };
    throw error;
  }
}
export async function requireChannel(odoo: Odoo, id: number) {
  const channel = await odoo.read('discuss.channel', id, ['name', 'channel_type', 'is_member']);
  if (!channel.is_member)
    throw denied('Bạn chưa tham gia hội thoại này. Hãy quản lý thành viên trong Odoo gốc.');
  return channel;
}
export async function channelMessages(
  odoo: Odoo,
  id: number,
  cursor: number,
  query: string,
  focusId?: number,
) {
  const channel = await requireChannel(odoo, id);
  const domain: unknown[] = [
    ['model', '=', 'discuss.channel'],
    ['res_id', '=', id],
  ];
  if (cursor) domain.push(['id', '<', cursor]);
  if (query) domain.push(['body', 'ilike', query]);
  const items = await odoo.search(
    'mail.message',
    domain,
    ['body', 'author_id', 'date', 'message_type', 'attachment_ids'],
    51,
    0,
    'id desc',
  );
  let focused = null;
  if (focusId) {
    const row = await odoo.read('mail.message', focusId, [
      'body',
      'author_id',
      'date',
      'model',
      'res_id',
      'attachment_ids',
    ]);
    if (row.model !== 'discuss.channel' || row.res_id !== id) throw denied();
    focused = { ...row, body: cleanHtml(row.body) };
  }
  return {
    channel,
    items: items.slice(0, 50).map((row) => ({ ...row, body: cleanHtml(row.body) })),
    nextCursor: items.length > 50 ? items[49].id : null,
    focused,
  };
}
