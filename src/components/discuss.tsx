'use client';
import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Users, ExternalLink, Send, Search, LoaderCircle } from 'lucide-react';
import { api, write, useData, label, dateLabel, type Row } from '@/lib/client';

type ChannelPage = { channel: Row; items: Row[]; nextCursor: number | null; focused?: Row | null };
export default function Discuss({
  odooUrl,
  writesEnabled,
  identity,
  notify,
}: {
  odooUrl: string;
  writesEnabled: boolean;
  identity: string;
  notify: (text: string, error?: boolean) => void;
}) {
  const pathname = usePathname(),
    params = useSearchParams();
  const id = Number(pathname.split('/')[2]) || null;
  const focused = params.get('message') || '';
  const channels = useData<{ available: boolean; reason?: string; items: Row[] }>('discuss');
  const [text, setText] = useState(''),
    [term, setTerm] = useState(''),
    [query, setQuery] = useState(''),
    [pending, setPending] = useState(false);
  const draftKey = `workspace-draft:channel:${identity}:${id}`;
  useEffect(() => {
    setText(sessionStorage.getItem(draftKey) || '');
  }, [draftKey]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(term), 350);
    return () => clearTimeout(timer);
  }, [term]);
  const history = useInfiniteQuery({
    queryKey: ['discuss-messages', id, query, focused],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<ChannelPage>(
        `discuss/${id}?cursor=${pageParam}&q=${encodeURIComponent(query)}${focused ? `&message=${encodeURIComponent(focused)}` : ''}`,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!id,
    retry: false,
    refetchInterval: 30000,
  });
  const messages =
    history.data?.pages
      .flatMap((p) => p.items)
      .slice()
      .reverse() || [];
  const focus = history.data?.pages[0].focused;
  const current = history.data?.pages[0].channel;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRAO ĐỔI ĐỘI NGŨ</p>
          <h1>Odoo Discuss</h1>
          <p>Hội thoại của bạn, tách biệt với Chatter trên nhiệm vụ.</p>
        </div>
        <a
          className="button"
          href={`${odooUrl}/web#action=mail.action_discuss`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Quản lý trong Odoo
          <ExternalLink size={14} />
        </a>
      </div>
      {channels.error ? (
        <div className="error-box">{channels.error.message}</div>
      ) : channels.isPending ? (
        <div className="empty">Đang kiểm tra Discuss…</div>
      ) : !channels.data?.available ? (
        <div className="panel empty">
          <MessageSquare />
          <h3>Discuss qua API chưa khả dụng</h3>
          <p>{channels.data?.reason} Bạn có thể tiếp tục bằng Odoo gốc.</p>
        </div>
      ) : (
        <div className="chat-layout">
          <aside className="panel channel-list">
            <h2>
              <Users size={17} /> Hội thoại đã tham gia
            </h2>
            {channels.data.items.length ? (
              channels.data.items.map((c) => (
                <Link href={`/discuss/${c.id}`} key={c.id} className={c.id === id ? 'active' : ''}>
                  <MessageSquare size={17} />
                  <span>
                    <strong>{c.name || `Hội thoại #${c.id}`}</strong>
                    <small>
                      {c.channel_type === 'chat'
                        ? 'Tin nhắn riêng'
                        : c.channel_type === 'group'
                          ? 'Nhóm'
                          : 'Kênh'}
                      {typeof c.member_count === 'number' ? ` · ${c.member_count} thành viên` : ''}
                    </small>
                  </span>
                </Link>
              ))
            ) : (
              <div className="empty">Chưa có hội thoại. Tạo hoặc tham gia trong Odoo gốc.</div>
            )}
            <p className="helper padded-note">
              Tối đa 100 hội thoại. Quản lý thành viên trong Odoo gốc.
            </p>
          </aside>
          <section className="panel channel-detail">
            {!id ? (
              <div className="empty">
                <MessageSquare size={30} />
                <h3>Chọn hội thoại để bắt đầu</h3>
                <p>Chỉ hiển thị các kênh đã tham gia và được Odoo cho phép.</p>
              </div>
            ) : (
              <>
                <div className="panel-heading">
                  <h2>{current?.name || `Hội thoại #${id}`}</h2>
                  <span className="badge">Làm mới 30 giây</span>
                </div>
                <label className="chat-search">
                  <Search size={16} />
                  <input
                    aria-label="Tìm trong hội thoại"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Tìm trong toàn bộ lịch sử hội thoại…"
                    maxLength={160}
                  />
                </label>
                {history.error ? (
                  <div className="error-box">{history.error.message}</div>
                ) : history.isPending ? (
                  <div className="empty">
                    <LoaderCircle className="spin" />
                    Đang đọc lịch sử…
                  </div>
                ) : (
                  <div className="chat-history">
                    {history.hasNextPage && (
                      <button
                        className="button small centered"
                        disabled={history.isFetchingNextPage}
                        onClick={() => history.fetchNextPage()}
                      >
                        Tải tin nhắn cũ hơn
                      </button>
                    )}
                    {focus && !messages.some((m) => m.id === focus.id) && (
                      <div className="linked-message">
                        <small>Tin nhắn được liên kết · #{focus.id}</small>
                        <ChatMessage row={focus} highlighted />
                      </div>
                    )}
                    {messages.length ? (
                      messages.map((m) => (
                        <ChatMessage key={m.id} row={m} highlighted={String(m.id) === focused} />
                      ))
                    ) : (
                      <div className="empty">Chưa có tin nhắn phù hợp.</div>
                    )}
                  </div>
                )}
                {writesEnabled && current && (
                  <form
                    className="composer"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setPending(true);
                      try {
                        await write(`discuss/${id}/messages`, { text });
                        setText('');
                        sessionStorage.removeItem(draftKey);
                        await history.refetch();
                        notify('Đã gửi tin nhắn Discuss.');
                      } catch (err) {
                        notify((err as Error).message, true);
                      } finally {
                        setPending(false);
                      }
                    }}
                  >
                    <textarea
                      aria-label="Nội dung tin nhắn Discuss"
                      rows={3}
                      required
                      maxLength={10000}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        sessionStorage.setItem(draftKey, e.target.value);
                      }}
                      placeholder="Nhắn tin trong hội thoại này…"
                    />
                    <div>
                      <span className="helper">Không tự động gửi lại khi timeout.</span>
                      <button className="button primary small" disabled={pending || !text.trim()}>
                        {pending ? <LoaderCircle className="spin" size={14} /> : <Send size={14} />}
                        Gửi tin nhắn
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      )}
      <p className="helper">
        Tạo hội thoại, quản lý thành viên, trạng thái chưa đọc và tệp Discuss hiện dùng Odoo gốc.
        Chatter nằm trong từng nhiệm vụ.
      </p>
    </>
  );
}
function ChatMessage({ row, highlighted = false }: { row: Row; highlighted?: boolean }) {
  return (
    <article
      className={`chat-message ${highlighted ? 'highlighted' : ''}`}
      id={`discuss-message-${row.id}`}
    >
      <span className="avatar small-avatar">{label(row.author_id).charAt(0) || 'O'}</span>
      <div>
        <div className="message-header">
          <strong>{label(row.author_id) || 'Odoo'}</strong>
          <time>{dateLabel(row.date)}</time>
          <small>#{row.id}</small>
        </div>
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: String(row.body || '') }} />
        {Array.isArray(row.attachment_ids) && row.attachment_ids.length > 0 && (
          <small className="muted">{row.attachment_ids.length} tệp · Xem trong Odoo gốc</small>
        )}
      </div>
    </article>
  );
}
