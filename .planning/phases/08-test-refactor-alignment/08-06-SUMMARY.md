---
phase: 08-test-refactor-alignment
plan: 06
subsystem: data-system/combat+event
tags: [test-alignment, combat, event, vitest, zero-production]
status: complete
requires:
  - phase: 08-test-refactor-alignment/08-01
    provides: 测试文件迁入 __test__ 目录的基线
provides:
  - "data-system 的 combat（4 test + 2 perf）与 event（1）共 7 个声明测试文件对齐 shipped 接口，聚焦 96/96 通过、perf 6/6 通过"
affects:
  - packages-user/data-system/src/combat
  - packages-user/data-system/src/event
tech-stack:
  added: []
  patterns:
    - "CombatFlow/EnemyContext 单参构造以 {} as IStateBase 最小桩装配，不新建重型夹具"
    - "已删的 addHook(...).load() 只保留 addHook(...)（Hookable 立即注册）"
    - "事件层经 GameMap.eventLayer 获取（IGameMap.getLayerByAlias 已删）"
key-files:
  created: []
  modified:
    - packages-user/data-system/src/combat/__test__/combat.test.ts
    - packages-user/data-system/src/combat/__test__/context.test.ts
    - packages-user/data-system/src/event/__test__/eventDispatch.test.ts
decisions:
  - "Q1：沿用各 combat 测试文件既有的 {} as IStateBase 最小桩；不新建 Phase 6 风格夹具"
  - "Q2：删除 eventDispatch 的 DirectionMapper 注入与 import/module 条目；MapState 改单参 commonState；不重注入 IFaceManager/IFaceHandler"
  - "Q3（用户授权偏离计划 must_haves）：不触发/不补测 DEV 守卫码 98/99/101，忽略无 emit 点的错误码；保持 Vitest 默认 mode=test，不改构建模式与配置"
requirements-completed: [TEST-02]
actuals:
  tokens: 1611
  tasks: 2
  commits: 3
  plan_head_before: 59e190b4689f5ea49b89c1b5545140d0304d0b9f
coverage:
  - id: D1
    description: "combat 4 test + 2 perf 对齐 shipped 接口，聚焦 0 失败"
    requirement: TEST-02
    verification:
      - kind: unit
        ref: "pnpm exec vitest run packages-user/data-system/src/combat/__test__ — 4 files / 90 passed / 0 failed"
        status: pass
      - kind: other
        ref: "pnpm exec vitest run --config vitest.perf.config.ts packages-user/data-system/src/combat/__test__ — 2 files / 6 passed / 0 failed"
        status: pass
    human_judgment: false
  - id: D2
    description: "event/eventDispatch 对齐 shipped 接口，聚焦 0 失败"
    requirement: TEST-02
    verification:
      - kind: unit
        ref: "pnpm exec vitest run packages-user/data-system/src/event/__test__ — 1 file / 6 passed / 0 failed"
        status: pass
    human_judgment: false
duration: 10min
completed: 2026-10-05
---

# 08-06 — combat/event 测试对齐 Summary

**一句话：** 将 `packages-user/data-system` 的 `combat`（4 test + 2 perf）与 `event`（1）声明测试文件对齐 shipped 接口——删除废弃的 `addHook(...).load()` 链与 `DirectionMapper` 注入、`CombatFlow`/`EnemyContext`/`MapState` 按单参构造装配、事件层改用 `GameMap.eventLayer`——聚焦 **96/96 通过**、perf **6/6 通过**、eslint **0 报错**、**零生产改动**。

## Task 0 裁决（已由用户批准「可以执行」）

- **Q1**：沿用各 combat 测试文件既有的 `{} as IStateBase` 最小桩，不新建 Phase 6 风格夹具。
- **Q2**：删除 `eventDispatch.test.ts` 中已废弃的 `DirectionMapper` 注入及其 import/module 条目（原 `:69/:104/:143`）；不重注入 `IFaceManager`/`IFaceHandler`；同夹具内 `new modules.MapState(tileStore, commonState)` → `new modules.MapState(commonState)`。测试文件技术处理由执行者判断。
- **Q3**：不触发/不补测 DEV 守卫码（98/99/101），忽略无 emit 点的错误码；保持 Vitest 默认 `mode=test`，不切构建模式、不改配置。此为对计划 must_haves「DEV 守卫码保持可触发」的**用户授权偏离**（见 Deviations）。

## 测试对齐改动（3 个文件）

- `combat/__test__/combat.test.ts`：删除 `addHook({...}).load()` 的 `.load()` 三处（原 `:442/:474/:499`），仅保留 `addHook(...)`；`CombatFlow` 构造本已传 `state`（`{} as IStateBase`），随 Q1 保留。删除后 eslint `--fix` 依 prettier 折叠链式调用（格式，非语义）。
- `combat/__test__/context.test.ts`：为「构造特殊查询修饰器」「告警 100（add 与 delete 同时非空）」两个用例夹具补一个**无副作用全局光环**，使 shipped `EnemyContext.buildupSpecials` 的 `if (this.sortedAura.size === 0) return;` 提前返回不再遮蔽特殊查询阶段；**断言文本与期望值未改、未删 `it`**。
- `event/__test__/eventDispatch.test.ts`：按 Q2 删 `DirectionMapper`；`MapState` 改单参 `commonState`；另将 `map.getLayerByAlias('event')` 改为 shipped 的 `map.eventLayer`（`getLayerByAlias` 已随重构删除，`fromRaw` 在 `alias==='event'` 时设置 `eventLayer`）。

