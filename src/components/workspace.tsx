'use client';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import Discuss from './discuss';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  MessageSquare,
  Bell,
  Files,
  Star,
  History,
  Settings,
  Search,
  ArrowUpRight,
  ChevronRight,
  Plus,
  ArrowLeft,
  ExternalLink,
  Moon,
  Sun,
  LogOut,
  Command,
  Check,
  LoaderCircle,
  Wifi,
  AlertCircle,
  Menu,
  X,
  CalendarDays,
  Users,
  CornerDownRight,
  Paperclip,
  Send,
  RefreshCw,
  ShieldCheck,
  LockKeyhole,
  Columns3,
  List,
  GitBranch,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import {
  api,
  write,
  clearClientState,
  useData,
  label,
  rid,
  dateLabel,
  ApiError,
  type Row,
} from '@/lib/client';

type Me = {
  user: Row;
  instance: string;
  writesEnabled: boolean;
  hosting: string;
  odooUrl: string;
  authMode: string;
};
const MeContext = createContext<Me | null>(null);
const NoticeContext = createContext<(text: string, error?: boolean) => void>(() => {});
const useMe = () => useContext(MeContext)!;
const useNotice = () => useContext(NoticeContext);
const nav = [
  ['Tổng quan', '/', LayoutDashboard],
  ['Dự án', '/projects', FolderKanban],
  ['Công việc của tôi', '/my-tasks', ClipboardList],
  ['Tất cả nhiệm vụ', '/tasks', List],
  ['Thảo luận', '/discuss', MessageSquare],
  ['Thông báo', '/notifications', Bell],
  ['Tài liệu', '/documents', Files],
  ['Đã đánh dấu', '/bookmarks', Star],
  ['Gần đây', '/recent', History],
] as const;

