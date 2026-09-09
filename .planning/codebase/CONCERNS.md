<!-- refreshed: 2026-09-07 -->
# Codebase Concerns

**Analysis Date:** 2026-09-07

> Project: `mota-ts` (魔塔/Magic Tower game engine monorepo). Scope: full repo (`packages`, `packages-user`, `src`, `script`, plus root config files). `public`, `template`, `graphify-out`, `_bundle`, `node_modules` are gitignored/generated and were treated as out of scope for source-level findings.

---

## Tech Debt

**Legacy bridge layer (`legacy-*` packages):**
- Issue: The old engine surface is bridged to the new data-side via global `core` object + `patch.add(...)` shims, producing pervasive `any` casts and `@ts-expect-error` markers. Comments literally say `// @ts-expect-error todo` and `// 为了防止逆天样板出问题` (to guard against pathological third-party plugins).
- Files: `packages-user/legacy-plugin-data/src/fallback.ts` (630 lines), `packages-user/data-state/src/legacy/item.ts`, `packages-user/data-state/src/legacy/hero.ts`, `packages-user/data-state/src/legacy/tile.ts`, `packages-user/data-fallback/src/hero.ts`
- Impact: Legacy compatibility is maintained through untyped, hard-to-reason-about shims; type-safety guarantees of the new layer are bypassed wherever the old API is touched.
- Fix approach: Continue the planned Layer-0/1/2 data-side refactor (see `dev.md` §"双端分离"); replace `core.*` global access with typed `IStateBase`/`IStateSystem` calls, deleting `patch.add` shims as each legacy surface is migrated.

**`@ts-expect-error` / `@ts-ignore` debt:**
- Issue: ~43 suppression markers across `packages` and `packages-user`, several explicitly deferred (`// @ts-expect-error 之后修` = "fix later", `// @ts-expect-error 遗留问题` = "legacy issue", `// @ts-expect-error todo`, `// @ts-ignore`).
- Files (notable): `packages/legacy-ui/src/tools/fixed.ts:32,35`, `packages/legacy-ui/src/preset/ui.ts:94`, `packages/legacy-ui/src/ui/equipbox.vue:248,258`, `packages/legacy-common/src/eventEmitter.ts:122`, `packages/render/src/core/gl2.ts:703,706`, `packages-user/legacy-plugin-data/src/fallback.ts:146,344,346,399,430`, `packages-user/client-modules/src/render/components/textbox.tsx:620`
- Impact: Suppressions mask real type gaps and drift; new code written against these modules has no reliable type contract.
- Fix approach: Resolve each suppression (not blanket-disable); where a third-party declaration is wrong, contribute a local `.d.ts` augmentation instead of `@ts-expect-error`.

**Widespread `any` types (explicitly allowed):**
- Issue: `@typescript-eslint/no-explicit-any` is set to `'off'` in `eslint.config.js:59`, so `any` is unchecked across the codebase (86 matches in `packages`, 74 in `packages-user`). The WebGL layer and the module registry are the heaviest users.
- Files: `packages/render/src/core/gl2.ts` (`buffer`/`sub` take `any`), `packages/render/src/core/graphics.ts` (`prevValue: any, nextValue: any`), `packages-user/entry-data/src/mota.ts:87` (`Record<string, any>` registry), `packages/legacy-ui/src/controller.ts:129` (`[x: string]: any`)
- Impact: `dev.md` §"类型规范" mandates avoiding unnecessary `any`, yet the registry and WebGL bindings are entirely untyped; regressions slip past `vue-tsc`.
- Fix approach: Re-enable `no-explicit-any` selectively (per-directory overrides) once `Mota.require`/`register` and WebGL wrappers are typed; start with `entry-data/src/mota.ts` and `render/src/core/gl2.ts`.

**Singleton/global-state patterns flagged for refactor:**
- Issue: Three module-level singletons are explicitly marked `// TODO: 逐渐弱化 … 单例概念` (gradually weaken singleton concept, pass instances via parameters).
- Files: `packages-user/data-state/src/ins.ts:3` (`state = new CoreState()`), `packages-user/client-modules/src/core.ts:4` (`client = new ClientCore(state)`), plus the global `window.Mota` registry in `packages-user/entry-data/src/mota.ts:152` and the static `GameStorage.list` registry in `packages/legacy-system/src/storage.ts:4`.
- Impact: Global mutable singletons make the data-side non-reentrant, hard to test, and couple the render/data split the project is trying to enforce.
- Fix approach: Inject `ICoreState`/`IClientCore` through constructors/parameters per the TODOs; remove `GameStorage.list` static accumulation or scope it.

