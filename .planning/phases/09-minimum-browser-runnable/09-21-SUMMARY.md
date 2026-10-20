---
phase: 09-minimum-browser-runnable
plan: 21
subsystem: build
tags: [vite, rollup, esm, jsonc, fontmin, data-isolation, build-pipeline]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-19 / 09-20 的数据端与渲染端插件系统（构建脚本此前未适配）
provides:
  - "script/build-plugin.ts：`dataIsolationPlugin`（模块图双路隔离检测）"
  - "script/build-resource.ts：`buildContent` / `minifyJSONC` 与 content 构建接口"
  - "script/build-game.ts：准备 → 渲染端 → 数据端 → content → LICENSE 的新构建编排"
affects: [09-minimum-browser-runnable, build:game 产物布局, 后续 content/loader 适配]

# Actuals
actuals:
  tokens: 4647
  tasks: 3
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "数据端隔离检测：`resolveId` 拦说明符 + `moduleParsed(info: ModuleInfo)` 按 `info.id` 兜底，命中即 `this.error`"
    - "数据端库模式 ESM：入口产物 `dist/data.js`（dist 根），附属 chunk/asset 落在 `dist/data/`，与渲染端 `assets/`、`chunks/` 分离"
    - "content 构建：jsonc 按行去 `//` 注释后 `JSON.parse` + `JSON.stringify`，输出单行纯 JSON 且后缀仍为 `.jsonc`"

key-files:
  created:
    - script/build-plugin.ts
    - script/build-plugin.test.ts
  modified:
    - script/build-resource.ts
    - script/build-game.ts
  deleted:
    - script/build-packages.ts

key-decisions:
  - "按用户指定文件名落码：`script/build-plugin.ts` / `script/build-plugin.test.ts`（覆盖 dev.md 小驼峰文件名规则）"
  - "隔离检测改为模块图硬报错，删除按体积推断的 `checkClientData` 启发式"
  - "数据端入口固定 `dist/data.js`（dist 根），附属产物前缀 `data/`，并强制 `emptyOutDir: false`"
  - "content 的 jsonc 去掉全部注释（含系统标记行），不保留注释、不改后缀、不改 loader"

patterns-established:
  - "构建脚本按函数切片做结构门禁：buildClient / buildData / buildGame 各自断言关键配置"
  - "插件行为用真实 `vite.build()`（`write: false` + 临时 fixture）验证，而不是只做文本断言"

requirements-completed: []
duration: 6min
completed: 2026-10-20
status: complete
---

# Phase 09 Plan 21: 任务 11 · 构建重构（适配新引擎）Summary

**构建脚本完成新引擎适配：渲染端以 `index.html` 输出常规 `dist`，数据端以库模式 ESM 产出 `dist/data.js` + `dist/data/`（模块图插件硬报错），`src/content` 去注释压成纯 JSON 落到 `dist/content`，并保留 `LICENSE`；旧 babel / zip / 分块 / 旧模板拷贝流程全部移除，`build-packages.ts` 已删除**

## Performance

- **Duration:** 约 6 分钟
- **Started:** 2026-10-20T17:31:00Z
- **Completed:** 2026-10-20T17:37:00Z
- **Tasks:** 3（Task 0 汇报关卡、Task 1 插件与单测、Task 2 脚本重写）
- **Files modified:** 5（新增 2、重写 2、删除 1）

## 任务执行结果

| Task | 内容 | 结果 |
| ---- | ---- | ---- |
| Task 0 | 预执行汇报关卡（`blocking-human`） | 用户已回复「可以执行」，关卡闭环 |
| Task 1 | `dataIsolationPlugin` + 真实 `vite.build()` 单测 | 完成，单测 4/4 通过 |
| Task 2 | 重写 `build-resource` / `build-game`、删除 `build-packages.ts`、写本 SUMMARY | 完成，结构门禁全绿 |

## What Was Built

### 数据端隔离插件（`script/build-plugin.ts`）

- 导出 `dataIsolationPlugin(): Plugin`；`name: 'mota-data-isolation'`、`enforce: 'pre'`、`apply: 'build'`。
- 双路扫描：
  - `resolveId(source, importer)` 拦渲染端说明符（`@user/client-*`、`@user/entry-client`、`@motajs/render*`、`@motajs/client*`、`@motajs/system`、`@motajs/audio`、`@motajs/legacy-*`、`vue`、`@vue/*`、`ant-design-vue`、`@ant-design/icons-vue`）。
  - `moduleParsed(info: ModuleInfo)` 用 `info.id` 拦解析后路径（`packages-user/client-*`、`packages/render*`、`packages/client*`、`packages/system`、`packages/audio`、`packages/legacy-*`、`src/client/**`、`node_modules/{vue,@vue,ant-design-vue,@ant-design}`），导入者经 `this.getModuleInfo(info.id)` 读取 `importers`。
