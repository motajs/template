---
phase: 04-render-adaptation
plan: 14
subsystem: render-ui-interface-adaptation
tags: [ui-interface-adaptation, step-2, d74-d78, hero-attribute-hook, new-loader, delete-old-wiring, tracer]
requires:
  - phase: 04-render-adaptation
    provides: 用户裁定 D-74 / D-75 / D-76 / D-77 / D-78 写入 04-CONTEXT.md（2026-09-30）
  - phase: 04-render-adaptation
    provides: 04-13 只读影响台账 04-UI-ADAPTATION-IMPACT.md（## 修改点汇总 + A–F 类）
provides:
  - render/ui/main.tsx：状态栏更新改在 client.hero.attribute 上 addHook({ onUpdateAttribute })，onUnmounted 注销；移除全局 hook 残留与手工调用垫片（D-78）
  - render/ui/load.tsx：旧加载 UI 改依新加载系统 client.loader.start() + client.loader.manager.get*；移除旧接口成员与失效 @ts-expect-error（D-74 / D-75）
  - render/index.tsx：删除被注释的 restart 监听块（D-76）
  - client.ts / entry-client/src/create.ts：删除被注释的兼容层 / 接线残留（D-77）
  - 五生产文件的静态门禁证据 + 人工复核结论（无运行时验证，D-68 的延续）
affects: [04-render-adaptation]
actuals:
  tokens: 5669
  tasks: 5
  commits: 1
  plan_head_before: cab6fe2e5ac96f2adacca0c02de65e5dcae6f6b6
tech-stack:
  added: []
  patterns:
    - "在对应对象上注册钩子（D-71 / D-72）：IHookable.addHook({ onUpdateAttribute }) 取代全局 hook.on/off；控制器 unload() 在 onUnmounted 注销"
    - "旧 UI 改依新加载接口：IMotaDataLoader.start()（AsyncIterable）取代旧 progress 异步迭代；进度数据一律取自 ILoadManager.get*"
    - "重构即删旧内容（D-77）：被注释的旧接线残留直接删除，不留占位"
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-14-SUMMARY.md
  modified:
    - packages-user/client-modules/src/render/ui/main.tsx
    - packages-user/client-modules/src/render/ui/load.tsx
    - packages-user/client-modules/src/render/index.tsx
    - packages-user/client-modules/src/client.ts
    - packages-user/entry-client/src/create.ts
  deleted: []
key-decisions:
  - "局部命名 attributeHook（Task 0 获批）；main.tsx 只新增该局部常量，不新增 / 改名 / 删除任何公共、受保护、私有成员"
  - "旧加载 UI 装配 / 可达性（createGameRenderer 无调用者）为开点：默认不重新接线，未改 render/index.tsx:11,13,25"
  - "D-77 名单中的 client-modules/src/index.ts 现行零残留，仅以 git grep 证据登记，不做任何编辑"
  - "client.ts 的 initMapExtensions 删除注释块后无调用者，但不在 D-77 名单内，予以保留"
  - "单一白名单提交（沿用 04-11 / 04-12 / 04-13 口径）：Task 1/2/3 不独立提交，Task 4 步骤 (8) 单次提交"
  - "Task 4 门禁脚本在 PowerShell 5.1 下 node -e \"...\" 转义不可直跑，按原样语义改由仓库外临时脚本执行，判据不变（见 Deviations）"
requirements-completed: []
duration: ~30min
completed: 2026-09-30
status: complete
---

# Phase 4 Plan 14: 部分 UI 进一步接口适配·第二步（适配实施）Summary

**对数据端 `d8fa4b8 refactor: Delete global loading & hook object` 与加载系统重构后渲染端「部分 UI」仍以已失效旧接口编写的落地点做第二步代码适配：状态栏更新改在勇士属性对象 `client.hero.attribute` 上 `addHook({ onUpdateAttribute })`（D-78）、旧加载 UI 改依新加载系统 `client.loader.start()` + `client.loader.manager.get*`（D-74 / D-75）、删除被注释的 `restart` 监听块（D-76）与三处非 UI 旧接线残留（D-77）；五个生产文件、无依赖变更、无 barrel 改动、无运行时验证（D-68 的延续）。**

## Performance

