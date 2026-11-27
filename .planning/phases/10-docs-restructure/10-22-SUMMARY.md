---
phase: 10-docs-restructure
plan: 22
subsystem: docs
tags: [vitepress, documentation, advanced-ii, equipment, replay]

# Dependency graph
requires: []
provides:
  - "docs/advanced/ii/equipment-system.md: 装备实例仓、EquipmentState 修饰器、装备槽与 EquipStatus、非存档修饰器与读档重装、compareEquip、IEquipmentSorter、onChangeModifier 与验证边界"
  - "docs/advanced/ii/custom-replay-command.md: ReplayCode 只增不改、IReplayCommand/finalize、主动与被动、BaseReplayCommand 参数校验、initializeReplay 注册、record 记录、沙盒播放与禁用录制、验证边界"
  - "高级 II 后续属性与怪物篇目可直接引用的装备修饰器、装备存档恢复与自定义录像指令说明"
affects:
  - 10-23（勇士属性篇引用装备修饰器与属性计算）
  - 10-24（怪物上下文篇引用录像沙盒与战斗一致性）
  - 10-25（导览与侧边栏注册）
  - 10-26 / 10-27（读者审阅与用户主导修订）

# Actuals (#2632) — chars/4 over the realized diff.
actuals:
  tokens: 5857
  tasks: 2
  commits: 2
  plan_head_before: 848cf6c

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "高级 II 文档按库文档写：先问题与概念，再完整可运行示例，最后验证与边界"
    - "装备篇用「实例仓 → 实例修饰器 → 装备槽 → 存档约定 → 对比与排序」组织，突出修饰器不进属性存档、由重新装备恢复"
    - "录像篇用「指令码 → 指令对象 → 主动/被动 → 基类 → 注册 → 记录 → 沙盒」组织，把玩家入口与回放入口分开"

key-files:
  created:
    - docs/advanced/ii/equipment-system.md
    - docs/advanced/ii/custom-replay-command.md
  modified: []

key-decisions:
  - "装备篇把「装备修饰器 save=false、读档由 HeroEquipment.loadState 重新 equip 恢复」作为关键约定单独成节，并给出正确的发放/穿戴/读档顺序"
  - "装备比较按源码写明：基线是当前属性，先移除目标槽现有装备的修饰器，再分别模拟 A/B；结果只包含有差异的键，slot 只接受索引"
  - "排序器示例按攻击加成降序，并说明返回值语义与 uid 兜底；排序器只影响展示顺序，不影响装备槽"
  - "录像篇按源码写明重复注册同一指令码会告警 163 并保留先注册对象，不按计划草稿的「覆盖」表述"
  - "录像篇补充播放期间必须 disable/revert：回放执行的指令会再次记录，并让读取流过期"
  - "沙盒验证区分 step 与 play/resume：step 走到末尾不会设置 ended，连续播放才会把 ended 置为 true"
  - "只写数据端；渲染端、编辑器与状态栏按 D-47 用非断链占位，不写 src/client 路径；未修改 docs/.vitepress/config.ts"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "equipment-system.md 讲清装备与道具区别、IHeroEquipsStore 实例仓、EquipmentState 修饰器、IHeroEquipment 装备槽与 EquipStatus、非存档修饰器与读档恢复、compareEquip、IEquipmentSorter 排序器、onChangeModifier 与 loadEvent/unloadEvent 现状、验证与边界"
    verification:
      - kind: other
        ref: "Task 1 static gate -> EQUIP-OK; cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, no dead link"
        status: pass
    human_judgment: true
    rationale: "D-09 要求用户人工审阅；存档恢复路径与 compareEquip 语义需要人工对照源码确认"
  - id: D2
    description: "custom-replay-command.md 讲清 ReplayCode 指令码与位宽、IReplayCommand 与 finalize、主动/被动、BaseReplayCommand 参数校验、ReplayUseSkill 完整示例、initializeReplay 注册、record 记录、createReplaySandbox 与 IReplaySandbox 播放控制、验证与边界"
    verification:
      - kind: other
        ref: "Task 2 static gate -> REPLAY-CMD-OK; cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, no dead link"
        status: pass
    human_judgment: true
    rationale: "D-09 要求用户人工审阅；自定义指令示例与沙盒行为需要人工对照源码确认"

# Metrics
duration: 22min
completed: 2026-10-21
status: complete
---

# Phase 10 Plan 22: 高级 II 装备与自定义录像指令 Summary

**新增 `equipment-system.md` 与 `custom-replay-command.md` 两篇高级 II 文档：装备篇讲清实例仓、实例修饰器、装备槽、非存档修饰器与读档重装、`compareEquip` 与排序器；录像篇从指令码一路讲到 `ReplayUseSkill`、注册、记录与沙盒回放，并写明播放期间必须禁用录制。**

