import { AppError } from './errors';
import { Odoo, relationId, type RecordData, selectFields } from './odoo';
import { decorateTasks, taskDomain } from './workspace';

export async function dashboard(odoo: Odoo, uid: number) {
  const meta = await odoo.fields('project.task');
  const mine = await taskDomain(odoo, new URLSearchParams('mine=true'), uid, meta);
  const overdue = await taskDomain(odoo, new URLSearchParams('mine=true&overdue=true'), uid, meta);
  const closed =
    meta.state?.selection?.map(([v]) => v).filter((v) => ['1_done', '1_canceled'].includes(v)) ||
    [];
  const open = closed.length ? [...mine, ['state', 'not in', closed]] : mine;
  const count = (model: string, domain: unknown[]) =>
    odoo.call<number>(model, 'search_count', [domain]);
  const [mineCount, overdueCount, projectCount, recent, projects, activities] = await Promise.all([
    count('project.task', open),
    count('project.task', overdue),
    count('project.project', []),
    odoo.search(
      'project.task',
      mine,
      selectFields(meta, [
        'name',
        'project_id',
        'parent_id',
        'stage_id',
        'state',
        'date_deadline',
        'user_ids',
        'write_date',
      ]),
      6,
      0,
      'write_date desc,id desc',
    ),
    odoo.search('project.project', [], ['name'], 6, 0, 'write_date desc,id desc'),
    count('mail.activity', [
      ['user_id', '=', uid],
      ['res_model', '=', 'project.task'],
    ]),
  ]);
  let unread: number | null = null;
  try {
    const user = await odoo.read('res.users', uid, ['partner_id']);
    unread = await count('mail.notification', [
      ['res_partner_id', '=', relationId(user.partner_id)],
      ['is_read', '=', false],
      ['mail_message_id.model', 'in', ['project.task', 'discuss.channel']],
    ]);
  } catch (e) {
    if (!(e instanceof AppError && e.status === 403)) throw e;
  }
  return {
    counts: { mine: mineCount, overdue: overdueCount, projects: projectCount, activities, unread },
    recent: await decorateTasks(odoo, recent, meta),
    projects,
  };
}
