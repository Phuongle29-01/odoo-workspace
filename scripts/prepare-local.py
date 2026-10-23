"""Create local-only settings once, preserving all existing user files."""
from pathlib import Path
import secrets
from urllib.parse import quote

root = Path(__file__).resolve().parents[1]
target = root / '.env.local'
if target.exists():
    print('.env.local already exists; preserved without changes.')
else:
    pg = secrets.token_hex(24)
    text = '\n'.join([
        'APP_ORIGIN=http://localhost:3000',
        f'DATABASE_URL=postgresql://workspace:{quote(pg)}@127.0.0.1:5433/workspace',
        f'LOCAL_POSTGRES_PASSWORD={pg}',
        f'ENCRYPTION_KEY={secrets.token_hex(32)}',
        'SESSION_COOKIE_SECURE=false', 'SESSION_TTL_HOURS=8',
        'ODOO_URL=http://127.0.0.1:8069', 'ODOO_PUBLIC_URL=http://127.0.0.1:8069', 'DOCKER_ODOO_URL=http://odoo:8069', 'ODOO_DB=workspace_test',
        'ODOO_VERSION=17', 'ODOO_HOSTING=self_hosted', 'ODOO_AUTH_MODE=password',
        'ODOO_ALLOW_HTTP=true', 'ODOO_WRITE_ENABLED=true',
        f'LOCAL_ODOO_ADMIN_PASSWORD={secrets.token_urlsafe(32)}',
        f'LOCAL_TEST_PASSWORD_A={secrets.token_urlsafe(32)}',
        f'LOCAL_TEST_PASSWORD_B={secrets.token_urlsafe(32)}', '',
    ])
    with target.open('x') as f:
        f.write(text)
    target.chmod(0o600)
    print('Created .env.local for disposable local Odoo only. Values are not logged.')