## Performance

- **Duration:** 约 22 min
- **Completed:** 2026-10-21
- **Tasks:** 2（Task 0 审批门禁已由用户「批准所有 Advanced II 计划」预先通过）
- **Files created:** 2
- **Build gate:** `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → `build complete`，无 dead link

## Accomplishments

- 新建 `docs/advanced/ii/equipment-system.md`：区分装备定义与装备实例，说明 `IItemRawData.equip` 的 `slots` / `animate` / `value` / `percentage` / `loadEvent` / `unloadEvent`，以及为什么同一件装备需要多个 `uid`。
- 装备篇覆盖 `IHeroEquipsStore` 的 `add` / `delete` / `get` / `instancesOf` / `instances` / `count` / `useSorter`，并给出发放装备、读取实例的完整示例。
- 装备篇说明 `EquipmentState` 的 `setValue` / `setPercentage` 如何生成 `ValueModifier` 与 `PercentageModifier`，写明百分比按基础值计算、优先级从大到小应用，以及穿戴后改数值会立即重算。
- 装备篇覆盖 `IHeroEquipment` 的 `slots` / `setSlots` / `canEquipTo` / `equip` / `unequip` / `equipped` / `getEquipped` / `getEquips`，写明 `EquipStatus` 三种取值、`autoUnload` 语义与槽位写法必须与定义一致。
- 装备篇单独成节说明装备修饰器以 `save = false` 进入属性、`HeroAttribute.loadState` 会清空修饰器、`HeroEquipment.loadState` 先清空再重新 `equip` 恢复，并给出 `HeroState.loadState` 的属性 → 位置 → 道具 → 装备顺序。
- 装备篇给出 `compareEquip` 的克隆试算语义与 `-1` 空槽用法，以及 `IEquipmentSorter` 的完整 `AtkBonusSorter` 示例和 `useSorter` 接入。
- 装备篇说明 `onChangeModifier` 在增加、删除、改值时触发，并明确 `loadEvent` / `unloadEvent` 只是数据字段、引擎不会自动执行。
- 新建 `docs/advanced/ii/custom-replay-command.md`：说明何时需要新指令、`ReplayCode` 只增不改、`ReplayCommandWidth.Uint8` 的 0–255 限制与 `Uint16` 切换。
- 录像篇覆盖 `IReplayCommand` 的 `type` / `execute` / `finalize`、`ReplayCommandResult` 三种结果，以及 `finalize` 的两个触发时机。
- 录像篇区分主动与被动，说明被动步必须在主动步期间由 `getPassive()` 取走并 `next(status)`，否则会被跳过并告警。
- 录像篇给出完整 `ReplayUseSkill` 与 `BaseReplayCommand` 参数校验说明，并在 `initializeReplay` 中演示 `registerCommand`；记录段把玩家入口 `use` 与回放入口 `apply` 分开，避免重复记录。
- 录像篇给出 `ReplayReseter` 与 `createReplaySandbox` 的完整播放函数，说明创建沙盒时立即 `reset`、`play` / `step` / `pause` / `resume` / `stop` / `getReplayed` / `onStep` 的用法，并强调播放期间必须 `disable` / `revert`。
- 两篇均包含「怎么验证」段，给出可执行调用、预期现象与边界注意事项；全部代码块为完整类、接口或函数。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写高级 II 勇士装备系统** - `6145607` (docs)
2. **Task 2: 编写高级 II 自定义录像指令** - `e3c2a45` (docs)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `docs/advanced/ii/equipment-system.md` - 装备实例仓、实例修饰器、装备槽、存档约定、对比、排序器、装备事件、验证与边界
- `docs/advanced/ii/custom-replay-command.md` - 指令码、指令对象、主动/被动、基类、注册、记录、沙盒播放、验证与边界

## Decisions Made

- 装备篇把「装备修饰器不进属性存档、由重新装备恢复」单独成节，并用 `HeroState.loadState` 的实际顺序解释为什么实例仓必须先于装备槽读档。
- `compareEquip` 按源码写明基线是当前属性、只移除目标槽现有装备的修饰器、结果只包含有差异的键；同时把「比较对象已穿在别的槽会重复计入」放进边界。
- 排序器示例选择「攻击加成降序」，用 `b - a` 直接体现返回值语义，并用 `return 0` 交给 uid 兜底。
- 录像篇把玩家入口 `SkillSystem.use`（记录 + 执行）与回放入口 `apply`（只执行）分开，避免同一次技能被记两遍。
- 沙盒播放统一用 `replay.disable()` / `revert()` 包住创建、单步与连续播放，避免回放产生的行为写回录像。
- 严格限定数据端内容，未写入 `src/client` 路径、渲染端实现或编辑器/状态栏细节；未修改 `docs/.vitepress/config.ts`。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - 源码准确性] 重复注册的语义按源码改写**
- **Found during:** Task 2
- **Issue:** 计划正文写「同一指令码重复注册会覆盖」，但 `ReplaySystem.registerCommand` 在已存在时告警 163 并直接返回，保留先注册的对象。
- **Fix:** 文档改为「重复注册会告警并保留先注册对象，后注册的不会生效」。
- **Files modified:** `docs/advanced/ii/custom-replay-command.md`
- **Commit:** `e3c2a45`

**2. [Rule 2 - 源码准确性] 沙盒 `ended` 的触发条件按源码改写**
- **Found during:** Task 2
- **Issue:** 计划的验证描述是「单步后继续播放到结束，确认 `ended` 为 `true`」；源码中 `step()` 走到末尾只会完成 `finalize` 并停止推进，不设置 `ended`，且 `step()` 已把 `playing` 置为 `true`，随后调用 `play()` 会直接返回。
- **Fix:** 验证示例改为单步检查 `getReplayed()`，另建沙盒用 `play()` 与 `onStopReplay` 确认 `ended`；正文补充 `step` 与连续播放的差别。
- **Files modified:** `docs/advanced/ii/custom-replay-command.md`
- **Commit:** `e3c2a45`

**3. [Rule 2 - 缺失的关键约束] 补充播放期间必须禁用录制**
- **Found during:** Task 2
- **Issue:** 回放执行的指令会再次调用带记录的入口；`ReplayArray.add` 会让读取流过期，导致播放中止。计划只在边界里提了一句，未说明它会影响沙盒示例。
- **Fix:** 在沙盒播放与验证示例中用 `disable()` / `revert()` 包住创建与播放，并在边界中说明原因。
- **Files modified:** `docs/advanced/ii/custom-replay-command.md`
- **Commit:** `e3c2a45`

**4. [Rule 2 - 源码准确性] 装备实例仓读档行为按源码写明**
- **Found during:** Task 1
- **Issue:** 类型注释描述为「复用原实例原地读档」，而 `HeroEquipsStore.loadState` 的实际实现是先 `clear()` 再按存档重建实例。
- **Fix:** 文档按源码写明读档会清空并重建实例，并提醒读档后按 `uid` 重新 `get`，不要缓存旧实例引用。未把该差异写成缺陷。
- **Files modified:** `docs/advanced/ii/equipment-system.md`
- **Commit:** `6145607`

### Process Notes

**5. 修改方式为内联执行**
- **Found during:** 执行开始
- **Issue:** 计划 Task 0 声明修改方式为派发子代理，但当前执行器环境没有可用的子代理派发工具。
- **Fix:** 由执行器内联创建两篇新文档；范围严格限定为 `files_modified` 列出的两篇，不修改配置、生产代码或既有注释。
- **Verification:** `git show --stat 6145607` 与 `git show --stat e3c2a45` 均只包含目标文档。
- **Impact:** 无内容或范围影响；仅执行载体不同。

**6. Task 0 审批门禁按用户批量批准处理**
- **Found during:** 执行开始
- **Issue:** 计划要求先汇报两篇文件名并等待「可以执行」。
- **Fix:** 执行上下文 `<approval_gate_cleared>` 明确记录用户已批准所有 Advanced II 计划，故未重复停机。
- **Impact:** 无；两篇文件名与 10-21 的命名基线一致。

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 高级 II 的装备与录像指令两篇已就位，10-23 起的属性与怪物上下文篇目可以直接引用装备修饰器、装备存档恢复与自定义指令说明。
- 两篇尚未接入侧边栏，`docs/.vitepress/config.ts` 保持原样；10-25 负责导览与侧边栏注册。
- 渲染端与编辑器内容按 D-47 保留非断链占位，待对应文档就位后替换。
- 构建已通过且无死链；内容可读性与语义仍需 10-26 读者审阅、10-27 用户主导修订确认。
- 按本次任务要求，未更新 `STATE.md` 与 `ROADMAP.md`。

---

*Phase: 10-docs-restructure*
*Completed: 2026-10-21*

## Self-Check: PASSED

- `docs/advanced/ii/equipment-system.md` — FOUND
- `docs/advanced/ii/custom-replay-command.md` — FOUND
- Commit `6145607` — FOUND
- Commit `e3c2a45` — FOUND
- Task 1 gate `EQUIP-OK` — PASSED
- Task 2 gate `REPLAY-CMD-OK` — PASSED
- Build `build complete`, dead link = 0 — PASSED
- Commits measured: `git rev-list --count 848cf6c..HEAD` = 2