**Oversized source files:**
- Issue: Multiple files exceed ~800 lines with no `#region` segmentation despite `dev.md` recommending it for long files.
- Files: `packages-user/client-modules/src/render/map/renderer.ts` (1642 lines), `packages/render/src/core/types.ts` (1526), `packages-user/client-modules/src/render/components/textboxTyper.ts` (1295), `packages/render/src/core/gl2.ts` (1289), `packages-user/client-modules/src/render/map/vertex.ts` (1090), `packages/render/src/core/item.ts` (1043), `packages/render/src/core/graphics.ts` (950), `packages-user/data-system/src/combat/context.ts` (818)
- Impact: High cognitive load, difficult review; the renderer/vertex/gl2 trio is the core hot path and also the hardest to change safely.
- Fix approach: Split by responsibility (e.g. `renderer.ts` into layer/draw/camera modules); use `#region` as an intermediate step.

**Planned deprecations/refactors (from `task.md`):**
- Issue: `task.md` lists an explicit backlog: deprecate `getMappedName`, `getNextLvUpNeed`, `getLvName`, `getHeroLoc`, `setHeroLoc`, `getNakedStatus`, `getStatusLabel`, `setBuff`, `addBuff`, `getBuff`, `setStatus`, `addStatus`, `getStatus`, `getStatusOrDefault`, `getRealStatus`, `getRealStatusOrDefault`; refactor 存档系统 (save system), 寻路系统 (pathfinding), `core.status.hero`, `core.status.hero.flags`.
- Impact: The save system and pathfinding are singled out as needing rework while still in active use; changes in these areas are risk-prone until the refactor lands.
- Fix approach: Treat `task.md` as the authoritative debt backlog; sequence save-system and pathfinding refactors before adding features that depend on them.

---

## Known Bugs

**Unguarded `JSON.parse` on persisted storage (startup crash risk):**
- Symptoms: A corrupted/malformed `localStorage` entry throws during `GameStorage.read()`, which runs in the constructor (`storage.ts:11`), breaking module initialization and the whole game load.
- Files: `packages/legacy-system/src/storage.ts:18-21`
- Trigger: Any prior crash mid-write, manual tampering, or a schema change leaves invalid JSON under a `HumanBreak_*` / `{author}@{key}` key.
- Workaround: Manually clear the offending `localStorage` key via devtools.

**Unguarded decompress+parse on save/swap data:**
- Symptoms: `JSON.parse(decompressFromBase64(...))` can throw on truncated/invalid save blobs with no recovery UI.
- Files: `packages/legacy-ui/src/utils.ts:284` (`swapChapter`), `packages-user/client-modules/src/render/utils/saves.ts:82,88`
- Trigger: Loading a corrupt `.h5save` file or a failed network response during chapter swap.
- Workaround: None in-app; error surfaces as an unhandled rejection.

**Duplicate module registration silently overwrites:**
- Symptoms: `Mota.register(key, data)` logs `console.warn('模块注册重复: …')` and overwrites the previous module, which can mask load-order bugs (the last registrant wins).
- Files: `packages-user/entry-data/src/mota.ts:100-105`
- Trigger: Two entry bundles or a plugin re-registering the same `@user/...` / `@motajs/...` key.
- Workaround: None; the overwrite is silent beyond the console warning.

---

## Security Considerations

**Dynamic code execution from game data (`eval` / `new Function`):**
- Risk: Untrusted game data (item effect scripts, typewriter strings) is executed as JavaScript, allowing arbitrary code execution if a game archive/plugin is malicious or compromised.
- Files: `packages/legacy-ui/src/utils.ts:155` (`eval('`' + str + '`')` in `type()`), `packages-user/data-state/src/legacy/item.ts:40,48,55` (`new Function('state','item', legacy.itemEffect)` etc.), and the gitignored `index.cjs` (root) which uses Node's `vm` module to run game/replay code for headless replay validation.
- Current mitigation: None. This is inherent to the "魔塔" plugin model where plugins supply raw JS strings. `index.cjs` is gitignored and local-only (replay validation), but `item.ts`/`utils.ts` run in the player's browser on live game data.
- Recommendations: Sandbox `new Function` bodies (e.g. `vm`/WebWorker/`with`-scoped whitelist), or migrate legacy effect strings to a declarative effect DSL. At minimum, document that loading a project = executing its code.

