'use client';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, CornerDownRight, Check } from 'lucide-react';
import { label, rid, dateLabel, type Row } from '@/lib/client';
import { Badge, Empty } from './ui';
import { TaskContext } from './smart-search';
export default function TaskTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Empty title="Chưa có nhiệm vụ phù hợp" />;
  return (
    <>
      <div className="table-wrap desktop-task-table">
        <table className="task-table">
          <caption className="sr-only">Danh sách nhiệm vụ và ngữ cảnh Odoo</caption>
          <thead>
            <tr>
              <th scope="col">NHIỆM VỤ</th>
              <th scope="col">DỰ ÁN / NHIỆM VỤ CHA</th>
              <th scope="col">GIAI ĐOẠN / TRẠNG THÁI</th>
              <th scope="col">THỜI HẠN</th>
              <th scope="col">
                <span className="sr-only">Mở nhiệm vụ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr key={task.id}>
                <td>
                  <Link className="task-name" href={`/tasks/${task.id}`}>
                    <span
                      aria-hidden
                      className={`task-check ${task.state === '1_done' ? 'done' : ''}`}
                    >
                      {task.state === '1_done' && <Check size={12} />}
                    </span>
                    <div>
                      <strong>{task.name}</strong>
                      <small>
                        #{task.id}
                        {task.priority === '1' ? ' · Ưu tiên cao' : ''}
                      </small>
                      {Array.isArray(task.assignees) && (
                        <small>
                          {(task.assignees as { name: string }[]).map((u) => u.name).join(', ') ||
                            'Chưa phân công'}
                        </small>
                      )}
                    </div>
                  </Link>
                </td>
                <td>
                  <div className="task-context">
                    {rid(task.project_id) ? (
                      <Link href={`/projects/${rid(task.project_id)}`}>
                        {label(task.project_id)}
                      </Link>
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
                  <div className="cell-badges">
                    <Badge tone="violet">{label(task.stage_id) || 'Chưa có giai đoạn'}</Badge>
                    {!!task.stateLabel && (
                      <Badge tone={task.state === '1_done' ? 'green' : 'neutral'}>
                        {String(task.stateLabel)}
                      </Badge>
                    )}
                  </div>
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
      <div className="mobile-task-cards">
        {rows.map((task) => (
          <Link href={`/tasks/${task.id}`} key={task.id}>
            <div className="result-title">
              <strong>{task.name}</strong>
              <small>#{task.id}</small>
            </div>
            <TaskContext task={task} />
          </Link>
        ))}
      </div>
    </>
  );
}
