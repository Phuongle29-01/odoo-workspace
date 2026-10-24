'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Download } from 'lucide-react';
import { dateLabel, type Row } from '@/lib/client';
import { ErrorBox } from './ui';
const PdfPreview = dynamic(() => import('./pdf-preview'), {
  loading: () => <p role="status">Đang mở trình đọc PDF…</p>,
  ssr: false,
});
export default function DocumentPreview({
  task,
  file,
  onClose,
}: {
  task: number;
  file: Row;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [content, setContent] = useState<{ type: string; url?: string; data?: ArrayBuffer } | null>(
      null,
    ),
    [error, setError] = useState<Error | null>(null);
  const download = `/api/tasks/${task}/attachments/${file.id}`;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setContent(null);
    setError(null);
    void fetch(`${download}?preview=1`, {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Không thể mở tài liệu.');
        }
        const type = response.headers.get('X-Workspace-Preview-Type');
        if (!type) throw new Error('Định dạng này chưa hỗ trợ xem trước.');
        const buffer = await response.arrayBuffer();
        if (type === 'application/pdf') setContent({ type, data: buffer });
        else if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(type)) {
          objectUrl = URL.createObjectURL(new Blob([buffer], { type }));
          setContent({ type, url: objectUrl });
        } else throw new Error('Định dạng chưa hỗ trợ.');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(new Error(e.message || 'Kết nối bị gián đoạn.'));
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [download]);
  return (
    <dialog
      ref={dialog}
      className="document-dialog"
      aria-labelledby="document-preview-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <h2 id="document-preview-title">{file.name}</h2>
          <p>
            {Math.ceil(Number(file.file_size || 0) / 1024)} KB · {dateLabel(file.create_date)} · Tệp
            từ nhiệm vụ Odoo #{task}
          </p>
        </div>
        <button className="icon-button" aria-label="Đóng xem trước" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="document-preview-body">
        {error ? (
          <ErrorBox error={error} />
        ) : !content ? (
          <p role="status">Đang tải tài liệu theo quyền của bạn…</p>
        ) : content.type === 'application/pdf' ? (
          <PdfPreview data={content.data!} />
        ) : (
          <img
            src={content.url}
            alt={`Xem trước ${file.name}`}
            onError={() => setError(new Error('Ảnh không hợp lệ hoặc trình duyệt không đọc được.'))}
          />
        )}
      </div>
      <footer>
        <span>Chỉnh sửa bằng ứng dụng phù hợp sau khi tải xuống.</span>
        <a href={download} className="button primary">
          <Download size={16} />
          Tải xuống
        </a>
      </footer>
    </dialog>
  );
}
