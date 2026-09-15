---
phase: 07-data-fixes
plan: 05
subsystem: data
tags: [map, save-load, diagnostics, logger, vitest]

# Dependency graph
requires:
  - phase: 07-data-fixes
    provides: "07-04 hero 缺陷修复（串行执行基线）"
provides:
  - "DynamicTile.loadState 逐个消费 IDynamicBlockSave 字段（先 set(save.num) 再恢复事件）"
  - "transferToDynamic 越界分支发码 128，与 transferToStatic/transferToStaticIfSafe 逐字一致"
affects: [map, save-load, verify-work]

actuals:
  tokens: 714
  tasks: 4
  commits: 2
plan_head_before: b1c20ea07d719eaed1f7e1a83f9c0105aa0ec0a8

tech-stack:
  added: []
  patterns:
    - "loadState 清单式修法：逐个 save 字段核对是否被消费"
    - "诊断码复用检查：改动写入点前 grep 全仓断言，确认语义归属"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/map/dynamicTile.ts
    - packages-user/data-base/src/map/saveLoad.test.ts
    - packages-user/data-base/src/map/mapLayer.ts
    - packages-user/data-base/src/map/mapLayer.test.ts

key-decisions:
  - "Task 0 用户选择 approve：码 131 → 128；不为码 128 补齐 4 个占位符；不新建 WINDOWS.md 账本条目"
  - "loadState 保持一参签名，不补 compression（对齐 MapTileBase 抽象声明 dev.md 未用后置参数不填）"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "DynamicTile.loadState 从存档恢复图块数字 num（同实例读档后 num 与存档一致）"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/saveLoad.test.ts#restores the tile num on the same instance"
        status: pass
    human_judgment: false
  - id: D2
    description: "越图 transferToDynamic 发越界诊断码 128（不再复用 setEventLayer 专属码 131）"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLayer.test.ts#warns code 128 for an out-of-map transferToDynamic"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-09-15
status: complete
---

# Phase 07 Plan 05: map 数据端缺陷修复 Summary

**DynamicTile.loadState 恢复存档图块数字，越图 transferToDynamic 改发越界码 128，两条正确预期 skip 用例取消并转绿**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-15T20:41:00Z
- **Completed:** 2026-09-15T20:48:00Z
- **Tasks:** 4 (Task 0 checkpoint:decision 用户批准 + Task 1/2/3 执行)
- **Files modified:** 4

## Accomplishments
- `#06-09-3`：`DynamicTile.loadState` 首行调用 `this.set(save.num)`（内部含 `tileNum` 写入、`tileRaw` 重取与 `restoreDefaultEvents()`），随后按 priority 恢复存档事件；签名仍为一参。
- `#06-06-1`：`mapLayer.ts` 越图 `transferToDynamic` 由 `logger.warn(131, x, y)` 改为 `logger.warn(128, x, y)`，与 `transferToStatic`（:467）和 `transferToStaticIfSafe`（:487）逐字一致；`inMap` 守卫与 `return null` 不动。
- 两条 skip 用例取消并转绿：`saveLoad.test.ts#restores the tile num on the same instance`、`mapLayer.test.ts#warns code 128 for an out-of-map transferToDynamic`；断言一字未改，中文注释同步（D-11）。
- 码 131 既有唯一断言 `gameMap.test.ts:185` 不回归；`mapLifecycle.test.ts` 的 `loadState` 幂等/`dirty` 语义不回归。

## Task Commits

Each task was committed atomically (D-13):

1. **Task 0: D-09 预执行汇报（checkpoint:decision）** - 用户回复 `approve`（记录：批准码 131→128；不补 128 占位符；不新建账本条目）
2. **Task 1: #06-09-3 loadState 恢复图块数字** - `3b1b9f1` (fix)
3. **Task 2: #06-06-1 越图改发码 128** - `620382c` (fix)
4. **Task 3: D-44 门禁 + 全量套件** - 无生产改动（仅验证，并入本 SUMMARY 元数据提交）

**Plan metadata:** 本 SUMMARY 的 docs 提交

