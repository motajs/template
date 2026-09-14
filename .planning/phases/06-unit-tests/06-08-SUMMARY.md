---
phase: 06-unit-tests
plan: 08
subsystem: testing
tags: [vitest, data-common, data-base, flag, face, faceManager, mover, indexer, utils]

# Dependency graph
requires: []
provides:
  - "FlagSystem 全公开表面的行为单测（不含 save/load）"
  - "common 工具覆盖：utils 朝向纯函数 / MapLocIndexer / FaceManager + Dir4/Dir8 handler / RoleFaceBinder / ObjectMover"
  - "码 43 / 44 / 111 的触发断言与 06-COVERAGE-MAP.md 06-08 小节"
affects: [06-09, verify-work]

# Actuals (#2632)
actuals:
  tokens: 9903
  tasks: 3
  commits: 3
  plan_head_before: 2b6de6df5fc7c7af255637f594fe00b729617dca

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "三阶段测试组织（构件 → 组合/流水线 → 完整/集成）"
    - "logger.catch 观测 warn/error code，vi.hoisted 全局 stub + Map.getOrInsertComputed/getOrInsert polyfill"
    - "异步 mover 路径用真实计时器 + await controller.onEnd"

key-files:
  created:
    - packages-user/data-base/src/flag/system.test.ts
    - packages-user/data-common/src/common/utils.test.ts
    - packages-user/data-common/src/common/indexer.test.ts
    - packages-user/data-common/src/common/faceManager.test.ts
    - packages-user/data-common/src/common/face.test.ts
  modified:
    - packages-user/data-common/src/common/mover.test.ts

key-decisions:
  - "按 D-43 三阶段顺序执行：构件级（utils/indexer）→ 组合（FlagSystem/FaceManager/handlers/RoleFaceBinder）→ 完整（ObjectMover 异步），每阶段跑绿并过 D-44 门禁后再进入下一阶段"
  - "D-32：不测任何 saveState/loadState；flag 存读档往返归 06-09"
  - "D-30：排除名称含 legacy 的接口/方法"
  - "ObjectMover 多步后退方向摆动记为疑似缺陷 #06-08-1，按 D-05 以 it.skip 正确预期用例登记，不修改核心代码"

patterns-established:
  - "flag/face 测试：vi.hoisted(vi.stubGlobal + Map polyfill) + beforeAll 动态 import 模块袋，纯函数模块直接相对导入"
  - "非数值 flag 字段告警：modules.logger.catch(() => system.addFieldValue(...)) 断言 info.code 含 111"
  - "mover 扩展覆盖：新增模块级 nextLocator 辅助并保持既有坐标回写用例不变"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "common 朝向工具纯函数与 MapLocIndexer 索引单元覆盖（构件级）"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/common/utils.test.ts#getFaceMovement/degradeFace/nextFaceDirection/fromDirectionString"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/common/indexer.test.ts#MapLocIndexer"
        status: pass
    human_judgment: false
  - id: D2
    description: "FlagSystem 全公开表面（码 111）与 FaceManager + Dir4/Dir8 handler + RoleFaceBinder（码 43/44）覆盖（组合/流水线）"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/flag/system.test.ts#FlagSystem field container + value accessors"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/common/faceManager.test.ts#FaceManager + Dir4FaceHandler + Dir8FaceHandler"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/common/face.test.ts#RoleFaceBinder malloc/bind/query"
        status: pass
    human_judgment: false
  - id: D3
    description: "ObjectMover 公开移动方法完整覆盖（含控制器 stop 与 start-while-moving 契约）"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/common/mover.test.ts#object mover position writeback + public surface"
        status: pass
    human_judgment: true
    rationale: "多步后退（backward(count>1)）行为异常，已按 D-05 记为疑似缺陷 #06-08-1 并以 it.skip 的正确预期用例登记；需人工确认预期语义后再修复与取消 skip"

