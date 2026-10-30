---
phase: 09-minimum-browser-runnable
plan: 14
subsystem: client-modules（跨包 legacy 依赖 / 存档簇的 D-54 延后登记）
tags: [legacy-removal, GameStorage, SaveSystem, deferred, D-54, A-1-1, A-2-1]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-13 回退层去除 + 12 条 ALT 收口（ALT-COUNT: 40 / ENTRY-COUNT: 99）
provides:
  - Task 0 汇报关卡闭环记录（延后记录性质：A-1-1 / 存档簇 DEFERRED per D-54；A-6 用户自行处理；A-2-1 仅记录）
  - A-1-1 与 7 条存档簇的 DEFERRED（D-54）登记
  - 40 条 ALT 覆盖承接可审计（REPLACED vs DEFERRED 逐条）
affects: [09-15, 09-16]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 0
  tasks: 1
  commits: 0
  plan_head_before: 529bb5578dfec2fb052f3ce41d686183bb9a0de9

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "存档相关适配（GameStorage / SaveSystem / localForage 及存档簇）统一依 D-54 登记为 DEFERRED，不纳入第一批改造"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-14-SUMMARY.md
  modified: []

key-decisions:
  - "本计划为延后记录（DEFERRAL RECORD）：无 active work task、不修改任何源码"
  - "A-1-1（GameStorage → SaveSystem）依 D-54 属存档相关适配，DEFERRED，后续另行规划"
  - "7 条存档簇（C:saves / C:getSave / C:getAllSaves / C:setLocalForage / C:removeLocalForage / C:removeSave / C:clearLocalForage）依 D-54 一并 DEFERRED（承接于 09-15 的延后组）"
  - "A-6（Mota.require / loading，A-6-1/2/3）按用户决定 DEFERRED，用户自行处理"
  - "A-2-1（全局 core → CoreState）仅作 umbrella 记录；不删 core.d.ts 声明、不改 core.ts:6 单例定义"

patterns-established:
  - "存档相关适配一律登记为 DEFERRED（D-54），保留全部 ALT 追踪，不冒充完成"

requirements-completed: []

# Metrics
duration: 0min
completed: 2026-10-12
status: complete
---

# Phase 9 Plan 14: `GameStorage` / 存档簇的 D-54 延后登记 + A-2-1 umbrella 记录 Summary

**本计划为延后记录（DEFERRAL RECORD）：无 active work task、未修改任何源码；A-1-1（`GameStorage` → `SaveSystem`）与 7 条存档簇依 D-54 DEFERRED；A-6（`Mota.require` / `loading`）按用户决定 DEFERRED（用户自行处理）；A-2-1（全局 `core` → `CoreState`）仅作 umbrella 记录；40 条 ALT 覆盖承接逐条可审计**

## Performance

- **Duration:** 0 min（延后记录，无 active work task）
- **Tasks:** 1（Task 0 为 `blocking-human` 汇报关卡，已闭环；本计划无源码改造任务）
- **Files modified:** 0（仅新增本 SUMMARY）

## Task 0：预执行汇报关卡（已闭环）

**类型：** `checkpoint:decision` · `gate="blocking-human"` · **结论：用户已闭环。**

- 本计划 = 任务 7 · 第一批改造（ALT 条目）· **第 2 组 / 共 4 组** 的**延后记录**。
- 采纳处置：`execute-default`（确认本计划为延后记录，无源码改造）。
- 依据 `AGENTS.md`（执行前须获批）/ D-03 / D-04；`.planning/config.json` 为 `mode: yolo`，故关卡显式 `blocking-human` 且 `autonomous: false`。
- OI-1 / OI-2 / OI-3 / OI-4 见下。

## 本计划性质：延后记录（DEFERRAL RECORD，D-54）

**本计划无 active work task，不修改任何源码文件。** 逐条处置如下：

