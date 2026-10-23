'use client';
import Link from 'next/link';
import {
  ClipboardList,
  FolderKanban,
  Bell,
  CalendarDays,
  ArrowUpRight,
  Search,
  AlertCircle,
  Clock3,
} from 'lucide-react';
import { useData, dateLabel, type Row } from '@/lib/client';
import { Loading, ErrorBox, Empty, Badge } from './ui';
import TaskTable from './task-table';
type DashboardData = {
  counts: {
    mine: number;
    overdue: number;
    activities: number;
    unread: number | null;
    projects: number;
  };
  recent: Row[];
  projects: Row[];
};
export default function Dashboard({ user }: { user: Row }) {
  const data = useData<DashboardData>('dashboard'),
    activities = useData<Row[]>('activities');
  const count = data.data?.counts;
  const stats = [
    {
      name: 'Công việc đang làm',
      key: 'mine',
      Icon: ClipboardList,
      href: '/my-tasks?open=true',
      note: 'Nhiệm vụ được giao cho bạn',
    },
    {
      name: 'Hoạt động cần xử lý',
      key: 'activities',
      Icon: CalendarDays,
      href: '/activities',
      note: 'Hoạt động Odoo của bạn',
    },
    {
      name: 'Nhiệm vụ quá hạn',
      key: 'overdue',
      Icon: AlertCircle,
      href: '/my-tasks?overdue=true',
      note: 'Ưu tiên xử lý hôm nay',
    },
    {
      name: 'Thông báo chưa đọc',
      key: 'unread',
      Icon: Bell,
      href: '/notifications?read=unread',
      note: 'Hộp thư Odoo cá nhân',
    },
    {
      name: 'Dự án được phép xem',
      key: 'projects',
      Icon: FolderKanban,
      href: '/projects',
      note: 'Theo quyền truy cập hiện tại',
    },
  ] as const;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">KHÔNG GIAN CỦA BẠN</p>
          <h1>Chào {String(user.name).split(' ').at(-1)}, cùng bắt đầu công việc.</h1>
          <p>Công việc rõ ràng, trao đổi liền mạch và luôn đúng ngữ cảnh.</p>
        </div>
        <Link href="/search" className="button primary">
          <Search size={17} />
          Tìm nhiệm vụ
        </Link>
      </div>
      <div className="focus-strip">
        <div>
          <span className="focus-icon">
            <ClipboardList size={22} />
          </span>
          <div>
            <strong>Hôm nay bạn muốn tiếp tục việc gì?</strong>
            <p>Mở công việc được giao hoặc tìm nhanh nhiệm vụ bằng Ctrl + K.</p>
          </div>
        </div>
        <Link href="/my-tasks">
          Công việc của tôi
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {data.error && <ErrorBox error={data.error} retry={() => data.refetch()} />}
      <div className="stat-grid overview-stats">
        {stats.map(({ name, key, Icon, href, note }) => (
          <Link
            className={`stat ${key === 'overdue' && count?.overdue ? 'attention' : ''}`}
            href={href}
            key={key}
          >
            <div>
              <span className="stat-icon">
                <Icon size={18} />
              </span>
              <span>{name}</span>
              <ArrowUpRight className="stat-arrow" size={15} />
            </div>
            <strong>{count?.[key] ?? '—'}</strong>
            <small>
              {key === 'unread' && count?.unread === null ? 'API thông báo chưa khả dụng' : note}
            </small>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Clock3 size={18} />
              Công việc cập nhật gần đây
            </h2>
            <Link href="/my-tasks?sort=updated">
              Xem tất cả
              <ArrowUpRight size={15} />
            </Link>
          </div>
          {data.isPending ? <Loading /> : data.data ? <TaskTable rows={data.data.recent} /> : null}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Cần xử lý</h2>
            <Badge>{activities.data?.length || 0}</Badge>
          </div>
          {activities.isPending ? (
            <Loading />
          ) : activities.error ? (
            <ErrorBox error={activities.error} />
          ) : activities.data?.length ? (
            <div className="activity-list">
              {activities.data.slice(0, 5).map((row) => (
                <Link href={`/tasks/${(row.task as Row).id}?tab=activity`} key={row.id}>
                  <span className="activity-icon">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <strong>{String(row.summary || 'Hoạt động')}</strong>
                    <p>{(row.task as Row).name}</p>
                    <small>{dateLabel(row.date_deadline)}</small>
                  </div>
                  <ArrowUpRight size={15} />
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
      <section className="dashboard-projects">
        <div className="section-toolbar">
          <h2>Dự án của đội ngũ</h2>
          <Link href="/projects" className="text-link">
            Tất cả dự án
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="project-shortcuts">
          {data.data?.projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <span className="project-icon">
                <FolderKanban size={20} />
              </span>
              <strong>{project.name}</strong>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