## 门禁证据

- **聚焦运行**：`pnpm exec vitest run packages-user/data-system/src/combat/__test__ packages-user/data-system/src/event/__test__` → **Test Files 5 passed（5）；Tests 96 passed（96）**（0 failed）。
- **perf 通道**：`pnpm exec vitest run --config vitest.perf.config.ts packages-user/data-system/src/combat/__test__` → **2 passed / 6 passed**（0 failed）。两个 `.perf.ts` 无需改动（构造与导入未漂移）。
- **eslint**：`pnpm exec eslint packages-user/data-system/src/combat/__test__ packages-user/data-system/src/event/__test__` → **0 报错**（perf 文件 2 条既有 `no-console` 告警，非报错）。
- **生产改动范围**：`git status` 下 `packages-user/data-system/src/{combat,event}` 仅上述 3 个 `__test__` 文件；**零生产改动**。
- **skip 计数**：未新增/未删除任何 `it`，`data-system` 测试内无 `.skip`/`.todo`；仓库级 skipped 仍为 1（`hero/equipment.test.ts` 码 147）。

## 并发保护（D-08）

未触碰、未暂存、未提交任何用户并发改动（`packages-user/client-*`、`packages/system/src/ui/*` 等）。每个任务仅以显式路径 `git add` 声明文件。

## Deviations from Plan

### 1. [用户授权偏离 must_haves] DEV 守卫码不触发/不补测（Q3）

- **Found during:** Task 0 裁决 → 贯穿 Task 1/2。
- **Issue:** 计划 must_haves 原写「DEV 守卫码保持可触发」（98/99/101，依赖 Vitest 默认 `mode=test`）。
- **Decision（用户）:** 不触发、不为这些码新增覆盖断言，亦不为无 emit 点的错误码补测；保持默认 `mode=test`，不改构建模式与配置。
- **Impact:** 既有 98/99/101 用例保持不变（未删未弱化）；未新增任何覆盖。属**用户明确授权**的偏离，登记于此。

### 2. [Rule 3 - Blocking] context 夹具补无副作用全局光环

- **Found during:** Task 1（combat 对齐）。
- **Issue:** shipped `EnemyContext.buildupSpecials`（commit `e25ef3f` 引入）在 `sortedAura.size === 0` 时提前返回，导致「仅注册特殊查询效果、无任何光环」的既有用例 `for` 不被调用 / 码 100 不在全链路径触发（2 个用例红灯）。
- **Fix:** 在两个用例夹具中各加一个 `FakeAura`（FullRange、`onApply` 空）作为全局光环，使构建进入特殊查询阶段；**未改生产**、未改断言、未删用例。
- **Files modified:** `packages-user/data-system/src/combat/__test__/context.test.ts`
- **Verification:** 聚焦 combat 90/90 通过。
- **Committed in:** `71f93a5`（Task 1）。

### 3. [Rule 1 - Bug/接口漂移] eventDispatch 再对齐 `getLayerByAlias` → `eventLayer`

- **Found during:** Task 2（eventDispatch 对齐）。
- **Issue:** 计划仅预期 `DirectionMapper` 与 `MapState` 两处漂移；修完这两处后暴露 `map.getLayerByAlias is not a function`——`IGameMap.getLayerByAlias` 已随同轮重构删除，`IGameMap` 现暴露 `eventLayer`。
- **Fix:** `map!.getLayerByAlias('event')!` → `map!.eventLayer!`（`fromRaw` 在 `alias==='event'` 时设置 `eventLayer`，语义等价）。
- **Files modified:** `packages-user/data-system/src/event/__test__/eventDispatch.test.ts`
- **Verification:** event 聚焦 6/6 通过。
- **Committed in:** `e024e2d`（Task 2）。

### 4. [Rule 3 - Blocking] 未改动 `.perf.ts`

- 计划 `files_modified` 含 2 个 perf 文件，但其导入/构造未漂移，按 Task 1「只改因导入/构造漂移必需的形状」保持原样；已用 perf 配置独立跑通（6/6）。

---

**Total deviations:** 2 自动修复（1 blocking 夹具、1 接口漂移） + 1 用户授权偏离（Q3）。
**Impact on plan:** 无范围蔓延；对齐范围严格限制在 7 个声明测试文件，零生产改动、零新增依赖。

## Issues Encountered

- 计划对 combat 的 `context.test.ts` 失效根因（`buildupSpecials` 提前返回）与 event 的 `getLayerByAlias` 漂移均未在 Task 0/计划中列出，执行期按「只对齐测试、零生产改动」原则处理并登记为 Deviations。

## Known Stubs

None。

## Threat Flags

None——未引入新的网络/鉴权/文件访问/信任边界表面；`T-08-06-01..04/S C` 缓解均满足（未用 `as never` 伪造、未删用例、未切构建模式、未提交用户并发改动、未安装任何包）。

## Next Phase Readiness

- combat 与 event 两子系统对齐完成，为 data-state 集成与后续覆盖计划铺路。
- 无阻塞；后续计划可继续对齐 `data-system/src` 其余 `__test__` 子系统。

---

*Phase: 08-test-refactor-alignment*
*Completed: 2026-10-05*

## Self-Check: PASSED

- FOUND: .planning/phases/08-test-refactor-alignment/08-06-SUMMARY.md
- FOUND: 71f93a5 (Task 1)
- FOUND: e024e2d (Task 2)
