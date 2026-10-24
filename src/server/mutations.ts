import { z } from 'zod';
import { hash } from './crypto';
import { pool, readyDb } from './db';
import { AppError } from './errors';
// One attempt only. A lost upstream response remains unknown and is never automatically replayed.
export async function mutate(
  identity: string,
  request: Request,
  data: unknown,
  run: () => Promise<unknown>,
) {
  const key = z.uuid().parse(request.headers.get('idempotency-key'));
  const fingerprint = hash(JSON.stringify(data));
  await readyDb();
  const inserted = await pool().query(
    'INSERT INTO workspace_mutations(identity,key,fingerprint) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING key',
    [identity, key, fingerprint],
  );
  if (!inserted.rowCount) {
    const { rows } = await pool().query(
      'SELECT fingerprint,status,result FROM workspace_mutations WHERE identity=$1 AND key=$2',
      [identity, key],
    );
    if (rows[0].fingerprint !== fingerprint)
      throw new AppError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'Mã thao tác đã được dùng cho nội dung khác.',
      );
    if (rows[0].status === 'done') return rows[0].result;
    throw new AppError(
      409,
      'RESULT_UNKNOWN',
      'Thao tác trước chưa có kết quả chắc chắn. Tải lại dữ liệu và kiểm tra trước khi tạo yêu cầu mới.',
    );
  }
  try {
    const result = await run();
    await pool().query(
      "UPDATE workspace_mutations SET status='done', result=$3 WHERE identity=$1 AND key=$2",
      [identity, key, JSON.stringify(result)],
    );
    return result;
  } catch (e) {
    // Retain failed/pending keys as uncertain, including transport timeouts.
    await pool().query(
      "UPDATE workspace_mutations SET status='unknown' WHERE identity=$1 AND key=$2",
      [identity, key],
    );
    throw e;
  }
}