- 命中即 `this.error(...)`，消息以 `[mota-data-isolation]` 开头，含 `matched: <token>`、命中模块与导入者，并说明 `data-side build must not depend on render-side`。
- 数据端依赖（`@user/data-*`、`@motajs/common`、`@motajs/loader`、`@motajs/anon-tokyo`、`@motajs/types`、`@motajs/animate`）不在禁令内。
- **取代** `checkClientData` / `ClientDataLevel` / `getFileName` / `getFileSize` 体积启发式。

### 渲染端（`buildClient`）

- 复用 `vite.config.ts`（`loadConfigFromFile` + `mergeConfig`），保持 `legacy(...)` 与 `manualChunks` 现状。
- **不设置** `rollupOptions.input`，由 Vite 默认以 `index.html` 为入口；`index.html` 本身未改。
- `outDir = dist`、`copyPublicDir: false`、`emptyOutDir: false`；输出常规 `index.html` + `assets/` / `chunks/`。
- 不再拷贝 `editor.html` / `_server` / `_docs` / `libs` / `logo.png` / `styles.css` / `main.js` / `启动服务.exe`，也不再做 `main.js` 的 babel 二次压缩。

### 数据端（`buildData`）

- 入口 `src/data.ts`，`lib.formats: ['es']`（ESM，不再 iife）。
- `entryFileNames: 'data.js'` → 入口产物固定 **`dist/data.js`（dist 根）**。
- `chunkFileNames: 'data/[name].[hash].js'`、`assetFileNames: 'data/[name].[hash][extname]'` → 附属产物落在 **`dist/data/`**，与渲染端 `assets/`、`chunks/` 分离。
- `copyPublicDir: false`、`emptyOutDir: false`（不清掉先产出的渲染端产物）；`plugins: [dataIsolationPlugin()]`。

### content（`script/build-resource.ts`）

- `minifyJSONC(text)`：按行过滤 `line.trim().startsWith('//')`（去掉 `// Type: ...` 与全部系统标记行），`JSON.parse` + `JSON.stringify` 输出单行纯 JSON，非法 JSON 直接抛错；后缀仍 `.jsonc`。
- `buildContent(options)`：递归镜像 `src/content` → `dist/content`；jsonc 压缩、字体（`.ttf/.otf/.woff/.woff2`）经 `Fontmin.glyph({ text: chars })` 子集化、其它素材 `fs-extra.copy` 原样拷贝；无字体二进制时跳过并 `process.stdout.write` 告警。
- 接口：`IContentBuildOptions`（`sourceDir` / `outputDir` / `chars: string`）、`IContentBuildStats`（`files` / `jsonc` / `fonts`）。
- 不再分块、不再 zip、不再引用 JSZip / `./types`。

### 编排（`buildGame`）

1. 准备：`ensureDir` + `emptyDir` 清空 `dist` 与 `_temp`（全流程仅一次）。
2. `await buildClient(distDir)`。
3. `await buildData(distDir, resolve(process.cwd(), 'src/data.ts'))`。
4. `getAllChars(): Promise<string>`（读取 `dist` 下渲染端 `.js`，跳过 `dist/data`、`dist/content`；再读 `src/content/**/*.jsonc`）→ `buildContent({ sourceDir: 'src/content', outputDir: 'dist/content', chars })`。
5. 复制 `LICENSE` → `dist/LICENSE`，输出 `data.js` 体积、content 统计与 `dist` 总体积。

### 最终 `dist` 清单 / 排除项

- **产出：** `index.html` + Vite 常规渲染产物（`assets/` / `chunks/`）+ `data.js` + `data/`（数据端附属）+ `content/` + `LICENSE`。
- **不产出：** `public/**`（`copyPublicDir: false`）、`main.js`、`editor.html`、`_server`、`_docs`、`libs`、`logo.png`、`styles.css`、`启动服务.exe`、`source-code.zip`、`loadList.json`、`dist.zip`、资源分块 `resource.<hash>.h5data`。

### 删除清单

- 删除 `script/build-packages.ts`（D-93 / D-98）。
- `script/build-lib.ts` **未动**。
- `package.json` **未改**，故 `build:packages` script 会指向已删除文件而失效（按计划接受，属已知后续项）。

## Files Created/Modified

- `script/build-plugin.ts`（新增）— 数据端隔离 Vite 插件 `dataIsolationPlugin`
- `script/build-plugin.test.ts`（新增，必需）— 真实 `vite.build()` 行为单测
- `script/build-resource.ts`（重写）— content 构建模块 `minifyJSONC` / `buildContent`
- `script/build-game.ts`（重写）— 新构建编排
- `script/build-packages.ts`（删除）

