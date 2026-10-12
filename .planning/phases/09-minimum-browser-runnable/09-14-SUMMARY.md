---
phase: 09-minimum-browser-runnable
plan: 14
subsystem: client-modules（跨包 legacy 依赖收口 / 全局 core umbrella 记录）
tags: [legacy-removal, GameStorage, SaveSystem, halted, R2, A-1-1, A-2-1]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-13 回退层去除 + 12 条 ALT 收口（ALT-COUNT: 40 / ENTRY-COUNT: 99）
provides:
  - Task 0 关卡闭环记录（裁剪后范围：A-1-1 / A-2-1；A-6 DEFERRED 用户自行处理）
  - A-2-1 umbrella 部分收口记录（REPLACED vs DEFERRED 逐条，40 条 ALT 可审计）
  - R2 阻断记录（A-1-1 GameStorage→SaveSystem：模块级 hotkey.ts 无合规实例路径）
affects: [09-15, 09-16]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 2637
  tasks: 2
  commits: 0
  plan_head_before: 529bb5578dfec2fb052f3ce41d686183bb9a0de9

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "模块级（非组件）文件取得 SaveSystem 无合规路径时：记录 R2 阻断 + STOP + 标记待裁定，保留 legacy 用法，不 invent"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-14-SUMMARY.md
  modified: []

key-decisions:
  - "Task 0 关卡按用户决定闭环：裁剪后范围 = A-1-1（GameStorage→SaveSystem）+ A-2-1（umbrella 记录）；A-6-1/2/3（Mota.require/loading）DEFERRED（用户自行处理）"
  - "R2 成立：模块级 hotkey.ts 无合规取得 SaveSystem 实例的路径（D-11 禁 client 单例），A-1-1 记录 R2 阻断并 STOP（待裁定）"
  - "未修改任何源码；未触碰 A-6（cache.ts / misc.ts）；未引入 client 单例；未新增命名"
  - "A-2-1 仅作 umbrella 记录：不删全局 core 声明（core.d.ts:1302）、不改 client-modules/src/core.ts:6 单例定义"

patterns-established:
  - "替代不可合规落地时：记录 R2 阻断 + STOP + 标记待裁定，保留 legacy 用法（不冒充完成），保留全部 ALT 追踪"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-10-12
status: halted
---

# Phase 9 Plan 14: `GameStorage` → `SaveSystem` 收口（R2 阻断）+ A-2-1 umbrella 记录 Summary

**`hotkey.ts` 跨包 legacy 依赖 `GameStorage` → `SaveSystem`（A-1-1）因模块级文件无合规实例路径（D-11 禁 `client` 单例）触发 R2 阻断并按计划 STOP；A-2-1 全局 `core` umbrella 部分收口已逐条记录（40 条 ALT 可审计）；A-6（`Mota.require`/`loading`）按用户决定保持 DEFERRED；未改动任何源码**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-12T08:43:51Z
- **Completed:** 2026-10-12T08:55:00Z
- **Tasks:** 2（Task 0 为 `blocking-human` 汇报关卡，已闭环；Task 1 触发 R2 STOP，无源码改动）
- **Files modified:** 0（仅新增本 SUMMARY）

## Task 0：预执行汇报关卡（已闭环）

**类型：** `checkpoint:decision` · `gate="blocking-human"` · **结论：用户已闭环。**

- 本计划 = 任务 7 · 第一批改造（ALT 条目）· **第 2 组 / 共 4 组** 的**裁剪后范围**：
  - **A-1-1**：跨包 legacy 依赖 `GameStorage`（`@motajs/legacy-system`）→ `SaveSystem` 全局存储（`packages-user/client-base/src/save/system.ts:41`）。
  - **A-2-1**：全局 `core`（`src/types/declaration/core.d.ts:1302`）→ `CoreState`（`packages-user/data-state/src/core.ts:76`）——**umbrella，仅记录部分收口**。
