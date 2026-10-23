import pg from 'pg';
import { AppError } from './errors';
const globalDb = globalThis as unknown as {
  workspacePool?: pg.Pool;
  workspaceSchema?: Promise<void>;
};
export function pool() {
  if (!process.env.DATABASE_URL)
    throw new AppError(503, 'DB_NOT_CONFIGURED', 'Chưa cấu hình database của ứng dụng.');
  return (globalDb.workspacePool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  }));
}
export async function migrate() {
  await pool().query(`
    CREATE TABLE IF NOT EXISTS workspace_sessions (
      token_hash text PRIMARY KEY, uid integer NOT NULL, instance text NOT NULL,
      encrypted text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS workspace_sessions_expiry ON workspace_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS workspace_limits (
      key text PRIMARY KEY, count integer NOT NULL, resets_at timestamptz NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workspace_mutations (
      identity text NOT NULL, key uuid NOT NULL, fingerprint text NOT NULL,
      status text NOT NULL DEFAULT 'pending', result jsonb, created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(identity, key)
    );
    CREATE TABLE IF NOT EXISTS workspace_preferences (
      identity text NOT NULL, task_id integer NOT NULL, bookmarked boolean NOT NULL DEFAULT false,
      visited_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(identity, task_id)
    );
  `);
}
export async function readyDb() {
  if (!globalDb.workspaceSchema)
    globalDb.workspaceSchema = migrate().catch((e) => {
      globalDb.workspaceSchema = undefined;
      throw e;
    });
  await globalDb.workspaceSchema;
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  await readyDb();
  const { rows } = await pool().query(
    `INSERT INTO workspace_limits(key,count,resets_at) VALUES($1,1,now()+$2 * interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN workspace_limits.resets_at<=now() THEN 1 ELSE workspace_limits.count+1 END,
    resets_at=CASE WHEN workspace_limits.resets_at<=now() THEN excluded.resets_at ELSE workspace_limits.resets_at END RETURNING count`,
    [key, seconds],
  );
  if (rows[0].count > limit)
    throw new AppError(429, 'RATE_LIMIT', 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.');
}