- **Duration:** ~30min
- **Started:** 2026-09-30
- **Completed:** 2026-09-30
- **Tasks:** 5（Task 0 blocking-human 汇报关卡 — 用户已回复「可以执行」；Task 1 tracer；Task 2；Task 3；Task 4 收口）
- **Files:** 5 修改（生产）+ 本 SUMMARY；删除文件 0；`files_modified` 之外零改动

## 只读起始基线（Task 1 步骤 0a）

- **只读起始基线（packages / packages-user / src）：** `（无）`
- **起始 HEAD：** `cab6fe2e5ac96f2adacca0c02de65e5dcae6f6b6`（short `cab6fe2`）
- **起始分支：** `refine/data-client`
- **用户并发改动：** `.planning/phases/04-render-adaptation/04-CONTEXT.md` 的既有未提交改动仍在（porcelain ` M`）；本 run 未回滚 / 暂存 / 提交 / 修改（D-56）。`packages/common/src/{hook.ts,types.ts}` 已在规划会话期间被用户提交为 `425ff28`，本 run 只读其现行接口形状。

## 要解决的问题

`04-13` 只读台账确认：数据端经 `d8fa4b8` 删除全局 `loading` / `hook` 与旧加载系统后，渲染端**部分 UI** 仍以旧接口编写。用户对全部 F 类未决项作出裁定（D-74..D-78），本计划据其落地第二步的代码改动。

| 裁定 | 内容 | 落点 |
|---|---|---|
| **D-74（F-01）** | 旧加载 UI 的「任务进度 / 字节进度 / 总字节」数据来源 = 新加载接口提供的方法（`IMotaDataLoader` / `ILoadManager`） | `render/ui/load.tsx` |
| **D-75（F-02）** | 旧 `loader.progress` 异步迭代的等价 = 新加载接口的 `start()`（返回 `AsyncIterable`） | `render/ui/load.tsx` |
| **D-76（F-04）** | `restart` 事件不再需要 → 删除相关（被注释）内容 | `render/index.tsx` |
| **D-77（F-05）** | 三处非 UI 旧加载 / 钩子接线残留直接删除（「重构即删旧内容」） | `client.ts`、`client-modules/src/index.ts`、`entry-client/src/create.ts` |
| **D-78（F-03）** | 状态栏更新改为在勇士属性对象（`client.hero.attribute`）上注册钩子 `onUpdateAttribute` | `render/ui/main.tsx` |

## 编辑集（A..F 逐条落点）

| 面 | 文件 | 实际形态 |
|---|---|---|
| **A（D-78）** | `packages-user/client-modules/src/render/ui/main.tsx` | 新增 `// 监听状态栏更新事件` 下的 `const attributeHook = client.hero.attribute.addHook({ onUpdateAttribute: () => { updateStatus(); updateDataFallback(); } });` 与 `onUnmounted(() => { attributeHook.unload(); });`；**删除**原 `:140-143` 手工单次调用垫片（含两行既有说明注释）与 `:145-152` 被注释的全局 hook 监听 / 注销块 |
| **B（D-74 / D-75）** | `packages-user/client-modules/src/render/ui/load.tsx` | `startLoad` 改以 `for await (const _ of loader.start())` 迭代，循环体内 `taskProgress.set(loader.manager.getLoadedTasks())` / `byteProgress.set(loader.manager.getLoadedByte())`，循环后 `loadEnd()`；`renderTaskList` 改取 `loader.manager.getLoadedTasks()` / `getAddedTasks()`；`renderByteList` 改取 `loader.manager.getTotalByte()` / `getLoadedByte()` / `getByteRatio()`；**删除** `:75` 失效的 `@ts-expect-error 需要重构`；保留 `const loader = client.loader;` 与 `loadEnd` |
| **C（D-76）** | `packages-user/client-modules/src/render/index.tsx` | **删除** `createRender` 内被注释的 `restart` 监听块（原 `:35-38`）；`createRender` 其余调用与 `:38-44` 的 7 条同目录 `export *` 零改动 |
| **D（D-77）** | `packages-user/client-modules/src/client.ts` | **删除** `:88-92` 与 `:124-127` 两段被注释的兼容层块（含两处「兼容层」标签）；`this.loader.addCoreConfig('client', config.clientURL)`（`:120`）与 `:126` `initMapExtensions` **保留** |
| **E（D-77）** | `packages-user/entry-client/src/create.ts` | **删除** `:16`、`:31` 两行被注释接线与 `:34-41` 被注释的模块创建函数块；全部 `import` 与 `create()` 内 `Mota.register(...)` **保留** |
| **F（D-77 名单 / 事实差异）** | `packages-user/client-modules/src/index.ts` | **无可删除内容**：现行零残留（`git grep -n -E "hook\.\|loading" -- packages-user/client-modules/src/index.ts` 空输出，退出码 1）；本计划**不做任何编辑**，仅登记「零残留」事实 |