- **范围裁剪说明：** 原第 2 组的 **A-6-1/2/3（`Mota.require('@user/data-base')` / `loading`）已按用户决定 DEFERRED，由用户自行处理**；本计划**不修改** `packages-user/client-base/src/elements/cache.ts` / `misc.ts`，不核实 / 不改写 `loading`。
- **`files_modified` 精确为 1 个源文件**（`packages-user/client-modules/src/action/hotkey.ts`）+ 本 SUMMARY。
- 依据 `AGENTS.md`（执行前须获批）/ D-03 / D-04；`.planning/config.json` 为 `mode: yolo`，故关卡显式 `blocking-human` 且 `autonomous: false`。
- 采纳处置：`execute-default`（可替代部分如实落地；R2 触发时按 STOP 处置；A-6 保持 DEFERRED）。OI-1 / OI-3 / OI-4 见下。

## Task 1：`GameStorage` → `SaveSystem`（A-1-1）—— R2 阻断，STOP（无源码改动）

### R2 核实结论：无合规实例路径

`hotkey.ts` 为**模块级副作用文件**（非组件），无 `props` / `IClientBase` 注入点。经全仓核实：

- `SaveSystem` 实例**仅**在 `ClientCore` 构造函数内创建（`packages-user/client-modules/src/client.ts:74`），并以实例成员 `readonly save: ISaveSystem`（`client.ts:49`）对外暴露；`IClientBase.save`（`packages-user/client-base/src/types.ts:23`）是唯一对外契约。
- 模块级代码可见的引用只有 legacy 全局（`core` / `main` 等）与 `client` 单例（`packages-user/client-modules/src/core.ts:6`）。**`client` 单例被 D-11 明确禁止**。
- 仓库无任何全局提供 `SaveSystem`（`src/types/declaration/*.d.ts` 中无相关 `declare`）；无 props / context / provider 机制；`dev.md` 亦指出不应存在 `createXxx` 式初始化函数把主对象下传。
- 结论：模块级 `hotkey.ts` **无法在不引入 `client` 单例、不 invent 接口、不做结构性改动的前提下**合规取得 `SaveSystem` 实例。

### 语义差异（sync → async，进一步佐证不可无痛替换）

| 维度 | `GameStorage`（现状） | `SaveSystem`（审计替代） |
| --- | --- | --- |
| 后端 | `localStorage`（键值） | Dexie / IndexedDB |
| 读取 | 构造器 `read()` 同步 `JSON.parse` | `getGlobal<T>(key)` **返回 `Promise<T \| null>`** |
| 写入 | `setValue()` 仅改内存；`beforeunload` / `blur` 时批量 `write()` | `setGlobal(key, value)` **返回 `Promise<void>`**，即时落库 |
| 键 | `GameStorage.fromAuthor('AncTe', 'gameKey')` | 全局存储 `key`（无 author 命名空间） |

`hotkey.ts` 现有行为为「`read()` → `fromJSON` 到 `gameKey` → 变更（`set` 事件）时 `setValue` 写内存 → 卸载时落盘」。改写为 `SaveSystem` 需将模块初始化的同步读取改为异步（`getGlobal().then(...)`）并把增量写入改为异步 read-modify-write —— 属**行为契约变化**，非机械替换。

### 阻断处置（按计划执行）

- **未修改** `hotkey.ts`：`GameStorage` 用法（`:3` 导入、`:518-522` 实例化 / `read`、`:523-525` `set` 监听 `setValue`、`:526` `fromJSON(toJSON())`）保持原样。
- **未引入** `client` 单例；**未 invent** 任何接口 / 全局 / 命名。
- **未保留 `GameStorage` 冒充完成**：A-1-1 状态记为 **「待裁定」（R2 阻断）**，交用户裁定接入口径（**OI-3**）。
- 依据计划：`09-14-PLAN.md` Line 179「若无法合规取得：记录 R2 阻断 + STOP」；Line 126「若 R2 触发 STOP，则相应条目标记为「待裁定」，门禁对未改文件不作强制」。

## A-2-1 umbrella（部分收口）—— REPLACED vs DEFERRED 逐条（本计划记录）

> **A-2-1 性质：** 全局 `core` → `CoreState` 的 **umbrella** 记录。本计划**不删除** `src/types/declaration/core.d.ts:1302` 的全局 `core` 声明，**不编辑** `packages-user/client-modules/src/core.ts:6` 的 `core` 单例定义（该定义属 ADAPT 分类 / 其它批次）。全量收口须待其余分类（ADAPT / NONE / TBD）完成后另行规划。

