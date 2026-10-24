import sanitize from 'sanitize-html';
import { z } from 'zod';
import { AppError, denied } from './errors';
import { Odoo, relationId, selectFields, type RecordData, type Fields } from './odoo';
import { config } from './config';
import { pool } from './db';

export const cleanHtml = (value: unknown) =>
  sanitize(typeof value === 'string' ? value : '', {
    allowedTags: [
      'p',
      'br',
      'b',
      'strong',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'h2',
      'h3',
      'a',
    ],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
export const plainText = (value: unknown) =>
  sanitize(typeof value === 'string' ? value : '', { allowedTags: [], allowedAttributes: {} });
export const normalize = (value: string) =>
  plainText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
    .trim();
const taskFields = [
  'id',
  'name',
  'project_id',
  'parent_id',
  'stage_id',
  'state',
  'user_ids',
  'date_deadline',
  'priority',
  'description',
  'write_date',
  'workspace_revision',
  'child_ids',
];

export async function taskDomain(
  odoo: Odoo,
  params: URLSearchParams,
  uid: number,
  metadata: Fields,
) {
  const domain: unknown[] = [];
  if (params.get('project'))
    domain.push([
      'project_id',
      '=',
      z.coerce.number().int().positive().parse(params.get('project')),
    ]);
  if (params.get('stage'))
    domain.push(['stage_id', '=', z.coerce.number().int().positive().parse(params.get('stage'))]);
  if (params.get('mine') === 'true') domain.push(['user_ids', 'in', [uid]]);
  if (params.get('assignee'))
    domain.push([
      'user_ids',
      'in',
      [z.coerce.number().int().positive().parse(params.get('assignee'))],
    ]);
  if (params.get('state')) {
    const state = z.string().max(80).parse(params.get('state'));
    if (!metadata.state?.selection?.some(([key]) => key === state))
      throw new AppError(400, 'INVALID_STATE', 'Trạng thái không có trong cấu hình Odoo.');
    domain.push(['state', '=', state]);
  }
  if (params.get('open') === 'true') {
    const closed =
      metadata.state?.selection
        ?.map(([v]) => v)
        .filter((v) => ['1_done', '1_canceled'].includes(v)) || [];
    if (closed.length) domain.push(['state', 'not in', closed]);
  }
  if (params.get('overdue') === 'true') {
    if (!metadata.date_deadline)
      throw new AppError(400, 'UNSUPPORTED_FILTER', 'Odoo không có trường hạn nhiệm vụ.');
    const user = await odoo.read('res.users', uid, ['tz']);
    let today: string;
    try {
      today = new Intl.DateTimeFormat('en-CA', {
        timeZone: typeof user.tz === 'string' ? user.tz : 'Asia/Ho_Chi_Minh',
      }).format(new Date());
    } catch {
      today = new Date().toISOString().slice(0, 10);
    }
    domain.push(['date_deadline', '<', today]);
    const closed =
      metadata.state?.selection
        ?.map(([v]) => v)
        .filter((v) => ['1_done', '1_canceled'].includes(v)) || [];
    if (closed.length) domain.push(['state', 'not in', closed]);
  }
  return domain;
}
export async function decorateTasks(odoo: Odoo, rows: RecordData[], metadata: Fields) {
  const ids = [
    ...new Set(rows.flatMap((r) => (Array.isArray(r.user_ids) ? (r.user_ids as number[]) : []))),
  ];
  let users: RecordData[] = [];
  if (ids.length)
    try {
      users = await odoo.search('res.users', [['id', 'in', ids]], ['name'], 200);
    } catch (e) {
      if (!(e instanceof AppError && e.status === 403)) throw e;
    }
  return rows.map((row) => ({
    ...row,
    stateLabel: metadata.state?.selection?.find(([key]) => key === row.state)?.[1] || '',
    assignees: ((row.user_ids as number[]) || []).map((id) => ({
      id,
      name: users.find((u) => u.id === id)?.name || `Nhân viên #${id}`,
    })),
  }));
}
export async function taskOptions(odoo: Odoo) {
  const fields = await odoo.fields('project.task');
  const [projects, stages, users] = await Promise.all([
    odoo.search('project.project', [], ['name'], 100, 0, 'name'),
    odoo.search('project.task.type', [], ['name'], 100, 0, 'sequence,id'),
    odoo.search('res.users', [['share', '=', false]], ['name'], 200, 0, 'name').catch((e) => {
      if (e instanceof AppError && e.status === 403) return [];
      throw e;
    }),
  ]);
  return { projects, stages, users, states: fields.state?.selection || [] };
}
export async function taskList(odoo: Odoo, params: URLSearchParams, uid: number) {
  const metadata = await odoo.fields('project.task');
  const fields = selectFields(
    metadata,
    taskFields.filter((f) => f !== 'description' && f !== 'child_ids'),
  );
  const domain = await taskDomain(odoo, params, uid, metadata);
  const cursor = z.coerce
    .number()
    .int()
    .min(0)
    .max(1000000)
    .parse(params.get('cursor') || 0);
  const query = (params.get('q') || '').trim();
  if (query.length > 160) throw new AppError(400, 'QUERY_TOO_LONG', 'Từ khóa tối đa 160 ký tự.');
  if (!query) {
    const order =
      params.get('sort') === 'updated'
        ? 'write_date desc,id desc'
        : params.get('sort') === 'deadline'
          ? 'date_deadline asc,id desc'
          : 'id desc';
    const rows = await odoo.search('project.task', domain, fields, 41, cursor, order);
    return {
      items: await decorateTasks(odoo, rows.slice(0, 40), metadata),
      nextCursor: rows.length > 40 ? cursor + 40 : null,
      mode: 'orm',
      scanLimited: false,
    };
  }
  // Optional Odoo addon: indexed normalized names, with every search still under this UID's ORM rules.
  if (metadata.workspace_search_name && params.get('description') !== 'true') {
    const projectMeta = await odoo.fields('project.project');
    if (projectMeta.workspace_search_name) {
      const needle = normalize(query).replace(/[\\%_]/g, '\\$&');
      const projects = await odoo.search(
        'project.project',
        [['workspace_search_name', 'ilike', needle]],
        ['id'],
        1001,
      );
      // Keep the bounded live scan if the project-name expansion would be incomplete.
      if (projects.length <= 1000) {
        const alternatives: unknown[] = [['workspace_search_name', 'ilike', needle]];
        if (projects.length) alternatives.push(['project_id', 'in', projects.map((p) => p.id)]);
        if (/^\d+$/.test(query) && Number.isSafeInteger(Number(query)))
          alternatives.push(['id', '=', Number(query)]);
        const combined = [...domain, ...Array(alternatives.length - 1).fill('|'), ...alternatives];
        const rows = await odoo.search('project.task', combined, fields, 41, cursor, 'id asc');
        return {
          items: await decorateTasks(odoo, rows.slice(0, 40), metadata),
          nextCursor: rows.length > 40 ? cursor + 40 : null,
          mode: 'indexed-orm',
          scanLimited: false,
        };
      }
    }
  }
  // Per-user live ORM scan: accent-independent matching without a shared permission cache.
  // A bounded scan returns an explicit continuation, never a false complete result set.
  const descriptions = params.get('description') === 'true';
  const q = normalize(query);
  const found: RecordData[] = [];
  let offset = cursor;
  let exhausted = false;
  let scanned = 0;
  while (scanned < 1000 && found.length < 40) {
    const rows = await odoo.search(
      'project.task',
      domain,
      [...fields, ...(descriptions && metadata.description ? ['description'] : [])],
      100,
      offset,
      'id asc',
    );
    if (!rows.length) {
      exhausted = true;
      break;
    }
    for (const task of rows) {
      offset++;
      scanned++;
      const project = Array.isArray(task.project_id) ? String(task.project_id[1]) : '';
      if (
        [
          task.name || '',
          project,
          String(task.id),
          ...(descriptions ? [String(task.description || '')] : []),
        ].some((s) => normalize(s).includes(q))
      ) {
        const { description: _removed, ...safe } = task;
        void _removed;
        found.push(safe as RecordData);
      }
      if (found.length === 40) break;
    }
    if (rows.length < 100 && found.length < 40) {
      exhausted = true;
      break;
    }
  }
  return {
    items: await decorateTasks(odoo, found, metadata),
    nextCursor: exhausted ? null : offset,
    mode: 'live-accent-scan',
    scanLimited: !exhausted,
    scanned,
  };
}

export async function taskDetail(odoo: Odoo, id: number, identity: string) {
  const metadata = await odoo.fields('project.task');
  const task = await odoo.read('project.task', id, selectFields(metadata, taskFields));
  task.description = cleanHtml(task.description);
  const ancestors: RecordData[] = [];
  const visited = new Set([id]);
  let parent = relationId(task.parent_id);
  let parentUnavailable = false;
  while (parent && ancestors.length < 20 && !visited.has(parent)) {
    visited.add(parent);
    try {
      const row = await odoo.read('project.task', parent, ['name', 'parent_id', 'project_id']);
      ancestors.unshift(row);
      parent = relationId(row.parent_id);
    } catch (e) {
      if (e instanceof AppError && [403, 404].includes(e.status)) {
        parentUnavailable = true;
        break;
      }
      throw e;
    }
  }
  const children = await odoo.search(
    'project.task',
    [['parent_id', '=', id]],
    selectFields(metadata, ['name', 'project_id', 'stage_id', 'state', 'user_ids']),
    100,
  );
  const siblings = relationId(task.parent_id)
    ? await odoo.search(
        'project.task',
        [
          ['parent_id', '=', relationId(task.parent_id)],
          ['id', '!=', id],
        ],
        ['name', 'project_id'],
        40,
      )
    : [];
  const projects = relationId(task.project_id);
  const stageMeta = await odoo.fields('project.task.type');
  const stages = await odoo.search(
    'project.task.type',
    stageMeta.project_ids && projects
      ? ['|', ['project_ids', 'in', [projects]], ['project_ids', '=', false]]
      : [],
    selectFields(stageMeta, ['name', 'sequence']),
    100,
    0,
    'sequence,id',
  );
  let users: RecordData[] = [];
  try {
    users = await odoo.search('res.users', [['share', '=', false]], ['name'], 200, 0, 'name');
  } catch (e) {
    if (!(e instanceof AppError && e.status === 403)) throw e;
  }
  await pool().query(
    `INSERT INTO workspace_preferences(identity,task_id) VALUES($1,$2) ON CONFLICT(identity,task_id) DO UPDATE SET visited_at=now()`,
    [identity, id],
  );
  return {
    task,
    ancestors,
    parentUnavailable,
    children,
    siblings,
    stages,
    users,
    fields: metadata,
    canAtomicEdit: !!metadata.workspace_revision && config().write,
    writesEnabled: config().write,
    odooLink: `${config().publicUrl}/web?db=${encodeURIComponent(config().db)}#id=${id}&model=project.task&view_type=form`,
  };
}

export const editTaskSchema = z
  .object({
    expectedRevision: z.string().min(1).max(100),
    values: z
      .object({
        name: z.string().trim().min(1).max(500).optional(),
        description: z.string().max(50000).optional(),
        stage_id: z.number().int().positive().optional(),
        state: z.string().max(80).optional(),
        user_ids: z.array(z.number().int().positive()).max(50).optional(),
        date_deadline: z.union([z.iso.date(), z.literal(false)]).optional(),
        priority: z.string().max(20).optional(),
      })
      .strict(),
  })
  .strict();
export async function editTask(odoo: Odoo, id: number, input: z.infer<typeof editTaskSchema>) {
  const fields = await odoo.fields('project.task');
  if (!fields.workspace_revision)
    throw new AppError(
      409,
      'BRIDGE_REQUIRED',
      'Cần addon Smart Workspace Bridge để lưu an toàn khi nhiều người cùng sửa. Bạn có thể mở nhiệm vụ trong Odoo để chỉnh sửa.',
    );
  const values: Record<string, unknown> = { ...input.values };
  if (!Object.keys(values).length) throw new AppError(400, 'EMPTY_UPDATE', 'Chưa có thay đổi.');
  for (const [key, value] of Object.entries(values)) {
    if (!fields[key] || fields[key].readonly)
      throw new AppError(400, 'UNSUPPORTED_FIELD', 'Trường này không cho phép chỉnh sửa.');
    if (fields[key].selection && !fields[key].selection!.some(([k]) => k === value))
      throw new AppError(400, 'INVALID_SELECTION', 'Giá trị không có trong cấu hình Odoo.');
  }
  if (input.values.description !== undefined)
    values.description = cleanHtml(input.values.description);
  if (input.values.user_ids) values.user_ids = [[6, 0, input.values.user_ids]];
  await odoo.call('project.task', 'workspace_write', [[id], input.expectedRevision, values]);
  return { saved: true };
}
export async function chatter(odoo: Odoo, id: number, focusId?: number) {
  await odoo.requireRecord('project.task', id);
  const rows = await odoo.search(
    'mail.message',
    [
      ['model', '=', 'project.task'],
      ['res_id', '=', id],
    ],
    ['body', 'author_id', 'date', 'message_type', 'subtype_id'],
    100,
    0,
    'id desc',
  );
  if (focusId && !rows.some((row) => row.id === focusId)) {
    const row = await odoo.read('mail.message', focusId, [
      'body',
      'author_id',
      'date',
      'message_type',
      'subtype_id',
      'model',
      'res_id',
    ]);
    if (row.model !== 'project.task' || row.res_id !== id) throw denied();
    rows.unshift(row);
  }
  return rows.map((row) => ({ ...row, body: cleanHtml(row.body) }));
}
export async function attachments(odoo: Odoo, id: number) {
  await odoo.requireRecord('project.task', id);
  return odoo.search(
    'ir.attachment',
    [
      ['res_model', '=', 'project.task'],
      ['res_id', '=', id],
      ['type', '=', 'binary'],
    ],
    ['name', 'mimetype', 'file_size', 'create_date'],
    100,
  );
}
export async function attachment(odoo: Odoo, taskId: number, id: number) {
  await odoo.requireRecord('project.task', taskId);
  const row = await odoo.read('ir.attachment', id, [
    'name',
    'res_model',
    'res_id',
    'datas',
    'mimetype',
    'type',
  ]);
  if (row.res_model !== 'project.task' || row.res_id !== taskId || row.type !== 'binary')
    throw denied();
  return row;
}
export async function notifications(odoo: Odoo, uid: number, params = new URLSearchParams()) {
  const user = await odoo.read('res.users', uid, ['partner_id']);
  try {
    const domain: unknown[] = [['res_partner_id', '=', relationId(user.partner_id)]];
    if (params.get('before'))
      domain.push(['id', '<', z.coerce.number().int().positive().parse(params.get('before'))]);
    if (['read', 'unread'].includes(params.get('read') || ''))
      domain.push(['is_read', '=', params.get('read') === 'read']);
    if (params.get('kind') === 'task') domain.push(['mail_message_id.model', '=', 'project.task']);
    if (params.get('kind') === 'channel')
      domain.push(['mail_message_id.model', '=', 'discuss.channel']);
    if (params.get('after'))
      domain.push([
        'mail_message_id.date',
        '>=',
        new Date(z.iso.datetime({ offset: true }).parse(params.get('after')))
          .toISOString()
          .slice(0, 19)
          .replace('T', ' '),
      ]);
    const raw = await odoo.search(
      'mail.notification',
      domain,
      ['mail_message_id', 'is_read', 'notification_type'],
      81,
      0,
      'id desc',
    );
    const page = raw.slice(0, 80);
    const readVisible = async (
      model: string,
      ids: number[],
      fields: string[],
      extra: unknown[] = [],
    ) => {
      if (!ids.length) return [];
      try {
        return await odoo.search(
          model,
          [['id', 'in', [...new Set(ids)]], ...extra],
          fields,
          ids.length,
        );
      } catch (error) {
        if (error instanceof AppError && [403, 404].includes(error.status)) return [];
        throw error;
      }
    };
    const messages = await readVisible(
      'mail.message',
      page.map((n) => relationId(n.mail_message_id)).filter((id): id is number => !!id),
      ['body', 'model', 'res_id', 'author_id', 'date', 'subtype_id'],
    );
    const [tasks, channels] = await Promise.all([
      readVisible(
        'project.task',
        messages.filter((m) => m.model === 'project.task').map((m) => Number(m.res_id)),
        ['name', 'project_id', 'state'],
      ),
      readVisible(
        'discuss.channel',
        messages.filter((m) => m.model === 'discuss.channel').map((m) => Number(m.res_id)),
        ['name', 'is_member'],
        [['is_member', '=', true]],
      ),
    ]);
    const byMessage = new Map(messages.map((m) => [m.id, m])),
      byTask = new Map(tasks.map((t) => [t.id, t])),
      byChannel = new Map(channels.map((c) => [c.id, c]));
    const items = [];
    for (const notification of page) {
      const message = byMessage.get(relationId(notification.mail_message_id)!);
      if (!message) continue;
      const channel =
        message.model === 'discuss.channel' ? byChannel.get(Number(message.res_id)) : undefined;
      const task =
        message.model === 'project.task' ? byTask.get(Number(message.res_id)) : undefined;
      if (!channel && !task) continue;
      items.push({
        ...notification,
        message: { ...message, body: plainText(message.body) },
        ...(task ? { task } : { channel }),
        targetName: (task || channel)!.name,
        kind: task ? 'task' : 'channel',
        href: task
          ? `/tasks/${task.id}?tab=discussion&message=${message.id}`
          : `/discuss/${channel!.id}?message=${message.id}`,
      });
    }
    return { available: true, items, nextCursor: raw.length > 80 ? page.at(-1)!.id : null };
  } catch (error) {
    if (error instanceof AppError && error.status === 403)
      return {
        available: false,
        items: [],
        nextCursor: null,
        reason:
          'Odoo chưa cho phép tài khoản này đọc mail.notification qua External API. Hãy dùng hộp thư Odoo gốc.',
      };
    throw error;
  }
}
