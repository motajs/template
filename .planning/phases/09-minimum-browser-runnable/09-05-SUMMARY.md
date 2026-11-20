---
phase: 09-minimum-browser-runnable
plan: 5
subsystem: ui
tags:
  - typescript
  - vue-tsc
  - iuicontroller
  - generic
  - prettier
  - client-base
  - client-modules

requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-04 UI props/state 归属迁移基线（本计划在其上修复迁移遗留）"
provides:
  - "IUIController/UIController 必填泛型 <IGameUIPropsBase> 全量适配（16 处类型标注 + 2 处构造点）"
  - "src/ui 迁移遗留类型错误修复：main.tsx p→props；statusBar/toolbar props 基类型归位；settings.tsx loc 窄化"
  - "background.tsx / statusBar.tsx 经 prettier 格式化（D-15）"
affects:
  - 09-minimum-browser-runnable
  - ui
  - client-base
  - client-modules

actuals:
  tokens: 7883
  tasks: 3
  commits: 3
  plan_head_before: 1bcdcc3677016dcc0cf325766330e3803dfe5ab9

tech-stack:
  added: []
  patterns:
    - "必填泛型适配：IUIController<PB> / UIController<PB> 统一取 IGameUIPropsBase（client-modules 自 @user/client-base；client-base 组件自 ../types）"
    - "内嵌组件 props 基类型：DefaultProps + IClientBaseExtended（仅消费 state，不携带 controller/instance）"
    - "控制器窄化局部引用：const controller: IUIController<IGameUIPropsBase> = props.controller，仅用于开子 UI 的 .open(...)"

key-files:
  created: []
  modified:
    - packages-user/client-modules/src/ui/save.tsx
    - packages-user/client-modules/src/ui/settings.tsx
    - packages-user/client-modules/src/ui/statistics.tsx
    - packages-user/client-modules/src/ui/viewmap.tsx
    - packages-user/client-modules/src/render/utils/saves.ts
    - packages-user/client-modules/src/render/scene.ts
    - packages-user/client-modules/src/ui/controller.tsx
    - packages-user/client-base/src/components/choices.tsx
    - packages-user/client-base/src/components/input.tsx
    - packages-user/client-base/src/components/misc.tsx
    - packages-user/client-modules/src/ui/main.tsx
    - packages-user/client-modules/src/ui/statusBar.tsx
    - packages-user/client-modules/src/ui/toolbar.tsx
    - packages-user/client-modules/src/ui/background.tsx

key-decisions:
  - "Task 0（blocking-human 决策关卡）已由用户先前回复「可以执行」并采纳全部默认处置闭合：构造点去悬空字符串实参 + <IGameUIPropsBase>；settings.tsx 用组件局部 const controller（非内联 as）；statusBar/toolbar 基类型改 IClientBaseExtended"
  - "模块级单例 sceneController / mainUIController 不删、不改名，仅调整构造点为 new UIController<IGameUIPropsBase>()"
  - "statusBar.tsx / toolbar.tsx 的 props 基类型复用既有 IClientBaseExtended（零新增命名），仅保留 state"
  - "settings.tsx 新增 2 个组件局部 const controller（MainSettings / SyncSave 各一，非成员、非导出）"

patterns-established:
  - "必填泛型 IUIController<PB> 的适配来源按模块分层：client-modules 用 @user/client-base，client-base 内部组件用 ../types"
  - "内嵌（直接 JSX 使用，非控制器 open）组件的 props 基类型用 IClientBaseExtended，控制器打开的 UI 用 IUIPropsBase"

requirements-completed: []