**本计划实际源码改动：无。** A-1-1 因 R2 阻断未落地，故本计划**未新增任何 REPLACED**；下表使 40 条 ALT 的整体覆盖保持可审计（含 09-13 已收口部分与 09-15 / 09-16 承接部分）。

### 40 条 ALT 覆盖总表（ALT-COUNT = 40；五类之和 = ENTRY-COUNT 99）

**① 已 REPLACED（09-13 回退层去除组，12 条）**

| ID | 对象 | 落地 |
| --- | --- | --- |
| A-7-1 | `fallback/index.ts` `patchAll()` | ✅ 09-13（删文件 + 断线） |
| A-7-3 | `fallback/ui.ts` | ✅ 09-13（删文件） |
| A-7-4 | `fallback/weather.ts` | ✅ 09-13（删文件） |
| A-7-5 | `fallback/load.ts` | ✅ 09-13（删文件） |
| A-1-2 | `Patch`/`PatchClass`（audio.ts:1） | ✅ 09-13（删文件） |
| A-1-4 | `Patch`/`PatchClass`（ui.ts:1） | ✅ 09-13（删文件） |
| A-1-5 | `Patch`/`PatchClass`（weather.ts:1） | ✅ 09-13（删文件） |
| A-4-1 | `new Patch(PatchClass.Control)`（audio.ts:10） | ✅ 09-13（删文件） |
| A-4-2 | `new Patch(PatchClass.UI)`（ui.ts:5） | ✅ 09-13（删文件） |
| A-4-3 | `new Patch(PatchClass.Control)`（weather.ts:8） | ✅ 09-13（删文件） |
| C:drawTip | `core.drawTip` | ✅ 09-13（→ `TipStore.drawTip`） |
| C:playSound | `core.playSound` | ✅ 09-13（→ `SoundPlayer.play`） |

**② 本计划（09-14，2 条）**

| ID | 对象 | 状态 |
| --- | --- | --- |
| A-1-1 | `GameStorage`（hotkey.ts:3,518-522） | ⏸ **待裁定（R2 阻断）** —— 未改源码 |
| A-2-1 | 全局 `core`（core.d.ts:1302）→ `CoreState`（data-state/core.ts:76） | 📝 **umbrella 部分收口（本记录）** —— 未删声明 / 未改 `core.ts:6` 单例 |

**③ DEFERRED —— 承接于 09-15（15 条，per 09-15-PLAN.md ALT 引用）**

`A-1-6`、`A-5-2`、`C:clearLocalForage`、`C:drawThumbnail`、`C:getAllSaves`、`C:getSave`、`C:openBook`、`C:openEquipbox`、`C:openQuickShop`、`C:openToolbox`、`C:removeLocalForage`、`C:removeSave`、`C:saves`、`C:setLocalForage`、`C:ui`

**④ DEFERRED —— 承接于 09-16（8 条，per 09-16-PLAN.md ALT 引用）**

`A-1-7`、`A-1-9`、`A-5-3`、`A-5-7`、`C:debug`、`C:encodeRoute`、`C:getTilesetOffset`、`C:hasItem`

**⑤ DEFERRED —— 用户自行处理（A-6，3 条）**

| ID | 对象 | 处置 |
| --- | --- | --- |
| A-6-1 | `Mota.require('@user/data-base')`（cache.ts:491） | DEFERRED（用户自行处理 `loading`；本计划不改 `cache.ts`） |
| A-6-2 | `Mota.require('@user/data-base')`（misc.ts:89） | DEFERRED（同上） |
| A-6-3 | `Mota.require('@user/data-base')`（misc.ts:219） | DEFERRED（同上） |

**计数核对：** 12 + 2 + 15 + 8 + 3 = **40** ✅（与 `09-LEGACY-REPLACEMENT-AUDIT.md` 的 `ALT-COUNT: 40` 一致）。

## 命名影响（D-04 / OI-4）

**零新增命名。** 本计划未修改任何源码，未新增 / 修改任何公共、受保护、私有方法、字段、类型或接口，未改既有命名。

## Gates / 验证结果

