'use client';
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
  type KeyboardEvent,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FolderKanban,
  GitBranch,
  ChevronRight,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import { useMediaQuery } from '@/lib/hooks';
import { useUiPreferences } from '@/lib/preferences';
import { useData, label, rid, dateLabel, type Row } from '@/lib/client';
import { useNotice } from './context';
import { Empty, ErrorBox, Loading } from './ui';
import type { TaskDetail } from './task-detail';

export function TaskNavigation({ detail }: { detail: TaskDetail }) {
  const { task, ancestors, children, siblings } = detail;
  return (
    <div className="task-navigation">
      <h2>
        <GitBranch size={16} />
        Điều hướng nhiệm vụ
      </h2>
      <nav aria-label="Cây nhiệm vụ">
        <div className="nav-section-label">DỰ ÁN CHỨA NHIỆM VỤ</div>
        {rid(task.project_id) && (
          <Link className="tree-project" href={`/projects/${rid(task.project_id)}`}>
            <FolderKanban size={16} />
            {label(task.project_id)}
          </Link>
        )}
        <div className="nav-section-label">ĐƯỜNG DẪN CHA / CON</div>
        <ul className="nav-tree">
          {ancestors.map((a, i) => (
            <li key={a.id} style={{ paddingLeft: i * 8 }}>
              <Link href={`/tasks/${a.id}`}>
                <GitBranch size={14} />
                <span>
                  {a.name}
                  <small>{label(a.project_id)}</small>
                </span>
              </Link>
            </li>
          ))}
          <li className="current-task" aria-current="page">
            <strong>{task.name}</strong>
            <small>Đang mở · #{task.id}</small>
          </li>
          {children.map((c) => (
            <li key={c.id} className="child-node">
              <Link href={`/tasks/${c.id}`}>
                <ChevronRight size={14} />
                <span>
                  {c.name}
                  <small>{label(c.project_id)}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!children.length && <p className="helper">Chưa có nhiệm vụ con.</p>}
        {siblings.length > 0 && (
          <>
            <div className="nav-section-label">CÙNG NHIỆM VỤ CHA</div>
            <ul className="nav-tree">
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link href={`/tasks/${s.id}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </div>
  );
}
export function TaskSummary({ detail }: { detail: TaskDetail }) {
  const { task: t, users, fields } = detail;
  return (
    <section className="panel task-summary" aria-label="Thông tin nhiệm vụ">
      <dl>
        <div>
          <dt>Người phụ trách</dt>
          <dd>
            {((t.user_ids as number[]) || [])
              .map((id) => users.find((u) => u.id === id)?.name || `#${id}`)
              .join(', ') || 'Chưa phân công'}
          </dd>
        </div>
        <div>
          <dt>Thời hạn</dt>
          <dd>{dateLabel(t.date_deadline)}</dd>
        </div>
        <div>
          <dt>Trạng thái</dt>
          <dd>
            {fields.state?.selection?.find(([key]) => key === t.state)?.[1] || 'Chưa xác định'}
          </dd>
        </div>
        <div>
          <dt>Giai đoạn</dt>
          <dd>{label(t.stage_id) || 'Chưa có giai đoạn'}</dd>
        </div>
        <div>
          <dt>Dự án</dt>
          <dd>
            {rid(t.project_id) ? (
              <Link href={`/projects/${rid(t.project_id)}`}>{label(t.project_id)}</Link>
            ) : (
              'Không có dự án'
            )}
          </dd>
        </div>
        <div>
          <dt>Ưu tiên</dt>
          <dd>
            {fields.priority?.selection?.find(([key]) => key === t.priority)?.[1] || 'Bình thường'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
export function TaskActivities({ id }: { id: number }) {
  const data = useData<Row[]>(`tasks/${id}/activities`);
  return (
    <section className="task-activities">
      <h2>Hoạt động trên nhiệm vụ</h2>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : data.data?.length ? (
        <ul>
          {data.data.map((a) => (
            <li key={a.id}>
              <CalendarDays size={18} />
              <div>
                <strong>{String(a.summary || label(a.activity_type_id) || 'Hoạt động')}</strong>
                <span>
                  {label(a.user_id)} · {dateLabel(a.date_deadline)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title="Chưa có hoạt động"
          description="Hoạt động Odoo liên quan sẽ xuất hiện tại đây theo quyền của bạn."
        />
      )}
    </section>
  );
}
export default function TaskWorkbench({
  detail,
  activeTab,
  collaboration,
  children,
}: {
  detail: TaskDetail;
  activeTab: string;
  collaboration: (view: string) => ReactNode;
  children: (collaborationVisible: boolean) => ReactNode;
}) {
  const router = useRouter(),
    notify = useNotice(),
    prefs = useUiPreferences(),
    wide = useMediaQuery('(min-width: 1440px)'),
    laptop = useMediaQuery('(min-width: 1100px)');
  const [navWidth, setNavWidth] = useState(180),
    [collabWidth, setCollabWidth] = useState(320),
    [view, setView] = useState(activeTab === 'activity' ? 'activity' : 'discussion');
  const drag = useRef<{
    kind: 'nav' | 'collab';
    x: number;
    initial: number;
    latest: number;
  } | null>(null);
  const navOpen = prefs.value.navOpen !== false,
    collabOpen = prefs.value.collabOpen !== false;
  useEffect(() => {
    setNavWidth(prefs.value.navWidth || 180);
    setCollabWidth(prefs.value.collabWidth || 320);
  }, [prefs.value.navWidth, prefs.value.collabWidth]);
  useEffect(() => {
    if (activeTab === 'activity' || activeTab === 'discussion') setView(activeTab);
  }, [activeTab]);
  const persist = (value: Parameters<typeof prefs.save>[0]) =>
    prefs.save(value).catch((e) => notify((e as Error).message, true));
  function navigate(tab: string) {
    const p = new URLSearchParams(window.location.search);
    p.set('tab', tab);
    router.replace(`/tasks/${detail.task.id}?${p}`, { scroll: false });
  }
  function separator(kind: 'nav' | 'collab') {
    const current = kind === 'nav' ? navWidth : collabWidth,
      min = kind === 'nav' ? 160 : 280,
      max = kind === 'nav' ? 280 : 420;
    const set = (value: number) => (kind === 'nav' ? setNavWidth(value) : setCollabWidth(value));
    const save = (value: number) =>
      persist(kind === 'nav' ? { navWidth: value } : { collabWidth: value });
    return (
      <div
        className="panel-resizer"
        role="separator"
        tabIndex={0}
        aria-label={kind === 'nav' ? 'Độ rộng điều hướng' : 'Độ rộng trao đổi'}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={`${current} pixel`}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { kind, x: e.clientX, initial: current, latest: current };
        }}
        onPointerMove={(e) => {
          if (drag.current?.kind !== kind) return;
          const value = Math.round(
            Math.max(
              min,
              Math.min(
                max,
                drag.current.initial + (e.clientX - drag.current.x) * (kind === 'nav' ? 1 : -1),
              ),
            ),
          );
          drag.current.latest = value;
          set(value);
        }}
        onPointerUp={() => {
          if (drag.current?.kind === kind) {
            save(drag.current.latest);
            drag.current = null;
          }
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
          e.preventDefault();
          const value =
            e.key === 'Home'
              ? min
              : e.key === 'End'
                ? max
                : Math.max(min, Math.min(max, current + (e.key === 'ArrowRight' ? 16 : -16)));
          set(value);
          save(value);
        }}
      >
        <span />
      </div>
    );
  }
  const showNav = wide && navOpen,
    showCollab = laptop && collabOpen;
  return (
    <section className="workbench" aria-label="Không gian nhiệm vụ">
      <div className="workbench-toolbar">
        <button
          className="button small"
          aria-expanded={wide ? navOpen : activeTab === 'navigation'}
          aria-controls={showNav ? 'task-navigation-panel' : undefined}
          onClick={() =>
            wide
              ? persist({ navOpen: !navOpen })
              : navigate(activeTab === 'navigation' ? 'overview' : 'navigation')
          }
        >
          {showNav ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}Điều hướng
        </button>
        <span className="helper">
          {wide
            ? 'Kéo hoặc dùng phím mũi tên ở đường chia để đổi kích thước.'
            : 'Mở từng vùng bằng các tab nhiệm vụ.'}
        </span>
        <button
          className="button small"
          aria-expanded={laptop ? collabOpen : activeTab === 'discussion'}
          aria-controls={showCollab ? 'task-collaboration-panel' : undefined}
          onClick={() =>
            laptop
              ? persist({ collabOpen: !collabOpen })
              : navigate(activeTab === 'discussion' ? 'overview' : 'discussion')
          }
        >
          {showCollab ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}Trao đổi
        </button>
      </div>
      <div
        className={`workbench-grid ${showNav ? 'with-navigation' : ''} ${showCollab ? 'with-collaboration' : ''}`}
        style={
          {
            '--navigation-width': `${navWidth}px`,
            '--collaboration-width': `${collabWidth}px`,
          } as CSSProperties
        }
      >
        {showNav && (
          <>
            <aside className="workbench-navigation panel" id="task-navigation-panel">
              <TaskNavigation detail={detail} />
            </aside>
            {separator('nav')}
          </>
        )}
        <div className="workbench-center">
          {activeTab === 'navigation' && !wide ? (
            <section className="panel">
              <TaskNavigation detail={detail} />
            </section>
          ) : (
            children(showCollab)
          )}
        </div>
        {showCollab && (
          <>
            {separator('collab')}
            <aside
              className="workbench-collaboration panel"
              id="task-collaboration-panel"
              aria-label="Trao đổi và hoạt động"
            >
              <div className="collaboration-tabs" role="group" aria-label="Nội dung trao đổi">
                <button aria-pressed={view === 'discussion'} onClick={() => setView('discussion')}>
                  <MessageSquare size={15} />
                  Trao đổi
                </button>
                <button aria-pressed={view === 'activity'} onClick={() => setView('activity')}>
                  <CalendarDays size={15} />
                  Hoạt động
                </button>
              </div>
              {collaboration(view)}
              <Link
                className="text-link collaboration-files"
                href={`/tasks/${detail.task.id}?tab=documents`}
              >
                Mở tài liệu nhiệm vụ
                <ChevronRight size={15} />
              </Link>
            </aside>
          </>
        )}
      </div>
    </section>
  );
}