**新增标识符（命名预批）：** 仅一个**局部常量 `attributeHook`**（`main.tsx` 的 `MainScene` 内）；不新增 / 改名 / 删除任何公共、受保护、私有成员、方法、字段、接口或文件。

## Task Commits

1. **Task 0（blocking-human 汇报关卡）** — 用户已回复「可以执行」，无文件改动、无提交
2. **Task 1（tracer）** — `main.tsx` 状态栏属性钩子端到端（D-78）；门禁全绿，无独立提交
3. **Task 2** — `load.tsx` 改依新加载系统（D-74 / D-75）；门禁全绿，无独立提交
4. **Task 3** — `render/index.tsx` / `client.ts` / `create.ts` 删除旧残留（D-76 / D-77）；门禁全绿，无独立提交
5. **Task 4** — 编辑集 / 范围 / 数据端 / 用户改动 / 既有产物 / CRLF 门禁 + 人工复核 + 本 SUMMARY + 白名单提交

**Plan metadata:** 单一白名单提交（见「提交记录」）。计划 Task 1/2/3 的 action 未定义独立提交步骤；Task 4 步骤 (8) 明示单次白名单提交（与 04-11 / 04-12 / 04-13 的单一提交口径一致）。

## 提交记录

- `feat(04-14): 部分 UI 进一步接口适配·第二步（D-74..D-78）` —— 单次白名单提交，仅含本计划 `files_modified` 的五个生产文件 + 本 `04-14-SUMMARY.md`（提交 hash 见 orchestrator 回报 / `git log`）。

## 门禁实测结果（全部静态 — D-68 的延续）

| # | 门禁 | 结果（OK 行） |
|---|---|---|
| T1-1 | `main.tsx` 在 `client.hero.attribute` 上注册 `onUpdateAttribute` 钩子 + 控制器 / 注销 | ✅ `OK D-78 attribute hook wired` |
| T1-2 | `main.tsx` 无全局 hook 监听 / 注销残留、无垫片说明注释 | ✅ `OK no global hook residue, no shim` |
| T1-3 | 禁用路径 porcelain 空 | ✅ `OK forbidden paths clean` |
| T1-4 | `main.tsx` CRLF | ✅ `OK CRLF main.tsx` |
| T2-1 | `load.tsx` 以 `start()` + `loader.manager.get*` 改指 + `loadEnd()` | ✅ `OK load UI adapted to new loader` |
| T2-2 | `load.tsx` 无旧接口成员与失效 `@ts-expect-error` | ✅ `OK no old loader interface residue` |
| T2-3 | 禁用路径 porcelain 空 | ✅ `OK forbidden paths clean` |
| T2-4 | `load.tsx` CRLF | ✅ `OK CRLF load.tsx` |
| T3-1 | `render/index.tsx` `restart` 注释块删除 + `createRender` / `./ui` 导出面完好（D-76） | ✅ `OK D-76 restart comment removed` |
| T3-2 | `client.ts` 两段兼容层删除 + `ClientCore` / `initMapExtensions` 保留（D-77） | ✅ `OK D-77 client.ts compat blocks removed` |
| T3-3 | `create.ts` 注释残留删除 + `create` / `Mota.register('@user/client-modules')` 完好（D-77） | ✅ `OK D-77 entry-client/create.ts residues removed` |
| T3-4 | `client-modules` + `entry-client` 源码面零全局 hook 调用 | ✅ `OK zero global hook call sites across client-modules + entry-client (git status=1)` |
| T3-5 | 禁用路径 porcelain 空 + 三被编辑文件 CRLF | ✅ `OK forbidden paths clean + CRLF` |
| T4-1 | 编辑集最终形状（D-78 接线 + D-74/D-75 改指） | ✅ `PASS :: EDIT SET GATE` |
| T4-2 | 范围门禁（`material/` / `packages/` / `src/` / 数据端 / `packages/common` / `REQUIREMENTS.md` 空） | ✅ `PASS :: SCOPE GATE` |
| T4-3 | 用户改动门禁（`04-CONTEXT.md` D-74..D-78 + `common/{hook.ts,types.ts}` 内容未被回退） | ✅ `PASS :: USER EDITS GATE` |
| T4-4 | 既有产物保护（`04-01`..`04-13` porcelain 空） | ✅ `PASS :: ARTIFACT PROTECTION GATE` |
| T4-5 | 五被编辑文件 CRLF | ✅ `PASS :: CRLF GATE five edited files` |
| T4-6 | 白名单提交（HEAD 提交名 ⊆ 白名单 + 提交信息含 `04-14`） | ✅ 见 orchestrator 回报 / `git log` |
| T4-7 | 收口（无 `04-15+`、SUMMARY 在场且含关键标识、SUMMARY CRLF） | ✅ 见下方 Self-Check |

