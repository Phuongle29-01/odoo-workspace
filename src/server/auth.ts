import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { config } from './config';
import { decrypt, encrypt, hash } from './crypto';
import { pool, readyDb, rateLimit } from './db';
import { AppError } from './errors';
import { Odoo } from './odoo';

export const SESSION_COOKIE = 'workspace_session';
export const instance = () => hash(`${config().url}\0${config().db}`);
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.SESSION_COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});
export async function createSession(uid: number, password: string) {
  await readyDb();
  const token = randomBytes(32).toString('hex');
  const ttl = Math.min(24, Math.max(1, Number(process.env.SESSION_TTL_HOURS) || 8));
  await pool().query('DELETE FROM workspace_sessions WHERE expires_at<now()');
  await pool().query('DELETE FROM workspace_limits WHERE resets_at<now()');
  await pool().query("DELETE FROM workspace_mutations WHERE created_at < now()-interval '7 days'");
  await pool().query(
    "INSERT INTO workspace_sessions(token_hash,uid,instance,encrypted,expires_at) VALUES($1,$2,$3,$4,now()+$5 * interval '1 hour')",
    [hash(token), uid, instance(), encrypt(password, config().key, `${instance()}:${uid}`), ttl],
  );
  (await cookies()).set(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: ttl * 3600 });
}
export async function session() {
  await readyDb();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.');
  const { rows } = await pool().query(
    'SELECT uid, encrypted FROM workspace_sessions WHERE token_hash=$1 AND instance=$2 AND expires_at>now()',
    [hash(token), instance()],
  );
  if (!rows.length)
    throw new AppError(401, 'SESSION_EXPIRED', 'Phiên đã hết hạn. Vui lòng đăng nhập lại.');
  const uid = Number(rows[0].uid);
  let password: string;
  try {
    password = decrypt(rows[0].encrypted, config().key, `${instance()}:${uid}`);
  } catch {
    throw new AppError(401, 'SESSION_EXPIRED', 'Phiên không còn hợp lệ. Vui lòng đăng nhập lại.');
  }
  await rateLimit(`session:${hash(token)}`, 180, 60);
  return { uid, identity: `${instance()}:${uid}`, odoo: new Odoo({ uid, password }) };
}
export async function logout() {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (cookie) {
    await readyDb();
    await pool().query('DELETE FROM workspace_sessions WHERE token_hash=$1', [hash(cookie)]);
  }
  (await cookies()).delete(SESSION_COOKIE);
}