**未改动（已核对）：** `script/build-lib.ts`、`package.json`、`index.html`、`dev.md`、`src/**`、`public/**`、`packages-user/**`、`vite.config.ts`、`pnpm-lock.yaml`、`packages*/**`、`script/dev.ts`。

## 命名获批情形

- OI-1：`script/build-plugin.ts`（用户显式指定，覆盖 dev.md 小驼峰文件名规则）、`dataIsolationPlugin`、`name: 'mota-data-isolation'`、`script/build-plugin.test.ts`。
- OI-2：`buildContent`、`minifyJSONC`、`IContentBuildOptions`、`IContentBuildStats`。
- 另有 1 个不导出的内部接口 `IContentBuildCounter`（仅用于统计累加，非公共命名）。

## Gates Run

| 门禁 | 命令 | 结果 |
| ---- | ---- | ---- |
| 插件单测 | `cmd /c "pnpm exec vitest run script/build-plugin.test.ts"` | **PASS**（4/4：拒 `vue`、拒 `src/client`、拒 `packages-user/client-*`、纯数据端通过并产出 ESM） |
| 插件结构断言 | 计划 Task 1 `<automated>`（`PLUGIN GATE FAILED`） | **PASS** |
| build-resource 结构断言 | 计划 Task 2 `<automated>`（`BUILD RESOURCE GATE FAILED`） | **PASS** |
| build-game 按函数切片断言 | 计划 Task 2 `<automated>`（`BUILD GAME GATE FAILED`） | **PASS** |
| 文件清单断言 | 计划 Task 2 `<automated>`（`FILES GATE FAILED`） | **PASS** |
| 附加：jsonc 数据体检 | 对 `src/content` 23 个 jsonc 按行去注释后 `JSON.parse` | **PASS**（23/23 可压成纯 JSON，无注释残留） |
| 附加：语法 / 类型 | `tsc --noEmit --ignoreConfig ...`（仅 4 个脚本） | **PASS**（无输出） |

## Open Items 处置

- OI-1 / OI-2：按计划提议命名采用（Task 0 已报备并由用户批准执行）。
- 已知后续项（不在本计划）：见下方 INFO-1 / INFO-2。

## Known Boundaries

- **INFO-1（jsonc 去净注释 ↔ 运行期加载器冲突）：** `dist/content/**/*.jsonc` 去掉全部注释后不再包含系统标记行，而运行期 `PrefixedJSONCProcessor`（`packages-user/data-state/src/loader/jsoncProcessor.ts`）按 `prefixSplit` 切分原文，切分结果不是 2 段时会报 **error 66**。loader 适配经用户确认**不在本计划范围**，此处仅记录为已知后续项；本计划未保留注释、未改 loader、未改 `src/**` 与 `packages-user/**`。
- **INFO-2（样式文件）：** `index.html` 仍含 `<link id="mota-css" href="/styles.css">`，本计划**不产出** `styles.css`，构建后该 link 会 404；`index.html` 与样式接线由用户处理，本计划未改该文件。
- **INFO-4（验证边界）：** 本计划**未端到端运行全量 `build:game`**（渲染端仍有两处用户 WIP 的 stale import：`src/client/initialize.ts`、`src/client/plugin/shop/shop.tsx`）。验证仅覆盖插件单测 + 两个脚本的结构断言 + jsonc 数据体检 + 脚本级语法/类型检查。**不得**将本次结果表述为「全量构建已通过」。

## Deviations from Plan

无功能性偏差，计划按既定口径执行。两处执行细节说明：

1. **换行符：** 4 个脚本文件按 dev.md「换行使用 CRLF」与 `.prettierrc` 的 `endOfLine: crlf` 写成 CRLF（与仓库既有脚本一致）；SUMMARY 等规划文档沿用 `.planning` 既有的 LF。
2. **单测产物形态：** `vite.build()` 在库模式下返回 `RollupOutput[]`，单测按数组/单对象两种形态归一后断言 `export`，未改动插件行为。

## Issues Encountered

- 单测首轮「纯数据端通过」用例因 `build()` 返回数组导致 `result.output` 为 `undefined`，已在测试内做形态归一后通过；插件实现未变。

## User Setup Required

None。

## Commits

**未提交任何内容（`git add` / `git commit` 均未执行，按本次执行指令保留在工作树）。**

## Next Phase Readiness

- 构建脚本已按新引擎产出结构就位，可继续由用户处理：INFO-1 的 jsonc loader 适配、INFO-2 的 `styles.css` 接线、渲染端两处 stale import。
- `package.json` 的 `build:packages` 已指向被删除的脚本，需在后续任务中调整（本计划按约束未改）。

---

*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-20*
