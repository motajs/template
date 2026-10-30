---
phase: 09-minimum-browser-runnable
plan: 4
subsystem: ui
tags: [vue, statusbar, hooks, data-state, refactor]

requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-03 props.state migration (src/ui is client-free; main.tsx uses props.state)
provides:
  - "statusBar.tsx self-owns leftStatus/rightStatus; attributes+lv refresh via hero.attribute.addHook({ onUpdateAttribute }); floor trigger via hero.location.addHook({ onSetFloor })"
  - "main.tsx cleaned of migrated status defs/props/hooks; hideStatus reads flag default once at setup"
affects: [client-modules, statusBar, main-scene]

actuals:
  tokens: 6266
  tasks: 2
  commits: 2
plan_head_before: c52bf9abeeec7c6e4b9ac2d98fdc12291249bdec

tech-stack:
  added: []
  patterns:
    - "组件自持响应式状态 + 数据端钩子订阅 + onUnmounted 卸载"
    - "无对应钩子的字段留空并就近标注 // TODO:"

key-files:
  created: []
  modified:
    - packages-user/client-modules/src/ui/statusBar.tsx
    - packages-user/client-modules/src/ui/main.tsx

key-decisions:
  - "replay 本期不接线，保持 TODO（replaySystem 仅沙箱级钩子，无聚合录像状态钩子）"
  - "hideStatus 旧刷新路径随 attributeHook 迁出而消失，默认改为 setup 内读取一次 flags 初值 + TODO"
  - "floor 触发改用 hero.location.onSetFloor 新钩子，取值保持 legacy core.status.floorId 以保 FloorIds 类型"
  - "无钩子字段（up/道具数量/debuff/exampleHard）如实留空并标 TODO，不臆造钩子"
  - "移除未导出 StatusBarProps 的 status 成员及随之未使用的泛型形参（未改任何导出公共契约）"

patterns-established:
  - "状态栏状态自持：LeftStatusBar/RightStatusBar 在 setup 内 reactive 创建自身状态，不再经 props 传入"
  - "钩子生命周期：addHook 返回的 controller 在 onUnmounted 中 unload()"

requirements-completed: []

coverage:
  - id: D1
    description: "statusBar.tsx：LeftStatusBar/RightStatusBar 自持 leftStatus/rightStatus；属性 9 字段与 lv 经 hero.attribute.onUpdateAttribute 刷新、floor 经 hero.location.onSetFloor 触发、无钩子字段标 TODO、onUnmounted 卸载双钩子、StatusBarProps 去 status"
    requirement: ""
    verification:
      - kind: other
        ref: "node -e static check over statusBar.tsx (self-owned reactive + addHook/onUpdateAttribute/getFinalAttribute + onSetFloor + onUnmounted/unload + TODO + StatusBarProps no status/generic + no p.status)"
        status: pass
    human_judgment: false
  - id: D2
    description: "main.tsx：移除迁出的状态/传参/attributeHook/updateStatus/updateDataFallback/死引用 locked；保留 hideStatus、地图渲染、交互监听、mainUIController、MainSceneUI"
    requirement: ""
    verification:
      - kind: other
        ref: "node -e static check over main.tsx (removed symbols absent; hideStatus/layerState={state.maps}/mainUIController/using.onExcitedFunc/renderMapMisc/MainSceneUI present) + src/ui client-free check"
        status: pass
    human_judgment: false

duration: 8 min
completed: 2026-10-09
status: complete
---

# Phase 09 Plan 04: status 归属迁移（D-12 定向重设计）Summary

**把 `leftStatus` / `rightStatus` 从 `main.tsx` 迁入 `statusBar.tsx` 由状态栏组件自持，属性与 `floor` 改走数据端钩子、无钩子字段如实留空标 `TODO`**

## Task 0: 预执行汇报关卡（已满足）

计划以 `checkpoint:decision gate="blocking-human"` 作为第一个 block 点。用户已在父会话明确回复「可以执行」并**采纳全部默认处置**：

- `replay` → 默认 ⛔ TODO（本期不接线）。
- `hideStatus` → 默认：setup 内读取一次 flag 初值 + `// TODO:`。
- `floor` 取值 → 保持 legacy `core.status.floorId`（触发经由新 `onSetFloor` 钩子）。
- `statusBar.tsx:463` 的过时注释（提及 `p.status`）**不修改**（AGENTS.md）。

因此 Task 0 判定为**已满足**，未再次停下询问，直接进入 Task 1–2。预执行状态基线自动化检查通过（`OK pre-execution state intact`）。

## Performance

