#!/usr/bin/env bash
set -euo pipefail
cd /workspace/odoo-workspace
export npm_config_cache=/workspace/.cache/npm
export NEXT_TELEMETRY_DISABLED=1
npm ci
export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright
npm exec playwright -- install chromium
python3 scripts/prepare-local.py
chmod -R a+rX addons
chmod a+r scripts/seed-odoo.py
docker compose --env-file .env.local --profile local up -d --wait db odoo
npm run local:seed
npm run db:migrate
npm run build