| 门禁 | 结果 |
| --- | --- |
| Task 0 pre-state（`hotkey.ts` + `save/system.ts` + 审计文档存在） | ✅ OK（`OK prestate intact`） |
| Task 1 GAMESTORAGE gate（`hotkey.ts` 无 `GameStorage` / 无 `@motajs/legacy-system` / 有 `SaveSystem`） | ⏸ **按 R2 分支：不改文件，门禁不作强制**（计划 Line 126） |
| Task 1 CRLF / IMPORT gate（`hotkey.ts`） | ⏸ 未改文件（沿用原状：CRLF，无 `import type`） |
| Task 1 scope gate（`git status --porcelain`：仅本计划产物 + 用户既有并发改动） | ✅ OK（仅新增本 SUMMARY；`data-state/**`、`data-system/**` 为用户并发改动，未触碰 / 未暂存） |

**门禁口径：** 全部为**静态断言**；未使用 `pnpm check:type` / `pnpm build` / 全仓 TS 诊断数。

**A-6 边界（T-09-14-01）：** `packages-user/client-base/src/elements/cache.ts` / `misc.ts` **未被本计划修改**（`git status` 无其改动）。

## Deviations from Plan

**None（R2 STOP 为计划内既定分支，非偏离）。** 计划 Task 1 明确：无法合规取得实例路径时「记录 R2 阻断 + STOP」（Line 179）、「相应条目标记为「待裁定」，门禁对未改文件不作强制」（Line 126）。本计划严格按该分支执行。

- 未 invent 替代方案；未引入 `client` 单例；未新增命名；未越界改其它分类。
- 未触碰 A-6（`cache.ts` / `misc.ts`）与 `09-CONTEXT.md` / `09-LEGACY-REPLACEMENT-AUDIT.md` / 09-01..09-13 任何文件。

## Issues Encountered

- **R2（A-1-1 接入口径，OI-3）—— 阻断，待用户裁定：** 模块级 `hotkey.ts` 取得 `SaveSystem` 的合规路径未定。可选方向（均需用户裁定 / 新命名批准 / 结构改动，故本计划不擅自实施）：
  1. 由拥有主对象的调用方在初始化时把 `ISaveSystem` 注入 hotkey 模块（需新增初始化入口 / 命名 → D-04）；
  2. 将热键配置持久化迁移到已有主对象上下文的位置（结构性改动 → Rule 4 / 影响面扩大）；
  3. 暂缓 A-1-1，待渲染端后续重构（如 hotkey 相关 UI 重构，D-19）时一并处理。
- **用户并发改动（非本计划产物，未触碰 / 未暂存）：** `packages-user/data-state/**`（`enemy/{aura,calculator,final,legacy,special}`）与 `packages-user/data-system/src/combat/types.ts`。二者为 `git status` 守卫豁免的既有并发改动。

## Next Phase Readiness

- **A-1-1 未收口，为 09-15 / 09-16 的悬置前置：** 因本计划 `status: halted`，依赖本计划的后续计划应视为**阻塞待裁定**，直至用户就 R2 / OI-3 给出接入口径。
- A-2-1 umbrella 已记录（全局 `core` 声明与 `core.ts:6` 单例定义均保持原状）。
- A-6（`Mota.require` / `loading`）保持 DEFERRED（用户自行处理）。
- 40 条 ALT 覆盖已在本文档逐条可审计（见 A-2-1 节）。

---

## Self-Check: PASSED

- `hotkey.ts` **未修改**（`GameStorage` 用法保持原状；R2 阻断如实记录，未冒充完成）。
- 未触碰 `cache.ts` / `misc.ts`（A-6 DEFERRED）；未触碰用户并发改动。
- A-2-1 部分收口记录完成，40 条 ALT 覆盖表逐条列明（REPLACED 12 / 本计划 2 / 09-15 承接 15 / 09-16 承接 8 / A-6 用户 3 = 40）。
- 提交：无任务提交（`commits: 0`，如实；本计划无源码改动）；本 SUMMARY 由收尾 docs 提交承载。
- STATE.md / ROADMAP.md / REQUIREMENTS.md 未被本执行修改（由 orchestrator 负责）。

---
*Phase: 09-minimum-browser-runnable*
*Plan: 14*
*Completed: 2026-10-12*
*Status: halted (R2 STOP — A-1-1 待用户裁定，OI-3)*
