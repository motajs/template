---
phase: 07-data-fixes
plan: 06
subsystem: data
tags: [flag, common, mover, state-machine, jsdoc, vitest]

# Dependency graph
requires:
  - phase: 07-data-fixes
    provides: "07-05 map 缺陷修复（串行执行基线）"
provides:
  - "ObjectMover.prepareStep 的 Special 后退分支以 this.faceDirection 为基准，多步后退保持同轴"
  - "IObjectMover.backward 的 jsdoc 与实现语义一致（沿当前朝向的反方向后退，多步同轴）"
affects: [common, flag, verify-work]

actuals:
  tokens: 810
  tasks: 3
  commits: 1
  plan_head_before: fb5589cc022f5064422ac5d19a618098a0d9bcfe

tech-stack:
  added: []
  patterns:
    - "后退基准取 faceDirection：把「本步实际移动方向」与「下一步的相对基准」解耦，避免同一次赋值互相污染"

key-files:
  created: []
  modified:
    - packages-user/data-common/src/common/mover.ts
    - packages-user/data-common/src/common/mover.test.ts

key-decisions:
  - "Task 0 用户裁决 route-a：后退基准改为 this.faceDirection 并同步 jsdoc 措辞；不新增私有基准方向字段（route-b 被否决）"
  - "前进分支保持既有 getCurrentDirection() 语义不变——只动 Special 的后退分支"
  - "只取消 #06-08-1 的 it.skip，断言一字未改、不新增用例（D-10）"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "连续后退每一步以当前朝向为基准，净位移为 -2、朝向不变、移动方向为反方向（#06-08-1）"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/common/mover.test.ts#keeps retreating along the same axis across multiple backward steps"
        status: pass
    human_judgment: false
  - id: D2
    description: "单步 backward 与 forward(2) 既有绿用例不回归"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/common/mover.test.ts#moves backward against the current face direction / #moves forward along the current face direction"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-09-15
status: complete
---

# Phase 07 Plan 06: flag/common 数据端缺陷修复 Summary

**`ObjectMover` 后退基准由「被本步改写的移动方向」改为「当前朝向」，多步后退不再摆动；`backward` 契约 jsdoc 与实现同步，一条正确预期 skip 用例取消并转绿**

## Performance

- **Duration:** 10 min
- **Started:** 2026-09-15T12:52:00Z
- **Completed:** 2026-09-15T13:02:00Z
- **Tasks:** 3 (Task 0 checkpoint:decision 用户已裁决 route-a + Task 1 修复 + Task 2 门禁/结清)
- **Files modified:** 2

## Accomplishments

- **`#06-08-1` 根因修复**：`mover.ts` `prepareStep` 的 `Special` 分支原先无条件用 `getCurrentDirection()` 取基准（该函数优先返回 `moveDirection`），后退时又把 `moveDirection` 写成 `opposite(dir)`，于是第 2 步取到刚写入的反方向并再次取反——方向来回摆动、净位移为零、朝向被翻转。按 route-a 将后退分支的基准固定为 `this.faceDirection`，前进分支保持 `getCurrentDirection()` 不变，使「本步实际移动方向」与「下一步的相对基准」解耦。
- **契约注释同步（D-11）**：`IObjectMover.backward` 的 jsdoc、`getCurrentDirection` 与 `prepareStep` 的注释改为「后退基准 = 当前朝向、多步后退保持同轴」，文档与实现一致。
- **测试转绿（D-10）**：`mover.test.ts` 的 `keeps retreating along the same axis across multiple backward steps` 取消 `it.skip`，断言一字未改，仅同步 it 前的中文注释（去掉「疑似 bug…修复后取消 skip」的临时描述）。
- **既有绿用例不回归**：`moves backward against the current face direction`（单步，tile.y=-1、face=Down、move=Up）与 `moves forward along the current face direction`（forward(2)，tile.y=2）均保持绿。
- **账本结清（D-14）**：`WINDOWS.md` id 22 → `fixed`；`open_count` 11 → 10，`fixed_count` 16 → 17；本计划**未新增**任何账本条目。

## Task Commits

Each task was committed atomically (D-13):

1. **Task 0: D-09 预执行汇报（checkpoint:decision）** - 无提交；用户回复 `route-a`（记录：后退基准取 `this.faceDirection` 并同步 jsdoc；不新增私有状态字段，即否决 route-b）
2. **Task 1: #06-08-1 后退基准不摆动 + 契约注释同步** - `9f05865` (fix)
3. **Task 2: D-44 门禁 + 全量套件 + WINDOWS id 22 结清** - 无源码改动（仅验证与账本收口，并入本 SUMMARY 元数据提交）

**Plan metadata:** 本 SUMMARY 的 docs 提交（含 `.planning/WINDOWS.md`）

**Commits measured at SUMMARY write:** `git rev-list --count fb5589cc022f5064422ac5d19a618098a0d9bcfe..HEAD` = **1**（Task 1 的代码提交；本 SUMMARY 的 docs 提交为紧随其后的第 2 个提交）。

## Files Created/Modified

- `packages-user/data-common/src/common/mover.ts` - `Special` 后退分支基准改为 `this.faceDirection`；`forward`/`backward` 入队逻辑、`start()` 的 `moveDirection` 归一、其余分支一律未动；三处 jsdoc/注释同步
- `packages-user/data-common/src/common/mover.test.ts` - 取消 `keeps retreating along the same axis across multiple backward steps` 的 skip，注释同步（断言零改动）

### 生产改动（逐字）

