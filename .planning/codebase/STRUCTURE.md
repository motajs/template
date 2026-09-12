# Codebase Structure

**Analysis Date:** 2026-09-07

## Directory Layout

```
mota-ts/
├── src/                    # Game entry code (@user/main): entry points + content data
│   ├── main.ts             # Render/client entry
│   ├── data.ts             # Data entry (replay verification, runs in Node)
│   ├── App.vue             # Vue UI root (legacy UI stack)
│   ├── data.ts             # (data-end entry)
│   ├── styles.less         # Global styles
│   ├── content/            # New JSONC game content (core/enemy/item/tile/maps)
│   ├── types/              # Generated + declared typings (source/, declaration/)
│   └── package.json        # name: @user/main
├── packages/               # Core engine monorepo (@motajs/*)
│   ├── common/             # utils, logger, hook, dirtyTracker
│   ├── legacy-common/      # Patch system, legacy EventEmitter, utils
│   ├── types/              # shared types (enemy, utils)
│   ├── client/             # re-export of client-base
│   ├── client-base/        # glUtils, keyCodes, types (KeyCode)
│   ├── system/             # action (hotkey/keyboard) + ui (UIController/GameUI)
│   ├── render/             # WebGL/Canvas MotaRenderer + assets + style
│   ├── render-vue/         # custom Vue renderer over IRenderItem
│   ├── animate/            # excitation/animation
│   ├── audio/              # audio context, decoders, bgm/effect/sound
│   ├── loader/             # LoadTask, progress, stream
│   ├── legacy-client/      # re-export of legacy-system + legacy-ui
│   ├── legacy-system/      # keyboard.vue, storage
│   └── legacy-ui/          # Vue components/panels/presets/tools/ui
├── packages-user/          # User game code monorepo (@user/*)
│   ├── entry-client/       # composition root (render): createGame()
│   ├── entry-data/         # composition root (data): Mota registry, createData()
│   ├── client-base/        # render system layer: load/ + material/
│   ├── client-modules/     # render impl layer: render/ + action/ + fallback/
│   ├── data-common/        # data L0: common/ event/ replay/ save/ store/
│   ├── data-base/          # data L1: game/ map/ hero/ enemy/ flag/ load/
│   ├── data-system/        # data L2: combat/ + trigger/
│   ├── data-state/         # data L3: CoreState singleton + enemy/hero/legacy
│   ├── data-fallback/      # patch legacy globals onto new state
│   ├── legacy-plugin-client/  # dev hot reload
│   └── legacy-plugin-data/    # legacy plugins: shop/replay/fiveLayer/hook
├── public/                 # Legacy mota-js sample content + editor assets
│   ├── main.js             # legacy mota-js runtime (core/main globals)
│   ├── editor.html         # legacy editor
│   ├── project/            # data.js/enemys.js/events.js/items.js/maps.js + assets
│   ├── libs/               # thirdparty libs (lz-string, lodash, localforage…)
│   ├── extensions/         # legacy extensions
│   ├── _server/            # editor server config
│   └── _docs/              # editor-embedded docs
├── script/                 # Build/dev tooling (tsx scripts)
│   ├── dev.ts              # Vite + Express + WS dev servers
│   ├── build-game.ts       # full game build → dist.zip
│   ├── build-lib.ts        # library build for packages + packages-user
│   ├── build-packages.ts   # library build for packages only
│   ├── build-resource.ts   # resource splitting/compression
│   ├── declare.ts          # regenerate src/types/source/*.d.ts from public/project/*.js
│   ├── pack-template.ts    # pack the template/ directory
│   ├── lines.ts            # line-count utility
│   ├── special.ts / types.ts / utils.ts
│   └── template/           # legacy template runtime (main.js, data.js, 启动服务.exe)
├── template/               # Copy of a fresh template project (for pack:template)
├── docs/                   # Vitepress documentation site
├── .planning/              # GSD planning state (config.json, graphs/, codebase/)
├── graphify-out/           # Knowledge-graph output (manifest, graph.json/html)
├── _bundle/                # Dev rollup output (ignored)
├── index.html              # HTML entry (canvas + Vue root + legacy scripts)
├── vite.config.ts          # Vite config + @motajs/@user path aliases
├── tsconfig.json           # TS project config + path aliases
├── tsconfig.node.json      # Node-side TS config
├── eslint.config.js        # ESLint flat config
├── pnpm-workspace.yaml     # workspace: packages/*, packages-user/*, src/
├── package.json            # root scripts + shared deps
└── dev.md                  # Project dev conventions/architecture doc (read first)
```

