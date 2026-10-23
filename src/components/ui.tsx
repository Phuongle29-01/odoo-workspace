'use client';
import { type ReactNode } from 'react';
import { AlertCircle, FolderKanban, RefreshCw } from 'lucide-react';
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="empty">
      <FolderKanban size={32} aria-hidden />
      <h3>{title}</h3>
      <p>{description || 'Dữ liệu sẽ xuất hiện tại đây khi có bản ghi phù hợp.'}</p>
    </div>
  );
}
export function ErrorBox({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div role="alert" className="error-box">
      <AlertCircle size={21} aria-hidden />
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
export function Loading() {
  return (
    <div className="skeleton-grid" role="status" aria-label="Đang tải dữ liệu">
      <span className="sr-only">Đang tải dữ liệu…</span>
      {[1, 2, 3].map((n) => (
        <div className="skeleton" key={n} />
      ))}
    </div>
  );
}
