# External Integrations

**Analysis Date:** 2026-09-07

## APIs & External Services

**h5mota.com (H5魔塔 tower publishing platform) — the only external HTTP service:**

The project integrates with the H5魔塔 community platform (`h5mota.com`) in three distinct places:

1. **Tower metadata scraper** — `script/special.ts`
   - `GET https://h5mota.com/backend/towers/query.php` (`mode=list`) — list all published towers
   - `GET https://h5mota.com/backend/admin/tower/info.php` (`name=<tower>`) — fetch tower metadata
   - `GET https://h5mota.com/games/{name}/project/{functions|enemys|floors.min|maps}.js` — download raw game source files for offline analysis
   - Auth: hardcoded `Cookie: id=2691; password=...` header (a session credential embedded in source — treat as sensitive; see Security Considerations below)

2. **Danmaku (barrage) proxy** — `script/dev.ts`
   - Vite dev proxy route `/danmaku` → `https://h5mota.com/backend/tower/barrage.php`

3. **Cloud save sync** — `packages-user/client-modules/src/render/utils/saves.ts`
   - `POST /games/sync.php` (relative path, resolved against the deployed `h5mota.com` origin)
   - Request body: `FormData` with `type=load`, `name`, `id`, `password`
   - Response: `SyncSaveFromServerResponse` — JSON with `code`/`msg`; `msg` is `lz-string` base64-compressed save data
   - Auth: identifier string (`存档编号` + `密码`) split into `id`/`password` by `parseIdPassword()`

## Data Storage

**Databases:**
- IndexedDB via **Dexie** (`dexie ^4.4.2`)
  - Implementation: `packages-user/data-common/src/save/system.ts` (`SaveSystem`)
  - Schema (v1): `saves` table (`id` key) and `global` table (`key` key)
  - Used for local save/autosave slots, undo/redo stack persistence, and global key-value state
- `localStorage` (legacy) — `packages/legacy-system/src/storage.ts`
- **localforage** (legacy fallback) — vendored at `public/libs/thirdparty/localforage.min.js`, typed in `src/types/declaration/util.d.ts`

**File Storage:**
- Local filesystem only. The dev/editor server exposes a file CRUD API over Express (`script/dev.ts`): `POST /listFile`, `/makeDir`, `/readFile`, `/writeFile`, `/deleteFile`, `/moveFile`, `/writeMultiFiles`; `GET /all/__all_floors__.js`, `/all/__all_animates__`, `/esm`, `/getPort`. All paths are confined to the `public/` base directory (`resolvePath()` safety check).

**Caching:**
- None (no external cache service). In-browser `localStorage`/IndexedDB are used for persistence only.

## Authentication & Identity

**Auth Provider:**
- Custom / none. There is no OAuth or third-party identity provider.
- Cloud save uses a bare `id` + `password` pair (split from a user-entered save code). See `parseIdPassword()` in `packages-user/client-modules/src/render/utils/saves.ts`.
- The scraper in `script/special.ts` authenticates to the admin API using a hardcoded session cookie.

**Native bridge (mobile packaging):**
- `window.jsinterface` global is called for orientation control (`requestPortrait()` / `requestLandscape()`) in `packages/legacy-ui/src/utils.ts` (`triggerFullscreen()`). This is the interface exposed by the native app shell (Android/iOS) that wraps the HTML5 game.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry/Bugsnag/etc.)

**Logs:**
- Custom in-repo logger: `packages/common/src/logger.ts` (with error/warn code tables surfaced in `docs/logger/`). Uses `console` output; `no-console` is `warn` in `eslint.config.js`.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages (static) — `.github/workflows/page.yml` builds on push to `master` and deploys the `dist/` folder to the `gh-pages` branch using `JamesIves/github-pages-deploy-action`.
- The built game is also distributed as a self-contained static bundle (`dist/`) and `dist.zip`.

**CI Pipeline:**
- GitHub Actions only:
  - `page.yml` — install deps (`pnpm@7.27.0`), `pnpm i`, `pnpm build`, deploy to Pages (uses secret `ACCESS_TOKEN`)
  - `codeql.yml` — CodeQL static analysis (JavaScript), runs on push/PR to `master` + weekly cron

## Environment Configuration

**Required env vars:**
- None at runtime. The project uses no `.env` files.

**Secrets location:**
- GitHub Actions secret: `ACCESS_TOKEN` (referenced in `.github/workflows/page.yml`)
- Editor server config: `public/_server/config.json` (gitignored; auto-created as `{}` by `script/dev.ts`)
- Hardcoded admin cookie in `script/special.ts` (should be externalized, see Security Considerations)

## Webhooks & Callbacks

**Incoming:**
- Dev-time Express server routes (`script/dev.ts`): file CRUD endpoints listed above, plus `GET /getPort` (returns the hot-reload WebSocket port to the client, `packages-user/legacy-plugin-client/src/dev/hotReload.ts`).
- WebSocket server (`ws`) on the editor HTTP server for hot reload; client connects to `ws://127.0.0.1:{port}` and receives `reload`, `floorHotReload`, `dataHotReload`, `cssHotReload` messages.

**Outgoing:**
- h5mota.com tower query/info/game-file endpoints (`script/special.ts`)
- h5mota.com barrage endpoint via dev proxy (`script/dev.ts`)
- h5mota.com cloud save sync `/games/sync.php` (`packages-user/client-modules/src/render/utils/saves.ts`)
- Local asset streaming via `window.fetch` (`packages/loader/src/task.ts`, `packages/loader/src/stream.ts`)

---

## Security Considerations

**Hardcoded session credential in `script/special.ts`**
- The admin API calls embed `Cookie: id=2691; password=26e631510147c1d0b71a368a3729df5a` directly in source. This is a live-looking session credential checked into the repository.
- Impact: if the credential is valid, it grants the scraper access to h5mota.com's admin/tower endpoints and leaks on any code share.
- Recommendation: move the cookie value to a local, gitignored config or environment variable; rotate the credential.

**No auth on editor file API (`script/dev.ts`)**
- The Express routes (`/readFile`, `/writeFile`, `/deleteFile`, etc.) require no authentication and are bound to the local server; the only protection is a path-traversal check (`resolvePath()`).
- Recommendation: keep the editor server loopback-only in production; do not expose port 3000 publicly.

---

*Integration audit: 2026-09-07*
