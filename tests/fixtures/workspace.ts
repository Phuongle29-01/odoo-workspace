import { type Page } from '@playwright/test';

export const fixedNow = '2026-10-23T02:00:00Z';
export const users = [
  { id: 6, name: 'Nguyễn Minh Anh' },
  { id: 7, name: 'Trần Quốc Bảo' },
];
export const projects = [
  {
    id: 11,
    name: 'Tòa nhà A',
    description: '<p>Thiết kế và triển khai công trình Tòa nhà A.</p>',
    task_count: 3,
    user_id: [6, users[0].name],
  },
  {
    id: 12,
    name: 'Nhà máy B',
    description: '<p>Kiểm tra hồ sơ kỹ thuật và nghiệm thu các hạng mục.</p>',
    task_count: 2,
    user_id: [7, users[1].name],
  },
];
export const stages = [
  { id: 21, name: 'Đang thực hiện' },
  { id: 22, name: 'Chờ duyệt' },
  { id: 23, name: 'Hoàn thành' },
];
export const fields = {
  state: {
    string: 'Trạng thái',
    selection: [
      ['01_in_progress', 'Đang thực hiện'],
      ['02_changes_requested', 'Cần thay đổi'],
      ['1_done', 'Hoàn thành'],
    ],
  },
  priority: {
    string: 'Ưu tiên',
    selection: [
      ['0', 'Bình thường'],
      ['1', 'Cao'],
    ],
  },
};
export const tasks = [
  {
    id: 101,
    name: 'Rà soát hồ sơ',
    project_id: [11, 'Tòa nhà A'],
    parent_id: false,
    stage_id: [21, 'Đang thực hiện'],
    state: '01_in_progress',
    user_ids: [6],
    date_deadline: '2026-10-29',
    priority: '0',
    description: '<p>Rà soát toàn bộ hồ sơ và phối hợp với các bộ phận.</p>',
  },
  {
    id: 102,
    name: 'Kiểm tra hồ sơ thiết kế',
    project_id: [12, 'Nhà máy B'],
    parent_id: [101, 'Rà soát hồ sơ'],
    stage_id: [21, 'Đang thực hiện'],
    state: '01_in_progress',
    user_ids: [6, 7],
    date_deadline: '2026-10-22',
    priority: '1',
    description:
      '<p>Đối chiếu bản vẽ kết cấu, kiểm tra kích thước và lập danh sách nội dung cần bổ sung.</p><ul><li>Kiểm tra hồ sơ thiết kế kỹ thuật</li><li>Phối hợp với đội thi công</li></ul>',
  },
  {
    id: 103,
    name: 'Đối chiếu bản vẽ kết cấu',
    project_id: [12, 'Nhà máy B'],
    parent_id: [102, 'Kiểm tra hồ sơ thiết kế'],
    stage_id: [22, 'Chờ duyệt'],
    state: '02_changes_requested',
    user_ids: [7],
    date_deadline: '2026-10-26',
    priority: '0',
    description: '<p>Kiểm tra số liệu giữa các bản vẽ liên quan.</p>',
  },
  {
    id: 104,
    name: 'Kiểm tra hồ sơ',
    project_id: [11, 'Tòa nhà A'],
    parent_id: false,
    stage_id: [22, 'Chờ duyệt'],
    state: '01_in_progress',
    user_ids: [6],
    date_deadline: '2026-11-03',
    priority: '0',
    description: '<p>Kiểm tra hồ sơ dự án A.</p>',
  },
  {
    id: 105,
    name: 'Kiểm tra hồ sơ',
    project_id: [12, 'Nhà máy B'],
    parent_id: false,
    stage_id: [23, 'Hoàn thành'],
    state: '1_done',
    user_ids: [7],
    date_deadline: false,
    priority: '0',
    description: '<p>Hồ sơ dự án B đã hoàn thành.</p>',
  },
].map((t) => ({
  ...t,
  assignees: users.filter((u) => t.user_ids.includes(u.id)),
  stateLabel: fields.state.selection.find(([key]) => key === t.state)?.[1],
  write_date: '2026-10-23 01:00:00',
  workspace_revision: '2026-10-23T01:00:00.000001',
}));
export const messages = [
  {
    id: 301,
    body: '<p>Đã nhận hồ sơ. Mình sẽ đối chiếu bản vẽ và cập nhật trước 16 giờ.</p>',
    author_id: [6, users[0].name],
    date: '2026-10-23 01:15:00',
    message_type: 'comment',
    subtype_id: [1, 'Bình luận'],
  },
  {
    id: 302,
    body: '<p>Nhờ Anh kiểm tra thêm phần kích thước ở bản vẽ kết cấu nhé.</p>',
    author_id: [7, users[1].name],
    date: '2026-10-23 01:30:00',
    message_type: 'comment',
    subtype_id: [1, 'Bình luận'],
  },
];
export const channels = [
  { id: 41, name: 'Đội thiết kế', channel_type: 'group', is_member: true, member_count: 4 },
  { id: 42, name: 'Dự án nhà máy B', channel_type: 'channel', is_member: true, member_count: 8 },
];
export const views = [
  { name: 'login', url: '/login', ready: 'Chào mừng trở lại' },
  { name: 'dashboard', url: '/', ready: 'Chào Anh, cùng bắt đầu công việc.' },
  {
    name: 'search',
    url: '/search?q=kiem%20tra%20ho%20so',
    ready: 'Tìm đúng việc. Thấy đầy đủ ngữ cảnh.',
  },
  { name: 'project', url: '/projects/12', ready: 'Nhà máy B' },
  { name: 'task', url: '/tasks/102', ready: 'Kiểm tra hồ sơ thiết kế' },
  { name: 'notifications', url: '/notifications', ready: 'Thông báo của bạn' },
  { name: 'discuss', url: '/discuss/41', ready: 'Odoo Discuss' },
];
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

