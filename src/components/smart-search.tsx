'use client';
import { Fragment, useEffect, useRef, useState, type RefObject, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { normalizeText } from '@/lib/search';
import {
  Search,
  X,
  CornerDownRight,
  FolderKanban,
  Users,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { api, ApiError, useData, label, dateLabel, type Row } from '@/lib/client';
import { highlightRanges } from '@/lib/search';
import { Badge, Empty, ErrorBox, Loading } from './ui';
type Result = { items: Row[]; nextCursor: number | null; scanLimited: boolean; scanned?: number };
type Options = { projects: Row[]; stages: Row[]; users: Row[]; states: [string, string][] };
export function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = highlightRanges(text, query);
  let end = 0;
  return (
    <>
      {ranges.map(([start, finish], i) => {
        const prefix = text.slice(end, start);
        end = finish;
        return (
          <Fragment key={i}>
            {prefix}
            <mark>{text.slice(start, finish)}</mark>
          </Fragment>
        );
      })}
      {text.slice(end)}
    </>
  );
}
export function TaskContext({ task, query = '' }: { task: Row; query?: string }) {
  const assignees = Array.isArray(task.assignees)
    ? (task.assignees as { id: number; name: string }[])
    : [];
  return (
    <>
      <div className="result-context">
        <span>
          <FolderKanban size={13} />
          <Highlight text={label(task.project_id) || 'Không có dự án'} query={query} />
        </span>
        {label(task.parent_id) && (
          <span>
            <CornerDownRight size={13} />
            {label(task.parent_id)}
          </span>
        )}
      </div>
      <div className="result-meta">
        <Badge tone="violet">{label(task.stage_id) || 'Chưa có giai đoạn'}</Badge>
        {!!task.stateLabel && (
          <Badge tone={task.state === '1_done' ? 'green' : 'neutral'}>
            {String(task.stateLabel)}
          </Badge>
        )}
        <span>
          <Users size={12} />
          {assignees.length ? assignees.map((u) => u.name).join(', ') : 'Chưa phân công'}
        </span>
        <span>{dateLabel(task.date_deadline)}</span>
      </div>
    </>
  );
}
export function SmartSearch({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  const router = useRouter(),
    root = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState(''),
    [query, setQuery] = useState(''),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(term.trim());
      setActive(-1);
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const data = useData<Result>(`tasks?q=${encodeURIComponent(query)}`, open && !!query, false);
  const rows = data.data?.items.slice(0, 6) || [];
  const show = open && !!term.trim();
  function go(id?: number) {
    setOpen(false);
    router.push(id ? `/tasks/${id}?focus=1` : `/search?q=${encodeURIComponent(term)}`);
  }
  function keyboard(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((index) =>
        rows.length ? (index + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length : -1,
      );
    }
  }
  return (
    <div className="smart-search" ref={root}>
      <form
        className="top-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(term.trim() === query ? rows[active >= 0 ? active : 0]?.id : undefined);
        }}
      >
        <Search size={17} aria-hidden />
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Tìm kiếm toàn cục"
          aria-expanded={show}
          aria-controls={
            show && rows.length && !data.isFetching ? 'quick-search-results' : undefined
          }
          aria-autocomplete="list"
          aria-activedescendant={show && active >= 0 ? `quick-result-${active}` : undefined}
          autoComplete="off"
          value={term}
          onFocus={() => setOpen(true)}
          onKeyDown={keyboard}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          placeholder="Tìm nhiệm vụ, dự án hoặc ID…"
        />
        <kbd aria-hidden>⌘ K</kbd>
      </form>
      {show && (
        <div className="search-popover">
          <div className="search-popover-heading">
            <span>Gợi ý từ toàn bộ công việc được phép xem</span>
            <kbd>ESC</kbd>
          </div>
          {data.isFetching || term.trim() !== query ? (
            <div className="search-progress" role="status">
              Đang tìm trong Odoo…
            </div>
          ) : data.error ? (
            <ErrorBox error={data.error} />
          ) : rows.length ? (
            <ul role="listbox" id="quick-search-results" aria-label="Gợi ý nhiệm vụ">
              {rows.map((task, index) => (
                <li role="presentation" key={task.id}>
                  <Link
                    role="option"
                    id={`quick-result-${index}`}
                    aria-selected={active === index}
                    tabIndex={-1}
                    href={`/tasks/${task.id}?focus=1`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => setOpen(false)}
                  >
                    <div className="result-title">
                      <strong>
                        <Highlight text={task.name || ''} query={query} />
                      </strong>
                      <small>#{task.id}</small>
                    </div>
                    <TaskContext task={task} query={query} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="search-progress">
              Không tìm thấy trong lượt này. Mở tìm kiếm đầy đủ để tìm tiếp.
            </div>
          )}
          <Link
            className="search-all"
            href={`/search?q=${encodeURIComponent(term)}`}
            onClick={() => setOpen(false)}
          >
            Mở tìm kiếm và bộ lọc nâng cao
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

export function TaskFilters({
  params,
  onChange,
  lockedMine = false,
}: {
  params: URLSearchParams;
  onChange: (name: string, value: string) => void;
  lockedMine?: boolean;
}) {
  const data = useData<Options>('task-options', true, false);
  return (
    <div className="advanced-filters" aria-label="Bộ lọc nhiệm vụ">
      <span className="filter-label">
        <SlidersHorizontal size={15} />
        Lọc theo
      </span>
      {data.error ? (
        <ErrorBox error={data.error} retry={() => data.refetch()} />
      ) : (
        <>
          {(['project', 'stage', 'assignee', 'state'] as const).map((key) => {
            const name = {
              project: 'Dự án',
              stage: 'Giai đoạn',
              assignee: 'Người phụ trách',
              state: 'Trạng thái',
            }[key];
            const choices =
              key === 'state'
                ? data.data?.states.map(([id, name]) => ({ id, name }))
                : data.data?.[
                    { project: 'projects', stage: 'stages', assignee: 'users', state: 'states' }[
                      key
                    ] as 'projects' | 'stages' | 'users'
                  ];
            return (
              <label key={key}>
                <span className="sr-only">{name}</span>
                <select
                  aria-label={name}
                  value={params.get(key) || ''}
                  disabled={data.isPending}
                  onChange={(e) => onChange(key, e.target.value)}
                >
                  <option value="">{name}: tất cả</option>
                  {choices?.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <label className="checkbox-filter">
            <input
              type="checkbox"
              disabled={lockedMine}
              checked={params.get('mine') === 'true'}
              onChange={(e) => onChange('mine', e.target.checked ? 'true' : '')}
            />
            Của tôi
          </label>
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={params.get('overdue') === 'true'}
              onChange={(e) => onChange('overdue', e.target.checked ? 'true' : '')}
            />
            Quá hạn
          </label>
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={params.get('open') === 'true'}
              onChange={(e) => onChange('open', e.target.checked ? 'true' : '')}
            />
            Chưa hoàn tất
          </label>
        </>
      )}
    </div>
  );
}

export default function SearchPage({ initial }: { initial: string }) {
  const router = useRouter(),
    url = useSearchParams(),
    ref = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState(initial),
    [active, setActive] = useState(-1);
  const query = (url.get('q') || '').trim();
  const p = new URLSearchParams();
  for (const key of [
    'q',
    'project',
    'stage',
    'state',
    'assignee',
    'mine',
    'overdue',
    'open',
    'description',
  ]) {
    const value = url.get(key);
    if (value) p.set(key, key === 'q' ? value.trim() : value);
  }
  p.sort();
  const canonical = p.toString(),
    generation = useRef(canonical);
  generation.current = canonical;
  const enabled =
    !!query ||
    ['project', 'stage', 'assignee', 'mine', 'overdue', 'open', 'state'].some(
      (key) => !!p.get(key),
    );
  const requestedPages = Math.max(1, Math.min(20, Number(url.get('pages')) || 1));
  useEffect(() => setTerm(url.get('q') || ''), [query]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if ((next.get('q') || '').trim() === term.trim()) return;
      term.trim() ? next.set('q', term.trim()) : next.delete('q');
      next.delete('pages');
      next.delete('selected');
      window.history.replaceState(null, '', `/search?${next}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [term, router]);
  useEffect(() => setActive(-1), [canonical]);
  const data = useInfiniteQuery<Result, ApiError>({
    queryKey: ['task-search', canonical],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api<Result>(`tasks?${canonical}&cursor=${pageParam}`, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const options = useData<Options>('task-options', true, false);
  const rows = [
    ...new Map(
      (data.data?.pages || []).flatMap((page) => page.items).map((task) => [task.id, task]),
    ).values(),
  ];
  useEffect(() => {
    if (
      enabled &&
      data.data &&
      data.data.pages.length < requestedPages &&
      data.hasNextPage &&
      !data.isFetching &&
      !data.error
    )
      void data.fetchNextPage();
  }, [
    enabled,
    requestedPages,
    data.data,
    data.hasNextPage,
    data.isFetching,
    data.error,
    data.fetchNextPage,
  ]);
  useEffect(() => {
    const id = Number(url.get('selected'));
    if (!id || active >= 0) return;
    const index = rows.findIndex((row) => row.id === id);
    if (index >= 0) {
      setActive(index);
      document.getElementById(`search-result-${index}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [url, rows, active]);
  function filter(name: string, value: string, clearQuery = false) {
    const next = new URLSearchParams(window.location.search);
    value ? next.set(name, value) : next.delete(name);
    next.delete('pages');
    next.delete('selected');
    if (clearQuery) {
      next.delete('q');
      setTerm('');
    }
    window.history.replaceState(null, '', `/search?${next}`);
  }
  function openTask(id: number) {
    const next = new URL(window.location.href);
    next.searchParams.set('selected', String(id));
    window.history.replaceState(window.history.state, '', next);
    router.push(`/tasks/${id}?focus=1`);
  }
  async function more() {
    const key = canonical;
    const next = await data.fetchNextPage();
    if (generation.current !== key || next.isError) return;
    const current = new URLSearchParams(window.location.search);
    for (const name of [...current.keys()])
      if (
        ![
          'q',
          'project',
          'stage',
          'state',
          'assignee',
          'mine',
          'overdue',
          'open',
          'description',
        ].includes(name)
      )
        current.delete(name);
    if (current.has('q')) current.set('q', current.get('q')!.trim());
    current.sort();
    if (current.toString() !== key) return;
    const params = new URLSearchParams(window.location.search);
    params.set('pages', String(next.data?.pages.length || 1));
    window.history.replaceState(null, '', `/search?${params}`);
  }
  const incomplete = !!data.hasNextPage,
    last = data.data?.pages.at(-1),
    loading =
      data.isFetchingNextPage ||
      !!(data.data && data.data.pages.length < requestedPages && incomplete);
  const suggestions =
    query.length >= 2
      ? [
          ...(options.data?.projects || [])
            .filter((row) => normalizeText(row.name || '').includes(normalizeText(query)))
            .slice(0, 3)
            .map((row) => ({ kind: 'project', label: 'Dự án', row })),
          ...(options.data?.users || [])
            .filter((row) => normalizeText(row.name || '').includes(normalizeText(query)))
            .slice(0, 2)
            .map((row) => ({ kind: 'assignee', label: 'Người phụ trách', row })),
        ]
      : [];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TÌM KIẾM THÔNG MINH</p>
          <h1>Tìm đúng việc. Thấy đầy đủ ngữ cảnh.</h1>
          <p>Tìm xuyên dự án và nhiệm vụ nhiều cấp, bằng tiếng Việt có dấu hoặc không dấu.</p>
        </div>
      </div>
      <div className="search-box">
        <Search size={23} />
        <input
          ref={ref}
          role="combobox"
          aria-label="Từ khóa tìm nhiệm vụ"
          aria-autocomplete="list"
          aria-expanded={rows.length > 0}
          aria-controls={rows.length ? 'search-results' : undefined}
          aria-activedescendant={
            active >= 0 && active < rows.length ? `search-result-${active}` : undefined
          }
          aria-busy={data.isFetching}
          autoComplete="off"
          value={term}
          maxLength={160}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
              e.preventDefault();
              setActive((n) =>
                rows.length
                  ? (n + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
                  : -1,
              );
            }
            if (e.key === 'Enter' && rows.length && term.trim() === query) {
              e.preventDefault();
              openTask(rows[active >= 0 ? active : 0].id);
            }
            if (e.key === 'Escape') {
              setActive(-1);
              ref.current?.blur();
            }
          }}
          placeholder="Một phần tiêu đề, dự án hoặc ID nhiệm vụ…"
        />
        {term && (
          <button className="icon-button" onClick={() => setTerm('')} aria-label="Xóa từ khóa">
            <X size={18} />
          </button>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="filter-suggestions" aria-label="Gợi ý bộ lọc">
          <span>Thử lọc theo:</span>
          {suggestions.map(({ kind, label: kindLabel, row }) => (
            <button
              className="button small"
              key={`${kind}:${row.id}`}
              onClick={() => filter(kind, String(row.id), true)}
            >
              {kindLabel}: {row.name}
            </button>
          ))}
        </div>
      )}
      <TaskFilters params={p} onChange={filter} />
      <div className="search-options">
        <label>
          <input
            type="checkbox"
            checked={url.get('description') === 'true'}
            onChange={(e) => filter('description', e.target.checked ? 'true' : '')}
          />
          Tìm cả trong mô tả
        </label>
        <span>
          <ShieldCheck size={14} />
          Quyền được kiểm tra tại Odoo mỗi lần tìm
        </span>
      </div>
      {!enabled ? (
        <Empty
          title="Bạn đang tìm công việc nào?"
          description="Thử “kiểm tra hồ sơ”, “kiem tra ho so”, ID hoặc chọn bộ lọc."
        />
      ) : data.isPending ? (
        <Loading />
      ) : data.error && !data.data ? (
        <ErrorBox error={data.error} retry={() => data.refetch()} />
      ) : (
        <>
          <div className="section-toolbar">
            <strong aria-live="polite">{rows.length} kết quả đã tải</strong>
            <span className="muted small-text">↑ ↓ chọn · Enter mở nhiệm vụ</span>
          </div>
          {data.error && <ErrorBox error={data.error} retry={() => data.refetch()} />}
          {rows.length ? (
            <ul
              className="search-result-list"
              id="search-results"
              role="listbox"
              aria-label="Kết quả tìm kiếm"
            >
              {rows.map((task, index) => (
                <li key={task.id} role="presentation">
                  <Link
                    role="option"
                    id={`search-result-${index}`}
                    aria-selected={active === index}
                    href={`/tasks/${task.id}?focus=1`}
                    onMouseEnter={() => setActive(index)}
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        openTask(task.id);
                      }
                    }}
                  >
                    <div className="result-title">
                      <strong>
                        <Highlight text={task.name || ''} query={query} />
                      </strong>
                      <span>
                        #{task.id}
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                    <TaskContext task={task} query={query} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title={incomplete ? 'Chưa thấy trong phần đã tìm' : 'Chưa có nhiệm vụ phù hợp'}
              description={
                incomplete
                  ? 'Còn dữ liệu chưa được quét. Tìm tiếp hoặc chọn dự án/người phụ trách để thu hẹp phạm vi.'
                  : 'Đã tìm hết trong phạm vi bộ lọc hiện tại. Thử từ khóa ngắn hơn hoặc thay đổi bộ lọc.'
              }
            />
          )}
          <div className="search-continuation" role="status">
            <span>
              {loading
                ? 'Đang tải tiếp và giữ các kết quả đã có…'
                : incomplete
                  ? last?.scanLimited
                    ? 'Chưa quét hết phạm vi tìm kiếm. Có thể còn nhiệm vụ phù hợp.'
                    : 'Còn kết quả phù hợp chưa được tải.'
                  : 'Đã tìm hết trong phạm vi bộ lọc hiện tại.'}
            </span>
            {incomplete && (
              <button
                className="button primary"
                disabled={data.isFetching}
                onClick={() => void more()}
              >
                {data.isFetching ? 'Đang tìm…' : 'Tìm tiếp'}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
