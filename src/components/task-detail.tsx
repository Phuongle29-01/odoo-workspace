'use client';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Star,
  LoaderCircle,
  FolderKanban,
  GitBranch,
  Users,
  CalendarDays,
  ShieldCheck,
  Plus,
  LockKeyhole,
  MessageSquare,
  Send,
  Paperclip,
  Files,
} from 'lucide-react';
import { api, write, useData, label, rid, dateLabel, type Row } from '@/lib/client';
import { useMe, useNotice } from './context';
import { Badge, Empty, ErrorBox, Loading } from './ui';
import TaskTable from './task-table';
import TaskWorkbench, { TaskSummary, TaskActivities } from './task-workbench';
const RichTextEditor = dynamic(() => import('./rich-text-editor'), {
  loading: () => <p role="status">Đang mở trình soạn thảo…</p>,
});
export type TaskDetail = {
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
export default function Task({ id }: { id: number }) {
  const router = useRouter(),
    params = useSearchParams(),
    notice = useNotice(),
    cache = useQueryClient();
  const me = useMe();
  const draftKey = `workspace-draft:edit:${me.instance}:${me.user.id}:${id}`;
  const original = useRef<Record<string, unknown>>({}),
    revision = useRef(''),
    initialDescription = useRef('');
  const [draftSaved, setDraftSaved] = useState(true);
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
  useEffect(() => {
    if (!editing) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ values, original: original.current, expectedRevision: revision.current }),
      );
      setDraftSaved(true);
    } catch {
      setDraftSaved(false);
    }
  }, [editing, values, draftKey]);
  if (data.isPending) return <Loading />;
  if (data.error) return <ErrorBox error={data.error} retry={() => data.refetch()} />;
  if (!data.data) return null;
  const d = data.data,
    t = d.task;
  const beginEdit = () => {
    const fresh = {
      name: t.name || '',
      description: String(t.description || ''),
      stage_id: rid(t.stage_id) || undefined,
      state: t.state || undefined,
      user_ids: t.user_ids || [],
      date_deadline: t.date_deadline ? String(t.date_deadline).slice(0, 10) : false,
      priority: t.priority || '0',
    };
    let restored: {
      values: Record<string, unknown>;
      original: Record<string, unknown>;
      expectedRevision: string;
    } | null = null;
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const value = JSON.parse(saved);
        if (value.values && value.original && typeof value.expectedRevision === 'string')
          restored = value;
      }
    } catch {}
    original.current = restored?.original || fresh;
    revision.current = restored?.expectedRevision || String(t.workspace_revision || '');
    initialDescription.current = String((restored?.values || fresh).description || '');
    setValues(restored?.values || fresh);
    setEditing(true);
    if (restored) notice('Đã khôi phục bản nháp của bạn.');
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
      <nav className="task-tabs" aria-label="Nội dung nhiệm vụ">
        {[
          ['overview', 'Tổng quan'],
          ['discussion', 'Thảo luận'],
          ['documents', 'Tài liệu'],
          ['navigation', 'Điều hướng'],
          ['activity', 'Hoạt động'],
        ].map(([key, text]) => (
          <Link
            key={key}
            href={`/tasks/${id}?tab=${key}`}
            aria-current={tab === key ? 'page' : undefined}
            className={tab === key ? 'active' : ''}
          >
            {text}
          </Link>
        ))}
      </nav>
      {editing ? (
        <form
          className="panel edit-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const changed: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(values)) {
                const before = original.current[k];
                if (JSON.stringify(before) !== JSON.stringify(v) && v !== undefined) changed[k] = v;
              }
              if (!Object.keys(changed).length) {
                setEditing(false);
                return;
              }
              await write(
                `tasks/${id}`,
                { expectedRevision: revision.current, values: changed },
                'PATCH',
              );
              sessionStorage.removeItem(draftKey);
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
          <div className="editor-field">
            <span className="field-label">Mô tả công việc</span>
            <RichTextEditor
              initialHtml={initialDescription.current}
              onChange={(description) => setValues((previous) => ({ ...previous, description }))}
            />
          </div>
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
              Đóng, giữ bản nháp
            </button>
            <button
              type="button"
              className="button"
              disabled={saving}
              onClick={() => {
                if (!window.confirm('Bỏ bản nháp chỉnh sửa trên thiết bị này?')) return;
                sessionStorage.removeItem(draftKey);
                setEditing(false);
                notice('Đã bỏ bản nháp chỉnh sửa.');
              }}
            >
              Bỏ bản nháp
            </button>
          </div>
          <p className="helper">
            {draftSaved
              ? 'Bản nháp được giữ trong phiên trình duyệt này.'
              : 'Chưa lưu được bản nháp trên trình duyệt. Hãy giữ trang đang mở.'}{' '}
            Nếu có xung đột, đối chiếu nội dung mới trong Odoo trước khi lưu lại.
          </p>
        </form>
      ) : (
        <TaskWorkbench
          detail={d}
          activeTab={tab}
          collaboration={(view) =>
            view === 'activity' ? (
              <TaskActivities id={id} />
            ) : (
              <Chatter id={id} enabled={d.writesEnabled} />
            )
          }
        >
          {(showCollab) => (
            <>
              <TaskSummary detail={d} />
              <div className="task-main">
                {tab === 'documents' ? (
                  <TaskDocuments id={id} enabled={d.writesEnabled} />
                ) : tab === 'discussion' && !showCollab ? (
                  <Chatter id={id} enabled={d.writesEnabled} />
                ) : tab === 'activity' && !showCollab ? (
                  <TaskActivities id={id} />
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
                    {!showCollab && <Chatter id={id} enabled={d.writesEnabled} />}
                  </>
                )}
              </div>
            </>
          )}
        </TaskWorkbench>
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
  const [seenMessage, setSeenMessage] = useState<number | null>(null);
  useEffect(() => setSeenMessage(null), [id]);
  useEffect(() => {
    if (data.data && seenMessage === null)
      setSeenMessage(Math.max(0, ...data.data.map((m) => m.id)));
  }, [data.data, seenMessage]);
  const newer = (data.data || []).filter((m) => seenMessage !== null && m.id > seenMessage);
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
      {newer.length > 0 && (
        <button
          className="new-messages"
          aria-live="polite"
          onClick={() => {
            const latest = Math.max(...newer.map((m) => m.id));
            setSeenMessage(latest);
            document
              .getElementById(`message-${latest}`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          {newer.length} trao đổi mới · Xem ngay
        </button>
      )}
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
