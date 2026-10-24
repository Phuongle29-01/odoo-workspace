'use client';

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
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
import dynamic from 'next/dynamic';
import { MeContext, NoticeContext, useMe, useNotice, type Me } from './context';
import { Badge, Empty, ErrorBox, Loading } from './ui';
import TaskTable from './task-table';
import Dashboard from './dashboard';
import SearchPage, { SmartSearch, TaskFilters } from './smart-search';
import { useUiPreferences } from '@/lib/preferences';
import { useMediaQuery, useOnline } from '@/lib/hooks';
const Discuss = dynamic(() => import('./discuss'), { loading: Loading });
const Task = dynamic(() => import('./task-detail'), { loading: Loading });
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

const nav = [
  ['Tổng quan', '/', LayoutDashboard],
  ['Công việc của tôi', '/my-tasks', ClipboardList],
  ['Dự án', '/projects', FolderKanban],
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
    [mobile, setMobile] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null),
    sidebarRef = useRef<HTMLElement>(null),
    menuRef = useRef<HTMLButtonElement>(null);
  const online = useOnline(),
    small = useMediaQuery('(max-width: 760px)');
  const wasOnline = useRef(true),
    menuWasOpen = useRef(false);
  useEffect(() => {
    if (online && !wasOnline.current) {
      cache.invalidateQueries();
      setNotice({
        text: 'Đã có mạng trở lại. Đang tải dữ liệu mới nhất; bản nháp vẫn được giữ.',
        error: false,
      });
    }
    wasOnline.current = online;
  }, [online, cache]);
  useEffect(() => {
    if (!mobile || !small) {
      if (menuWasOpen.current) menuRef.current?.focus();
      menuWasOpen.current = false;
      return;
    }
    menuWasOpen.current = true;
    const first = sidebarRef.current?.querySelector<HTMLElement>('a,button');
    first?.focus();
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobile(false);
      }
      if (e.key === 'Tab') {
        const targets = [...(sidebarRef.current?.querySelectorAll<HTMLElement>('a,button') || [])];
        const first = targets[0],
          last = targets.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [mobile, small]);
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
    (pathname === '/search'
      ? 'Tìm kiếm'
      : pathname === '/activities'
        ? 'Hoạt động cần làm'
        : 'Chi tiết nhiệm vụ');
  return (
    <MeContext.Provider value={me.data}>
      <NoticeContext.Provider value={notify}>
        <div className="workspace">
          <a className="skip-link" href="#main-content">
            Đến nội dung chính
          </a>
          {mobile && (
            <button className="backdrop" aria-label="Đóng menu" onClick={() => setMobile(false)} />
          )}
          <aside
            ref={sidebarRef}
            id="workspace-sidebar"
            inert={small && !mobile}
            className={`sidebar ${mobile ? 'open' : ''}`}
          >
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
            <nav aria-label="Điều hướng chính">
              {nav.map(([text, url, Icon]) => (
                <Link
                  key={url}
                  aria-current={
                    (url === '/' ? pathname === '/' : pathname.startsWith(url)) ? 'page' : undefined
                  }
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
          <div className="main-shell" inert={small && mobile}>
            <header className="topbar">
              <button
                ref={menuRef}
                aria-expanded={mobile}
                aria-controls="workspace-sidebar"
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
              <SmartSearch inputRef={searchRef} />
              <div className={`connection ${me.error || !online ? 'offline' : ''}`}>
                <span className="pulse-dot" />
                {me.error || !online ? 'Mất kết nối' : 'Đã kết nối'}
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
            {!online && (
              <div className="network-banner" role="status">
                <Wifi size={16} />
                Đang ngoại tuyến. Bản nháp được giữ trên thiết bị; kết nối lại trước khi gửi hoặc
                lưu.
              </div>
            )}
            {!me.data.writesEnabled && (
              <div className="read-only">
                <LockKeyhole size={14} />
                Chế độ chỉ đọc · Các thao tác ghi vào Odoo đang được khóa.
              </div>
            )}
            <main id="main-content" tabIndex={-1} className="content">
              {pathname === '/' ? (
                <Dashboard user={me.data.user} />
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
              ) : pathname === '/activities' ? (
                <Activities />
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
    router = useRouter(),
    pathname = usePathname(),
    prefs = useUiPreferences(),
    notice = useNotice();
  const [cursor, setCursor] = useState(0);
  const explicit = searchParams.get('view');
  const view = ['list', 'kanban', 'tree'].includes(explicit || '')
    ? explicit!
    : prefs.value.view || 'list';
  const params = new URLSearchParams(searchParams.toString());
  if (mine) params.set('mine', 'true');
  if (project) params.set('project', String(project));
  params.set('cursor', String(cursor));
  const stage = params.get('stage');
  useEffect(() => setCursor(0), [searchParams]);
  function filter(name: string, value: string) {
    if (name === 'project' && project) {
      router.push(value ? `/projects/${value}` : '/tasks');
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    value ? next.set(name, value) : next.delete(name);
    router.replace(`${pathname}?${next}`, { scroll: false });
  }
  const data = useData<{ items: Row[]; nextCursor: number | null }>(`tasks?${params}`);
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
        <div className="view-tabs" role="group" aria-label="Cách xem nhiệm vụ">
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
                aria-pressed={view === key}
                onClick={() => {
                  filter('view', String(key));
                  prefs
                    .save({ view: key as 'list' | 'kanban' | 'tree' })
                    .catch((e) => notice(e.message, true));
                }}
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
      <TaskFilters params={params} onChange={filter} lockedMine={mine} />
      <div className="list-order">
        <label>
          Sắp xếp{' '}
          <select
            aria-label="Sắp xếp nhiệm vụ"
            value={params.get('sort') || 'id'}
            onChange={(e) => filter('sort', e.target.value)}
          >
            <option value="id">Thứ tự nhiệm vụ</option>
            <option value="updated">Cập nhật gần nhất</option>
            <option value="deadline">Thời hạn</option>
          </select>
        </label>
        <span className="muted">Cách xem được lưu riêng cho tài khoản của bạn.</span>
      </div>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} retry={() => data.refetch()} />
      ) : !data.data?.items.length ? (
        <Empty
          title="Chưa có nhiệm vụ phù hợp"
          description="Thử thay đổi bộ lọc để xem các công việc khác."
        />
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
function Notifications() {
  const params = useSearchParams(),
    router = useRouter();
  const [saving, setSaving] = useState<number | null>(null);
  const read = params.get('read') || 'all',
    kind = params.get('kind') || 'all',
    subtype = params.get('subtype') || 'all';
  function filter(name: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (name === 'read' || name === 'kind') next.delete('needs');
    if (name === 'needs' && value === 'true') {
      next.delete('read');
      next.delete('kind');
    }
    value === 'all' ? next.delete(name) : next.set(name, value);
    window.history.replaceState(null, '', `/notifications?${next}`);
  }
  const me = useMe(),
    notice = useNotice();
  type NotificationPage = {
    available: boolean;
    reason?: string;
    nextCursor?: number | null;
    items: (Row & { message: Row; targetName: string; kind: string; href: string; task?: Row })[];
  };
  const apiParams = new URLSearchParams();
  for (const key of ['read', 'kind'])
    if (params.get(key) && params.get(key) !== 'all') apiParams.set(key, params.get(key)!);
  if (params.get('needs') === 'true') {
    apiParams.set('read', 'unread');
    apiParams.set('kind', 'task');
  }
  const from = params.get('from') || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    const date = new Date(`${from}T00:00:00`);
    if (Number.isFinite(date.getTime())) apiParams.set('after', date.toISOString());
  }
  apiParams.sort();
  const stream = useInfiniteQuery<NotificationPage, ApiError>({
    queryKey: ['notifications', apiParams.toString()],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api<NotificationPage>(
        `notifications?${apiParams}${pageParam ? `&before=${pageParam}` : ''}`,
        { signal },
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    retry: false,
    refetchInterval: 30000,
  });
  const first = stream.data?.pages[0];
  const merged = [
    ...new Map(
      (stream.data?.pages || []).flatMap((page) => page.items).map((row) => [row.id, row]),
    ).values(),
  ];
  const data = { ...stream, data: first ? { ...first, items: merged } : undefined };
  const taskOptions = useData<{ projects: Row[] }>('task-options', true, false);
  const items = (data.data?.items || []).filter(
    (n) =>
      (read === 'all' || (read === 'read') === n.is_read) &&
      (kind === 'all' || n.kind === kind) &&
      (subtype === 'all' || String(rid(n.message.subtype_id)) === subtype) &&
      (!params.get('project') || rid(n.task?.project_id) === Number(params.get('project'))) &&
      (params.get('needs') !== 'true' ||
        (!n.is_read &&
          n.kind === 'task' &&
          !['1_done', '1_canceled'].includes(String(n.task?.state)))),
  );
  const subtypes = new Map(
    (data.data?.items || [])
      .filter((n) => rid(n.message.subtype_id))
      .map((n) => [rid(n.message.subtype_id)!, label(n.message.subtype_id)]),
  );
  return (
    <>
      <PageTitle
        eyebrow="HỘP THƯ"
        title="Thông báo của bạn"
        description="Mở đúng nhiệm vụ và bình luận liên quan từ thông báo Odoo."
      />
      <div className="notification-filters">
        <button
          className="button small"
          aria-pressed={params.get('needs') === 'true'}
          onClick={() => filter('needs', params.get('needs') === 'true' ? 'all' : 'true')}
        >
          Cần xử lý
        </button>
        <label>
          <span>Từ ngày</span>
          <input
            type="date"
            aria-label="Thông báo từ ngày"
            value={from}
            onChange={(e) => filter('from', e.target.value || 'all')}
          />
        </label>
        <label>
          <span className="sr-only">Dự án thông báo</span>
          <select
            aria-label="Dự án thông báo"
            value={params.get('project') || 'all'}
            onChange={(e) => filter('project', e.target.value)}
          >
            <option value="all">Tất cả dự án</option>
            {taskOptions.data?.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="view-tabs" role="group" aria-label="Trạng thái thông báo">
          {[
            ['all', 'Tất cả'],
            ['unread', 'Chưa đọc'],
            ['read', 'Đã đọc'],
          ].map(([key, text]) => (
            <button
              key={key}
              aria-pressed={read === key}
              className={read === key ? 'selected' : ''}
              onClick={() => filter('read', key)}
            >
              {text}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Loại thông báo</span>
          <select
            aria-label="Loại thông báo"
            value={kind}
            onChange={(e) => filter('kind', e.target.value)}
          >
            <option value="all">Tất cả loại thông báo</option>
            <option value="task">Nhiệm vụ</option>
            <option value="channel">Thảo luận</option>
          </select>
        </label>
        {subtypes.size > 0 && (
          <label>
            <span className="sr-only">Loại sự kiện Odoo</span>
            <select
              aria-label="Loại sự kiện Odoo"
              value={subtype}
              onChange={(e) => filter('subtype', e.target.value)}
            >
              <option value="all">Tất cả sự kiện</option>
              {[...subtypes].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="muted" aria-live="polite">
          {items.length} thông báo phù hợp đã tải
        </span>
      </div>
      {data.isPending ? (
        <Loading />
      ) : data.error && !data.data ? (
        <ErrorBox error={data.error} retry={() => data.refetch()} />
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
      ) : items.length ? (
        <section className="panel notification-list">
          {items.map((n) => (
            <article key={n.id} className={n.is_read ? '' : 'unread'}>
              <span className="activity-icon">
                <MessageSquare size={18} />
              </span>
              <Link href={n.kind === 'task' ? `${n.href}&focus=1` : n.href}>
                <span className="notification-kind">
                  {n.kind === 'task' ? 'Nhiệm vụ' : n.kind === 'channel' ? 'Thảo luận' : 'Odoo'} ·{' '}
                  {n.is_read ? 'Đã đọc' : 'Chưa đọc'}
                  {label(n.message.subtype_id) ? ` · ${label(n.message.subtype_id)}` : ''}
                </span>
                <strong>{n.targetName}</strong>
                <p>{String(n.message.body || '').slice(0, 220)}</p>
                <small>
                  {label(n.message.author_id)} · {dateLabel(n.message.date)}
                </small>
              </Link>
              {!n.is_read && me.writesEnabled && (
                <button
                  className="button small"
                  disabled={saving === n.id}
                  onClick={async () => {
                    setSaving(n.id);
                    try {
                      await write(`notifications/${n.id}`, {});
                      await data.refetch();
                      notice('Đã đánh dấu thông báo là đã đọc.');
                    } catch (e) {
                      notice((e as Error).message, true);
                    } finally {
                      setSaving(null);
                    }
                  }}
                >
                  {saving === n.id ? 'Đang lưu…' : 'Đánh dấu đã đọc'}
                </button>
              )}
            </article>
          ))}
        </section>
      ) : (
        <Empty
          title={
            stream.hasNextPage
              ? 'Chưa có thông báo phù hợp trong phần đã tải'
              : 'Chưa có thông báo liên quan đến nhiệm vụ hoặc hội thoại'
          }
          description={
            stream.hasNextPage
              ? 'Tải tiếp để kiểm tra các thông báo cũ hơn theo quyền của bạn.'
              : undefined
          }
        />
      )}
      {stream.isFetching && !stream.isPending && (
        <p className="helper" role="status">
          Đang đồng bộ thông báo…
        </p>
      )}
      {stream.error && data.data && (
        <ErrorBox error={stream.error} retry={() => stream.refetch()} />
      )}
      {stream.hasNextPage && (
        <div className="pagination">
          <button
            className="button"
            disabled={stream.isFetching}
            onClick={() => void stream.fetchNextPage()}
          >
            {stream.isFetching ? 'Đang tải…' : 'Tải thông báo cũ hơn'}
          </button>
        </div>
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
      { read: boolean; write?: boolean; reason?: string; customFields?: string[]; bridge?: boolean }
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
                  {result.read && (
                    <Badge tone={result.write ? 'green' : 'amber'}>
                      {result.write ? 'ACL cho phép ghi' : 'ACL không cho ghi'}
                    </Badge>
                  )}
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
          Quyền ghi ở đây là ACL của model; Odoo còn kiểm tra record rules khi thao tác từng bản
          ghi. Kết quả chỉ thể hiện khả năng của tài khoản hiện tại. Không suy luận loại hosting từ
          tên miền. Odoo Online cần gói hỗ trợ External API.
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

function Activities() {
  const data = useData<Row[]>('activities');
  return (
    <>
      <PageTitle
        eyebrow="HOẠT ĐỘNG"
        title="Hoạt động cần xử lý"
        description="Các hoạt động được giao cho bạn trên Odoo."
      />
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : (
        <section className="panel activity-list">
          {data.data?.length ? (
            data.data.map((row) => (
              <Link key={row.id} href={`/tasks/${(row.task as Row).id}?tab=activity`}>
                <span className="activity-icon">
                  <CalendarDays size={19} />
                </span>
                <div>
                  <strong>{String(row.summary || 'Hoạt động')}</strong>
                  <p>{(row.task as Row).name}</p>
                  <small>{dateLabel(row.date_deadline)}</small>
                </div>
                <ChevronRight size={18} />
              </Link>
            ))
          ) : (
            <Empty title="Chưa có hoạt động cần xử lý" />
          )}
        </section>
      )}
    </>
  );
}