| ID | 对象 | 处置 |
| --- | --- | --- |
| A-1-1 | `GameStorage`（`@motajs/legacy-system`，hotkey.ts:3）→ `SaveSystem`（save/system.ts:41） | **DEFERRED（D-54）** —— 存档相关适配暂时忽略 / 延后，后续另行规划；本计划不改 `hotkey.ts` |
| A-2-1 | 全局 `core`（core.d.ts:1302）→ `CoreState`（data-state/core.ts:76） | **仅记录（umbrella）** —— 不删 `core` 全局声明、不改 `core.ts:6` 单例定义；不做源码改造 |
| A-6-1/2/3 | `Mota.require('@user/data-base')`（cache.ts:491 / misc.ts:89 / misc.ts:219） | **DEFERRED（用户自行处理 `loading`）** —— 本计划不改 `cache.ts` / `misc.ts` |
| 7 条存档簇 | `C:saves` / `C:getSave` / `C:getAllSaves` / `C:setLocalForage` / `C:removeLocalForage` / `C:removeSave` / `C:clearLocalForage`（`core.*` → `SaveSystem`） | **DEFERRED（D-54）** —— 存档相关适配暂时忽略 / 延后；承接于 09-15 的延后组，本计划不改 |

> **依据（D-54）：** 新存档系统与旧设计完全不同、适配难度大，故存档相关 legacy 适配暂时忽略 / 延后（含 `GameStorage`、`SaveSystem`、`localForage` 及 `core.saves` / `core.getSave` / `core.getAllSaves` / `core.setLocalForage` / `core.removeLocalForage` / `core.removeSave` / `core.clearLocalForage`）。本计划据此将 A-1-1 与 7 条存档簇登记为 DEFERRED，不纳入第一批改造。

> **补充佐证（存档适配难度，支持 D-54）：** A-1-1 的 `GameStorage` → `SaveSystem` 非机械替换——后端由 `localStorage` 键值改为 Dexie / IndexedDB，读取 / 写入契约由同步改为 `Promise`（`getGlobal` / `setGlobal`），且 `hotkey.ts` 为模块级副作用文件（无 `props` / `IClientBase` 注入点），在不引入 `client` 单例（D-11 禁）的前提下无合规实例路径。该难度与 D-54「适配难度大」一致，故 A-1-1 归入 DEFERRED。

## 40 条 ALT 覆盖总表（ALT-COUNT = 40）

> 本计划**未新增任何 REPLACED**；下表使 40 条 ALT 的整体覆盖保持可审计（含 09-13 已收口部分与 09-15 / 09-16 承接部分）。

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

**② 本计划（09-14，延后登记 2 条）**

| ID | 对象 | 状态 |
| --- | --- | --- |
| A-1-1 | `GameStorage`（hotkey.ts:3）→ `SaveSystem`（save/system.ts:41） | ⏸ **DEFERRED（D-54）** —— 未改源码 |
| A-2-1 | 全局 `core`（core.d.ts:1302）→ `CoreState`（data-state/core.ts:76） | 📝 **仅记录（umbrella）** —— 未删声明 / 未改 `core.ts:6` 单例 |

**③ DEFERRED（D-54）—— 存档簇 7 条（承接于 09-15 的延后组）**

`C:clearLocalForage`、`C:getAllSaves`、`C:getSave`、`C:removeLocalForage`、`C:removeSave`、`C:saves`、`C:setLocalForage`

**④ 承接于 09-15（active 7 条，per 09-15-PLAN.md）**

`A-1-6`、`A-5-2`、`C:openBook`、`C:openEquipbox`、`C:openQuickShop`、`C:openToolbox`、`C:ui`

**⑤ 承接于 09-16（9 条，per 09-16-PLAN.md）**

`A-1-7`、`A-1-9`、`A-5-3`、`A-5-7`、`C:debug`、`C:drawThumbnail`、`C:encodeRoute`、`C:getTilesetOffset`、`C:hasItem`

**⑥ 用户自行处理（A-6，3 条）**

