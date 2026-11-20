---
phase: 09-minimum-browser-runnable
plan: 15
subsystem: client-modules（UI 打开 / 控制 cluster 的 R2 阻断登记）
tags: [legacy-removal, R2, STOP, ui-open, DEFERRED, D-54, BookUI, ToolBoxUI, EquipBoxUI, ShopUI, mainUIController]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-14 存档簇 DEFERRED（D-54）登记 + 40 条 ALT 覆盖承接
provides:
  - Task 0 汇报关卡闭环记录（用户已回复「可以执行」）
  - 09-15 UI 打开 / 控制组（C:openBook / C:openToolbox / C:openEquipbox / C:openQuickShop / C:ui / A-1-6 / A-5-2）的 R2 核实结论与 STOP 登记
affects: [09-16]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 0
  tasks: 1
  commits: 1
  plan_head_before: a15b79b29fc902acc7fc0561082c12110659deae

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UI 打开 / 控制的合规接入须满足：可从 props / 主对象取得 `UIController.open(ui, props)` 的全部必需 props，且不得引入 `client` 单例（D-11）；不可满足时记录并 STOP，不猜语义"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-15-SUMMARY.md
  modified: []

key-decisions:
  - "本计划 Task 1 触发 R2 STOP：未修改任何源码（`hotkey.ts` / `toolbar.tsx` / `viewmap.tsx` / `settings.tsx` 均保持原状）"
  - "`action/hotkey.ts` 为模块级副作用文件，无 props / `IClientBase` 注入点；在不引入 `client` 单例（D-11 禁）前提下，无法为 `BookUI` / `ToolBoxUI` / `EquipBoxUI` / `ShopUI` 取得 `open` 所需 state/props ⇒ C:openBook / C:openToolbox / C:openEquipbox / C:openQuickShop 记录 STOP"
  - "`EquipBoxUI` 的必需 props `attributes` 元素类型 `IHeroAttrItem` 为 `equipbox.tsx` 内未导出局部接口，外部无法构造 ⇒ C:openEquipbox STOP"
  - "`ShopUI` 的必需 props `shop` / `shopSystem` 在 `CoreState` / `ICoreState` / `IStateSystem` / `IClientBase` 上均不存在（`IShopSystem` 未接入数据端主对象）⇒ C:openQuickShop STOP"
  - "`core.ui._drawViewMaps()`（toolbar.tsx:198）在非 legacy 包中无等价物 ⇒ C:ui 整条 STOP（同 entry 的 settings.tsx:160 `closePanel` 可映射 `closeAll`，但整条 entry 因 `_drawViewMaps` 阻断）"
  - "`mainUi.open('settings')`（settings.tsx:67）的新架构目标 UI 未确定（非 legacy 包中无系统设置面板 `GameUI`；映射到主设置菜单 `MainSettingsUI` 会构成自指）⇒ A-5-2 / A-1-6 STOP，不得猜语义"
  - "存档簇 7 条维持 DEFERRED（D-54），本计划未触碰 `saves.ts` / `save.tsx` 与 `settings.tsx:573` / `:621`"

patterns-established:
  - "UI 打开 / 控制条目的可替换性取决于 props 可达性：无 props / 主对象注入点者一律 STOP + 登记，不臆造、不留 legacy 冒充完成"

requirements-completed: []

# Metrics
duration: 0min
completed: 2026-10-13
status: complete
---

# Phase 9 Plan 15: UI 打开 / 控制替换的 R2 阻断记录 Summary

**R2 核实：模块级 `hotkey.ts` 无 props / 主对象注入点，无法合规打开 `BookUI` / `ToolBoxUI` / `EquipBoxUI` / `ShopUI`；`EquipBoxUI` 的 `attributes` 为未导出局部类型、`ShopUI` 的 `shop` / `shopSystem` 未接入数据端主对象、`core.ui._drawViewMaps()` 无非 legacy 等价物 → 记录并 STOP，未修改任何源码**

