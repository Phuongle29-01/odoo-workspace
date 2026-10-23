import { migrate, pool } from '../src/server/db';
await migrate();
await pool().end();
console.log('Workspace schema ready.');
