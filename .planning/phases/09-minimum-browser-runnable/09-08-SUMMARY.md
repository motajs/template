---
phase: 09-minimum-browser-runnable
plan: 8
subsystem: ui
tags: [vue, tsx, hero-items, toolbox, render-vue]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 用户补齐的 IHeroItems.iterateItems()（data-base/src/hero/types.ts:632），以及既有 Scroll/icon/GameUI 渲染骨架
provides:
  - "toolbox 道具栏 UI：ToolBox / ToolBoxUI / ToolBoxProps（packages-user/client-modules/src/ui/toolbox.tsx）"
affects: [09-minimum-browser-runnable]

# Actuals (#2632)
actuals:
  tokens: 2680
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "以 heroState.items.iterateItems() 枚举背包并按 consumable 分组、count 降序 / num 升序排序"
    - "三列均以 <Scroll noscroll> 承载列表 / 说明，占满游戏画面（FULL_LOC）"

key-files:
  created:
    - packages-user/client-modules/src/ui/toolbox.tsx
  modified: []

key-decisions:
  - "OI-T1（枚举来源）：采用用户补齐的 heroState.items.iterateItems()，不再借用 saveState()，无需额外 prop"
  - "OI-T2（使用行为）：仅调用 useItem，不改打开 / 关闭流程"
  - "OI-T3（不可用提示）：useItem 返回 false 时不额外提示，仅保持界面"
  - "OI-T4（数字格式化）：数量以 core.formatBigNumber 格式化"
  - "OI-T5（命名）：toolbox.tsx / ToolBox / 'toolbox' / ToolBoxProps / ToolBoxUI 全部照准"
  - "道具行类型复用既有 IHeroItemState，不新增行类型命名"

patterns-established:
  - "道具栏分组排序：过滤 hideInToolbox 后按 consumable 分组、count 降序、num 升序（先构建新数组，避免就地修改来源）"

requirements-completed: []

coverage:
  - id: D1
    description: "toolbox 道具栏三列布局（永久道具 / 可消耗道具 / 名称+说明）与过滤、分组、排序"
    verification:
      - kind: other
        ref: "node -e \"...TOOLBOX LAYOUT GATE...\"（静态源码断言）"
        status: pass
    human_judgment: true
    rationale: "布局与视觉形态无自动化 UI 测试，需人工目视确认三列与占满画面（D-34 / D-33）"
  - id: D2
    description: "交互：单击选中、再次点击使用（useItem）、右下退出（controller.close）；无丢弃 / 拖拽"
    verification:
      - kind: other
        ref: "node -e \"...TOOLBOX INTERACTION GATE...\"（静态源码断言）"
        status: pass
    human_judgment: true
    rationale: "点击选中 / 再点使用 / 退出为运行时交互，需人工在浏览器确认行为（D-36 / D-37）"

# Metrics
duration: 12min
completed: 2026-10-11
status: complete
---

# Phase 9 Plan 8: toolbox 道具栏 Summary

**将 legacy 道具栏移植为新接口三列 UI：以 `heroState.items.iterateItems()` 枚举背包，永久 / 可消耗分组并按数量降序、图块数字升序，单击选中、再点 `useItem`，右下退出。**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-11T14:40:28Z
- **Completed:** 2026-10-11
- **Tasks:** 3（Task 0 汇报关卡已满足；Task 1、Task 2 为代码任务）
- **Files modified:** 1（新增）

## Accomplishments
- 新增 `packages-user/client-modules/src/ui/toolbox.tsx`：三列布局（左 永久道具 / 中 可消耗道具 / 右 道具名称 + 道具说明），根容器 `FULL_LOC` 占满游戏画面。
- 以 `heroState.items.iterateItems()` 直接枚举背包，过滤 `raw.hideInToolbox === true`，按 `consumable` 分组，各组 `count` 降序、`count` 相同按 `num` 升序（先建新数组，不就地修改来源）。
- 行渲染 `<icon icon={num}>` + `raw.name` + `core.formatBigNumber(count)`；列表与说明区均用 `<Scroll noscroll>` 纵向滚动。
- 交互：单击选中（高亮），再次点击已选中项调用 `heroState.items.useItem(item)`；右下「退出」调用 `props.controller.close(props.instance)`；无丢弃 / 拖拽。

## Task Commits

Each task was committed atomically:

1. **Task 0: 预执行汇报关卡（blocking-human）** - 无提交（只读汇报关卡，已获用户「可以执行」并采纳全部默认处置）
2. **Task 1: 布局 + 列表** - `f039ebc` (feat)
3. **Task 2: 交互 + 门禁** - `08f9b41` (feat)

**Plan metadata:** 见下方（SUMMARY 提交）

_Note: Task 1 与 Task 2 共用同一文件，按计划拆分为两次原子提交：Task 1 = 布局 / 列表 / 选中高亮骨架 + 退出按钮视觉；Task 2 = 再点使用 + 退出接线。_

## Files Created/Modified
- `packages-user/client-modules/src/ui/toolbox.tsx` - toolbox 道具栏：`ToolBox` / `ToolBoxUI` / `ToolBoxProps`。

## Decisions Made
- Task 0 汇报关卡已由用户在父会话满足：明确回复「可以执行」并采纳全部默认处置（OI-T1 已闭合改用 `iterateItems()`；OI-T2 仅 `useItem` 不改打开流程；OI-T3 不做不可用提示；OI-T4 用 `core.formatBigNumber`；OI-T5 命名照准）。
- 道具行类型复用既有 `IHeroItemState`，未新增行类型命名（与 Task 0 汇报一致）。
- 排序在枚举时构建的新数组上执行，天然不修改数据端来源数组。

## Deviations from Plan

None - plan executed exactly as written.

（说明：Task 1 行动 (5) 提及「选中项以高亮样式标识」，故 Task 1 提交含选中 `ref` 与高亮骨架；「再次点击使用」与「退出接线」按 Task 2 落地。这属于计划既有任务划分，非偏离。）

## Issues Encountered
- Task 2 提交信息中误带入一行无意义文本「- 已忽略全角/半角措辞」；因该提交已成功，遵循「不擅自 amend」约束未做修改，此处如实记录，纯属提交信息外观问题，不影响代码。

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None — 未引入计划 `<threat_model>` 之外的新信任边界（纯新增只读 UI，数据经由既有 `IHeroItems` 接口）。

## Self-Check: PASSED

- `packages-user/client-modules/src/ui/toolbox.tsx` 存在
- 提交 `f039ebc`、`08f9b41` 存在

## Next Phase Readiness
- toolbox 道具栏已就绪，可被 UI 控制器以 `'toolbox'` 名打开（打开方式不在本计划范围）。
- 未修改 STATE.md / ROADMAP.md（由编排器负责）。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-11*