## Files Created/Modified
- `packages-user/data-base/src/map/dynamicTile.ts` - `loadState` 先 `this.set(save.num)`，补中文 jsdoc 说明 num/events 为 save 全部字段
- `packages-user/data-base/src/map/saveLoad.test.ts` - 取消 `restores the tile num on the same instance` 的 skip，注释同步
- `packages-user/data-base/src/map/mapLayer.ts` - 越图 `transferToDynamic` 诊断码 131 → 128
- `packages-user/data-base/src/map/mapLayer.test.ts` - 取消 `warns code 128 for an out-of-map transferToDynamic` 的 skip，注释同步

## Decisions Made
- Task 0 用户答复 `approve`：两条方案按计划执行；不补齐码 128 的 4 个占位符（避免改动两个未登记的既有 `transferToStatic*` 兄弟分支）；`#06-06-1`/`#06-09-3` 无账本条目，不新建（避免抬高 `open_count`）。
- `loadState` 保持一参签名，不补 `compression`——`MapTileBase.loadState`（tile.ts:76）同样一参，token 未使用。

## Findings ↔ 账本对照（research §WINDOWS.md 收口映射）

| Finding | 生产写入点 | 取消 skip 用例 | 账本状态 | 处置 |
|---------|-----------|---------------|---------|------|
| `#06-06-1` | `mapLayer.ts:441` | `mapLayer.test.ts#warns code 128 for an out-of-map transferToDynamic` | WINDOWS.md **无条目** | 不新建（`open_count` 维持 11） |
| `#06-09-3` | `dynamicTile.ts:118-127` | `saveLoad.test.ts#restores the tile num on the same instance` | WINDOWS.md **无条目** | 不新建（`open_count` 维持 11） |

## 未处置的相邻事项（登记，不静默丢弃）

- **码 128 的 `$1..$4` 占位符缺参**：`packages/common/src/logger.json` 中码 128 文案含四个占位符，而三个越界分支（`transferToDynamic`、`transferToStatic`、`transferToStaticIfSafe`）均只传 `x, y` 两个参数，缺失项渲染为 `[not delivered]`。本计划按 Task 0 决定不补齐（属既有小瑕疵，且补齐会触及两个未登记兄弟分支）。是否另立 WINDOWS.md 条目待用户决定。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 无。码 131 影响面复核确认：`mapLayer.ts` 内已无 `logger.warn(131`，`gameMap.ts:149` 的 `setEventLayer` 写入点未触碰，`gameMap.test.ts:185` 断言不受影响。

## Verification Results

| 门禁 | 命令 | 结果 |
|------|------|------|
| Task 1 目标用例 | `pnpm exec vitest run packages-user/data-base/src/map/saveLoad.test.ts` | 9 passed（含取消 skip 用例） |
| Task 1 回归 | `pnpm exec vitest run packages-user/data-base/src/map/mapLifecycle.test.ts` | 5 passed |
| Task 2 目标/回归 | `pnpm exec vitest run packages-user/data-base/src/map/mapLayer.test.ts packages-user/data-base/src/map/gameMap.test.ts` | 45 passed，0 skipped |
| D-44(a) eslint | `pnpm exec eslint --fix` → `pnpm exec eslint`（4 文件） | 0 errors |
| D-44(b) 类型 | `pnpm exec vue-tsc --noEmit` 按 4 文件路径过滤 | 0 命中 |
| D-44(c) 全量 | `pnpm test:ci` | 66 files passed，677 passed \| 4 skipped（均为既有，本计划新增 0） |

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- map 数据端两条缺陷已修复，无新增 `it.skip`，无新增 WINDOWS.md 条目。
- 待用户决定：码 128 占位符缺参是否另立账本条目。

---
*Phase: 07-data-fixes*
*Completed: 2026-09-15*

## Self-Check: PASSED

- All 4 declared `files_modified` exist; SUMMARY.md exists.
- Task commits `3b1b9f1` (#06-09-3) and `620382c` (#06-06-1) exist.
- No new `it.skip`; no new WINDOWS.md entries.
