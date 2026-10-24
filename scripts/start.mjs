import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!existsSync('.next/standalone/server.js'))
  throw new Error('Build missing. Run npm run build first.');
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
process.env.HOSTNAME = '0.0.0.0';
await import(pathToFileURL(resolve('.next/standalone/server.js')).href);
