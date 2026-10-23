import { NextResponse } from 'next/server';
import { z } from 'zod';
import { endpoint, csrf, body, positiveId, requireWrites } from '@/server/http';
import { config } from '@/server/config';
import { authenticate, relationId, selectFields } from '@/server/odoo';
import { createSession, session, logout } from '@/server/auth';
import { hash } from '@/server/crypto';
import { pool, rateLimit, readyDb } from '@/server/db';
import { AppError, denied } from '@/server/errors';
import { mutate } from '@/server/mutations';
import { channels, channelMessages, requireChannel } from '@/server/discuss';
import { dashboard } from '@/server/dashboard';
import {
  taskList,
  taskDetail,
  editTask,
  editTaskSchema,
  chatter,
  attachments,
  attachment,
  notifications,
  cleanHtml,
  taskOptions,
} from '@/server/workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  const { path } = await context.params;
  if (path.join('/') === 'health')
    return endpoint(async () => {
      await readyDb();
      await pool().query('SELECT 1');
      return { status: 'ok', database: 'ok' };
    });
  return endpoint(async () => {
    const { odoo, uid, identity } = await session();
    const params = new URL(request.url).searchParams;
    if (path[0] === 'dashboard') return dashboard(odoo, uid);
    if (path[0] === 'task-options') return taskOptions(odoo);
    if (path[0] === 'ui-preferences') {
      const { rows } = await pool().query(
        'SELECT value FROM workspace_ui_preferences WHERE identity=$1',
        [identity],
      );
      return rows[0]?.value || {};
    }
    if (path[0] === 'me') {
      const user = await odoo.read('res.users', uid, ['name', 'login', 'partner_id']);
      return {
        user,
        instance: hash(`${config().url}:${config().db}`).slice(0, 12),
        writesEnabled: config().write,
        hosting: config().hosting,
        odooUrl: config().publicUrl,
        authMode: config().authMode,
      };
    }
    if (path[0] === 'connection') {
      const version = await odoo.version();
      const checks: Record<string, unknown> = {};
      for (const model of [
        'project.project',
        'project.task',
        'project.task.type',
        'res.users',
        'mail.message',
        'mail.followers',
        'mail.activity',
        'mail.notification',
        'ir.attachment',
        'discuss.channel',
      ]) {
        try {
          const fields = await odoo.fields(model);
          await odoo.search(model, [], ['id'], 1);
          checks[model] = {
            read: true,
            write: await odoo.call<boolean>(model, 'check_access_rights', ['write'], {
              raise_exception: false,
            }),
            customFields: Object.keys(fields).filter((f) => f.startsWith('x_')),
            bridge: !!fields.workspace_revision,
          };
        } catch (e) {
          checks[model] = { read: false, reason: e instanceof AppError ? e.code : 'UNAVAILABLE' };
        }
      }
      return {
        version: version.server_version,
        hosting: config().hosting,
        checks,
        writesEnabled: config().write,
      };
    }
    if (path[0] === 'projects' && !path[1]) {
      const meta = await odoo.fields('project.project');
      const cursor = z.coerce
        .number()
        .int()
        .min(0)
        .parse(params.get('cursor') || 0);
      const items = await odoo.search(
        'project.project',
        [],
        selectFields(meta, ['name', 'description', 'task_count', 'user_id', 'date_start', 'date']),
        41,
        cursor,
        'name,id',
      );
      return {
        items: items.slice(0, 40).map((p) => ({ ...p, description: cleanHtml(p.description) })),
        nextCursor: items.length > 40 ? cursor + 40 : null,
      };
    }
    if (path[0] === 'projects' && path[1])
      return odoo.read('project.project', positiveId(path[1]), ['name']);
    if (path[0] === 'tasks' && !path[1]) return taskList(odoo, params, uid);
    if (path[0] === 'tasks' && path[1]) {
      const id = positiveId(path[1]);
      if (path[2] === 'activities') {
        await odoo.requireRecord('project.task', id);
        return odoo.search(
          'mail.activity',
          [
            ['res_model', '=', 'project.task'],
            ['res_id', '=', id],
          ],
          ['summary', 'date_deadline', 'user_id', 'activity_type_id'],
          50,
          0,
          'date_deadline,id',
        );
      }
      if (path[2] === 'messages')
        return chatter(
          odoo,
          id,
          params.get('message') ? positiveId(params.get('message')) : undefined,
        );
      if (path[2] === 'attachments') {
        if (path[3]) {
          const row = await attachment(odoo, id, positiveId(path[3]));
          // Returned separately below to support binary downloads.
          return { download: { name: row.name, data: row.datas } };
        }
        return attachments(odoo, id);
      }
      return taskDetail(odoo, id, identity);
    }
    if (path[0] === 'notifications') return notifications(odoo, uid);
    if (path[0] === 'discuss') {
      if (!path[1]) return channels(odoo);
      const cursor = z.coerce
        .number()
        .int()
        .min(0)
        .parse(params.get('cursor') || 0);
      const query = z
        .string()
        .max(160)
        .parse(params.get('q') || '');
      return channelMessages(
        odoo,
        positiveId(path[1]),
        cursor,
        query,
        params.get('message') ? positiveId(params.get('message')) : undefined,
      );
    }
    if (path[0] === 'activities') {
      const rows = await odoo.search(
        'mail.activity',
        [
          ['user_id', '=', uid],
          ['res_model', '=', 'project.task'],
        ],
        ['summary', 'date_deadline', 'res_id', 'activity_type_id'],
        60,
        0,
        'date_deadline,id',
      );
      const visible = [];
      for (const row of rows) {
        try {
          const task = await odoo.read('project.task', Number(row.res_id), ['name', 'project_id']);
          visible.push({ ...row, task });
        } catch (e) {
          if (e instanceof AppError && [403, 404].includes(e.status)) continue;
          throw e;
        }
      }
      return visible;
    }
    if (path[0] === 'preferences') {
      const { rows } = await pool().query(
        'SELECT task_id,bookmarked,visited_at FROM workspace_preferences WHERE identity=$1 ORDER BY visited_at DESC LIMIT 100',
        [identity],
      );
      const items = [];
      for (const row of rows) {
        if (params.get('bookmarked') === 'true' && !row.bookmarked) continue;
        try {
          const task = await odoo.read('project.task', row.task_id, [
            'name',
            'project_id',
            'stage_id',
            'parent_id',
          ]);
          items.push({ ...task, bookmarked: row.bookmarked });
        } catch (e) {
          if (e instanceof AppError && [403, 404].includes(e.status)) continue;
          throw e;
        }
      }
      return { items };
    }
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy API.');
  }).then(async (response) => {
    if (path[0] === 'tasks' && path[2] === 'attachments' && path[3] && response.ok) {
      const payload = await response.json();
      if (payload.download)
        return new NextResponse(Buffer.from(payload.download.data || '', 'base64'), {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(String(payload.download.name || 'document'))}`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        });
    }
    return response;
  });
}

export async function POST(request: Request, context: Context) {
  return endpoint(async () => {
    csrf(request);
    const { path } = await context.params;
    if (path[0] === 'auth' && path[1] === 'login') {
      const input = z
        .object({ login: z.string().trim().min(1).max(200), password: z.string().min(1).max(4096) })
        .strict()
        .parse(await body(request));
      await rateLimit(`login:${hash(input.login.toLowerCase())}`, 10, 900);
      await rateLimit('login:global', 200, 60);
      const uid = await authenticate(input.login, input.password);
      await createSession(uid, input.password);
      return { authenticated: true };
    }
    if (path[0] === 'auth' && path[1] === 'logout') {
      await logout();
      return { loggedOut: true };
    }
    const { odoo, identity, uid } = await session();
    if (path[0] === 'ui-preferences') {
      const input = z
        .object({
          view: z.enum(['list', 'kanban', 'tree']).optional(),
          navWidth: z.number().int().min(160).max(280).optional(),
          collabWidth: z.number().int().min(280).max(420).optional(),
          navOpen: z.boolean().optional(),
          collabOpen: z.boolean().optional(),
        })
        .strict()
        .parse(await body(request));
      await pool().query(
        'INSERT INTO workspace_ui_preferences(identity,value) VALUES($1,$2) ON CONFLICT(identity) DO UPDATE SET value=workspace_ui_preferences.value || $2::jsonb',
        [identity, JSON.stringify(input)],
      );
      return { saved: true };
    }
    if (path[0] === 'preferences') {
      const input = z
        .object({ taskId: z.number().int().positive(), bookmarked: z.boolean() })
        .strict()
        .parse(await body(request));
      await odoo.requireRecord('project.task', input.taskId);
      await pool().query(
        'INSERT INTO workspace_preferences(identity,task_id,bookmarked) VALUES($1,$2,$3) ON CONFLICT(identity,task_id) DO UPDATE SET bookmarked=$3',
        [identity, input.taskId, input.bookmarked],
      );
      return { saved: true };
    }
    requireWrites();
    if (path[0] === 'discuss' && path[1] && path[2] === 'messages') {
      const id = positiveId(path[1]);
      await requireChannel(odoo, id);
      const input = z
        .object({ text: z.string().trim().min(1).max(10000) })
        .strict()
        .parse(await body(request));
      return mutate(identity, request, { channel: id, ...input }, async () => ({
        id: await odoo.call('discuss.channel', 'message_post', [[id]], {
          body: input.text,
          message_type: 'comment',
          subtype_xmlid: 'mail.mt_comment',
        }),
      }));
    }
    if (path[0] === 'tasks' && path[1]) {
      const id = positiveId(path[1]);
      await odoo.requireRecord('project.task', id);
      if (path[2] === 'messages') {
        const input = z
          .object({
            text: z.string().trim().min(1).max(10000),
            internal: z.boolean().default(false),
          })
          .strict()
          .parse(await body(request));
        return mutate(identity, request, { task: id, ...input }, async () => ({
          id: await odoo.call('project.task', 'message_post', [[id]], {
            body: input.text,
            message_type: 'comment',
            subtype_xmlid: input.internal ? 'mail.mt_note' : 'mail.mt_comment',
          }),
        }));
      }
      if (path[2] === 'children') {
        const input = z
          .object({ name: z.string().trim().min(1).max(500) })
          .strict()
          .parse(await body(request));
        const parent = await odoo.read('project.task', id, ['project_id']);
        return mutate(identity, request, { parent: id, ...input }, async () => ({
          id: await odoo.call('project.task', 'create', [
            { name: input.name, parent_id: id, project_id: relationId(parent.project_id) || false },
          ]),
        }));
      }
      if (path[2] === 'attachments') {
        const input = z
          .object({
            name: z
              .string()
              .min(1)
              .max(200)
              .refine((s) => !/[\x00-\x1f\/\\]/.test(s)),
            data: z
              .string()
              .min(4)
              .max(7_000_000)
              .regex(/^[A-Za-z0-9+/]+={0,2}$/),
          })
          .strict()
          .parse(await body(request, 7_100_000));
        if (Buffer.from(input.data, 'base64').length > 5 * 1024 * 1024)
          throw new AppError(413, 'FILE_TOO_LARGE', 'Tệp tối đa 5 MB.');
        return mutate(identity, request, { task: id, ...input }, async () => ({
          id: await odoo.call('ir.attachment', 'create', [
            {
              name: input.name,
              datas: input.data,
              res_model: 'project.task',
              res_id: id,
              type: 'binary',
            },
          ]),
        }));
      }
    }
    if (path[0] === 'notifications' && path[1]) {
      const id = positiveId(path[1]);
      const user = await odoo.read('res.users', uid, ['partner_id']);
      const row = await odoo.read('mail.notification', id, ['res_partner_id']);
      if (relationId(row.res_partner_id) !== relationId(user.partner_id)) throw denied();
      return mutate(identity, request, { notification: id }, async () => {
        await odoo.call('mail.notification', 'write', [[id], { is_read: true }]);
        return { saved: true };
      });
    }
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy API.');
  });
}
export async function PATCH(request: Request, context: Context) {
  return endpoint(async () => {
    csrf(request);
    requireWrites();
    const { path } = await context.params;
    const { odoo, identity } = await session();
    if (path[0] === 'tasks' && path[1] && !path[2]) {
      const id = positiveId(path[1]);
      const input = editTaskSchema.parse(await body(request, 70_000));
      return mutate(identity, request, { task: id, ...input }, () => editTask(odoo, id, input));
    }
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy API.');
  });
}
