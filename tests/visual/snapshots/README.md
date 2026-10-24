# Renderer-specific screenshots

Chromium, fixture, font files, viewport, locale, timezone and animation settings are fixed by Playwright. Debian 13 and Ubuntu 24.04 still produce small differences in variable-font rasterization. `playwright.config.ts` selects snapshots using `/etc/os-release`; CI pins Ubuntu 24.04.

- `debian-13/`: original reviewed local production screenshots, preserved unchanged.
- `ubuntu-24.04/`: reviewed actual screenshots from CI run [39978725935](https://github.com/Phuongle29-01/odoo-workspace/actions/runs/39978725935), source application commit `da2a4d2`. The run's 4 real Odoo and 14 UI tests passed; 17 screenshots differed by 55–227 pixels, concentrated on glyph edges, with identical dimensions and layout. Four comparisons were already within the existing 50-pixel allowance. `provenance.json` records each source.

The comparison keeps `maxDiffPixels: 50`, without masks or a relaxed color threshold. Updates require explicit `UPDATE_VISUALS=1` after reviewing expected/actual/diff; CI never updates images. New OS versions need their own reviewed baseline rather than overwriting another renderer's reference.

UX2 (24/10/2026): Debian search/task/notifications/Discuss references changed after inspecting expected UI; added Project List/Task List at all three viewports. Before/after evidence is in docs/ux2, hashes/reasons in debian-13/ux2-provenance.json. Login, Dashboard, Project Detail references remain unchanged. Ubuntu UX2 references come from an inspected local Ubuntu24.04 container with Playwright dependencies and fonts-dejavu-core. All 27 comparisons pass there, including the 9 unchanged original references. See ubuntu-24.04/ux2-provenance.json for the precise source; these are not claimed as downloaded CI artifact images.
