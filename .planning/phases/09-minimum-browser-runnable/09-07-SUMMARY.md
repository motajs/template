---
phase: 09-minimum-browser-runnable
plan: 7
subsystem: ui
tags: [ui, equipbox, render-vue, hero-equip, drag, gameui]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-05 已闭环；数据端接口 IHeroEquipment（slots/equip/unequip/getEquipped/canEquipTo/compareEquip，compareEquip 支持 -1 = 无装备）"
provides:
  - "packages-user/client-modules/src/ui/equipbox.tsx：EquipBox / EquipBoxUI / EquipBoxProps / IHeroAttrItem"
  - "装备界面：左列状态区域（属性列举 + 选中增减）、右侧装备描述 / 装备槽（横滚）/ 拥有装备（纵滚）"
  - "交互：点击选中、再点穿上（autoUnload equip）、拖拽装脱、右下退出"
affects: [09]

# Actuals (#2632) — chars/4 over the realized diff of the created file.
actuals:
  tokens: 5704
  tasks: 3
  commits: 2
  plan_head_before: 1fe68b9f2b92928dc8db0d38ad74a96088eddcf2

tech-stack:
  added: []
  patterns:
    - "equipbox 三段式布局：左列状态区域 + 右侧自上而下 描述 / 装备槽（横向滚动）/ 拥有装备（纵向滚动）"
    - "增减量统一经 IHeroEquipment.compareEquip(-1 = 无装备) 取得，不自算修饰器公式"
    - "拖拽以渲染端动作事件（onDown/onMove/onUp）实现，非 DOM 拖拽；浮层图标加 noevent 不拦截命中"

key-files:
  created:
    - packages-user/client-modules/src/ui/equipbox.tsx
  modified: []

key-decisions:
  - "OI-E1：装备槽取自 heroState.equip.slots（非 state.equipment.slots）"
  - "OI-E2：单装备增减量经 compareEquip(uid,-1,slot) / compareEquip(-1,uid,slot) / compareEquip(uid,existing,slot)，不自算修饰器"
  - "OI-E3：拥有装备按 IEquipmentState.item.num 升序排序"
  - "OI-E4：拖拽以渲染端动作事件实现；拖拽穿脱为本期目标"
  - "OI-E5：命名照准（equipbox.tsx / EquipBox / GameUI 'equipbox' / EquipBoxProps / IHeroAttrItem / EquipBoxUI）"
  - "已装备装备再次点击仅为选中（不卸下）；卸下经拖拽，符合 D-31 / D-32"
  - "不自行绘制 UI 背景（遵循 R-1：背景交由背景控制器）"

patterns-established:
  - "新增装备界面挂载于 root renderer（FULL_LOC），不改 src/ui/index.ts 导出，避免与同 wave 计划冲突"

requirements-completed: []

# Coverage metadata (#1602) — static-gate-only plan; UI behavior needs human/visual UAT.
coverage:
  - id: D1
    description: "equipbox 三段式布局与数据枚举：左列状态区域按 attributes 顺序列举当前值与选中增减；右侧描述/装备槽（横滚）/拥有装备（纵滚）"
    verification: []
    human_judgment: true
    rationale: "本计划门禁为静态源码断言，未运行浏览器；布局与增减显示需人工/视觉 UAT"
  - id: D2
    description: "交互：点击选中、再点穿上（autoUnload equip）、拖拽拥有装备到槽、拖拽已装备卸下、右下退出"
    verification: []
    human_judgment: true
    rationale: "拖拽手感与穿脱链路需在浏览器中人工验收（GAP-E4 参考实现，手感按用户验收调整）"

duration: 4min
completed: 2026-10-11
status: complete
---

# Phase 9 Plan 7: equipbox 装备界面 Summary

**EquipBox 装备界面：左列状态区域 + 右侧描述 / 装备槽（横滚）/ 拥有装备（纵滚），点击选中与再点穿上、渲染端事件拖拽装脱、右下退出，增减量统一取自 `compareEquip(-1 = 无装备)`**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-11T06:26:50Z
- **Completed:** 2026-10-11T06:31:00Z
- **Tasks:** 3（Task 0 汇报关卡已由用户「可以执行」闭环；Task 1 / Task 2 执行）
- **Files modified:** 1（新增）