## Performance

- **Duration:** 0 min（R2 阻断记录，无源码改造）
- **Tasks:** 1（Task 0 为 `blocking-human` 汇报关卡，已闭环；Task 1 触发 R2 STOP）
- **Files modified:** 0（仅新增本 SUMMARY）

## Task 0：预执行汇报关卡（已闭环）

**类型：** `checkpoint:decision` · `gate="blocking-human"` · **结论：用户已回复「可以执行」四字，关卡闭环。**

- 本计划 = 任务 7 · 第一批改造（ALT 条目）· **第 3 组 / 共 4 组 —— UI 打开 / 控制替换**（7 条 active；存档簇 7 条 DEFERRED，D-54）。
- 采纳处置：`execute-default`。
- 依据 `AGENTS.md`（执行前须获批）/ D-03 / D-04；`.planning/config.json` 为 `mode: yolo`，故关卡显式 `blocking-human` 且 `autonomous: false`。
- 汇报前置门禁（`OK prestate intact (UI callsites + UI defs + audit present)`）通过。
- OI-1 / OI-2 / OI-3 / OI-4 见下（其中 OI-3 即本次触发的 R2）。

## Task 1：R2 核实结论（STOP）

**类型：** `type="auto"` · **结论：R2 不成立 ⇒ 依计划「无法等价则记录并 STOP」，未改写任何源码。**

计划 Task 1 的 `<action>` 明确规定「**改写（R2 满足前提下）**」「无法等价则**记录并 STOP**」。本执行先做 R2 核实（只读），核实结果表明本组 7 条 active 条目的替代接入均不满足合规接入条件，故不执行改写。

### 逐条 R2 核实表（active 7 条）

| ID | 原接口（调用点） | 审计替代 | R2 核实结论 |
| --- | --- | --- | --- |
| C:openBook | `core.openBook`（hotkey.ts:481；toolbar.tsx:89,192；viewmap.tsx:130） | `BookUI`（book.tsx:251） | **STOP** —— `BookUI` 仅需基础 props；但 `hotkey.ts` 为模块级，无 props / 主对象注入点；模块级 `mainUIController`（ui/controller.tsx:5）未绑定 `propsBaseCreator`，无法注入 `state`（`Book` 依赖 `props.state.enemyContext`） |
| C:openToolbox | `core.openToolbox`（hotkey.ts:484；toolbar.tsx:90） | `ToolBoxUI`（toolbox.tsx:278） | **STOP** —— `ToolBoxUI` 必需 props `heroState: IHeroState<IHeroAttr>`；`hotkey.ts`（模块级）无合规来源；`props.state.hero` 仅在组件上下文（toolbar/viewmap）可得，无法覆盖模块级调用点 |
| C:openEquipbox | `core.openEquipbox`（hotkey.ts:487；toolbar.tsx:98） | `EquipBoxUI`（equipbox.tsx:551） | **STOP** —— `EquipBoxUI` 必需 props `attributes: readonly IHeroAttrItem[]`；`IHeroAttrItem` 为 `equipbox.tsx:11` **未导出局部接口**，外部无法构造（构造即 invent，禁） |
| C:openQuickShop | `core.openQuickShop`（hotkey.ts:493；toolbar.tsx:99） | `ShopUI`（shop.tsx:491） | **STOP** —— `ShopUI` 必需 props `shop: IShopState` / `shopSystem: IShopSystem`；`CoreState`（data-state/core.ts:76）/ `ICoreState` / `IStateSystem`（data-system/types.ts:7）/ `IClientBase`（client-base/types.ts:21）均无此二成员，无合规来源 |
| C:ui | `core.ui`（settings.tsx:160 与 toolbar.tsx:198 active） | `mainUIController`（ui/controller.tsx:5） | **STOP** —— 同一 entry 含 `core.ui._drawViewMaps()`（toolbar.tsx:198），非 legacy 包中**无等价物**（`_drawViewMaps` 仅存于 legacy 声明 / `public/libs/actions.js`）；`settings.tsx:160` 的 `closePanel` 虽可映射 `closeAll`，但整条 entry 因 `_drawViewMaps` 阻断；`:621`（存档回调内）为 DEFERRED（D-54），不在本次范围 |
| A-1-6 | `import { mainUi } from '@motajs/legacy-ui'`（settings.tsx:13） | `mainUIController` | **STOP** —— `mainUi` 唯一使用点为 `mainUi.open('settings')`；其新架构等价目标未确定（见 A-5-2），故不能单方面移除 `mainUi` 导入 |
| A-5-2 | `mainUi.open('settings')`（settings.tsx:67） | `UIController.open`（system/ui/controller.ts:190） | **STOP** —— 非 legacy 包中**无系统设置面板 `GameUI`**（`new GameUI(...)` 全量枚举无 "settings" 面板；`MainSettingsUI` 为主设置菜单，自指映射错误）；审计未给出实例目标，不得猜语义 |