/** Browser-only interception. Never imported by src/ or shipped as a runtime adapter. */
export async function mockWorkspace(page: Page, user: 'A' | 'B' = 'A') {
  const uid = user === 'A' ? 6 : 7;
  const state = {
    tasks: structuredClone(tasks),
    messages: structuredClone(messages),
    bookmarks: [102],
    preferences: { view: 'list' },
    loggedIn: true,
    readIds: [402],
  };
  await page.clock.setFixedTime(new Date(fixedNow));
  await page.addInitScript(() => {
    if (!localStorage.getItem('workspace-theme')) localStorage.setItem('workspace-theme', 'light');
  });
  await page.route('**/api/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace('/api/', '');
    const method = req.method();
    const input = method === 'GET' ? {} : req.postDataJSON() || {};
    const ok = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (path === 'health') return ok({ status: 'ok', database: 'ok' });
    if (path === 'auth/login') {
      state.loggedIn = true;
      return ok({ authenticated: true });
    }
    if (path === 'auth/logout') {
      state.loggedIn = false;
      return ok({ loggedOut: true });
    }
    if (!state.loggedIn)
      return ok({ error: { code: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.' } }, 401);
    if (path === 'me')
      return ok({
        user: {
          ...users.find((u) => u.id === uid),
          login: `workspace.${user.toLowerCase()}@example.test`,
          partner_id: [uid + 100, 'Nhân viên'],
        },
        instance: 'visual-fixture',
        writesEnabled: true,
        hosting: 'self_hosted',
        odooUrl: 'https://odoo.example.test',
        authMode: 'password',
      });
    if (path === 'dashboard')
      return ok({
        counts: { mine: 3, overdue: 1, activities: 1, unread: 1, projects: 2 },
        recent: state.tasks.slice(0, 4),
        projects,
      });
    if (path === 'projects') return ok({ items: projects, nextCursor: null });
    if (/^projects\/\d+$/.test(path))
      return ok(projects.find((p) => p.id === Number(path.split('/')[1])));
    if (path === 'task-options')
      return ok({ projects, stages, users, states: fields.state.selection });
    if (path === 'tasks') {
      let items = state.tasks;
      const p = url.searchParams;
      if (p.get('open') === 'true') items = items.filter((t) => t.state !== '1_done');
      if (p.get('mine') === 'true') items = items.filter((t) => t.user_ids.includes(uid));
      if (p.get('project'))
        items = items.filter((t) => t.project_id[0] === Number(p.get('project')));
      if (p.get('stage')) items = items.filter((t) => t.stage_id[0] === Number(p.get('stage')));
      if (p.get('assignee'))
        items = items.filter((t) => t.user_ids.includes(Number(p.get('assignee'))));
      if (p.get('state')) items = items.filter((t) => t.state === p.get('state'));
      if (p.get('overdue') === 'true')
        items = items.filter(
          (t) => t.date_deadline && t.date_deadline < '2026-10-23' && t.state !== '1_done',
        );
      if (p.get('q'))
        items = items.filter((t) =>
          norm(`${t.name} ${t.project_id[1]} ${t.id}`).includes(norm(p.get('q')!)),
        );
      return ok({
        items,
        users,
        states: fields.state.selection,
        nextCursor: null,
        scanLimited: false,
        scanned: state.tasks.length,
      });
    }
    if (path.startsWith('tasks/')) {
      const [, id, child] = path.split('/');
      const task = state.tasks.find((t) => t.id === Number(id));
      if (!task)
        return ok(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Không tìm thấy nhiệm vụ hoặc không còn quyền xem.',
            },
          },
          404,
        );
      if (method === 'PATCH') {
        Object.assign(task, input.values);
        return ok({ saved: true });
      }
      if (child === 'messages') {
        if (method === 'POST') {
          state.messages.push({
            id: 303 + state.messages.length,
            body: `<p>${input.text}</p>`,
            author_id: [uid, users.find((u) => u.id === uid)!.name],
            date: '2026-10-23 02:00:00',
            message_type: 'comment',
            subtype_id: [1, 'Bình luận'],
          });
          return ok({ id: state.messages.at(-1)!.id });
        }
        return ok(state.messages);
      }
      if (child === 'activities')
        return ok([
          {
            id: 71,
            summary: 'Rà soát bản vẽ kỹ thuật',
            date_deadline: '2026-10-24',
            user_id: [6, users[0].name],
            activity_type_id: [1, 'Cần làm'],
          },
        ]);
      if (child === 'attachments')
        return ok([
          {
            id: 501,
            name: 'Ho-so-thiet-ke.pdf',
            file_size: 248000,
            create_date: '2026-10-22 08:00:00',
            mimetype: 'application/pdf',
          },
        ]);
      const ancestors = [];
      let parent = Array.isArray(task.parent_id) ? Number(task.parent_id[0]) : 0;
      while (parent) {
        const row = state.tasks.find((t) => t.id === parent);
        if (!row) break;
        ancestors.unshift(row);
        parent = Array.isArray(row.parent_id) ? Number(row.parent_id[0]) : 0;
      }
      return ok({
        task,
        ancestors,
        parentUnavailable: false,
        children: state.tasks.filter(
          (t) => Array.isArray(t.parent_id) && t.parent_id[0] === task.id,
        ),
        siblings: [],
        stages,
        users,
        fields,
        canAtomicEdit: true,
        writesEnabled: true,
        canWrite: true,
        odooLink: `https://odoo.example.test/web#id=${task.id}&model=project.task`,
      });
    }
    if (path === 'activities')
      return ok([
        {
          id: 71,
          summary: 'Rà soát bản vẽ kỹ thuật',
          date_deadline: '2026-10-24',
          task: state.tasks[1],
          activity_type_id: [1, 'Cần làm'],
        },
      ]);
    if (path === 'notifications')
      return ok({
        available: true,
        items: [
          {
            id: 401,
            is_read: state.readIds.includes(401),
            notification_type: 'inbox',
            kind: 'task',
            targetName: tasks[1].name,
            task: state.tasks[1],
            message: { ...state.messages[1], body: state.messages[1].body.replace(/<[^>]*>/g, '') },
            href: '/tasks/102?tab=discussion&message=302',
          },
          {
            id: 402,
            is_read: state.readIds.includes(402),
            notification_type: 'inbox',
            kind: 'channel',
            targetName: 'Đội thiết kế',
            channel: channels[0],
            message: { ...state.messages[0], body: state.messages[0].body.replace(/<[^>]*>/g, '') },
            href: '/discuss/41?message=301',
          },
        ],
      });
    if (path.startsWith('notifications/')) {
      state.readIds.push(Number(path.split('/')[1]));
      return ok({ saved: true });
    }
    if (path === 'ui-preferences') {
      if (method === 'POST') {
        Object.assign(state.preferences, input);
        return ok({ saved: true });
      }
      return ok(state.preferences);
    }
    if (path === 'preferences') {
      if (method === 'POST') return ok({ saved: true });
      return ok({ items: state.tasks.filter((t) => state.bookmarks.includes(t.id)) });
    }
    if (path === 'discuss') return ok({ available: true, items: channels });
    if (path.startsWith('discuss/'))
      return ok({ channel: channels[0], items: state.messages, nextCursor: null, focused: null });
    // Unknown APIs fail loudly instead of falling through to real Odoo.
    return ok(
      { error: { code: 'UNMOCKED_API', message: `Test fixture has no ${method} ${path}` } },
      501,
    );
  });
  return state;
}