| ID | 对象 | 处置 |
| --- | --- | --- |
| A-6-1 | `Mota.require('@user/data-base')`（cache.ts:491） | DEFERRED（用户自行处理 `loading`；本计划不改 `cache.ts`） |
| A-6-2 | `Mota.require('@user/data-base')`（misc.ts:89） | DEFERRED（同上） |
| A-6-3 | `Mota.require('@user/data-base')`（misc.ts:219） | DEFERRED（同上） |

**计数核对：** 12（①）+ 2（②）+ 7（③）+ 7（④）+ 9（⑤）+ 3（⑥）= **40** ✅（与 `09-LEGACY-REPLACEMENT-AUDIT.md` 的 `ALT-COUNT: 40` 一致）。

## 命名影响（D-04 / OI-4）

**零新增命名。** 本计划未修改任何源码，未新增 / 修改任何公共、受保护、私有方法、字段、类型或接口，未改既有命名。

## Gates / 验证结果

| 门禁 | 结果 |
| --- | --- |
| Task 0 pre-state（审计文档 + CONTEXT 存在） | ✅ OK（`OK prestate intact`） |
| 范围守卫（`git status --porcelain`：仅本计划产物 + 用户既有并发改动） | ✅ OK（仅新增本 SUMMARY；`packages-user/data-state/**` 为用户并发改动，未触碰 / 未暂存） |
| 源码改动 | ✅ **0**（`hotkey.ts` / `cache.ts` / `misc.ts` / `saves.ts` / `save.tsx` 等均未改） |

**门禁口径：** 全部为**静态断言**；未使用 `pnpm check:type` / `pnpm build` / 全仓 TS 诊断数。

## Deviations from Plan

**None。** 本计划严格按延后记录执行：无 active work task、未修改任何源码。

- 未 invent 替代方案；未引入 `client` 单例；未新增命名；未越界改其它分类。
- 未触碰 A-6（`cache.ts` / `misc.ts`）与 `09-CONTEXT.md` / `09-LEGACY-REPLACEMENT-AUDIT.md` / 09-01..09-13 任何文件。

## Issues Encountered

- **用户并发改动（非本计划产物，未触碰 / 未暂存）：** `packages-user/data-state/**`（`enemy/{aura,calculator,final,legacy,special}`）与 `packages-user/data-system/src/combat/types.ts`。二者为 `git status` 守卫豁免的既有并发改动。
- **存档适配（A-1-1 + 7 条存档簇）—— DEFERRED（D-54）：** 后续另行规划；本计划不实施、不核实接入口径（OI-2）。

## Next Phase Readiness

- A-1-1 与 7 条存档簇保持 **DEFERRED（D-54）**，后续另行规划。
- A-6（`Mota.require` / `loading`）保持 DEFERRED（用户自行处理）。
- A-2-1 umbrella 已记录（全局 `core` 声明与 `core.ts:6` 单例定义均保持原状）。
- 40 条 ALT 覆盖已在本文档逐条可审计（见「40 条 ALT 覆盖总表」）。

---

## Self-Check: PASSED

- **未修改任何源码**（`hotkey.ts` / `cache.ts` / `misc.ts` 等保持原状；本计划无 active work task）。
- 未触碰 A-6（`cache.ts` / `misc.ts`）；未触碰用户并发改动。
- A-1-1 + 7 条存档簇登记为 DEFERRED（D-54）；A-2-1 仅记录；40 条 ALT 覆盖表逐条列明（12 + 2 + 7 + 7 + 9 + 3 = 40）。
- 提交：无任务提交（`commits: 0`，如实；本计划无源码改动）；本 SUMMARY 由收尾 docs 提交承载。
- STATE.md / ROADMAP.md / REQUIREMENTS.md 未被本执行修改（由 orchestrator 负责）。

---
*Phase: 09-minimum-browser-runnable*
*Plan: 14*
*Completed: 2026-10-12*
*Status: complete (延后记录 — A-1-1 与 7 条存档簇 DEFERRED，D-54)*
