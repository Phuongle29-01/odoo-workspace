'use client';
import { useEffect, useRef, useState } from 'react';
import { ErrorBox } from './ui';
import type { PDFDocumentProxy } from 'pdfjs-dist';
export default function PdfPreview({ data }: { data: ArrayBuffer }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [document, setDocument] = useState<PDFDocumentProxy | null>(null),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(true),
    [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let stopped = false,
      dispose = () => {};
    setError(null);
    setBusy(true);
    void import('pdfjs-dist')
      .then((pdf) => {
        if (stopped) return;
        pdf.GlobalWorkerOptions.workerSrc = '/pdf-worker';
        const loading = pdf.getDocument({
          data: new Uint8Array(data.slice(0)),
          enableXfa: false,
          useSystemFonts: true,
        });
        dispose = () => void loading.destroy();
        const timeout = setTimeout(() => {
          if (!stopped) {
            setError(
              new Error('Tài liệu xử lý quá lâu. Hãy tải xuống để xem bằng ứng dụng phù hợp.'),
            );
            setBusy(false);
            dispose();
          }
        }, 20000);
        return loading.promise
          .then((doc) => {
            clearTimeout(timeout);
            if (stopped) {
              dispose();
              return;
            }
            setDocument(doc);
            setPage(1);
          })
          .catch((e) => {
            clearTimeout(timeout);
            if (!stopped) {
              setError(e);
              setBusy(false);
            }
          });
      })
      .catch((e) => {
        if (!stopped) {
          setError(e);
          setBusy(false);
        }
      });
    return () => {
      stopped = true;
      dispose();
    };
  }, [data]);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let stopped = false,
      render: { cancel: () => void } | undefined;
    setBusy(true);
    setError(null);
    void document
      .getPage(page)
      .then((pdfPage) => {
        if (stopped || !canvas.current) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const width = Math.max(160, Math.min(760, window.innerWidth - 72));
        const scale = Math.min(
          width / base.width,
          Math.sqrt(8_000_000 / (base.width * base.height)),
        );
        const viewport = pdfPage.getViewport({ scale });
        canvas.current.width = Math.ceil(viewport.width);
        canvas.current.height = Math.ceil(viewport.height);
        const task = pdfPage.render({ canvas: canvas.current, viewport, annotationMode: 0 });
        render = task;
        return task.promise;
      })
      .then(() => {
        if (!stopped) setBusy(false);
      })
      .catch((e) => {
        if (!stopped) {
          setError(e);
          setBusy(false);
        }
      });
    return () => {
      stopped = true;
      render?.cancel();
    };
  }, [document, page]);
  return (
    <>
      <div className="pdf-controls">
        <button
          className="button small"
          disabled={!document || page <= 1 || busy}
          onClick={() => setPage((p) => p - 1)}
        >
          Trang trước
        </button>
        <span>
          Trang {page} / {document?.numPages || '…'}
        </span>
        <button
          className="button small"
          disabled={!document || page >= document.numPages || busy}
          onClick={() => setPage((p) => p + 1)}
        >
          Trang sau
        </button>
      </div>
      {busy && <p role="status">Đang hiển thị PDF…</p>}
      {error && (
        <ErrorBox
          error={new Error('Chưa thể hiển thị PDF. Tải xuống để mở bằng ứng dụng phù hợp.')}
        />
      )}
      <canvas ref={canvas} aria-label={`Nội dung PDF trang ${page}`} className="pdf-canvas" />
    </>
  );
}