export default function Workspace() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <Shell />
    </QueryClientProvider>
  );
}
function Shell() {
  const router = useRouter(),
    pathname = usePathname(),
    query = useSearchParams(),
    cache = useQueryClient();
  const me = useData<Me>('me', pathname !== '/login', 60000);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null),
    [dark, setDark] = useState(false),
    [mobile, setMobile] = useState(false),
    [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const theme = localStorage.getItem('workspace-theme') === 'dark';
    setDark(theme);
    document.documentElement.dataset.theme = theme ? 'dark' : 'light';
  }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);
  useEffect(() => {
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    if (me.error?.status === 401) {
      cache.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' });
      router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    }
  }, [me.error, router, pathname, cache]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);
  const notify = useCallback((text: string, error = false) => setNotice({ text, error }), []);
  if (pathname === '/login') return <Login />;
  if (!me.data)
    return (
      <main className="boot">
        {me.error && me.error.status !== 401 ? (
          <ErrorBox error={me.error} retry={() => me.refetch()} />
        ) : (
          <>
            <LoaderCircle className="spin" />
            Đang kết nối không gian làm việc…
          </>
        )}
      </main>
    );
  const title =
    nav.find(([, url]) => (url === '/' ? pathname === '/' : pathname.startsWith(url)))?.[0] ||
    'Chi tiết nhiệm vụ';
  return (
    <MeContext.Provider value={me.data}>
      <NoticeContext.Provider value={notify}>
        <div className="workspace">
          {mobile && (
            <button className="backdrop" aria-label="Đóng menu" onClick={() => setMobile(false)} />
          )}
          <aside className={`sidebar ${mobile ? 'open' : ''}`}>
            <Link href="/" className="brand">
              <span className="brand-icon">
                <Columns3 size={22} />
              </span>
              <span>
                smart<span className="brand-light">workspace</span>
                <small>CONNECTED TO ODOO 17</small>
              </span>
            </Link>
            <div className="workspace-picker">
              <span className="workspace-avatar">W</span>
              <div>
                <strong>Không gian đội ngũ</strong>
                <small>Odoo Smart Workspace</small>
              </div>
              <ShieldCheck size={16} />
            </div>
            <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
            <nav>
              {nav.map(([text, url, Icon]) => (
                <Link
                  key={url}
                  href={url}
                  className={`nav-item ${(url === '/' ? pathname === '/' : pathname.startsWith(url)) ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  {text}
                  {url === '/tasks' && <kbd>⌘ K</kbd>}
                </Link>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sync-card">
                <span className="pulse-dot" />
                <strong>Dữ liệu trực tiếp từ Odoo</strong>
                <p>Tìm kiếm và thao tác theo quyền của bạn.</p>
              </div>
              <Link
                className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
                href="/settings"
              >
                <Settings size={18} />
                Cài đặt kết nối
              </Link>
              <div className="profile">
                <span className="avatar">
                  {String(me.data.user.name)
                    .split(' ')
                    .slice(-2)
                    .map((w) => w[0])
                    .join('')}
                </span>
                <div>
                  <strong>{me.data.user.name}</strong>
                  <small>Tài khoản Odoo cá nhân</small>
                </div>
                <button
                  className="icon-button"
                  aria-label="Đăng xuất"
                  onClick={async () => {
                    try {
                      await api('auth/logout', { method: 'POST' });
                      clearClientState();
                      cache.clear();
                      router.replace('/login');
                    } catch (e) {
                      notify((e as Error).message, true);
                    }
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <button
                className="icon-button mobile-menu"
                onClick={() => setMobile(true)}
                aria-label="Mở menu"
              >
                <Menu size={20} />
              </button>
              <div className="location">
                <span>Không gian làm việc</span>
                <ChevronRight size={14} />
                <strong>{title}</strong>
              </div>
              <form
                className="top-search"
                action="/search"
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`/search?q=${encodeURIComponent(q)}`);
                }}
              >
                <Search size={17} />
                <input
                  ref={searchRef}
                  aria-label="Tìm kiếm toàn cục"
                  name="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm nhiệm vụ, dự án…"
                />
                <kbd>⌘ K</kbd>
              </form>
              <div className={`connection ${me.error ? 'offline' : ''}`}>
                <span className="pulse-dot" />
                {me.error ? 'Mất kết nối' : 'Đã kết nối'}
              </div>
              <button
                className="icon-button"
                aria-label={dark ? 'Chế độ sáng' : 'Chế độ tối'}
                onClick={() => {
                  const next = !dark;
                  setDark(next);
                  localStorage.setItem('workspace-theme', next ? 'dark' : 'light');
                  document.documentElement.dataset.theme = next ? 'dark' : 'light';
                }}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link href="/notifications" className="icon-button" aria-label="Thông báo">
                <Bell size={19} />
              </Link>
            </header>
            {!me.data.writesEnabled && (
              <div className="read-only">
                <LockKeyhole size={14} />
                Chế độ chỉ đọc · Các thao tác ghi vào Odoo đang được khóa.
              </div>
            )}
            <main className="content">
              {pathname === '/' ? (
                <Dashboard />
              ) : pathname === '/projects' ? (
                <Projects />
              ) : /^\/projects\/\d+$/.test(pathname) ? (
                <Project id={Number(pathname.split('/')[2])} />
              ) : pathname === '/tasks' || pathname === '/my-tasks' ? (
                <Tasks mine={pathname === '/my-tasks'} />
              ) : pathname === '/search' ? (
                <SearchPage initial={query.get('q') || ''} />
              ) : /^\/tasks\/\d+$/.test(pathname) ? (
                <Task id={Number(pathname.split('/')[2])} />
              ) : pathname === '/notifications' ? (
                <Notifications />
              ) : pathname === '/settings' ? (
                <ConnectionSettings />
              ) : pathname.startsWith('/discuss') ? (
                <Discuss
                  odooUrl={me.data.odooUrl}
                  writesEnabled={me.data.writesEnabled}
                  identity={`${me.data.instance}:${me.data.user.id}`}
                  notify={notify}
                />
              ) : pathname === '/recent' || pathname === '/bookmarks' ? (
                <Preferences bookmarks={pathname === '/bookmarks'} />
              ) : pathname === '/documents' ? (
                <Documents />
              ) : (
                <Empty
                  title="Không tìm thấy trang"
                  description="Kiểm tra đường dẫn hoặc quay về Tổng quan."
                />
              )}
            </main>
            <footer className="footer">
              <span>Odoo Smart Workspace</span>
              <span>
                <ShieldCheck size={13} /> Quyền truy cập được xác thực tại Odoo
              </span>
            </footer>
          </div>
          {notice && (
            <div role="status" className={`toast ${notice.error ? 'error' : ''}`}>
              {notice.error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
              <span>{notice.text}</span>
              <button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </NoticeContext.Provider>
    </MeContext.Provider>
  );
}

function Login() {
  const router = useRouter(),
    query = useSearchParams(),
    cache = useQueryClient();
  const [login, setLogin] = useState(''),
    [password, setPassword] = useState(''),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  return (
    <main className="login">
      <section className="login-story">
        <Link href="/login" className="brand">
          <span className="brand-icon">
            <Columns3 />
          </span>
          <span>smartworkspace</span>
        </Link>
        <div>
          <span className="eyebrow">CÔNG VIỆC RÕ RÀNG. ĐỘI NGŨ KẾT NỐI.</span>
          <h1>
            Mọi nhiệm vụ.
            <br />
            Đúng ngữ cảnh.
            <br />
            <em>Một không gian.</em>
          </h1>
          <p>
            Tìm đúng công việc, theo dõi nhiệm vụ con và trao đổi cùng đội ngũ trên dữ liệu Odoo của
            bạn.
          </p>
          <div className="login-benefits">
            <span>
              <Search size={18} />
              Tìm kiếm tiếng Việt không dấu
            </span>
            <span>
              <GitBranch size={18} />
              Điều hướng nhiệm vụ cha và con
            </span>
            <span>
              <ShieldCheck size={18} />
              Tôn trọng quyền truy cập Odoo
            </span>
          </div>
        </div>
        <small>ODOO SMART WORKSPACE · ODOO 17</small>
      </section>
      <section className="login-form-wrap">
        <form
          className="login-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError('');
            try {
              await api('auth/login', {
                method: 'POST',
                body: JSON.stringify({ login, password }),
              });
              setPassword('');
              cache.clear();
              const next = query.get('next') || '/';
              router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/');
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setPending(false);
            }
          }}
        >
          <span className="login-mark">
            <LockKeyhole size={25} />
          </span>
          <h2>Chào mừng trở lại</h2>
          <p>Đăng nhập bằng danh tính Odoo của bạn.</p>
          <label>
            Email hoặc tên đăng nhập
            <input
              name="username"
              autoComplete="username"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="ban@congty.vn"
            />
          </label>
          <label>
            Mật khẩu hoặc API key cá nhân
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập thông tin xác thực Odoo"
            />
          </label>
          {error && (
            <div role="alert" className="inline-error">
              {error}
            </div>
          )}
          <button className="button primary full" disabled={pending}>
            {pending ? <LoaderCircle className="spin" size={17} /> : null}Đăng nhập
            <ArrowUpRight size={17} />
          </button>
          <div className="login-note">
            <ShieldCheck size={18} />
            <p>
              Thông tin xác thực được mã hóa phía máy chủ và không lưu trong trình duyệt. Odoo
              Online có thể yêu cầu API key hoặc mật khẩu local được quản trị viên cấp.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="empty">
      <FolderKanban size={32} />
      <h3>{title}</h3>
      <p>{description || 'Dữ liệu sẽ xuất hiện tại đây khi có bản ghi phù hợp.'}</p>
    </div>
  );
}
function ErrorBox({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div role="alert" className="error-box">
      <AlertCircle size={21} />
      <div>
        <strong>Chưa thể tải dữ liệu</strong>
        <p>{error.message}</p>
        {retry && (
          <button className="button small" onClick={retry}>
            <RefreshCw size={14} />
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}
function Loading() {
  return (
    <div className="skeleton-grid" aria-label="Đang tải">
      {[1, 2, 3].map((n) => (
        <div className="skeleton" key={n} />
      ))}
    </div>
  );
}
function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function TaskTable({ rows }: { rows: Row[] }) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>NHIỆM VỤ</th>
            <th>DỰ ÁN / NHIỆM VỤ CHA</th>
            <th>GIAI ĐOẠN</th>
            <th>THỜI HẠN</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((task) => (
            <tr key={task.id}>
              <td>
                <Link className="task-name" href={`/tasks/${task.id}`}>
                  <span className={`task-check ${task.state === '1_done' ? 'done' : ''}`}>
                    {task.state === '1_done' && <Check size={12} />}
                  </span>
                  <div>
                    <strong>{task.name}</strong>
                    <small>
                      #{task.id}
                      {task.priority === '1' ? ' · Ưu tiên cao' : ''}
                    </small>
                  </div>
                </Link>
              </td>
              <td>
                <div className="task-context">
                  {rid(task.project_id) ? (
                    <Link href={`/projects/${rid(task.project_id)}`}>{label(task.project_id)}</Link>
                  ) : (
                    <span>Không có dự án</span>
                  )}
                  {rid(task.parent_id) && (
                    <Link className="muted" href={`/tasks/${rid(task.parent_id)}`}>
                      <CornerDownRight size={12} />
                      {label(task.parent_id)}
                    </Link>
                  )}
                </div>
              </td>
              <td>
                <Badge tone={task.state === '1_done' ? 'green' : 'violet'}>
                  {label(task.stage_id) || 'Chưa có giai đoạn'}
                </Badge>
              </td>
              <td>
                <span className="deadline">
                  <CalendarDays size={13} />
                  {dateLabel(task.date_deadline)}
                </span>
              </td>
              <td>
                <Link
                  href={`/tasks/${task.id}`}
                  aria-label={`Mở ${task.name}`}
                  className="icon-button"
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="Chưa có nhiệm vụ phù hợp" />
  );
}

function Dashboard() {
  const me = useMe();
  const tasks = useData<{ items: Row[] }>('tasks?mine=true'),
    projects = useData<{ items: Row[] }>('projects'),
    activities = useData<Row[]>('activities');
  const firstName = String(me.user.name).split(' ').at(-1);
  return (
    <>
      <PageTitle
        eyebrow="KHÔNG GIAN CỦA BẠN"
        title={`Chào ${firstName}, cùng bắt đầu công việc.`}
        description="Nắm bắt công việc cần xử lý và trở lại đúng nơi bạn đang làm."
        action={
          <Link href="/search" className="button primary">
            <Search size={16} />
            Tìm nhiệm vụ
          </Link>
        }
      />
      <div className="dashboard-banner">
        <div>
          <Badge tone="white">
            <span className="pulse-dot" /> KẾT NỐI TRỰC TIẾP ODOO 17
          </Badge>
          <h2>Mọi công việc đều có ngữ cảnh.</h2>
          <p>Từ dự án đến nhiệm vụ con, tìm đúng việc và tiếp tục ngay.</p>
          <Link href="/my-tasks">
            Mở công việc của tôi <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden>
          <div>
            <FolderKanban />
            <span>Dự án</span>
          </div>
          <span className="art-line" />
          <div>
            <GitBranch />
            <span>Nhiệm vụ</span>
          </div>
          <span className="art-line" />
          <div>
            <CheckCircle2 />
            <span>Hoàn thành</span>
          </div>
        </div>
      </div>
      <div className="stat-grid">
        <Stat
          icon={<ClipboardList />}
          label="Công việc của tôi"
          value={
            tasks.data
              ? `${tasks.data.items.length}${tasks.data.items.length === 40 ? '+' : ''}`
              : '—'
          }
          note="Trong trang dữ liệu mới nhất"
        />
        <Stat
          icon={<FolderKanban />}
          label="Dự án đang truy cập"
          value={
            projects.data
              ? `${projects.data.items.length}${projects.data.items.length === 40 ? '+' : ''}`
              : '—'
          }
          note="Theo quyền tài khoản Odoo"
        />
        <Stat
          icon={<Bell />}
          label="Hoạt động cần xử lý"
          value={activities.data ? String(activities.data.length) : '—'}
          note="Được giao trực tiếp cho bạn"
        />
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>Công việc của tôi</h2>
            <Link href="/my-tasks">
              Xem tất cả <ArrowUpRight size={15} />
            </Link>
          </div>
          {tasks.isPending ? (
            <Loading />
          ) : tasks.error ? (
            <ErrorBox error={tasks.error} />
          ) : (
            <TaskTable rows={(tasks.data?.items || []).slice(0, 6)} />
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Cần xử lý</h2>
            <CalendarDays size={18} />
          </div>
          {activities.isPending ? (
            <Loading />
          ) : activities.error ? (
            <ErrorBox error={activities.error} />
          ) : activities.data?.length ? (
            <div className="activity-list">
              {activities.data.slice(0, 6).map((row) => (
                <Link href={`/tasks/${(row.task as Row).id}`} key={row.id}>
                  <span className="activity-icon">
                    <ClipboardList size={17} />
                  </span>
                  <div>
                    <strong>{String(row.summary || 'Hoạt động')}</strong>
                    <p>{(row.task as Row).name}</p>
                    <small>{dateLabel(row.date_deadline)}</small>
                  </div>
                  <ChevronRight size={15} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="Bạn đã xử lý hết hoạt động"
              description="Chưa có hoạt động được giao qua Odoo."
            />
          )}
        </section>
      </div>
    </>
  );
}
function Stat({
  icon,
  label: caption,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="stat">
      <div>
        <span className="stat-icon">{icon}</span>
        <span>{caption}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function Projects() {
  const [cursor, setCursor] = useState(0);
  const data = useData<{ items: Row[]; nextCursor: number | null }>(`projects?cursor=${cursor}`);
  return (
    <>
      <PageTitle
        eyebrow="DỰ ÁN"
        title="Cùng đội ngũ tiến về phía trước"
        description="Mở dự án để xem nhiệm vụ, giai đoạn và công việc liên quan."
      />
      <div className="section-toolbar">
        <span>
          <FolderKanban size={17} />
          Danh sách dự án
        </span>
        <Badge tone="green">Dữ liệu Odoo trực tiếp</Badge>
      </div>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : data.data?.items.length ? (
        <div className="project-grid">
          {data.data.items.map((p, i) => (
            <Link href={`/projects/${p.id}`} className="project-card" key={p.id}>
              <div className="project-card-top">
                <span className={`project-icon color-${i % 4}`}>
                  <FolderKanban size={23} />
                </span>
                <ArrowUpRight size={19} />
              </div>
              <h2>{p.name}</h2>
              <div
                className="project-description"
                dangerouslySetInnerHTML={{
                  __html: String(p.description || '<p>Không có mô tả dự án.</p>'),
                }}
              />
              <div className="project-card-footer">
                <span>
                  <ClipboardList size={14} />
                  {typeof p.task_count === 'number' ? `${p.task_count} nhiệm vụ` : 'Xem nhiệm vụ'}
                </span>
                <span>{label(p.user_id) || 'Đội ngũ'}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title="Chưa có dự án được phép xem" />
      )}
      <Pagination cursor={cursor} next={data.data?.nextCursor} setCursor={setCursor} />
    </>
  );
}
function Project({ id }: { id: number }) {
  const project = useData<Row>(`projects/${id}`);
  return (
    <>
      <Link className="back-link" href="/projects">
        <ArrowLeft size={15} />
        Tất cả dự án
      </Link>
      <PageTitle eyebrow={`DỰ ÁN #${id}`} title={project.data?.name || 'Đang tải dự án…'} />
      {project.error ? <ErrorBox error={project.error} /> : <Tasks project={id} embedded />}
    </>
  );
}
function Pagination({
  cursor,
  next,
  setCursor,
}: {
  cursor: number;
  next?: number | null;
  setCursor: (n: number) => void;
}) {
  return (
    <div className="pagination">
      {cursor > 0 && (
        <button className="button small" onClick={() => setCursor(0)}>
          Về đầu
        </button>
      )}
      {next != null && (
        <button className="button small" onClick={() => setCursor(next)}>
          Trang tiếp <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
function Tasks({
  mine = false,
  project,
  embedded = false,
}: {
  mine?: boolean;
  project?: number;
  embedded?: boolean;
}) {
  const searchParams = useSearchParams(),
    stage = searchParams.get('stage');
  const [cursor, setCursor] = useState(0),
    [view, setView] = useState('list');
  const data = useData<{ items: Row[]; nextCursor: number | null }>(
    `tasks?mine=${mine}&cursor=${cursor}${project ? `&project=${project}` : ''}${stage ? `&stage=${stage}` : ''}`,
  );
  const groups = new Map<string, Row[]>();
  for (const task of data.data?.items || []) {
    const key = label(task.stage_id) || 'Chưa có giai đoạn';
    groups.set(key, [...(groups.get(key) || []), task]);
  }
  return (
    <>
      {!embedded && (
        <PageTitle
          eyebrow={mine ? 'CÁ NHÂN' : 'CÔNG VIỆC'}
          title={mine ? 'Công việc của tôi' : 'Tất cả nhiệm vụ'}
          description="Các nhiệm vụ bạn được phép xem, bao gồm nhiệm vụ con ở nhiều dự án."
          action={
            <Link href="/search" className="button primary">
              <Search size={16} />
              Tìm toàn cục
            </Link>
          }
        />
      )}
      <div className="section-toolbar">
        <div className="view-tabs">
          {[
            ['list', 'Danh sách', List],
            ['kanban', 'Kanban', Columns3],
            ['tree', 'Cây nhiệm vụ', GitBranch],
          ].map(([key, text, Icon]) => {
            const I = Icon as typeof List;
            return (
              <button
                key={String(key)}
                className={view === key ? 'selected' : ''}
                onClick={() => setView(String(key))}
              >
                <I size={15} />
                {String(text)}
              </button>
            );
          })}
        </div>
        <span className="muted small-text">
          {stage ? 'Đang lọc theo giai đoạn · ' : ''}Tự làm mới mỗi 30 giây
        </span>
      </div>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : view === 'list' ? (
        <section className="panel">
          <TaskTable rows={data.data?.items || []} />
        </section>
      ) : view === 'kanban' ? (
        <div className="kanban">
          {Array.from(groups).map(([name, rows]) => (
            <section key={name}>
              <h3>
                <span className="stage-dot" />
                {name}
                <small>{rows.length}</small>
              </h3>
              {rows.map((task) => (
                <Link className="kanban-card" href={`/tasks/${task.id}`} key={task.id}>
                  <small>
                    #{task.id} · {label(task.project_id)}
                  </small>
                  <strong>{task.name}</strong>
                  {label(task.parent_id) && (
                    <p>
                      <GitBranch size={13} />
                      {label(task.parent_id)}
                    </p>
                  )}
                  <span>
                    <CalendarDays size={13} />
                    {dateLabel(task.date_deadline)}
                  </span>
                </Link>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <TaskTree rows={data.data?.items || []} />
      )}
      <Pagination cursor={cursor} next={data.data?.nextCursor} setCursor={setCursor} />
      {view === 'tree' && (
        <p className="helper">
          Cây hiển thị các bản ghi trong trang hiện tại. Mở nhiệm vụ để xem cha/con theo quyền, kể
          cả khi khác dự án.
        </p>
      )}
    </>
  );
}
function TaskTree({ rows }: { rows: Row[] }) {
  const ids = new Set(rows.map((r) => r.id));
  const render = (task: Row, depth = 0, seen = new Set<number>()): ReactNode => {
    if (seen.has(task.id)) return null;
    const visited = new Set([...seen, task.id]);
    return (
      <div key={task.id}>
        <Link
          className="tree-row"
          style={{ paddingLeft: 20 + depth * 26 }}
          href={`/tasks/${task.id}`}
        >
          <GitBranch size={16} />
          <strong>{task.name}</strong>
          <span>{label(task.project_id)}</span>
          <ChevronRight size={15} />
        </Link>
        {rows.filter((r) => rid(r.parent_id) === task.id).map((r) => render(r, depth + 1, visited))}
      </div>
    );
  };
  return (
    <section className="panel">
      {rows.length ? (
        rows.filter((t) => !rid(t.parent_id) || !ids.has(rid(t.parent_id)!)).map((t) => render(t))
      ) : (
        <Empty title="Chưa có nhiệm vụ" />
      )}
    </section>
  );
}
function SearchPage({ initial }: { initial: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(initial),
    [debounced, setDebounced] = useState(initial),
    [cursor, setCursor] = useState(0),
    [description, setDescription] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(term);
      setCursor(0);
      router.replace(`/search?q=${encodeURIComponent(term)}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [term, router]);
  const data = useData<{ items: Row[]; nextCursor: number | null; scanLimited: boolean }>(
    `tasks?q=${encodeURIComponent(debounced)}&cursor=${cursor}&description=${description}`,
    !!debounced.trim(),
    false,
  );
  return (
    <>
      <PageTitle
        eyebrow="TÌM KIẾM THÔNG MINH"
        title="Tìm đúng việc. Thấy đầy đủ ngữ cảnh."
        description="Tìm xuyên dự án và nhiệm vụ con theo quyền Odoo, có hỗ trợ tiếng Việt không dấu."
      />
      <div className="search-box">
        <Search size={23} />
        <input
          autoFocus
          aria-label="Từ khóa tìm nhiệm vụ"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Tên nhiệm vụ, một phần tiêu đề, dự án hoặc ID…"
        />
        {term && (
          <button className="icon-button" onClick={() => setTerm('')} aria-label="Xóa từ khóa">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="search-options">
        <label>
          <input
            type="checkbox"
            checked={description}
            onChange={(e) => {
              setDescription(e.target.checked);
              setCursor(0);
            }}
          />
          Tìm cả trong mô tả
        </label>
        <span>
          <ShieldCheck size={14} /> Chỉ dữ liệu bạn có quyền xem
        </span>
      </div>
      {!debounced.trim() ? (
        <Empty
          title="Bạn đang tìm công việc nào?"
          description="Thử “kiểm tra hồ sơ”, “kiem tra ho so” hoặc ID nhiệm vụ."
        />
      ) : data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : (
        <>
          <div className="section-toolbar">
            <strong>Kết quả cho “{debounced}”</strong>
            <span className="muted">{data.data?.items.length || 0} kết quả trong lượt tìm này</span>
          </div>
          <section className="panel">
            <TaskTable rows={data.data?.items || []} />
          </section>
          {data.data?.scanLimited && (
            <p className="helper">
              Còn dữ liệu chưa quét. Bấm “Tìm tiếp” để kiểm tra các nhiệm vụ còn lại, không bỏ sót
              kết quả ngoài lượt hiện tại.
            </p>
          )}
          <div className="pagination">
            {cursor > 0 && (
              <button className="button" onClick={() => setCursor(0)}>
                Về đầu
              </button>
            )}
            {data.data?.nextCursor != null && (
              <button className="button primary" onClick={() => setCursor(data.data!.nextCursor!)}>
                Tìm tiếp <ChevronRight size={15} />
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

type TaskDetail = {
  task: Row;
  ancestors: Row[];
  parentUnavailable: boolean;
  children: Row[];
  siblings: Row[];
  stages: Row[];
  users: Row[];
  fields: Record<string, { string: string; selection?: [string, string][] }>;
  canAtomicEdit: boolean;
  writesEnabled: boolean;
  odooLink: string;
};
function Task({ id }: { id: number }) {
  const router = useRouter(),
    params = useSearchParams(),
    notice = useNotice(),
    cache = useQueryClient();
  const [editing, setEditing] = useState(false),
    [saving, setSaving] = useState(false),
    [values, setValues] = useState<Record<string, unknown>>({});
  const data = useData<TaskDetail>(`tasks/${id}`, true, editing ? false : 30000);
  const [childName, setChildName] = useState(''),
    [childBusy, setChildBusy] = useState(false);
  const tab = params.get('tab') || 'overview';
  const [bookmark, setBookmark] = useState(false);
  const prefs = useData<{ items: Row[] }>('preferences?bookmarked=true', true, false);
  useEffect(() => {
    setBookmark(!!prefs.data?.items.some((t) => t.id === id));
  }, [prefs.data, id]);
  useEffect(() => {
    setEditing(false);
    setValues({});
  }, [id]);
  if (data.isPending) return <Loading />;
  if (data.error) return <ErrorBox error={data.error} retry={() => data.refetch()} />;
  if (!data.data) return null;
  const d = data.data,
    t = d.task;
  const beginEdit = () => {
    setValues({
      name: t.name || '',
      description: String(t.description || ''),
      stage_id: rid(t.stage_id) || undefined,
      state: t.state || undefined,
      user_ids: t.user_ids || [],
      date_deadline: t.date_deadline ? String(t.date_deadline).slice(0, 10) : false,
      priority: t.priority || '0',
    });
    setEditing(true);
  };
  return (
    <>
      <div className="task-topline">
        <button
          className="back-link"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/tasks'))}
        >
          <ArrowLeft size={15} />
          Quay lại
        </button>
        <div className="button-row">
          <button
            className={`icon-button ${bookmark ? 'starred' : ''}`}
            aria-label={bookmark ? 'Bỏ đánh dấu' : 'Đánh dấu nhiệm vụ'}
            onClick={async () => {
              try {
                await api('preferences', {
                  method: 'POST',
                  body: JSON.stringify({ taskId: id, bookmarked: !bookmark }),
                });
                setBookmark(!bookmark);
                cache.invalidateQueries({ queryKey: ['preferences?bookmarked=true'] });
              } catch (e) {
                notice((e as Error).message, true);
              }
            }}
          >
            <Star size={19} fill={bookmark ? 'currentColor' : 'none'} />
          </button>
          <a className="button small" href={d.odooLink} target="_blank" rel="noopener noreferrer">
            Mở trong Odoo
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <nav className="breadcrumbs" aria-label="Đường dẫn nhiệm vụ">
        <Link href="/projects">Dự án</Link>
        <ChevronRight size={12} />
        {rid(t.project_id) && (
          <>
            <Link href={`/projects/${rid(t.project_id)}`}>{label(t.project_id)}</Link>
            <ChevronRight size={12} />
          </>
        )}
        {rid(t.stage_id) && rid(t.project_id) && (
          <>
            <Link href={`/projects/${rid(t.project_id)}?stage=${rid(t.stage_id)}`}>
              {label(t.stage_id)}
            </Link>
            <ChevronRight size={12} />
          </>
        )}
        {d.ancestors.map((a) => (
          <span key={a.id}>
            <Link href={`/tasks/${a.id}`}>{a.name}</Link>
            <ChevronRight size={12} />
          </span>
        ))}
        <strong>{t.name}</strong>
      </nav>
      {d.parentUnavailable && (
        <p className="helper">Một phần đường dẫn cha không khả dụng theo quyền của bạn.</p>
      )}
      <div className="task-title">
        <div>
          <div className="button-row">
            <span className="eyebrow">NHIỆM VỤ #{id}</span>
            <Badge tone="violet">{label(t.stage_id) || 'Chưa có giai đoạn'}</Badge>
            {!!t.state && (
              <Badge>
                {d.fields.state?.selection?.find(([k]) => k === t.state)?.[1] || String(t.state)}
              </Badge>
            )}
          </div>
          <h1>{t.name}</h1>
        </div>
        {!editing && (
          <button className="button primary" disabled={!d.canAtomicEdit} onClick={beginEdit}>
            Chỉnh sửa nhiệm vụ
          </button>
        )}
      </div>
      {!d.canAtomicEdit && d.writesEnabled && (
        <p className="helper">
          <LockKeyhole size={14} />
          Chỉnh sửa trực tiếp cần addon Smart Workspace Bridge để kiểm soát xung đột. Hãy dùng “Mở
          trong Odoo” nếu hosting không hỗ trợ addon.
        </p>
      )}
      <div className="task-tabs">
        {[
          ['overview', 'Tổng quan'],
          ['discussion', 'Thảo luận'],
          ['documents', 'Tài liệu'],
        ].map(([key, text]) => (
          <Link key={key} href={`/tasks/${id}?tab=${key}`} className={tab === key ? 'active' : ''}>
            {text}
          </Link>
        ))}
      </div>
      {editing ? (
        <form
          className="panel edit-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const changed: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(values)) {
                const before =
                  k === 'stage_id'
                    ? rid(t.stage_id)
                    : k === 'date_deadline'
                      ? t.date_deadline
                        ? String(t.date_deadline).slice(0, 10)
                        : false
                      : t[k];
                if (JSON.stringify(before) !== JSON.stringify(v) && v !== undefined) changed[k] = v;
              }
              if (!Object.keys(changed).length) {
                setEditing(false);
                return;
              }
              await write(
                `tasks/${id}`,
                { expectedRevision: t.workspace_revision, values: changed },
                'PATCH',
              );
              setEditing(false);
              await data.refetch();
              notice('Đã lưu thay đổi vào Odoo.');
            } catch (err) {
              notice((err as Error).message, true);
            } finally {
              setSaving(false);
            }
          }}
        >
          <h2>Chỉnh sửa nhiệm vụ</h2>
          <label>
            Tên nhiệm vụ
            <input
              required
              value={String(values.name || '')}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          </label>
          <label>
            Mô tả (HTML an toàn)
            <textarea
              rows={6}
              value={String(values.description || '')}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </label>
          <div className="form-grid">
            <label>
              Giai đoạn
              <select
                value={Number(values.stage_id) || ''}
                onChange={(e) => setValues({ ...values, stage_id: Number(e.target.value) })}
              >
                <option value="" disabled>
                  Chọn giai đoạn
                </option>
                {d.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trạng thái
              <select
                value={String(values.state || '')}
                onChange={(e) => setValues({ ...values, state: e.target.value })}
              >
                {d.fields.state?.selection?.map(([v, text]) => (
                  <option key={v} value={v}>
                    {text}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Thời hạn
              <input
                type="date"
                value={values.date_deadline ? String(values.date_deadline) : ''}
                onChange={(e) => setValues({ ...values, date_deadline: e.target.value || false })}
              />
            </label>
            <label>
              Ưu tiên
              <select
                value={String(values.priority || '0')}
                onChange={(e) => setValues({ ...values, priority: e.target.value })}
              >
                {d.fields.priority?.selection?.map(([v, text]) => (
                  <option key={v} value={v}>
                    {text}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Người phụ trách (giữ Ctrl/Cmd để chọn nhiều)
            <select
              multiple
              value={((values.user_ids as number[]) || []).map(String)}
              onChange={(e) =>
                setValues({
                  ...values,
                  user_ids: Array.from(e.target.selectedOptions).map((o) => Number(o.value)),
                })
              }
            >
              {d.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <div className="button-row">
            <button className="button primary" disabled={saving}>
              {saving && <LoaderCircle className="spin" size={15} />}Lưu vào Odoo
            </button>
            <button
              type="button"
              className="button"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Hủy
            </button>
          </div>
          <p className="helper">
            Bản nháp được giữ khi có lỗi. Nếu có xung đột, hãy ghi lại nội dung và tải lại trước khi
            chỉnh sửa tiếp.
          </p>
        </form>
      ) : (
        <div className="task-layout">
          <div className="task-main">
            {tab === 'documents' ? (
              <TaskDocuments id={id} enabled={d.writesEnabled} />
            ) : tab === 'discussion' ? (
              <Chatter id={id} enabled={d.writesEnabled} />
            ) : (
              <>
                <section className="panel padded">
                  <h2>Mô tả công việc</h2>
                  {t.description ? (
                    <div
                      className="rich-text"
                      dangerouslySetInnerHTML={{ __html: String(t.description) }}
                    />
                  ) : (
                    <p className="muted">Chưa có mô tả.</p>
                  )}
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <h2>
                      <GitBranch size={18} />
                      Nhiệm vụ con{' '}
                      <Badge>
                        {d.children.length}
                        {d.children.length === 100 ? '+' : ''}
                      </Badge>
                    </h2>
                  </div>
                  <TaskTable rows={d.children} />
                  {d.writesEnabled && (
                    <form
                      className="inline-create"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setChildBusy(true);
                        try {
                          const result = await write<{ id: number }>(`tasks/${id}/children`, {
                            name: childName,
                          });
                          setChildName('');
                          await data.refetch();
                          notice('Đã tạo nhiệm vụ con.');
                          router.push(`/tasks/${result.id}`);
                        } catch (err) {
                          notice((err as Error).message, true);
                        } finally {
                          setChildBusy(false);
                        }
                      }}
                    >
                      <Plus size={17} />
                      <input
                        aria-label="Tên nhiệm vụ con"
                        placeholder="Thêm nhiệm vụ con…"
                        required
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                      />
                      <button className="button small" disabled={childBusy}>
                        Tạo nhiệm vụ
                      </button>
                    </form>
                  )}
                </section>
                <Chatter id={id} enabled={d.writesEnabled} />
              </>
            )}
          </div>
          <aside className="task-aside">
            <section className="panel padded">
              <h2>Thông tin nhiệm vụ</h2>
              <dl>
                <dt>
                  <FolderKanban size={15} />
                  Dự án chứa nhiệm vụ
                </dt>
                <dd>
                  {rid(t.project_id) ? (
                    <Link href={`/projects/${rid(t.project_id)}`}>{label(t.project_id)}</Link>
                  ) : (
                    'Không có dự án'
                  )}
                </dd>
                <dt>
                  <GitBranch size={15} />
                  Nhiệm vụ cha
                </dt>
                <dd>
                  {rid(t.parent_id) ? (
                    <Link href={`/tasks/${rid(t.parent_id)}`}>{label(t.parent_id)}</Link>
                  ) : (
                    'Nhiệm vụ gốc'
                  )}
                </dd>
                <dt>
                  <Users size={15} />
                  Người phụ trách
                </dt>
                <dd>
                  {((t.user_ids as number[]) || [])
                    .map((uid) => d.users.find((u) => u.id === uid)?.name || `#${uid}`)
                    .join(', ') || 'Chưa phân công'}
                </dd>
                <dt>
                  <CalendarDays size={15} />
                  Thời hạn
                </dt>
                <dd>{dateLabel(t.date_deadline)}</dd>
                <dt>
                  <Star size={15} />
                  Ưu tiên
                </dt>
                <dd>
                  {d.fields.priority?.selection?.find(([k]) => k === t.priority)?.[1] ||
                    String(t.priority || '—')}
                </dd>
              </dl>
            </section>
            {d.siblings.length > 0 && (
              <section className="panel padded">
                <h2>Nhiệm vụ cùng cấp</h2>
                <div className="sibling-list">
                  {d.siblings.map((s) => (
                    <Link href={`/tasks/${s.id}`} key={s.id}>
                      <span>
                        {s.name}
                        <small>{label(s.project_id)}</small>
                      </span>
                      <ChevronRight size={14} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <div className="context-note">
              <ShieldCheck size={20} />
              <p>
                Nhiệm vụ cha và con có thể thuộc các dự án khác nhau. Mọi liên kết giữ nguyên ID gốc
                Odoo.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Chatter({ id, enabled }: { id: number; enabled: boolean }) {
  const params = useSearchParams(),
    notice = useNotice(),
    me = useMe();
  const draftKey = `workspace-draft:${me.instance}:${me.user.id}:${id}`;
  const data = useData<Row[]>(
      `tasks/${id}/messages${params.get('message') ? `?message=${encodeURIComponent(params.get('message')!)}` : ''}`,
    ),
    [text, setText] = useState(''),
    [internal, setInternal] = useState(false),
    [pending, setPending] = useState(false);
  useEffect(() => {
    setText(sessionStorage.getItem(draftKey) || '');
  }, [id, draftKey]);
  useEffect(() => {
    const message = params.get('message');
    if (message && data.data)
      document
        .getElementById(`message-${message}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [params, data.data]);
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <MessageSquare size={18} />
          Trao đổi trên nhiệm vụ
        </h2>
        <Badge>Chatter</Badge>
      </div>
      {enabled && (
        <form
          className="composer"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            try {
              await write(`tasks/${id}/messages`, { text, internal });
              setText('');
              sessionStorage.removeItem(draftKey);
              await data.refetch();
              notice('Đã gửi trao đổi vào Odoo.');
            } catch (err) {
              notice((err as Error).message, true);
            } finally {
              setPending(false);
            }
          }}
        >
          <textarea
            aria-label="Nội dung trao đổi"
            required
            maxLength={10000}
            rows={3}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              sessionStorage.setItem(draftKey, e.target.value);
            }}
            placeholder="Trao đổi với đội ngũ về nhiệm vụ này…"
          />
          <div>
            <label>
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
              />
              Ghi chú nội bộ
            </label>
            <button className="button primary small" disabled={pending || !text.trim()}>
              {pending ? <LoaderCircle className="spin" size={14} /> : <Send size={14} />}Gửi
            </button>
          </div>
          <p className="helper">
            Bản nháp lưu trong phiên trình duyệt này. Không tự động gửi lại khi mất kết nối.
          </p>
        </form>
      )}
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : data.data?.length ? (
        <div className="messages">
          {data.data.map((m) => (
            <article
              id={`message-${m.id}`}
              key={m.id}
              className={params.get('message') === String(m.id) ? 'highlighted' : ''}
            >
              <span className="avatar small-avatar">{label(m.author_id).charAt(0) || 'O'}</span>
              <div>
                <div className="message-header">
                  <strong>{label(m.author_id) || 'Odoo'}</strong>
                  <time>
                    {dateLabel(m.date)}{' '}
                    {typeof m.date === 'string' ? m.date.slice(11, 16) + ' UTC' : ''}
                  </time>
                  <small>#{m.id}</small>
                  <Badge>{label(m.subtype_id)}</Badge>
                </div>
                <div
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: String(m.body || '') }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Bắt đầu trao đổi"
          description="Các bình luận và ghi chú Odoo sẽ xuất hiện tại đây."
        />
      )}
    </section>
  );
}
function TaskDocuments({ id, enabled }: { id: number; enabled: boolean }) {
  const notice = useNotice(),
    data = useData<Row[]>(`tasks/${id}/attachments`);
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <Paperclip size={18} />
          Tài liệu nhiệm vụ
        </h2>
        {enabled && (
          <label className={`button small ${busy ? 'disabled' : ''}`}>
            <Plus size={14} />
            {busy ? 'Đang tải lên…' : 'Tải lên (tối đa 5 MB)'}
            <input
              aria-label="Tải tệp đính kèm"
              type="file"
              hidden
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  notice('Tệp tối đa 5 MB.', true);
                  return;
                }
                setBusy(true);
                try {
                  const buffer = new Uint8Array(await file.arrayBuffer());
                  let binary = '';
                  for (let i = 0; i < buffer.length; i += 32768)
                    binary += String.fromCharCode(...buffer.subarray(i, i + 32768));
                  await write(`tasks/${id}/attachments`, { name: file.name, data: btoa(binary) });
                  await data.refetch();
                  notice('Đã tải tài liệu lên Odoo.');
                } catch (err) {
                  notice((err as Error).message, true);
                } finally {
                  setBusy(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
        )}
      </div>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : data.data?.length ? (
        <div className="file-list">
          {data.data.map((f) => (
            <a href={`/api/tasks/${id}/attachments/${f.id}`} key={f.id} className="file-row">
              <span className="file-icon">
                <Files size={21} />
              </span>
              <div>
                <strong>{f.name}</strong>
                <small>
                  {Math.ceil(Number(f.file_size || 0) / 1024)} KB · {dateLabel(f.create_date)}
                </small>
              </div>
              <ArrowUpRight size={18} />
            </a>
          ))}
        </div>
      ) : (
        <Empty
          title="Chưa có tài liệu"
          description="Tệp được lưu tại nhiệm vụ gốc trên Odoo; quyền tải xuống được kiểm tra lại mỗi lần."
        />
      )}
      <p className="helper padded-note">
        Tải xuống để xem hoặc chỉnh sửa bằng ứng dụng phù hợp. Chỉnh sửa đồng thời và xem trước
        trong trình duyệt chưa được triển khai.
      </p>
    </section>
  );
}
function Notifications() {
  const me = useMe(),
    notice = useNotice(),
    data = useData<{
      available: boolean;
      reason?: string;
      items: (Row & { message: Row; targetName: string; kind: string; href: string })[];
    }>('notifications');
  return (
    <>
      <PageTitle
        eyebrow="HỘP THƯ"
        title="Thông báo của bạn"
        description="Mở đúng nhiệm vụ và bình luận liên quan từ thông báo Odoo."
      />
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : !data.data?.available ? (
        <section className="panel">
          <Empty title="Thông báo qua API chưa khả dụng" description={data.data?.reason} />
          <a
            className="button centered"
            href={`${me.odooUrl}/web#action=mail.action_discuss`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mở hộp thư Odoo
            <ExternalLink size={14} />
          </a>
        </section>
      ) : data.data.items.length ? (
        <section className="panel notification-list">
          {data.data.items.map((n) => (
            <article key={n.id} className={n.is_read ? '' : 'unread'}>
              <span className="activity-icon">
                <MessageSquare size={18} />
              </span>
              <Link href={n.href}>
                <strong>{n.targetName}</strong>
                <p>{String(n.message.body || '').slice(0, 220)}</p>
                <small>
                  {label(n.message.author_id)} · {dateLabel(n.message.date)}
                </small>
              </Link>
              {!n.is_read && me.writesEnabled && (
                <button
                  className="button small"
                  onClick={async () => {
                    try {
                      await write(`notifications/${n.id}`, {});
                      await data.refetch();
                    } catch (e) {
                      notice((e as Error).message, true);
                    }
                  }}
                >
                  Đã đọc
                </button>
              )}
            </article>
          ))}
        </section>
      ) : (
        <Empty title="Chưa có thông báo liên quan đến nhiệm vụ hoặc hội thoại" />
      )}
    </>
  );
}
function ConnectionSettings() {
  const me = useMe(),
    [run, setRun] = useState(false);
  const data = useData<{
    version: string;
    hosting: string;
    checks: Record<
      string,
      { read: boolean; reason?: string; customFields?: string[]; bridge?: boolean }
    >;
  }>('connection', run, false);
  return (
    <>
      <PageTitle
        eyebrow="CẤU HÌNH"
        title="Kết nối Odoo 17"
        description="Cấu hình máy chủ do quản trị viên quản lý; nhân viên chỉ dùng tài khoản Odoo cá nhân."
      />
      <section className="panel padded settings-panel">
        <div className="connection-heading">
          <span className="project-icon">
            <Wifi size={25} />
          </span>
          <div>
            <h2>Odoo External API</h2>
            <p>XML-RPC · /xmlrpc/2/common và /xmlrpc/2/object</p>
          </div>
          <Badge tone="green">Đã xác thực</Badge>
        </div>
        <dl>
          <dt>Máy chủ Odoo</dt>
          <dd>{me.odooUrl}</dd>
          <dt>Loại hosting</dt>
          <dd>{me.hosting}</dd>
          <dt>Chế độ đăng nhập</dt>
          <dd>{me.authMode === 'api_key' ? 'API key cá nhân' : 'Mật khẩu / API key cá nhân'}</dd>
          <dt>Quyền ghi của môi trường</dt>
          <dd>{me.writesEnabled ? 'Đã bật — Odoo tiếp tục kiểm tra ACL' : 'Chỉ đọc'}</dd>
        </dl>
        <button
          className="button primary"
          disabled={data.isFetching}
          onClick={() => (run ? data.refetch() : setRun(true))}
        >
          <RefreshCw size={16} className={data.isFetching ? 'spin' : ''} />
          Kiểm tra khả năng API
        </button>
        {data.isFetching && (
          <p className="helper">Đang kiểm tra metadata và quyền đọc bằng tài khoản của bạn…</p>
        )}
        {data.error && <ErrorBox error={data.error} />}{' '}
        {data.data && (
          <>
            <h3>Phiên bản: {data.data.version}</h3>
            <div className="capabilities">
              {Object.entries(data.data.checks).map(([name, result]) => (
                <div key={name}>
                  <code>{name}</code>
                  <Badge tone={result.read ? 'green' : 'amber'}>
                    {result.read ? 'Đọc được' : result.reason || 'Chưa khả dụng'}
                  </Badge>
                  {result.bridge && <small>Atomic update bridge</small>}
                  {!!result.customFields?.length && (
                    <small>Trường tùy chỉnh: {result.customFields.join(', ')}</small>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        <p className="helper">
          Kết quả chỉ thể hiện khả năng của tài khoản hiện tại. Không suy luận loại hosting từ tên
          miền. Odoo Online cần gói hỗ trợ External API.
        </p>
      </section>
    </>
  );
}
function Preferences({ bookmarks }: { bookmarks: boolean }) {
  const data = useData<{ items: Row[] }>(`preferences${bookmarks ? '?bookmarked=true' : ''}`);
  return (
    <>
      <PageTitle
        eyebrow="CÁ NHÂN"
        title={bookmarks ? 'Nhiệm vụ đã đánh dấu' : 'Công việc gần đây'}
        description="Quyền truy cập Odoo được kiểm tra lại trước khi hiển thị từng nhiệm vụ."
      />
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : (
        <section className="panel">
          <TaskTable rows={data.data?.items || []} />
        </section>
      )}
    </>
  );
}
function Documents() {
  return (
    <>
      <PageTitle
        eyebrow="TÀI LIỆU"
        title="Tài liệu theo đúng công việc"
        description="Tệp đính kèm được giữ trong Odoo và kiểm tra quyền theo nhiệm vụ gốc."
      />
      <section className="panel padded">
        <Empty
          title="Mở nhiệm vụ để xem tài liệu"
          description="Tìm nhiệm vụ, mở tab Tài liệu để tải xuống hoặc đính kèm tệp. Kho tài liệu tổng hợp chưa được triển khai."
        />
        <Link href="/search" className="button primary centered">
          <Search size={16} />
          Tìm nhiệm vụ có tài liệu
        </Link>
      </section>
    </>
  );
}