## Directory Purposes

**`src/`:**
- Purpose: The game entry point and game content. Package name `@user/main`.
- Contains: `main.ts` (client entry), `data.ts` (data entry), `App.vue`, `styles.less`, `content/` (JSONC data), `types/` (typings).
- Key files: `src/main.ts`, `src/data.ts`, `src/App.vue`, `src/package.json`.

**`packages/` (core engine, `@motajs/*`):**
- Purpose: The reusable engine core — utilities, render system, audio, animation, input/UI systems, loader, and the legacy bridge.
- Contains: one directory per package, each with `src/` and its own `package.json`.
- Key files: `packages/render/src/core/render.ts`, `packages/system/src/action/hotkey.ts`, `packages/legacy-common/src/patch.ts`.

**`packages-user/` (user code, `@user/*`):**
- Purpose: The game-specific implementation layered over the engine — data end (L0–L3) and render end (system + impl), plus composition roots.
- Contains: one directory per package; each `src/` mirrors its layer's responsibility.
- Key files: `packages-user/entry-data/src/mota.ts`, `packages-user/data-state/src/core.ts`, `packages-user/client-modules/src/index.ts`.

**`public/`:**
- Purpose: The legacy mota-js sample game content and runtime, plus editor assets. Not TypeScript — these are the uncompiled game files the engine loads.
- Contains: `main.js` (legacy runtime), `project/` (data, enemys, events, items, maps, floors, images, sounds, bgms, autotiles, tilesets, materials, animates), `libs/thirdparty/`, `extensions/`, `_server/`, `_docs/`, `editor.html`, `styles.css`, `logo.png`.
- Key files: `public/main.js`, `public/project/data.js`, `public/project/maps.js`.

**`script/`:**
- Purpose: Build/dev tooling run via `tsx` (`pnpm dev`, `pnpm build:game`, `pnpm declare`, …).
- Contains: `dev.ts` (dev servers + hot reload), `build-game.ts` (game packaging), `build-resource.ts` (asset splitting), `declare.ts` (type generation), `pack-template.ts`, and helpers.
- Key files: `script/dev.ts`, `script/build-game.ts`, `script/declare.ts`.

**`docs/`:**
- Purpose: Vitepress documentation site (`docs:dev` / `docs:build`), including API docs per package, dev guides, and logger error-code reference.
- Contains: `.vitepress/`, `api/`, `dev/`, `guide/`, `logger/`.

**`template/`:**
- Purpose: A standalone copy of a fresh template project, packaged by `script/pack-template.ts` (`pnpm pack:template`).
- Contains: its own `src/`, `script/`, `vite.config.ts`, `package.json`, etc.

**`.planning/`:**
- Purpose: GSD workflow state — `config.json` (workflow toggles), `graphs/` (project knowledge graph), `codebase/` (these analysis docs). Do not hand-edit during normal development.

## Key File Locations

**Entry Points:**
- `src/main.ts`: Render/client entry — `createGame()` + Vue mount.
- `src/data.ts`: Data entry — replay verification, Node-only.
- `index.html`: HTML shell — canvas `#render-main`, Vue `#root`, legacy scripts.
- `packages-user/entry-client/src/create.ts`: Client composition (`createGame`).
- `packages-user/entry-data/src/mota.ts`: Module registry (`Mota`, `r`, `rf`).

**Configuration:**
- `vite.config.ts`: Vite + auto-generated `@motajs/*`/`@user/*` aliases (from `packages/*/src` and `packages-user/*/src`).
- `tsconfig.json`: path aliases `@motajs/*` → `./packages/*/src`, `@user/*` → `./packages-user/*/src`.
- `pnpm-workspace.yaml`: workspace globs.
- `package.json`: root scripts (`dev`, `build:game`, `build:lib`, `build:packages`, `declare`, `check:circular`, `lint:*`).
- `eslint.config.js`, `.prettierrc`, `.madgerc`.

**Core Logic:**
- `packages-user/data-state/src/core.ts`: `CoreState` (data-end composition).
- `packages-user/data-base/src/game.ts`: `loading`, `hook`, `gameListener`.
- `packages-user/data-common/src/save/system.ts`: `SaveSystem` (Dexie persistence).
- `packages-user/data-common/src/replay/system.ts`: `ReplaySystem`.
- `packages/render/src/core/render.ts`: `MotaRenderer`.
- `packages/system/src/action/hotkey.ts`: `Hotkey` (input).

