# Danh sách tệp bàn giao

Repository ban đầu trống; các tệp nguồn sau được tạo trong nhánh `feature/odoo17-smart-workspace`. Không bao gồm secret, node_modules, build output, browser reports hoặc volume dữ liệu. AGENTS.md do Next.js development sinh và đã được đọc/xác minh.

- `.dockerignore`
- `.env.example`
- `.github/workflows/ci.yml`
- `.gitignore`
- `.nvmrc`
- `.prettierrc.json`
- `AGENTS.md`
- `Dockerfile`
- `README.md`
- `addons/smart_workspace_bridge/__init__.py`
- `addons/smart_workspace_bridge/__manifest__.py`
- `addons/smart_workspace_bridge/models/__init__.py`
- `addons/smart_workspace_bridge/models/project_task.py`
- `compose.production.yaml`
- `compose.yaml`
- `deploy/Caddyfile`
- `docs/acceptance.md`
- `docs/architecture.md`
- `docs/changes.md`
- `docs/cloud-start.md`
- `docs/deployment.md`
- `docs/pull-request.md`
- `docs/repository-audit.md`
- `docs/validation.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `scripts/build-cloud-image.py`
- `scripts/check-odoo.ts`
- `scripts/cloud-install.sh`
- `scripts/integration.ts`
- `scripts/migrate.ts`
- `scripts/prepare-local.py`
- `scripts/seed-odoo.py`
- `scripts/start.mjs`
- `src/app/[[...slug]]/page.tsx`
- `src/app/api/[...path]/route.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/discuss.tsx`
- `src/components/workspace.tsx`
- `src/lib/client.ts`
- `src/server/auth.ts`
- `src/server/config.ts`
- `src/server/crypto.ts`
- `src/server/db.ts`
- `src/server/discuss.ts`
- `src/server/errors.ts`
- `src/server/http.ts`
- `src/server/mutations.ts`
- `src/server/odoo.ts`
- `src/server/workspace.ts`
- `tests/e2e/workspace.spec.ts`
- `tests/unit/security.test.ts`
- `tsconfig.json`
- `vitest.config.ts`

## Bản cải tiến UX và kiểm thử tiếp theo

- Design tokens/Inter và responsive overrides: `src/app/tokens.css`, `workspace-ux.css`; các component dùng chung, smart search, task workbench, editor và dashboard tách khỏi shell.
- Backend thêm dashboard counts, bộ lọc domain, task activities, state/assignee decoration và bảng `workspace_ui_preferences`; không đổi nguồn dữ liệu nghiệp vụ.
- Tests: unit cho highlight/tz/filter, fixtures chỉ trong browser, UI/axe, collaboration thật, 21 screenshot baselines; CI giữ HTML report/diagnostics/trace khi lỗi.
- `scripts/measure-performance.ts`, `docs/performance.md`, `docs/measurements/`, `docs/ux-review.md`, ảnh audit ban đầu ở `docs/ui-before/` và các ảnh chuẩn ở `tests/visual/snapshots/`.
- Reusable cloud setup cài browser Playwright đúng lockfile; hướng dẫn startup giữ việc khởi động dịch vụ và kiểm tra nghiệp vụ riêng.