### R2 关键事实（只读核实）

1. **模块级无注入点（hotkey.ts）：** `action/hotkey.ts` 顶层即为 `gameKey.realize(...)` 副作用代码，无 `props` / `IClientBase`；这是与 09-14 中 A-1-1 完全同类的结构性约束（模块级副作用文件、无合规实例路径）。
2. **两个 `mainUIController` 实例：** 模块级导出 `mainUIController`（`ui/controller.tsx:5`，Phase 4 遗留）与 `ClientCore.mainUIController`（`client.ts:127`）为不同实例；只有后者的 `setPropsBaseCreator` 被调用（`client.ts:130`），即模块级导出未绑定 `propsBaseCreator`。此事实影响「经模块级 `mainUIController` 注入 `state`」的可行性判定（如实陈述，不作问题认定）。
3. **`open` 契约：** `UIController.open(ui, vBind, alwaysShow=false)`（`packages/system/src/ui/controller.ts:121`）；基础 props（`instance` / `controller` / `state`）由 `propsBaseCreator`（`ui/func.ts:13`）注入；其余业务 props 须由调用方提供。
4. **`closePanel` 与 `_drawViewMaps`：** 审计述 `closePanel` 以 `closeAll` 等价（`UIController.closeAll`，`controller.ts:146`）；`_drawViewMaps` 无非 legacy 等价物（未核实到）。
5. **替代符号齐全但 props 不可达：** `BookUI` / `ToolBoxUI` / `EquipBoxUI` / `ShopUI` 均真实存在（book.tsx:251 / toolbox.tsx:278 / equipbox.tsx:551 / shop.tsx:491），但除 `BookUI` 外均带外部不可达的必需 props。

### 门禁与范围

| 门禁 | 结果 |
| --- | --- |
| Task 0 pre-state（UI 调用点 / UI 定义 / 审计文档存在） | ✅ OK（`OK prestate intact ...`） |
| Task 1 UIOPEN 门禁 | ⏸ **不适用（STOP 分支）** —— 未改写，legacy 用法保留为「未完成」；依计划「（或按 STOP 分支记录）」如实记录，不冒充完成 |
| Task 1 CRLF / import type 门禁 | ⏸ 不适用（未改写任何源码） |
| 范围守卫（`git status --porcelain`） | ✅ 无源码改动；无待暂存文件 |
| 源码改动量 | ✅ **0**（4 个目标文件均保持原状） |

**门禁口径：** 全部为**静态断言**；未使用 `pnpm check:type` / `pnpm build` / 全仓 TS 诊断数。

## 存档簇（DEFERRED，D-54）

C:saves / C:getSave / C:getAllSaves / C:setLocalForage / C:removeLocalForage / C:removeSave / C:clearLocalForage 维持 **DEFERRED（D-54）**。本计划**未修改** `render/utils/saves.ts` / `ui/save.tsx`，也未改 `ui/settings.tsx` 的 `C:clearLocalForage` 用法（`:573`）及存档回调内的 `core.ui.closePanel()`（`:621`）。