**Unsafe HTML injection (`v-html` / `innerHTML`):**
- Risk: XSS if any interpolated string originates from game data, plugin output, or player-provided text.
- Files: `packages/legacy-ui/src/ui/settings.vue:52`, `packages/legacy-ui/src/ui/shop.vue:12`, `packages/legacy-ui/src/ui/toolbox.vue:101`, `packages/legacy-ui/src/ui/equipbox.vue:155`, `packages/legacy-ui/src/tools/book.tsx:43` (`<span innerHTML={...}>`), `packages/legacy-system/src/keyboard.vue:17`
- Current mitigation: Content largely originates from first-party game data (`descText`, item descriptions), but the sink is unguarded.
- Recommendations: Sanitize or escape before rendering; replace `v-html` with text interpolation where markup isn't required.

**Hardcoded credentials in working tree:**
- Risk: `user.ts` at the repo root contains `export const id = 2691; export const password = '<md5-hash>';` — a static credential pattern for game upload/auth.
- Files: `E:\github\template\user.ts`
- Current mitigation: `user.ts` is listed in `.gitignore`, so it is not committed — but it exists in the working tree and is easy to accidentally force-add or copy.
- Recommendations: Move to an untracked `.env`/config loaded at runtime; never hardcode credentials in source; rotate the credential.

**CodeQL configured but minimal:**
- Risk: `.github/workflows/codeql.yml` runs only the default `javascript` query pack (`queries: security-extended,security-and-quality` is commented out) and uses deprecated `actions/checkout@v3` / `codeql-action@v2`.
- Files: `.github/workflows/codeql.yml:17,41,45,53,59,72`
- Current mitigation: Weekly + push-to-master CodeQL scan exists.
- Recommendations: Pin `@v4` actions, enable `security-extended,security-and-quality`, and ensure `eval`/`new Function` findings are triaged.

---

## Performance Bottlenecks

**`beforeunload`/`blur` writes every storage instance:**
- Problem: On every window blur (tab switch, devtools focus, dialog), all `GameStorage` instances are serialized and written to `localStorage` synchronously.
- Files: `packages/legacy-system/src/storage.ts:111-116`
- Cause: Global `GameStorage.list` registry iterated without debounce; writes are synchronous `localStorage.setItem` calls on the main thread.
- Improvement path: Debounce/coalesce writes; only persist dirty storages (track a dirty flag in `setValue`); avoid `blur` as a write trigger or use `requestIdleCallback`.

**Large in-memory replay buffers:**
- Problem: `ReplayArray` maintains `commandBuffer`, `paramBuffer`, `indexBuffer` as `ArrayBuffer`s grown by a multiplier; long sessions accumulate large buffers that are copied on resize.
- Files: `packages-user/data-common/src/replay/array.ts` (823 lines)
- Cause: Resize likely re-allocates and copies the whole buffer; full replay is held in memory for step/seek.
- Improvement path: Use growable ring/segmented buffers; consider streaming to IndexedDB (`dexie` is already a dependency) for long replays.

---

## Fragile Areas

**`packages-user/legacy-plugin-data/src/fallback.ts` (legacy → new bridge):**
- Files: `packages-user/legacy-plugin-data/src/fallback.ts` (630 lines), `packages-user/legacy-plugin-data/src/shop.ts`, `packages-user/legacy-plugin-data/src/hook.ts`
- Why fragile: Every shim reaches into both the old `core.*` global and the new `state` object simultaneously; a change to either side silently breaks the other. Heavily decorated with `@ts-expect-error todo`.
- Safe modification: Add regression coverage for each `patch.add` handler before touching; keep old/new writes atomic (mirror `core.status.hero.loc` and `state.hero.mover` together, as in `setHeroLoc`).
- Test coverage: None (see Test Coverage Gaps).

**`packages/render/src/core/gl2.ts` + `graphics.ts` (WebGL core):**
- Files: `packages/render/src/core/gl2.ts` (1289 lines), `packages/render/src/core/graphics.ts` (950 lines), `packages/render/src/core/render.ts` (822 lines)
- Why fragile: Untyped `any` WebGL bindings, manual buffer/sub-offset arithmetic, and shader compilation error paths (`logger.json` codes 9/10/13/17/18/28/29). Rendering regressions are visually subtle.
- Safe modification: Keep shader/layout changes isolated; validate against `logger.json` error codes; add render smoke tests if a headless GL context becomes feasible.
- Test coverage: None.

