import { config } from '../src/server/config';
import { rpc } from '../src/server/odoo';
try {
  const conf = config();
  const result = (await rpc('common', 'version', [])) as {
    server_version: string;
    server_version_info: unknown[];
  };
  console.log(
    JSON.stringify(
      {
        host: new URL(conf.url).hostname,
        databaseConfigured: !!conf.db,
        version: result.server_version,
        compatible: result.server_version_info[0] === 17,
        hosting: conf.hosting,
        writesEnabled: conf.write,
      },
      null,
      2,
    ),
  );
  if (result.server_version_info[0] !== 17) process.exitCode = 1;
} catch {
  console.error(
    'Cannot verify Odoo. Check URL, database, network policy and TLS. No secrets were logged.',
  );
  process.exitCode = 1;
}