coverage:
  - id: D1
    description: "D-15：background.tsx 与 statusBar.tsx 经 prettier 格式化（纯格式，逻辑零改）"
    verification:
      - kind: other
        ref: "prettier --check packages-user/client-modules/src/ui/background.tsx packages-user/client-modules/src/ui/statusBar.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-16：16 处 IUIController 标注补 <IGameUIPropsBase>；render/scene.ts 与 ui/controller.tsx 构造点改 new UIController<IGameUIPropsBase>()（去悬空字符串实参）"
    verification:
      - kind: other
        ref: "static B-gate (asserts every :IUIController carries <IGameUIPropsBase>; ctor sites fixed; imports present)"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-17：src/ui/** 迁移遗留类型错误修复（main.tsx p→props；statusBar/toolbar 基类型；settings.tsx loc 窄化）"
    verification: []
    human_judgment: true
    rationale: "计划规定的定向 vue-tsc 门禁在本沙箱无法执行——node_modules 的 pnpm 符号链接遍历被 OS 拒绝（os error 448 untrusted mount point），vue-tsc/tsc 均无法解析任何依赖。改动按计划逐条落地且静态/格式化/CRLF 门禁通过，但「这些具体 TS 错误已消失」未经机器验证，须人工/可运行环境复核。"

duration: 14 min
completed: 2026-10-10
status: complete
---

# Phase 09 Plan 05: 迁移后 UI 修复（A prettier + B IUIController 泛型适配 + C src/ui 迁移遗留类型错误） Summary

**为 `@motajs/system` 的必填泛型 `IUIController<PB>`/`UIController<PB>` 完成 16 处调用点 + 2 处构造点的 `<IGameUIPropsBase>` 适配，修复 `src/ui/**` 迁移遗留类型错误（`p`→`props`、内嵌组件 props 基类型归位、settings 控制器窄化），并对两文件执行 prettier 格式化。**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-10T06:05:59Z
- **Completed:** 2026-10-10T06:20:00Z (approx.)
- **Tasks:** 3（Task 0 决策关卡 + Task 1 B + Task 2 C+A）
- **Files modified:** 14（production）

## Accomplishments

- **B（D-16）全量泛型适配**：client-modules 侧 9 处（`save.tsx` 4 / `settings.tsx` 2 / `statistics.tsx` 1 / `viewmap.tsx` 1 / `render/utils/saves.ts` 1）+ client-base 侧 7 处（`choices.tsx` 4 / `input.tsx` 2 / `misc.tsx` 1）`IUIController` 标注补 `<IGameUIPropsBase>`；`render/scene.ts` 与 `ui/controller.tsx` 构造点改为 `new UIController<IGameUIPropsBase>()`（移除零参构造器下无效的字符串实参）。引入来源分层正确。
- **C（D-17）迁移遗留修复**：`main.tsx:56` 的 `p.state` 笔误改为 `props.state`；`statusBar.tsx` 的 `StatusBarProps` 与 `toolbar.tsx` 的 `ToolbarProps` 基类型由 `IUIPropsBase` 改为 `DefaultProps, IClientBaseExtended`（去必填 `controller`/`instance`，内嵌 `<MixedToolbar>`/`<NumpadToolbar>` 等不再报缺 props）；`settings.tsx` 在 `MainSettings`/`SyncSave` setup 内新增 `const controller: IUIController<IGameUIPropsBase> = props.controller;`，7 处开子 UI 的 `.open(...)` 改经该窄化引用以消除 `loc` 被 `UIRawProps` 误 `Omit` 的 TS2353。
- **A（D-15）格式化**：`background.tsx`、`statusBar.tsx` 经 `prettier --write` 归一（`.prettierrc` `endOfLine: crlf`），`prettier --check` 两文件通过。

## Task Commits

Each task was committed atomically:

1. **Task 1（B）: IUIController/UIController 泛型适配** - `3a49b37` (fix)
2. **Task 2（C+A）: src/ui 迁移遗留类型错误修复 + prettier** - `8cfbc73` (fix)

**Plan metadata:** committed as `docs(09-05): complete ... plan` (see completion note).

## Task 0（决策关卡）处置

Task 0 为 `checkpoint:decision gate="blocking-human"`（AGENTS.md 硬要求的执行前汇报关卡）。**用户已在父会话明确回复「可以执行」并采纳全部默认处置**，故本执行未再停留：

- 构造点：**移除**悬空字符串实参，改 `new UIController<IGameUIPropsBase>()`（不改 `packages/system`）。
- `settings.tsx`：新增组件局部 `const controller: IUIController<IGameUIPropsBase> = props.controller;`（**无 `as`**）。
- `statusBar.tsx`/`toolbar.tsx`：基类型改为 `DefaultProps, IClientBaseExtended`。

执行前实测基线（Task 0 `<automated>` 断言）通过：`main.tsx p.state` 遗留、`StatusBarProps`/`ToolbarProps` 基类型为 `IUIPropsBase`、两构造点带字符串实参、`settings.tsx` 裸 `IUIController` 均在册（A/B/C 全部未解）。

## Files Created/Modified

- `packages-user/client-modules/src/ui/save.tsx` - 4 处 `IUIController<IGameUIPropsBase>`；补 `@user/client-base` 引入
- `packages-user/client-modules/src/ui/settings.tsx` - `openSettings`/`openReplay` 补泛型；`MainSettings`/`SyncSave` 新增窄化 `controller`；7 处 `.open` 改经窄化引用
- `packages-user/client-modules/src/ui/statistics.tsx` - `openStatistics` 参数 `IUIController<IGameUIPropsBase>`
- `packages-user/client-modules/src/ui/viewmap.tsx` - `openViewMap` 参数 `IUIController<IGameUIPropsBase>`
- `packages-user/client-modules/src/render/utils/saves.ts` - `syncFromServer` 参数 `IUIController<IGameUIPropsBase>`
- `packages-user/client-modules/src/render/scene.ts` - `new UIController<IGameUIPropsBase>()`（单例名不变）
- `packages-user/client-modules/src/ui/controller.tsx` - `new UIController<IGameUIPropsBase>()`（单例名不变）
- `packages-user/client-base/src/components/choices.tsx` - 4 处泛型标注；补 `../types` 引入
- `packages-user/client-base/src/components/input.tsx` - 2 处泛型标注；补 `../types` 引入
- `packages-user/client-base/src/components/misc.tsx` - `waitbox` 泛型标注；补 `../types` 引入
- `packages-user/client-modules/src/ui/main.tsx` - `p.state` → `props.state`
- `packages-user/client-modules/src/ui/statusBar.tsx` - props 基类型归位；`IClientBaseExtended` 引入；prettier 格式化
- `packages-user/client-modules/src/ui/toolbar.tsx` - props 基类型归位；`IClientBaseExtended` 引入
- `packages-user/client-modules/src/ui/background.tsx` - prettier 格式化（纯格式）

## Decisions Made

- 采纳 Task 0 的全部默认处置（见上「Task 0 处置」）。
- `statusBar.tsx`/`toolbar.tsx` 复用既有 `IClientBaseExtended`（`client-base/src/types.ts:52`）；**零新增导出命名**。
- 未删除/改名模块级单例 `sceneController` / `mainUIController`；未引入 `IHeroAttr`；无依赖变更。

## Deviations from Plan

### Verification limitation (environment)

**1. [Environment] 定向 `vue-tsc` 门禁无法在本沙箱执行**
- **Found during:** Task 2（最终门禁）
- **Issue:** `packages/` 工程使用 pnpm 虚拟存储；`node_modules/**` 的符号链接/junction 遍历被 OS 拒绝（`UNKNOWN: unknown error` / Windows `os error 448 UNTRUSTED_MOUNT_POINT`，`cmd type` 亦复现）。因此 `node_modules/.bin/vue-tsc.CMD`、`pnpm exec vue-tsc`、直接 `node .../vue-tsc.js` 均无法解析 `typescript`/`@volar/*`/`vue`/`lodash-es` 等依赖，`pnpm check:type` 不可运行。
- **Impact:** 计划 Task 2 的核心门禁（断言在册 TS 错误消失）未能运行；`D3` 的覆盖分类为 `human_judgment: true`。
- **Mitigation:** 代码改动按计划逐条落地并由静态断言校验；其余可运行门禁全部通过：
  - B 静态门禁：`OK B: all IUIController annotations carry IGameUIPropsBase; ctor sites fixed`
  - Task 2 acceptance 静态断言：`OK: Task2 acceptance checks pass`（main 无 `p.state`；statusBar/toolbar 基类型 = `DefaultProps, IClientBaseExtended` 且不再引用 `IUIPropsBase`；settings 2 处窄化引用、7 处 `controller.open(`、0 处 `props.controller.open(`、`openSettings`/`openReplay` 泛型到位）
  - `prettier --check`（background/statusBar）：通过
  - CRLF 守卫：通过
  - 已登记 `.planning/WINDOWS.md`（id 29，`unrun-verify`）。
- **Files modified:** None（环境限制，非代码问题）
- **Committed in:** N/A
- **Remediation:** 需在可正常解析 `node_modules` 的环境（或本机真实 pnpm 环境）运行 `pnpm check:type` / 定向 `vue-tsc` 复核。

---

**Total deviations:** 0 auto-fixed（代码）；1 environment limitation（未执行门禁，已登记）。
**Impact on plan:** A/B/C 三项代码改动均按计划完成；除「类型错误已消失」未经机器验证外，无范围外改动、无新增命名、无既有注释改动。

## Issues Encountered

- 沙箱 `node_modules` 符号链接不可遍历（见上）。所有代码编辑与其余门禁不受影响；已改用「真实 store 路径 + 静态断言」执行 prettier 与全部可运行检查。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 14 个白名单生产文件已按计划修复并原子提交（`3a49b37`、`8cfbc73`）；范围零外溢（`git diff --name-only <base>..HEAD` 恰为白名单 14 文件；未触碰 `packages/system`、`packages/render*`、`data-*`、`legacy-ui`、`src/App.vue`、`vertex.ts`、`floorSelect.tsx`、`elements/**`、`render/index.tsx`、`client-base/src/map/renderer.ts`）。
- 待办：在可解析依赖的环境运行 `pnpm check:type` 复核 D3（见 WINDOWS.md id 29）。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-10*

## Self-Check: PASSED

- FOUND: `.planning/phases/09-minimum-browser-runnable/09-05-SUMMARY.md`
- FOUND commit: `3a49b37` (Task 1)
- FOUND commit: `8cfbc73` (Task 2)
- Scope verified: `git diff --name-only 1bcdcc3..HEAD -- packages-user` == whitelist 14 production files
- Gates verified: B static gate PASS; Task 2 acceptance static assertions PASS; `prettier --check` PASS; CRLF guard PASS
- Known limitation: targeted `vue-tsc` gate not runnable in sandbox (node_modules symlink traversal blocked); recorded in `.planning/WINDOWS.md` id 29