**Save/load round-trip (`ISaveableContent` system):**
- Files: `packages-user/data-state/src/core.ts` (`saveables`/`addedSaveables` maps), `packages-user/data-base/src/flag/field.ts` (`toStructured`/`fromStructured` return `any`), `packages-user/client-modules/src/render/utils/saves.ts`
- Why fragile: Save schema is spread across `toStructured`/`fromStructured` methods returning `any`; a field rename or type change silently corrupts saves. This is the "存档系统" refactor target in `task.md`.
- Safe modification: Version the save format; add a save round-trip test before modifying `toStructured`/`fromStructured`.
- Test coverage: None.

---

## Scaling Limits

**Singleton architecture limits reentrancy/multi-instance:**
- Current capacity: One `CoreState` (`data-state/src/ins.ts`), one `ClientCore` (`client-modules/src/core.ts`), one global `window.Mota` registry.
- Limit: Cannot host two independent game sessions (e.g. editor + preview, or side-by-side replay) in one page; the static `GameStorage.list` also grows unbounded across instances.
- Scaling path: Convert singletons to injected instances (the already-filed TODOs), and scope `GameStorage.list` per game context.

**Replay buffer memory growth:**
- Current capacity: In-memory `ReplayArray` for the whole session.
- Limit: Multi-hour sessions produce large buffers; growth-by-multiplier causes repeated copies.
- Scaling path: Segmented/streaming storage backed by IndexedDB (`dexie` dependency available).

---

## Dependencies at Risk

**`anon-tokyo` (version `0.0.0-alpha.0`):**
- Risk: Pinned to a pre-release alpha version in `package.json:28`; API may change without notice.
- Impact: Whatever it powers (likely a font/typeface or UI preset) could break on upgrade.
- Migration plan: Pin to a stable release or vendor the needed subset.

**Legacy engine dependency on global `core` (not npm):**
- Risk: The `legacy-*` packages rely on a runtime-injected global `core` object rather than typed imports; it is not represented as a dependency and cannot be type-checked.
- Impact: Refactors of the data-side risk breaking an invisible contract with third-party 魔塔 plugins.
- Migration plan: Continue the Layer migration; expose a typed `ICoreState`/`IStateBase` and deprecate raw `core` access via `patch.add`.

**TypeScript `6.0.3` (bleeding edge):**
- Risk: `typescript: 6.0.3` (`package.json:90`) is a very new major; `vue-tsc` (`^2.2.12`) and `typescript-eslint` (`^8.58.2`) may lag on full compatibility.
- Impact: Type-check results may differ between editor and CI; possible false positives/negatives.
- Migration plan: Pin to the latest stable that `vue-tsc` and `typescript-eslint` officially support.

---

## Missing Critical Features

**Automated test suite (blocking):**
- Problem: `vitest` is configured (`package.json:8`, `"test": "vitest"`) but zero test files exist anywhere in `packages`, `packages-user`, `src`, or `script` (no `*.test.*`/`*.spec.*`/`__tests__`), and there is no `vitest.config.*`.
- Blocks: Safe refactoring of the save system, pathfinding, and legacy bridge; regression prevention for render/data split; the `pnpm test` script currently does nothing useful.

**CI for lint/type/build/tests:**
- Problem: `.github/workflows/` only contains `codeql.yml` (security scan) and `page.yml` (docs deploy). No workflow runs `pnpm lint:packages`, `pnpm lint:user`, `pnpm check:type`, `pnpm check:circular`, or `pnpm test`.
- Blocks: Automated gating of the quality rules documented in `dev.md`; nothing prevents a bad commit from reaching `master`.

---

## Test Coverage Gaps

**Entire codebase is untested:**
- What's not tested: Save/load round-trip (`ISaveableContent`), replay array encode/decode, combat calculation (`packages-user/data-system/src/combat/*`), the legacy→new bridge (`fallback.ts`), map layer/vertex generation, storage persistence.
- Files: No test files present. `pnpm test` (`vitest`) has nothing to run.
- Risk: Every refactor (esp. the `task.md` save/pathfinding items and the in-flight map interface refactor on branch `refactor/data`) is unguarded against regressions; the data/render split's "data side must run headlessly in Node" guarantee (see `dev.md` §"双端分离") is untested and can silently regress.
- Priority: **High** — add at minimum unit tests for `data-common` (replay, save) and `data-system` (combat), which are the headless, deterministic, high-value layers.

---

*Concerns audit: 2026-09-07*
