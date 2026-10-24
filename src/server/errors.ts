export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function denied(message = 'Bạn không có quyền truy cập dữ liệu này.') {
  return new AppError(403, 'ACCESS_DENIED', message);
}