**人工复核结论（Task 4 步骤 (6)）：**
逐条打开当日源码核对，**全部通过，无偏差**：

1. `main.tsx` 的 `addHook({ onUpdateAttribute })` 挂在 `client.hero.attribute`（`IReadonlyHeroAttribute<IHeroAttr> extends IHookable<IHeroAttributeHooks<IHeroAttr>>`，`packages-user/data-base/src/hero/types.ts:104-106`）上，处理器调用 `updateStatus()` / `updateDataFallback()`，`onUnmounted` 调 `attributeHook.unload()`；触发点 `packages-user/data-base/src/hero/attribute.ts:89`（`forEachHook(hook => hook.onUpdateAttribute?.(name, value))`）。
2. `load.tsx` 的每个 `loader.manager.get*` 调用与 `ILoadManager`（`packages/loader/src/types.ts:288-335`）成员一一对应：`getLoadedTasks` / `getAddedTasks` / `getTotalByte` / `getLoadedByte` / `getByteRatio`；`loader.start()` 为 `IMotaDataLoader.start(): AsyncIterable<number>`（`packages-user/data-state/src/loader/types.ts:26`），迭代结束即加载完成，随后 `loadEnd()`。
3. 三个删除文件的保留项完好：`render/index.tsx` 的 `createRender` 与 7 条同目录 `export *`（含 `./ui`）；`client.ts` 的 `class ClientCore` / `initMapExtensions` / `this.loader.addCoreConfig('client', config.clientURL)`；`create.ts` 的全部 `import` 与 `Mota.register(...)`。
4. `client-modules/src/index.ts` 零残留核对命令输出为空（退出码 1），与登记一致；该文件未被编辑。

## Decisions Made

- **局部命名 `attributeHook`**：仅 `main.tsx` 内新增的局部常量（Task 0 已获批）。
- **单一白名单提交**：沿用 04-11 / 04-12 / 04-13 口径，Task 1/2/3 不独立提交，Task 4 步骤 (8) 单次提交，仅暂存五个生产文件 + 本 SUMMARY。
- **未写其它 `.planning/` 文件**：除本 SUMMARY 外未写 `STATE.md` / `ROADMAP.md` / `WINDOWS.md` / `REQUIREMENTS.md`（`REND-01` / `REND-02` 保持 Pending）。
- **开点不私自接线**：旧加载 UI 的装配 / 可达性（`createGameRenderer` 无调用者）未被重新接线；`client-modules/src/index.ts` 零残留事实按名单 / 事实差异登记。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Tooling] 门禁脚本在 PowerShell 5.1 下 `node -e "..."` 转义不可直跑**

- **Found during:** Task 3 / Task 4 门禁执行
- **Issue:** 计划门禁以 `node -e "..."` 内嵌双引号（如 `'./ui'`、`"hook\\.on\\("`）；本环境 shell 为 Windows PowerShell 5.1，双引号字符串不把 `\"` 视为转义，node 收到被截断 / 破坏的脚本（`SyntaxError` / `ParserError`）。
- **Fix:** 将门禁脚本按**逐字语义**落到仓库外临时文件（`%TEMP%\opencode\gsd-04-14-task3-gates.js` / `gsd-04-14-task4-pre.js`）后执行 `node <file>`；判据（接线 / 残留 / 禁用路径 / CRLF / 范围 / 用户改动 / 既有产物）与计划完全一致，结果全绿。
- **Files modified:** 无生产文件（临时工装，位于仓库外）
- **Commit:** 不适用

