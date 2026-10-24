import { AppError } from './errors';
/** File extension and declared MIME are untrusted. Never preview HTML/SVG. */
export function previewType(bytes: Uint8Array): string {
  if (bytes.byteLength > 5 * 1024 * 1024)
    throw new AppError(
      413,
      'PREVIEW_TOO_LARGE',
      'Xem trước giới hạn 5 MB. Bạn có thể tải tệp về máy.',
    );
  const b = Buffer.from(bytes);
  if (b.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'image/jpeg';
  if (['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (
    b.subarray(0, 4).toString('ascii') === 'RIFF' &&
    b.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp';
  throw new AppError(
    415,
    'UNSAFE_PREVIEW',
    'Định dạng này chỉ hỗ trợ tải xuống. Xem trước hỗ trợ PDF và ảnh PNG/JPEG/GIF/WebP.',
  );
}
