<!-- refreshed: 2026-09-07 -->
# Architecture

**Analysis Date:** 2026-09-07

## System Overview

This is **`mota-ts`** — an HTML5 "魔塔" (Mota / Tower of the Sorcerer) game engine plus a sample game, organized as a **pnpm monorepo**. The core engine lives in `packages/` (scoped `@motajs/*`), user-facing game code lives in `packages-user/` (scoped `@user/*`), and the game entry point lives in `src/`. Legacy "mota-js" sample content (uncompiled game data and the old runtime) lives in `public/`.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                        Game Entry (src/)                                  │
│   src/main.ts  (render/client entry)   src/data.ts  (data entry, replay)  │
│   src/App.vue (Vue UI root)            src/content/ (JSONC game data)     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ depends on (@user/*)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     User Layer (packages-user/ → @user/*)                 │
│  entry-client / entry-data  ← composition root + module registry          │
│  client-base (系统层)  client-modules (实现层)   [render end]              │
│  data-common(L0) data-base(L1) data-system(L2) data-state(L3)  [data end] │
│  data-fallback / legacy-plugin-client / legacy-plugin-data                │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ depends on (@motajs/*)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Core Engine (packages/ → @motajs/*)                    │
│  common  legacy-common  types  client  client-base  system                │
│  render  render-vue  animate  audio  loader  legacy-*                     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Legacy runtime & assets (public/)  +  Build tooling (script/, vite)      │
│  public/main.js (legacy mota-js core), public/project/*, public/libs/*     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Dependency direction is strictly one-way:** `src` → `packages-user` → `packages`. `packages` and `packages-user` are independently buildable as libraries; `src` is the game entry code. This is stated in `dev.md`.

## Component Responsibilities

| Component (package) | Scope | Responsibility | Key file |
|---------------------|-------|----------------|----------|
| `src` (`@user/main`) | Game entry | Composes the game: `createGame()` + mounts Vue `App` | `src/main.ts` |
| `@user/entry-client` | Composition | Registers client-side modules into `Mota`, then runs `create()` on each | `packages-user/entry-client/src/create.ts` |
| `@user/entry-data` | Composition | Defines the `Mota` module registry (`IMota`/`MotaSystem`) and registers data-side modules | `packages-user/entry-data/src/mota.ts` |
| `@user/client-base` | Render system layer | Render-side core: asset loading + material/autotile management | `packages-user/client-base/src/index.ts` |
| `@user/client-modules` | Render impl layer | Concrete renderer, UI, weather, action (hotkey/move) | `packages-user/client-modules/src/index.ts` |
| `@user/data-common` | Data Layer 0 | Common/utility interfaces (face, mover), event, replay, save, store | `packages-user/data-common/src/index.ts` |
| `@user/data-base` | Data Layer 1 | Saveable game data: maps, hero, enemy, flag, loading/hook | `packages-user/data-base/src/index.ts` |
| `@user/data-system` | Data Layer 2 | Game logic: combat/damage + trigger registry/collector | `packages-user/data-system/src/index.ts` |
| `@user/data-state` | Data Layer 3 | `CoreState` singleton that wires L0–L3 together | `packages-user/data-state/src/core.ts` |
| `@user/data-fallback` | Compatibility | Patches legacy globals onto new state (`patchAll`) | `packages-user/data-fallback/src/index.ts` |
| `@motajs/common` | Core utility | `utils`, `logger`, `hook`/`Hookable`, `dirtyTracker` | `packages/common/src/index.ts` |
| `@motajs/legacy-common` | Legacy util | `Patch` system, legacy `EventEmitter`, utils | `packages/legacy-common/src/index.ts` |
| `@motajs/system` | Input + UI sys | `Hotkey`/keyboard (`action`) + `UIController`/`GameUI` (`ui`) | `packages/system/src/index.ts` |
| `@motajs/render` | Graphics engine | `MotaRenderer` WebGL/Canvas render tree, assets, style | `packages/render/src/core/render.ts` |
| `@motajs/render-vue` | Vue renderer | Custom Vue `createRenderer` over `IRenderItem` | `packages/render-vue/src/renderer.ts` |
| `@motajs/animate` | Animation | `RafExcitation`, `ExcitationDivider`, transitions | `packages/animate/src/index.ts` |
| `@motajs/audio` | Audio | `MotaAudioContext`, BGM/effect/sound, decoders | `packages/audio/src/index.ts` |
| `@motajs/loader` | Loader | `LoadTask`, `LoadProgressTotal`, stream | `packages/loader/src/index.ts` |

## Pattern Overview

**Overall:** Layered monorepo + **inversion-of-control module registry** + **event-driven lifecycle** + strict **dual-end separation** (data end vs render end).

**Key Characteristics:**
- **Module registry (`Mota`) instead of static imports across layers.** `window.Mota.register(key, ns)` / `Mota.require(key)` is a runtime DI container that lets the data end reference render-side code lazily without creating bundle-level circular imports (see `packages-user/entry-data/src/mota.ts`).
- **No side effects at module scope.** Packages only declare functions/classes/constants; initialization happens via `createXxx()` functions bubbled up to the composition root (`dev.md` module principles).
- **Event-driven loading.** `loading` (a `GameLoading` `EventEmitter`) and `hook` (a `GameEvent` `EventEmitter`) in `packages-user/data-base/src/game.ts` coordinate startup and gameplay events.
- **Dual-end separation.** The **data end** (`src/data.ts`) runs standalone in Node for replay verification and contains zero rendering; the **render end** (`src/main.ts`) only sends input and never computes logic.
- **Legacy bridge via `Patch`.** `@motajs/legacy-common`'s `Patch` class monkey-patches the legacy `main.js` globals (`core`, `main`, `data`, `enemys`, …) so new TypeScript code coexists with the uncompiled mota-js sample.

## Layers

**Data end (three layers, per `dev.md` and `CoreState`):**

- **Layer 0 — 公共层 (`@user/data-common`):**
  - Purpose: dependency-free common interfaces/utilities (`IDataCommon`); no saveable state.
  - Location: `packages-user/data-common/src/`
  - Contains: `common/` (face, faceManager, indexer, mover), `event/`, `replay/` (`ReplaySystem`), `save/` (`SaveSystem`, Dexie), `store/` (tile/item/map/event stores).
  - Depends on: `@motajs/common`, `@motajs/loader`, `@motajs/types` only.
  - Used by: Layers 1–3 and the render end.

- **Layer 1 — 数据层 (`@user/data-base`):**
  - Purpose: all saveable game data and its interfaces (`IDataBase`).
  - Location: `packages-user/data-base/src/`
  - Contains: `game.ts` (`loading`/`hook`/`gameListener`), `map/` (`MapState`, `MapLayer`, `Tile`), `hero/`, `enemy/`, `flag/`, `load/` (`MotaDataLoader`).
  - Depends on: `@user/data-common`, `@motajs/common`, `@motajs/types`, `@motajs/loader`.
  - Used by: Layer 2, Layer 3, and render modules.

- **Layer 2 — 系统层 (`@user/data-system`):**
  - Purpose: game-logic actions that mutate Layer 1 state but are themselves not saved (`IDataSystem`).
  - Location: `packages-user/data-system/src/`
  - Contains: `combat/` (`DamageSystem`, `EnemyContext`, `MapDamage`), `trigger/` (`TriggerRegistry`, `TriggerCollector`).
  - Depends on: `@user/data-base`, `@motajs/common`.
  - Used by: Layer 3.

- **Layer 3 — 顶层模块 (`@user/data-state`):**
  - Purpose: composition/initialization only; exposes `CoreState` (singleton `state`) to the render end.
  - Location: `packages-user/data-state/src/`
  - Contains: `core.ts` (`CoreState` wires L0–L3), `enemy/` (calculators/comparers/specials), `hero/`, `legacy/`, `content/`, `ins.ts` (`state = new CoreState()`).
  - Depends on: L0–L2 plus `lodash-es`, `@motajs/loader`.
  - Used by: `@user/entry-data` (and via `Mota.require('@user/data-state')`, the render end).

**Render end (two layers):**

- **系统层 (`@user/client-base`):** render-side core — asset loading (`load/`) and material/autotile managers (`material/`). Entry `create()` in `packages-user/client-base/src/index.ts` calls `createMaterial()`.
- **实现层 (`@user/client-modules`):** depends on the system layer to implement actual rendering and interaction — `render/` (map renderer, UI panels, weather, fx), `action/` (hotkey, move), `fallback/`.

## Data Flow

### Startup / Composition Path

1. **Render entry** `src/main.ts` calls `createGame()` (from `@user/entry-client`), then `createApp(App).mount('#root')`, then legacy `main.init('play')` + `main.listen()`.
2. `createGame()` (`packages-user/entry-client/src/index.ts`) calls `createData()` then `create()`.
3. `createData()` (`packages-user/entry-data/src/index.ts`) calls `createMota()` (installs `window.Mota`), `patchAll(state)`, and `create()`.
4. `create()` (`entry-data/src/create.ts`) registers data-side namespaces into `Mota`, then emits `loading.emit('dataRegistered')`.
5. Client `create()` (`entry-client/src/create.ts`) registers client namespaces into `Mota`, emits `loading.emit('clientRegistered')`.
6. `GameLoading.checkRegistered()` (`packages-user/data-base/src/game.ts`) emits `registered` once **both** ends are registered.
7. On `registered`, `createModule()` runs `UserClientBase.create()`, `ClientModules.create()`, `LegacyUI.create()`; then async-imports Ant Design CSS, sets `main.renderLoaded`, emits `hook.emit('renderLoaded')`.

### Gameplay Loop

1. Input (keyboard/mouse) → `@motajs/system` `Hotkey` (`gameKey`) dispatches (see `packages/system/src/action/hotkey.ts`, DOM listeners at bottom).
2. Action handlers (e.g. `@user/client-modules/src/action/move.ts`) send intents to the data end.
3. Data end (`@user/data-system` combat/trigger + `@user/data-state` `CoreState`) mutates Layer 1 state (`maps`, `hero`, `enemyManager`, `flags`).
4. `hook` events (e.g. `moveOneStep`, `afterBattle`, `setBlock`) notify render modules.
5. Render end reads state reactively and re-renders via the WebGL `MotaRenderer` / custom Vue renderer.

**State Management:**
- Single source of truth is the data-end `CoreState` (`packages-user/data-state/src/core.ts`), exposed as singleton `state` (`ins.ts`). It holds saveable stores (`tileStore`, `itemStore`, `mapStore`, `maps`, `hero`, `enemyManager`, `flags`) plus execution objects (`enemyContext`, `triggerRegistry`, `triggerCollector`).
- Persistence via `SaveSystem` (`packages-user/data-common/src/save/system.ts`) over **Dexie** (IndexedDB), with undo/redo stacks and compression levels.
- Render state is derived/passive — the render end never pushes updates to the data end (arch constraint #17 in `.agents/code.md`).

## Key Abstractions

**`Mota` module registry:**
- Purpose: runtime DI container bridging the data end and render end without static import cycles.
- Interface: `IMota` with `require(key)` / `register(key, data)`, plus `r(fn)` / `rf(fn)` helpers (see `packages-user/entry-data/src/mota.ts`).
- Pattern: `Mota.register('@user/data-state', DataState)` … `Mota.require('@user/data-state')`.
- **`r()` / `rf()` are critical**: they wrap code that must run only in the render process and never during replay verification (`main.replayChecking`). Use `rf` to wrap a function, `r` to run a block.

**`CoreState` (data-end singleton):**
- Purpose: top-level object that wires Layer 0–3 and is the single data-end state.
- Files: `packages-user/data-state/src/core.ts` (class), `ins.ts` (`state` singleton).
- Pattern: constructor initializes `#region L0` → `L1` → `L2` → `L3`, registering saveable content (`addSaveableContent('@system/hero', this.hero)`, …).

**`loading` / `hook` event emitters:**
- Purpose: startup coordination (`GameLoading` in `game.ts`) and gameplay lifecycle (`GameEvent` in `game.ts`).
- Pattern: typed `EventEmitter` from `eventemitter3`; events declared as interface maps (`GameLoadEvent`, `GameEvent`, `ListenerEvent`).

**`Patch` (legacy bridge):**
- Purpose: monkey-patch legacy mota-js globals (`core`, `main`, `data`, `enemys`, `events`, `icons`, `items`, `loader`, `maps`, `ui`, `utils`, …) via `PatchClass` enum.
- Files: `packages/legacy-common/src/patch.ts`, applied in `packages-user/entry-data/src/index.ts` (`Patch.patchAll()`) and `packages-user/data-fallback/src/index.ts` (`patchAll`).

**`MotaRenderer` + custom Vue renderer:**
- Purpose: WebGL/Canvas rendering tree, plus a Vue `createRenderer` that renders Vue VNodes onto `IRenderItem` (so Vue reactivity drives the game canvas).
- Files: `packages/render/src/core/render.ts` (renderer), `packages/render-vue/src/renderer.ts` (Vue adapter), `packages-user/client-modules/src/render/renderer.ts` (instantiation, `mainRenderer`, `createApp`).

**`SaveSystem` / `ReplaySystem`:**
- Purpose: persistence (Dexie, undo/redo, compression) and replay verification (command recording + sandbox for deterministic replay in Node).
- Files: `packages-user/data-common/src/save/system.ts`, `packages-user/data-common/src/replay/system.ts`.

## Entry Points

**Render/client entry:**
- Location: `src/main.ts`
- Triggers: browser page load (`index.html` loads `main.js` then `/src/main.ts` as module).
- Responsibilities: `createGame()`, mount Vue `App`, start legacy `main.init('play')` / `main.listen()`.

**Data entry (replay verification):**
- Location: `src/data.ts`
- Triggers: `pnpm build:game` builds it separately via `script/build-game.ts` (`buildData`), run in Node.
- Responsibilities: `createData()` only — no rendering, no DOM.

**HTML entry:**
- Location: `index.html`
- Responsibilities: defines `#render-main` canvas, `#root` Vue mount, legacy third-party scripts, and legacy `main.js`.

**Editor/dev servers:**
- Location: `script/dev.ts`
- Responsibilities: Vite dev server (game), Express static/file API server (editor at `/editor.html`), WebSocket hot reload. Proxies `/readFile`, `/writeFile`, etc.

**Build pipeline:**
- Location: `script/build-game.ts` (game zip), `script/build-lib.ts`, `script/build-packages.ts`, `script/declare.ts` (type generation), `script/pack-template.ts`.

## Architectural Constraints

- **One-way dependency:** `src` → `packages-user` → `packages`. Never invert.
- **No circular imports:** enforced by convention (`dev.md`) and `pnpm check:circular` (madge on `src/main.ts`). If a cycle is tempting, use the `Mota` registry or refactor the interface design.
- **No module side effects:** packages must only export declarations; initialize via `createXxx()` functions.
- **No `import type`:** use regular imports (only very exceptional cases allowed) — `dev.md` module principles.
- **Render end is passive:** it never pushes updates to the data end; it only reacts via hooks (`.agents/code.md` rule #17).
- **Threading / process model:** the render end is single-threaded browser JS; the data end is a separate bundle designed to run standalone in Node (for replay verification). No web workers used in the data path.
- **Global state:** the legacy mota-js runtime maintains globals `core`, `main`, and hashed data globals (`data_a1e2fb4a…`, `enemys_fcae963b…`, `icons_4665ee12…`). The new engine adds `window.Mota` (`IMota`) and `state` (`CoreState`). These globals are intentional bridge points, not free-for-all state.

## Anti-Patterns

### Putting render code in the data end

**What happens:** Adding DOM/rendering calls directly on data-end objects (e.g. inside `CoreState` or data-system logic).
**Why it's wrong:** The data end runs in Node during replay verification and has no DOM; such code breaks replay determinism and will error. This is explicitly documented in `packages-user/data-state/src/ins.ts`.
**Do this instead:** Wrap render-only effects with `Mota.r(() => { ... })` / `rf(...)` (see `packages-user/entry-data/src/mota.ts`), or route through `hook` events and let the render end subscribe.

### Creating a module with top-level side effects

**What happens:** A package file runs initialization code at module scope (e.g. instantiating a singleton and wiring it immediately).
**Why it's wrong:** Breaks the "no side effects" principle (`dev.md`), makes import order load-bearing, and risks duplicate/incorrect initialization across the client/data bundles.
**Do this instead:** Export a `createXxx()` function and call it from the package `index.ts`, bubbled up to `entry-client`/`entry-data`.

### Referencing classes instead of interfaces as member types

**What happens:** Declaring a member as `map: GameMap` instead of `map: IGameMap`.
**Why it's wrong:** Violates `dev.md` type rules and `.agents/code.md` rule #16; couples consumers to concrete implementations and breaks the layered abstraction.
**Do this instead:** Declare the interface (e.g. `IGameMap`, `IEnemyManager`) and type members with it.

### Using `as` casts / silent error handling

**What happens:** Type assertions (`as`, `as unknown as X`) or swallowing errors with `return`.
**Why it's wrong:** `.agents/code.md` forbids `as` and requires errors to be reported through `logger` with a meaningful code.
**Do this instead:** Use `logger.error(code, ...)` / `logger.warn(code, ...)` (from `@motajs/common`) with a non-zero, non-reused code; avoid assertions.

## Error Handling

**Strategy:** Centralized `logger` interface from `@motajs/common` (`packages/common/src/logger.ts`). Errors/warnings are reported with numeric codes; `logger` never throws or halts the game.

**Patterns:**
- `logger.warn(code, ...args)` for non-fatal issues (e.g. duplicate registration warnings, unknown lookups).
- `logger.error(code, ...args)` for unexpected states; the game continues.
- Direct `throw new Error(...)` only where the contract genuinely requires it (e.g. `Mota.require` of an unregistered module, `Realize nonexistent key`).
- Non-null checks: `if (!object)` for objects, `isNil(value)` (lodash-es) for literals — per `.agents/code.md` rule #13.

## Cross-Cutting Concerns

**Logging:** `@motajs/common` `logger` (`packages/common/src/logger.ts`) with numeric codes; documented under `docs/logger/`.

**Validation / type safety:** TypeScript strict mode (`tsconfig.json`), `vue-tsc --noEmit` (`check:type`). Generated legacy typings live in `src/types/source/*.d.ts` (regenerated by `script/declare.ts` from `public/project/*.js`).

**Authentication:** Not applicable (client-side game; no auth). The editor file API (`script/dev.ts`) does path-safety checks (`resolvePath`/`withSafeCheck`) but is a local dev tool, not a secured service.

**Persistence:** `SaveSystem` over Dexie/IndexedDB (data end), with compression (`SaveCompression`) and undo/redo stacks.

**Replay/determinism:** `ReplaySystem` records commands into typed arrays and replays in a sandbox; render-only code must be gated by `main.replayChecking`/`main.mode` (see `r()`/`rf()`).

---

*Architecture analysis: 2026-09-07*