- **Duration:** ~8 min
- **Started:** 2026-10-09T18:45Z (approx.)
- **Completed:** 2026-10-09T18:53Z
- **Tasks:** 2（Task 1、Task 2；Task 0 为已满足的 checkpoint）
- **Files modified:** 2

## Accomplishments

- `statusBar.tsx`：`LeftStatusBar` 自持 `leftStatus`、`RightStatusBar` 自持 `rightStatus`（`reactive`），移除 `status` prop 传参契约（未导出 `StatusBarProps` 去 `status` 成员与未使用泛型；`statusBarProps.props` 去 `'status'`）。
- 属性 9 字段（`hp/hpmax/mana/manamax/atk/def/mdef/money/exp`）与 `lv` 经 `p.state.hero.attribute.addHook({ onUpdateAttribute })` 刷新（`getFinalAttribute`；`lv` 值经 legacy `core.getLvName`）。
- `floor` 经 `p.state.hero.location.addHook({ onSetFloor })` 触发，取值保持 legacy `core.status.floorId`；`onUnmounted` 卸载两个钩子。
- 无钩子字段（`up`、道具/钥匙数量、`poison/weak/curse`、`replay`、`exampleHard`）如实留空并就近标注 `// TODO:`（debuff 沿用既有注释文本）。
- `main.tsx`：移除 `replayStatus`/`leftStatus`/`rightStatus` 定义、`updateStatus`、`updateDataFallback`、死引用 `locked`、`attributeHook` + 其 `onUnmounted`、两处 `status={...}` 传参与不再使用的 import；保留 `hideStatus`（改为读一次 flags 初值 + TODO）、地图渲染、交互监听、`mainUIController` 区块、`using.onExcitedFunc`、`MainSceneUI`。

## Task Commits

Each task was committed atomically:

1. **Task 1: statusBar.tsx 状态归属迁移 + 钩子接线** - `61b618e` (refactor)
2. **Task 2: main.tsx 清理 + 门禁** - `4581350` (refactor)

**Plan metadata:** committed as the `docs(09-04)` completion commit (this commit)

## Files Created/Modified

- `packages-user/client-modules/src/ui/statusBar.tsx` - 状态自持 + 属性/floor 钩子 + TODO + onUnmounted 卸载 + `StatusBarProps` 去 `status`
- `packages-user/client-modules/src/ui/main.tsx` - 清理迁出物与死引用；保留面零破坏

## Decisions Made

- `replay` 本期不接线，保持 TODO（`replaySystem` 仅沙箱级钩子 `onCreateSandbox`/`onStartReplay` 等，无聚合录像状态钩子；原值来源 legacy `core.status.replay`）。
- `hideStatus` 旧刷新触发（`attributeHook`）随迁移消失，改为 setup 内读取一次 `p.state.flags.getFieldValueDefaults('hideStatusBar', false)` + `// TODO:`。
- `floor` 以新钩子做触发、以 legacy `core.status.floorId` 取值（保住 `FloorIds` 字面量联合类型，避免 `as` 断言）。
- 无钩子字段不写任何更新/订阅代码，只标 TODO（不臆造钩子）。
- 移除未导出 `StatusBarProps` 的 `status` 成员与随之未使用的泛型形参；未改动任何导出公共契约（`ILeftHeroStatus` / `IRightHeroStatus` / `LeftStatusBar` / `RightStatusBar` 名称与导出位置不变）。
- 组件 setup 内新增局部 `const`：`refreshAttribute`、`locationHook`（函数局部标识符，非成员/导出）。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `git status` 显示用户并发改动（`packages-user/data-*` 下多个文件）始终在场；两次提交均只暂存本计划 `files_modified` 白名单内的单一文件（先 `git status` 核对，再逐文件 `git add`），未触碰用户并发改动（D-56）。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- D-12（定向重设计）落地：状态归宿迁入 `statusBar.tsx`，字段更新走对应钩子（无钩子者 TODO），`main.tsx` 清理且 `hideStatus` / 地图 / 交互零破坏。
- 待用户派发 Phase 9 的下一个增量任务。
- `replay` 联动（沙箱级钩子编排）为已知后续项，需用户另行派发界定范围。

## Self-Check: PASSED

- FOUND: `packages-user/client-modules/src/ui/statusBar.tsx`
- FOUND: `packages-user/client-modules/src/ui/main.tsx`
- FOUND: `.planning/phases/09-minimum-browser-runnable/09-04-SUMMARY.md`
- FOUND commit: `61b618e` (Task 1)
- FOUND commit: `4581350` (Task 2)