**Testing:**
- Root `package.json` defines `pnpm test` → `vitest`. (See `TESTING.md` for details; not the focus of this doc.)

## Naming Conventions

Conventions are defined in `dev.md` (authoritative) and escalated in `.agents/code.md`.

**Files:**
- Code files: **camelCase** (e.g. `mapStore.ts`, `hotkey.ts`, `build-game.ts`).
- Markdown folders/files: **kebab-case** (e.g. `docs/dev/`, `my-notes.md`).
- One class per file; multiple trivial implementations of the same interface in one file only after confirmation (`.agents/code.md` #6).

**Directories:**
- Package directories: lowercase single word (e.g. `client-modules`, `legacy-ui`), kebab-case for multi-word.
- Source subfolders group by feature/domain (e.g. `render/map/`, `data-state/enemy/`), not by modifier type.

**Identifiers (from `dev.md`):**
- Variables, members, general constants, methods, functions: **camelCase**.
- Classes, interfaces, type aliases, namespaces, generics, enums, comments: **PascalCase**.
- Immutable constants: **UPPER_SNAKE_CASE** (e.g. `MAX_COUNT`); acronyms all-caps (`HTTP`, `URI`).
- Interfaces meant to be `implements`-ed: **prefixed with `I`** (e.g. `IGameMap`, `IEnemyManager`, `ICoreState`).
- HTML/CSS `id`/`class`: **kebab-case**.
- No underscore naming; private members/methods do **not** start with underscore.

## Where to Add New Code

**New engine feature (core, reusable):**
- Implementation: `packages/<package>/src/` under the appropriate package (e.g. render primitives in `packages/render/src/core/`).
- Export it from the package `index.ts` (e.g. `packages/render/src/index.ts`).
- Update `packages/<package>/package.json` dependencies if it now depends on another `@motajs/*` package.

**New user/game feature:**
- Data logic → `packages-user/data-system/src/` (Layer 2) or extend `packages-user/data-state/src/` (Layer 3).
- Saveable data structures → `packages-user/data-base/src/` (Layer 1).
- Shared/utility interfaces → `packages-user/data-common/src/` (Layer 0).
- Rendering/UI → `packages-user/client-modules/src/render/` (impl layer) or `packages-user/client-base/src/` (system layer).
- Register new modules in `packages-user/entry-data/src/create.ts` and/or `packages-user/entry-client/src/create.ts` so they are available via `Mota`.

**New content (game data):**
- New JSONC content: `src/content/` (e.g. `src/content/item.jsonc`, `src/content/maps/`).
- Legacy content editing: `public/project/` (regenerate types with `pnpm declare`).

**Utilities:**
- Generic shared helpers → `packages/common/src/utils/` (or `packages/common/src/` for `logger`/`hook`).
- Legacy compatibility helpers → `packages/legacy-common/src/`.

**Tests:**
- Co-located or under a `test`/`__tests__` folder as the existing `vitest` config expects; run with `pnpm test`.

**Documentation:**
- API docs → `docs/api/` (one folder per package is generated); dev guides → `docs/dev/`; error codes → `docs/logger/`.

## Special Directories

**`node_modules/` (workspace + per-package):**
- Purpose: pnpm-installed dependencies; per-package `node_modules/@motajs/*` and `@user/*` are symlinks to sibling workspace packages.
- Generated: Yes. Committed: No.

**`_bundle/`:**
- Purpose: Dev rollup output produced by `script/dev.ts` (`getEsmFile`).
- Generated: Yes. Committed: No.

**`_temp/` / `dist/` / `dist.zip`:**
- Purpose: Build intermediates (`_temp/`) and game output (`dist/`, `dist.zip`) from `script/build-game.ts`.
- Generated: Yes. Committed: No.

**`.planning/`:**
- Purpose: GSD workflow state (config, graphs, codebase docs).
- Generated: Partly (by GSD commands). Committed: Yes (config and docs are committed by GSD).

**`graphify-out/`:**
- Purpose: Knowledge-graph build output (`graph.json`, `graph.html`, `manifest.json`).
- Generated: Yes. Committed: Varies (check `.gitignore`).

---

*Structure analysis: 2026-09-07*