## Accomplishments
- 新增 `packages-user/client-modules/src/ui/equipbox.tsx`：`EquipBox` / `EquipBoxUI` / `EquipBoxProps` / `IHeroAttrItem`
- 布局（D-28）：左列状态区域（属性列举、纵向滚动 noscroll）；右侧自上而下 装备描述 / 装备槽（横向滚动 noscroll）/ 拥有装备（纵向滚动 noscroll）；根容器 `FULL_LOC`，右下退出
- 数据（D-30）：装备槽 `heroState.equip.slots`；拥有装备 `heroState.items.equipment.instances()` 按 `item.num` 升序；已装备映射 `getEquipped(i)` → `equipment.get(uid)`
- 增减量（D-29 / D-31）：选中时经 `hero.equip.compareEquip` 取 `-1 = 无装备` 语义；空槽 `compareEquip(uid,-1,slot)`、替换 `compareEquip(uid,existing,slot)`、已装备仅卸下 `compareEquip(-1,uid,slot)`；增绿减红、靠右对齐，不自算修饰器
- 交互（D-32 / D-37）：点击选中、再点穿上 `hero.equip.equip(uid, slotIndex, true)`（同类型首槽 `canEquipTo`）；拖拽拥有装备到槽装脱、拖拽已装备 `hero.equip.unequip(slotIndex)`；右下 `props.controller.close(props.instance)`

## Task Commits

Each task was committed atomically:

1. **Task 0: 预执行汇报关卡** - 未产生提交（用户已回复「可以执行」并采纳默认处置，见下）
2. **Task 1: 布局 + 数据列举** - `2217e09` (feat)
3. **Task 2: 交互 + 门禁** - `ba0732e` (feat)

**Plan metadata:** （本 SUMMARY 提交，orchestrator 持有 STATE/ROADMAP 写入）

## Files Created/Modified
- `packages-user/client-modules/src/ui/equipbox.tsx` - 装备界面组件（布局 + 数据枚举 + 交互）

## Decisions Made
- Task 0（`blocking-human`）已由用户在父会话回复「可以执行」并采纳全部默认处置：OI-E1 用 `heroState.equip.slots`；OI-E2 已闭合（`compareEquip` 支持 `-1 = 无装备`）；OI-E3 按 `item.num` 升序；OI-E4 渲染端事件拖拽且为本期目标；OI-E5 命名清单照准。
- 内部非导出辅助（`getTargetSlot` / `startPress` / `movePress` / `endPress` / `dragNum` 及拖拽状态 ref）为文件内实现细节，非 Task 0 的公共命名清单范围；命名遵循 `dev.md`（小驼峰）。
- 已装备装备再次点击仅为「选中」（不卸下），卸下走拖拽；符合 D-31「点击已装备仍算选中、仅显示卸下增减」与 D-32「拖拽已装备 = 卸下」。
- 不自行绘制 UI 背景，遵循 R-1（背景交由背景控制器处理）。

## Deviations from Plan
None - plan executed exactly as written.

（实现细节补充：拖拽浮层 `<icon>` 加 `noevent`，避免其拦截指针命中导致装备槽 `onEnter/onLeave` 失效；属拖拽实现的必要细节，未改契约。）

## Issues Encountered
- 布局门禁要求 `equipment.instances` 连续出现；初版 `hero.items.equipment\n.instances()` 因换行被门禁判失败，改为在单行内调用后通过。

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `equipbox.tsx` 已就位，可直接被控制器以 `EquipBoxUI` 打开（打开方式不在本计划范围）。
- 数据端接口未改动；`compareEquip` 的 `-1 = 无装备` 语义已被 UI 直接消费。
- 待人工/视觉 UAT：布局比例、拖拽手感、增减显示（静态门禁已全绿）。

## Self-Check: PASSED
- Created files verified present, commits verified in history.

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-11*