---

**Total deviations:** 1（门禁执行方式）——**不涉及生产代码，所有实质判据全部通过**。

## Known Stubs / 开点（只报告不处置）

| # | 余留 | 位置 | 说明 |
|---|---|---|---|
| 1 | 旧加载 UI 装配 / 可达性未接线（**开点**） | `packages-user/client-modules/src/render/index.tsx:11,13,25` | `git grep -n "createGameRenderer" -- packages-user packages src` 仅命中 `:13` 定义行、**无调用者**；`LoadSceneUI` 仅在 `createGameRenderer` 内被 `open`。D-74..D-78 未裁定，本计划默认只做 `load.tsx` 接口适配（D-74 / D-75）、不重新接线 |
| 2 | D-77 名单 / 现行事实差异 | `packages-user/client-modules/src/index.ts` | D-77 列出该文件，但现行零 `loading` / `hook` 文本；本计划以 `git grep` 证据登记「零残留」、**零编辑** |
| 3 | `initMapExtensions` 无调用者 | `packages-user/client-modules/src/client.ts:126` | 删除被注释的兼容层块后，`this.initMapExtensions()` 无调用者；不在 D-77 名单内（`:88-92,124-127`），按裁定予以保留 |

> 依计划 prohibitions，未写入 `.planning/WINDOWS.md` / `STATE.md` / `ROADMAP.md`（本步仅允许写 `files_modified` 与 `04-14-SUMMARY.md`）。

## Issues Encountered

- 见「Deviations from Plan」的 1 处（门禁脚本 shell 兼容性），已按规则处置，无生产代码影响。

## 无运行时验证声明（D-68 的延续）

- 本步**没有「保证能运行」的要求**：**未运行** `pnpm check:type` / `pnpm build`，**未使用** TS 诊断数（全仓或范围内）作为任何门禁或验收项。
- 证明方式全部为**静态**：文件内容断言 / `git status --porcelain` 范围断言 / 用户改动内容判据 / 既有产物保护 / CRLF，辅以人工代码复核。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **D-78 落地（tracer）**：状态栏更新已从「全局 hook 监听」改为「在 `client.hero.attribute` 上注册 `onUpdateAttribute`」并在 `onUnmounted` 注销；垫片与全局 hook 残留清除。
- **D-74 / D-75 落地**：旧加载 UI 的进度 / 字节 / 任务数据全部取自 `client.loader.manager` 的现有方法，异步迭代走 `client.loader.start()`；旧接口成员与失效 `@ts-expect-error` 清零。
- **D-76 / D-77 落地**：`restart` 注释块、`client.ts` 两段兼容层注释、`entry-client/src/create.ts` 被注释接线与模块创建函数块全部删除；`client-modules/src/index.ts` 零残留已取证。
- **范围零外溢**：`material/`（D-42 / D-48）、`packages/**`、`src/**`、数据端（`data-state` / `data-base` / `loader`）、`packages/common`、任何 barrel 导出面、任何测试文件全部零触碰；无依赖变更、未执行 `pnpm i`；用户并发改动 `04-CONTEXT.md` 与 `packages/common/src/{hook.ts,types.ts}` 未被修改 / 暂存 / 提交（D-56）。
- **开点待裁**：旧加载 UI 的装配 / 可达性未被私自接线；`client-modules/src/index.ts` 的名单 / 事实差异已登记待裁；`REND-01` / `REND-02` 仍为 **Pending**，`.planning/REQUIREMENTS.md` 零改动。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-30*

## Self-Check: PASSED

- `packages-user/client-modules/src/render/ui/main.tsx`: FOUND（D-78 接线，门禁全绿）
- `packages-user/client-modules/src/render/ui/load.tsx`: FOUND（D-74 / D-75 改指，门禁全绿）
- `packages-user/client-modules/src/render/index.tsx` / `client.ts` / `packages-user/entry-client/src/create.ts`: FOUND（D-76 / D-77 删除，门禁全绿）
- `04-14-SUMMARY.md`: FOUND
- 用户并发改动 `04-CONTEXT.md` / `packages/common/src/{hook.ts,types.ts}`: PRESERVED（未触碰、未暂存、未提交）
- `04-01`..`04-13` 既有产物: 零触碰；无 `04-15+`
- commits measured from ledger (`cab6fe2e..HEAD`): 1