```ts
// packages-user/data-common/src/common/mover.ts — prepareStep 的 Special 分支
case ObjectMoveType.Special: {
    if (step.direction === ObjectSpecialStep.Backward) {
        // 后退基准固定为当前朝向，避免被本步写入的反方向改写后摆动
        const dir = this.faceDirection;
        this.moveDirection = this.faceHandler.opposite(dir);
        this.faceDirection = dir;
    } else {
        const dir = this.getCurrentDirection();
        this.moveDirection = dir;
        this.faceDirection = dir;
    }
    break;
}
```

### jsdoc 改动前后措辞（D-11）

| 位置 | 改动前 | 改动后 |
|------|--------|--------|
| `IObjectMover.backward`（`:309-313`） | `追加若干个后退步，沿当前移动方向的反方向移动` | `追加若干个后退步，沿当前朝向的反方向后退` + `每一步都以当前朝向为基准，因此连续后退保持在同一轴线上，朝向不变` |
| `getCurrentDirection`（`:464-466`） | `获取当前应当作为相对移动基准的方向` | `获取相对移动（如前进）所使用的基准方向` + 「优先取本步之前已确定的移动方向，使多步前进保持同轴；否则回退到当前朝向。后退不使用此基准，一律以当前朝向为准」 |
| `prepareStep`（`:479-486`） | `根据步骤内容预先同步移动器内部状态` | 追加「前进以已确定的移动方向为基准；后退固定以当前朝向为基准，从而不会因本步写入的反方向而让基准在多步之间摆动」 |

`IObjectMover.forward`（`:303-307`）的 jsdoc「沿当前移动方向移动」保持不变——前进语义未改。

## Decisions Made

- **Task 0 用户裁决 `route-a`**：后退基准取 `this.faceDirection`（`const dir = this.faceDirection; this.moveDirection = this.faceHandler.opposite(dir); this.faceDirection = dir;`），前进分支保持 `getCurrentDirection()` 既有语义；按 D-11 同步 `backward`/`getCurrentDirection`/`prepareStep` 注释。**不**新增私有状态字段（route-b 保留字面契约路线被否决），故 `start()`（`:687` 的 `moveDirection = Unknown`）与类字段声明一行未动。
- **`backward` 的 jsdoc 措辞改动属 D-11 范围**——用户已在 Task 0 明确确认（这是 route-a 的既定代价）。
- 既有测试名 `moves backward against the current face direction` 本就与 route-a 语义一致，无需改断言。

## Findings ↔ 账本对照

| Finding | 生产写入点 | 取消 skip 用例 | 账本状态 | 处置 |
|---------|-----------|---------------|---------|------|
| `#06-08-1` | `mover.ts` `prepareStep` 的 `Special` 后退分支 | `mover.test.ts#keeps retreating along the same axis across multiple backward steps` | WINDOWS.md **id 22**（`skipped-test`，phase 06） | `windows fixed 22` → `fixed`（`open_count` 11 → 10），**无新增条目** |

## Deviations from Plan

None - plan executed exactly as written（按用户 Task 0 裁决的 route-a 执行；未出现方案失败，故未触发 D-09 的「退出并修订计划」路径）。

## Issues Encountered

- 无。`backward(` 全仓命中复核（Task 0 汇报项）：仅 `mover.ts`（接口声明 + 实现）与 `mover.test.ts`，无其它调用方，生产影响面收敛于本文件。
- 后备路线（route-b）所需的私有状态同步点（`start()` 初始化 + `prepareStep` 非后退步骤同步）本计划**未实施**，符合用户裁决。

## Verification Results

| 门禁 | 命令 | 结果 |
|------|------|------|
| Task 1 目标/回归 | `pnpm exec vitest run packages-user/data-common/src/common/mover.test.ts` | 1 file passed，**19 passed | 0 skipped**（修前为 18 passed + 1 skipped） |
| D-44(a) eslint | `pnpm exec eslint --fix` → `pnpm exec eslint`（2 文件） | 0 errors（两次均 exit 0） |
| D-44(b) 类型 | `pnpm exec vue-tsc --noEmit` 按 2 文件相对路径过滤 | **0 命中**；整仓 exit=2 的 28 条诊断全部为 `client-modules`/`legacy-plugin-data`/`legacy-ui` 既有渲染端错误（D-12 明确排除，不以整仓退出码判定） |
| D-44(c) 全量 | `pnpm test:ci` | **66 files passed，678 passed | 3 skipped（681）**，exit 0 |
| 全量计数变化 | 对比 07-05 基线（677 passed | 4 skipped） | **+1 passed、-1 skipped**，无回归 |
| 新增 skip | `git grep -n "it\.skip"` | 本计划新增 **0**；`mover.test.ts` 已无 `it.skip`；余下 3 条为既有（D-06 码 147、D-07 用户接线、#06-09-5 待后续计划） |
| 账本 | `gsd-tools windows fixed 22` | id 22 = `fixed`，`open_count: 10`、`fixed_count: 17`；WINDOWS.md 仅 6 行变化（本计划未新增条目） |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `#06-08-1` 已修复并结清；`ObjectMover` 的后退契约与实现一致，无新增 `it.skip`、无新增 WINDOWS.md 条目。
- 07-06 为 Phase 7 第 6 个计划；remaining：07-07、07-08（save 剩余项与 path 用户负责项）。

---

*Phase: 07-data-fixes*
*Completed: 2026-09-15*

## Self-Check: PASSED

- Declared `files_modified` 均存在且已修改：`packages-user/data-common/src/common/mover.ts`、`packages-user/data-common/src/common/mover.test.ts`。
- Task 1 提交 `9f05865` 存在（`git log --oneline` 命中 `fix(07-06): #06-08-1 keep backward steps on the same axis`）。
- 无新增 `it.skip`；WINDOWS.md 无新增条目，id 22 状态为 `fixed`。