# Metrics
duration: 21min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 08: flag + common 单元测试 Summary

**以 6 个行为单测覆盖 FlagSystem 全公开表面与 common 工具（朝向纯函数 / MapLocIndexer / FaceManager + 4·8 向 handler / RoleFaceBinder / ObjectMover），触发码 43/44/111，并按 D-05 记录 1 处疑似缺陷**

## Performance

- **Duration:** 21min
- **Started:** 2026-09-14T08:40:00Z (approx)
- **Completed:** 2026-09-14T09:01:33Z
- **Tasks:** 3
- **Files modified:** 6（5 新建 + 1 扩展）

## Accomplishments
- 阶段 1（构件级）：`utils.test.ts` 覆盖 `getFaceMovement`/`degradeFace`/`nextFaceDirection`（4 向与 8 向顺逆时针、Unknown 透传）/`fromDirectionString`（全部字符串 + 未知）；`indexer.test.ts` 覆盖 `MapLocIndexer` 的坐标/定位符一致、索引往返与 `setWidth` 步长变化。
- 阶段 2（组合/流水线）：`flag/system.test.ts` 覆盖 `FlagSystem` 全部公开方法（`occupied`/`insertField`/`getField`/`getOrInsert`/`getOrInsertComputed`/`deleteField`/`setFieldValue`/`addFieldValue`/`getFieldValue`/`getFieldValueDefaults`）并触发码 111；`faceManager.test.ts` 覆盖注册表与 `Dir4FaceHandler`/`Dir8FaceHandler` 全方法（degrade/movement/move/opposite/next/mapDirection/mapMovement）；`face.test.ts` 覆盖 `RoleFaceBinder` 并触发码 43/44。
- 阶段 3（完整/集成）：扩展 `mover.test.ts`，在保留既有 4 条坐标回写用例的前提下补齐 `ObjectMover` 全部公开移动方法（`setPos`/`setFaceDir`/`setMoveDir`/`tp`/`jump`/`step`/`stepFace`/`forward`/`backward`/`speed`/`face`/`animDir`/`push`/`clear`/`start`）与控制器 `stop` 契约，异步路径用真实计时器 + `await controller.onEnd`。
- 覆盖表与问题记录：`06-COVERAGE-MAP.md` 新增 06-08 小节与码 43/44/111 行；`06-TEST-FINDINGS.md` 新增 `#06-08` 小节（`#06-08-1`）。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）：朝向工具纯函数 + MapLocIndexer** - `7394a25` (test)
2. **阶段 2（组合/流水线）：FlagSystem + FaceManager/handlers + RoleFaceBinder** - `2cb9bba` (test)
3. **阶段 3（完整/集成）：ObjectMover 异步移动** - `6699df9` (test)

**Plan metadata:** (docs: complete 06-08 plan) — 见最终 docs 提交

_Note: 每阶段先跑绿聚焦用例并过 D-44 门禁（eslint + vue-tsc 文件级 + `pnpm test:ci`）后提交。_

## Files Created/Modified
- `packages-user/data-common/src/common/utils.test.ts` - 朝向工具纯函数覆盖（11 用例）
- `packages-user/data-common/src/common/indexer.test.ts` - `MapLocIndexer` 覆盖（4 用例）
- `packages-user/data-base/src/flag/system.test.ts` - `FlagSystem` 全公开表面与码 111（10 用例）
- `packages-user/data-common/src/common/faceManager.test.ts` - `FaceManager` + `Dir4`/`Dir8` handler（12 用例）
- `packages-user/data-common/src/common/face.test.ts` - `RoleFaceBinder` 与码 43/44（7 用例）
- `packages-user/data-common/src/common/mover.test.ts` - `ObjectMover` 扩展覆盖（18 通过 + 1 skip，既有 4 用例保留）