## 命名影响（D-04 / OI-4）

**零新增命名。** 本计划未修改任何源码，未新增 / 修改任何公共、受保护、私有方法、字段、类型或接口。

## Deviations from Plan

**None（源码层面）。** 计划 Task 1 的 `<action>` 明确规定「改写（R2 满足前提下）」与「无法等价则记录并 STOP」；本执行据此在 R2 不成立时记录并 STOP，未做任何改写，属计划**既定分支**而非偏离。

> **与派发方 success_criteria 的差异（如实呈报）：** 派发说明列出「`settings.tsx:160` active replaced」为期望项。经 R2 核实，C:ui 因同 entry 的 `_drawViewMaps`（toolbar.tsx:198）无法等价而不成立，故 `settings.tsx:160` **未替换**（保持原状），`:621` 存档回调内 `core.ui` **未触碰**（符合 D-54）。此差异的根因即 R2 STOP，已按计划 STOP 分支登记，供用户裁定。

## Issues Encountered

- **R2 阻断（OI-3，待用户裁定）：** 本组 active 7 条 UI 打开 / 控制的替代接入全部不满足合规条件（模块级无注入点 / props 类型未导出 / props 源不存在 / `_drawViewMaps` 无等价物）。依计划不得 invent、不得引入 `client` 单例，故记录并 STOP。
- **用户既有并发改动：** 执行期 `git status --porcelain` 为空，无待处理并发改动。

## Open Items（承接 Task 0）

- **OI-1（批次拆分）：** 本计划为任务 7 批次 4 计划中的第 3 个（**待用户确认**）。
- **OI-2（存档簇 DEFERRED，D-54）：** 维持 DEFERRED；本计划不实施、不核实映射口径。
- **OI-3（UI 打开传参 / `core.ui` 等价物，R2）：** **本次核实结论 = 不成立，已记录 STOP**（详见上表）。**待用户裁定**（延后 / 提供合规接入路径 / 调整分组）。
- **OI-4（命名影响）：** 零新增命名。

## Next Phase Readiness

- 本组 active 7 条（C:openBook / C:openToolbox / C:openEquipbox / C:openQuickShop / C:ui / A-1-6 / A-5-2）保持**未替换 + 已登记 STOP**；源码零改动，4 个目标文件保持原状。
- 存档簇 7 条维持 **DEFERRED（D-54）**。
- 阻断根因（模块级无注入点 / props 不可达）与 09-14 的 A-1-1 同类；后续规划需为用户提供合规接入决策（如：允许在组件上下文经 `props.state` 接入、或为模块级调用设计注入点、或维持 DEFERRED）。

---

## Self-Check: PASSED

- **未修改任何源码**（`hotkey.ts` / `toolbar.tsx` / `viewmap.tsx` / `settings.tsx` 保持原状）—— 与「Task 1 触发 R2 STOP」一致。
- 未触碰存档簇（`saves.ts` / `save.tsx` / `settings.tsx:573` / `:621`）；未触碰用户并发改动。
- 未 invent 替代；未引入 `client` 单例；未新增命名；未越界改其它分类。
- `settings.tsx:621` 存档回调内 `core.ui` 保持 DEFERRED（D-54）、未触碰；`settings.tsx:160` 因 C:ui 整条 R2 阻断而未替换（已如实登记的偏差）。
- 提交：本 SUMMARY 由 docs 提交承载（`commits` 以 ledger 实测为准）；无源码任务提交。
- STATE.md / ROADMAP.md / REQUIREMENTS.md 未被本执行修改（由 orchestrator 负责）。

---
*Phase: 09-minimum-browser-runnable*
*Plan: 15*
*Completed: 2026-10-13*
*Status: complete (R2 STOP — UI 打开 / 控制 7 条记录并 STOP；存档簇 DEFERRED，D-54)*
