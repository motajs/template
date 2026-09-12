# Technology Stack

**Analysis Date:** 2026-09-07

## Languages

**Primary:**
- TypeScript 6.0.3 - All engine/package source, build scripts, and docs config (monorepo `packages/`, `packages-user/`, `src/`, `script/`, `docs/`)
- Vue 3 SFC (Single File Components) - Client UI (`*.vue` in `packages-user/client-modules/`, `src/App.vue`)

**Secondary:**
- JavaScript (legacy runtime) - The legacy H5 runtime layer under `public/libs/*.js` and game content `public/project/*.js` (data.js, enemys.js, events.js, floors, maps, etc.)
- Less - Stylesheets (`src/styles.less`, `javascriptEnabled: true` in Vite config)
- CSS - Editor/assets styles (`public/styles.css`, `public/_server/**`)

## Runtime

**Environment:**
- Node.js `^20.0.0 || >=22.0.0` (per `dev.md`)
- Browsers supporting ESNext; production build targets `Chrome >= 56`, `Firefox >= 51`, `Edge >= 79`, `Safari >= 15`, `Opera >= 43` via `@vitejs/plugin-legacy` (`script/build-game.ts`)

**Package Manager:**
- pnpm `>= 10.0.0` (per `dev.md`)
- Lockfile: `pnpm-lock.yaml` (present)
- Workspace: `pnpm-workspace.yaml` — globs `packages/*`, `packages-user/*`, and `src/`; `onlyBuiltDependencies`: `core-js`, `esbuild`, `ttf2woff2`, `vue-demi`

## Frameworks

**Core:**
- Vue `^3.5.29` - UI framework for the client render side (`src/main.ts`, `src/App.vue`)
- Vite `^7.3.1` - Dev server and production bundler (`vite.config.ts`, `script/dev.ts`, `script/build-game.ts`)
- Ant Design Vue `^3.2.20` + `@ant-design/icons-vue ^6.1.0` - UI component library (bundled as manual chunk `antdv`)

**Rendering (custom, in-repo):**
- WebGL2 - Hand-written render engine in `packages/render/src/core/gl2.ts`, `assets/composer.ts` (no external rendering framework)
- `gl-matrix ^3.4.4` - Matrix/vector math for WebGL (`packages/render/src/core/transform.ts`, `core/item.ts`)
- `maxrects-packer ^2.7.3` - Texture atlas packing (`packages/render/src/assets/composer.ts`, `streamComposer.ts`)

**Audio:**
- Web Audio API (`AudioContext`) via `packages/audio/src/context.ts` with wasm decoders:
  - `@wasm-audio-decoders/ogg-vorbis ^0.1.20`
  - `ogg-opus-decoder ^1.7.3`
  - `opus-decoder ^0.7.11`
  - `codec-parser ^2.5.0` (codec stream parsing in `packages/audio/src/source.ts`)

**Testing:**
- Vitest `^4.0.18` - Test runner (`package.json` script `"test": "vitest"`)

**Docs:**
- VitePress `^1.6.4` - Documentation site (`docs/.vitepress/config.ts`, output to `public/_docs`)
- Mermaid `^11.12.3` + `vitepress-plugin-mermaid ^2.0.17` + `markdown-it-mathjax3 ^4.3.2`

**Build/Dev:**
- Rollup `^4.59.0` (+ `@rollup/plugin-*` family) - Programmatic bundling in build scripts
- `@babel/core ^7.29.0` / `@babel/preset-env ^7.29.0` / `@babel/cli ^7.28.6` - Post-build script minification (`script/build-game.ts`)
- `vue-tsc ^2.2.12` - Type checking for `.vue` files
- `tsx ^4.21.0` - Execute TypeScript build/dev scripts
- `fontmin ^2.0.3` - CJK font subsetting at build time (`script/build-game.ts`)
- Express `^5.2.1` - Local editor/dev HTTP server (`script/dev.ts`)
- `ws ^8.19.0` - WebSocket server for hot reload (`script/dev.ts`)
- `chokidar ^3.6.0` - File watching (`script/dev.ts`)
- `archiver ^7.0.1` + `compressing ^1.10.4` - Zip packaging (`script/build-game.ts`)
- `madge ^8.0.0` - Circular dependency check (`"check:circular"` script)

## Key Dependencies

**Critical:**
- `dexie ^4.4.2` - IndexedDB wrapper for game saves (`packages-user/data-common/src/save/system.ts`)
- `lz-string ^1.5.0` - Save compression (`packages-user/client-modules/src/render/utils/saves.ts`, `packages/legacy-ui/src/utils.ts`)
- `jszip ^3.10.1` - Zip handling (`packages/loader/`)
- `axios ^1.13.6` - HTTP client (`script/special.ts`, `packages/legacy-ui/src/utils.ts`)
- `lodash-es ^4.17.23` - Utility functions (used widely across packages)
- `eventemitter3 ^5.0.4` - Event emitter
- `mutate-animate ^1.4.2` - Animation tweening (`packages/legacy-ui/src/utils.ts`)
- `anon-tokyo 0.0.0-alpha.0` - "high performance interpreter" (declared dependency; no import found in `packages/`/`src/`/`packages-user/` source)
- `chart.js ^4.5.1` - Charts (declared; not detected in source, likely editor-facing)

**Infrastructure:**
- `fs-extra ^11.3.4`, `glob ^11.1.0` - File system utilities in build scripts
- `less ^4.5.1`, `postcss-preset-env ^9.6.0` - CSS preprocessing

## Configuration

**Environment:**
- No `.env` / `.env.*` files present — the project does not use runtime environment variables.
- `import.meta.env.BASE_URL` is used for asset path prefixing (`packages/loader/src/task.ts`, `packages/legacy-ui/src/utils.ts`). Vite `base` is set to `./` (`vite.config.ts`).
- Editor config: `public/_server/config.json` (gitignored; auto-generated as `{}` by `ensureConfig()` in `script/dev.ts`).

**Build:**
- `tsconfig.json` — `strict`, `moduleResolution: "bundler"`, `jsx: "preserve"` (`jsxImportSource: "vue"`), path aliases `@motajs/*` → `packages/*/src` and `@user/*` → `packages-user/*/src`.
- `tsconfig.node.json` — covers `vite.config.ts`, `script/`, and `docs/.vitepress/*`.
- `vite.config.ts` — dynamic aliases generated from `packages/*/src` and `packages-user/*/src`; Less `javascriptEnabled`; `postcss-preset-env`.
- `.prettierrc` — `tabWidth: 4`, `singleQuote`, `semi`, `trailingComma: "none"`, `endOfLine: "crlf"`.
- `eslint.config.js` — flat config combining `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, `eslint-plugin-react`, `eslint-plugin-prettier`.
- `.madgerc` — madge config for circular-dependency detection (`.ts`/`.tsx`, skips type imports).

## Platform Requirements

**Development:**
- Node.js 20/22+, pnpm 10+, VSCode (recommended extensions: `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `vue.volar`, `slevesque.shader`, `tobermory.es6-string-html` in `.vscode/extensions.json`).
- Run `pnpm dev` (Vite on 5173 + Express editor server on 3000) or `pnpm test`.

**Production:**
- Static HTML5 game: `pnpm build:game` produces `dist/` (deployable static bundle) and `dist.zip`.
- Deployment target: GitHub Pages via `.github/workflows/page.yml` (builds `dist` folder to `gh-pages` branch).
- The data layer (`src/data.ts`) is built separately as an IIFE bundle (`data.process.js`) usable for replay verification in Node.

---

*Stack analysis: 2026-09-07*