## Decisions Made
- 三阶段严格顺序执行（D-43）；每阶段通过 D-44 门禁（`eslint --fix` 后 `eslint` 0 错误、`vue-tsc --noEmit` 本计划文件 0 类型错误、`pnpm test:ci` 全绿）后才提交并进入下一阶段。
- 纯函数模块（utils/indexer/faceManager）直接相对导入，避免 barrel 副作用；flag/face 因 import 链触及 `@motajs/common` logger 使用 `vi.hoisted` 全局 stub 与 `Map.getOrInsertComputed`/`getOrInsert` polyfill。
- 不测 `saveState`/`loadState`（D-32），不引入任何生产代码改动。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug（测试预期）] 修正 `getMainFace` 期望值与负步数 `-0` 断言**
- **Found during:** 阶段 2（`face.test.ts`、`faceManager.test.ts` 首次聚焦运行）
- **Issue:** `RoleFaceBinder.getMainFace(identifier)` 返回的是**被查询图块自身标识**与主朝向方向；测试误写成主图块标识。另 `move(dir, negative)` 在零分量上产生 `-0`，与 `{ x: 0 }` 不被 `toEqual` 视为相等。
- **Fix:** 将 `getMainFace(2)` 期望改为 `{ identifier: 2, face: Down }`；负步数用例改用无零分量的对角方向（`RightUp, -2`），dir4 只保留正步数缩放。
- **Files modified:** `packages-user/data-common/src/common/face.test.ts`、`packages-user/data-common/src/common/faceManager.test.ts`
- **Verification:** 阶段 2 聚焦运行与全量 `pnpm test:ci` 全绿
- **Committed in:** `2cb9bba`（阶段 2 提交）

**2. [Rule 1 - Bug（测试骨架）] 扩展 `TestMover` 以支持 Jump/DirFace/Special 步**
- **Found during:** 阶段 3（扩展 `mover.test.ts`）
- **Issue:** 既有 `TestMover.onStepEnd` 只处理 `Teleport`/`Dir`，无法驱动 `jump`/`stepFace`/`forward`/`backward`。
- **Fix:** 抽出模块级 `nextLocator` 辅助；`onStepEnd` 增加 `Teleport|Jump`（含 `rel` 相对模式）、`Dir|DirFace`、`Special`（按 `this.moveDirection`）分支。既有 4 条坐标回写用例断言保持不变。
- **Files modified:** `packages-user/data-common/src/common/mover.test.ts`
- **Verification:** 阶段 3 聚焦运行（18 通过 / 1 skip）与全量 `pnpm test:ci` 全绿
- **Committed in:** `6699df9`（阶段 3 提交）

---

**Total deviations:** 2 auto-fixed（均为测试预期/测试骨架问题，未触碰生产代码）
**Impact on plan:** 无范围扩张；偏差仅限测试自身的期望与辅助实现，生产源码零改动。

## Issues Encountered
- 发现疑似缺陷 `#06-08-1`：`ObjectMover.backward(count>1)` 因 `Special` 步把 `moveDirection` 翻转为反方向、而 `getCurrentDirection` 又优先读取该方向，导致连续后退方向来回摆动、净位移为零并翻转朝向。按 D-05 以正确预期的 `it.skip` 用例登记（`mover.test.ts` `keeps retreating along the same axis across multiple backward steps`），并在 `06-TEST-FINDINGS.md` 记录；单步后退正常用例通过。未修改核心代码。

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- flag 与 common 的行为覆盖已完成，`pnpm test:ci` 全绿（58 文件 / 563 通过 / 14 跳过）。
- 存读档往返（含 flag）按 D-32 归 06-09；`#06-08-1` 待用户确认语义后修复并取消 skip。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*

## Self-Check: PASSED

- All 6 test files + SUMMARY exist
- Commits 7394a25, 2cb9bba, 6699df9 exist
- Focused runs green; pnpm test:ci green (58 files / 563 passed / 14 skipped)
- D-44 gate passed per stage
