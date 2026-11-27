---
phase: 08-test-refactor-alignment
plan: 07
subsystem: data-system/path
tags: [test-alignment, pathfinding, vitest, authorized-production-fix, D-10]
status: complete
requires:
  - phase: 08-test-refactor-alignment/08-01
    provides: 测试文件迁入 __test__ 目录的基线
provides:
  - "data-system 的 path 子系统 3 个声明测试文件对齐 shipped 注入面（useMapLayer / useFaceHandler / IPathfindingResult），聚焦 28/28 通过、eslint 0"
  - "经用户授权的两处最小生产修复（D-10）：起始节点登记进图（B1）与 174 NaN/负数损失守卫（B2）"
affects:
  - packages-user/data-system/src/path
tech-stack:
  added: []
  patterns:
    - "已删 useMapState 仅删除，图宽度由 useMapLayer(layer) 内的 indexer.setWidth(layer.width) 承担"
    - "useFaceHandler 注入真实处理器对象（Dir4FaceHandler / Dir8FaceHandler），不再传数字方向组"
    - "find() / getPath() 返回 IPathfindingResult（status + path），断言改为 status 与 path"
key-files:
  created: []
  modified:
    - packages-user/data-system/src/path/graph.ts
    - packages-user/data-system/src/path/__test__/graph.test.ts
    - packages-user/data-system/src/path/__test__/system.test.ts
    - packages-user/data-system/src/path/__test__/performance.test.ts
decisions:
  - "Q1：默认注入 Dir4FaceHandler（延续旧默认 InternalDirectionGroup.Dir4 意图）；显式八方向用例注入 Dir8FaceHandler 对象"
  - "Q2：useMapState 在 builder 与 finder 两处删除，宽度由 useMapLayer 承担；遗留 maps 局部变量按 lint 处理"
  - "Q3：performance.test.ts 仅改注入面，规模参数与断言阈值逐字不变"
  - "B1=（a）：授权最小生产修复，build() 中起始节点 mapped.add(startIndex)（D-10）"
  - "B2=（a）：授权在 resolveCost 恢复 174 守卫，NaN/负数告警并回退为 1；Infinity 仍是合法损失"
  - "F5=（a）：越界起点用例注入谓词与方向处理器，走真实越界分支并断言 183（而非 173）"
requirements-completed: [TEST-02]
actuals:
  tokens: 5910
  tasks: 2
  commits: 3
  plan_head_before: 4208857eff7a8501b2863875a9d18078a6dccb42
coverage:
  - id: D1
    description: "path 3 个测试文件对齐 shipped 注入面，聚焦 0 失败"
    requirement: TEST-02
    verification:
      - kind: unit
        ref: "pnpm exec vitest run packages-user/data-system/src/path/__test__ — 3 files / 28 passed / 0 failed"
        status: pass
      - kind: lint
        ref: "pnpm exec eslint packages-user/data-system/src/path/__test__ packages-user/data-system/src/path/graph.ts — 0 errors"
        status: pass
    human_judgment: false
  - id: D2
    description: "B1 起始节点建图 + B2 174 守卫恢复，经既有用例验证"
    requirement: TEST-02
    verification:
      - kind: unit
        ref: "graph.test.ts 单向门用例断言 source 节点存在；graph/system.test.ts 的 NaN 与负数用例断言 174 告警并回退单位损失"
        status: pass
    human_judgment: false
duration: 40min
completed: 2026-10-05
---

# 08-07 — path 测试对齐 Summary

**一句话：** 将 `packages-user/data-system` 的 `path` 子系统 3 个声明测试文件对齐 shipped 寻路注入面——删除废弃的 `useMapState`/`DirectionMapper`、`useFaceHandler` 注入真实处理器对象、`find()/getPath()` 断言改为 `IPathfindingResult`（status+path）——并落地经用户授权的两处最小生产修复（B1 起始节点建图、B2 174 损失守卫）；聚焦 **28/28 通过**、eslint **0 报错**。

## Task 0 裁决（Q1–Q3，已 RESOLVED）

- **Q1**：默认注入 `Dir4FaceHandler`（延续旧 builder 默认 `InternalDirectionGroup.Dir4` 的意图）；显式八方向用例改用 `Dir8FaceHandler` 对象确认。
- **Q2**：`useMapState` 在 builder 与 finder 两处均删除；图宽度由 `useMapLayer(layer)` 内的 `indexer.setWidth(layer.width)` 承担；删除后不再使用的 `maps` 局部变量按 lint 处理。
- **Q3**：`performance.test.ts` 仅改注入面，性能矩阵规模参数与断言阈值逐字不变。

## 第二轮裁决（生产漂移 B1/B2/F5，已 RESOLVED）

- **B1 = (a)**：授权在 `packages-user/data-system/src/path/graph.ts` 的 `build()` 中，于 `adjacency.set(startIndex, [])` 之后补 `mapped.add(startIndex)`——重构遗漏了起始节点登记，导致单向门/死路起点下 `finder.ts:144` 的 `graph.nodes.has(startIndex)` 恒假、返回 NoPath。属 **D-10 已确认的最小生产修复**。
- **B2 = (a)**：授权在 `resolveCost` 恢复 174 守卫——以 `this.cost(block)` 求值（无损失函数时默认 1），结果为 `NaN` 或负数时 `logger.warn(174)` 并回退为 1，否则原样返回；`Infinity` 仍是合法损失。用户明确接受该（可忽略的）求值开销。
- **F5 = (a)**：越界起点用例注入通行谓词（+ 已默认注入的 `Dir4FaceHandler`），使其越过 173 早退、抵达真实越界分支并断言守卫码 **183**；缺失绑定类 173 覆盖由其邻居用例保留。

## 注入面对齐改动（F 族，3 个测试文件）

- **F1** 删除 `useMapState`：`graph.test.ts` 的 `builder.useMapState(maps)`、`system.test.ts` / `performance.test.ts` 的 `finder.useMapState(maps)` 与内联 builder 的 `useMapState` 全部删除；不再使用的 `maps` 局部变量按 lint 处理。
- **F2** 删除 `DirectionMapper`：`graph.test.ts` 的 import、`TestModules` 条目与所有 `new modules.DirectionMapper()` 使用删除；不再用其四正交组推导期望方向数。
- **F3** `useDirGroup(<数字>)` → `useFaceHandler(<处理器对象>)`：三个夹具默认注入 `new Dir4FaceHandler()`（对应旧默认意图）。
- **F4** 显式八方向用例注入 `new Dir8FaceHandler()` 对象（替代旧 `InternalDirectionGroup.Dir8` 数字）。
- **F5** 越界起点用例改走真实 183 分支并断言 183（见上，本轮完成）。
- **F6** `find()/getPath()` 形状对齐：断言由直接返回 `IPathfindingStep[]` 改为 `IPathfindingResult` 的 `status`（`Success`/`NoPath`/`InvalidInput`）与 `path`；`performance.test.ts` 的步数统计改用 `find.value.path.length`。

另随 shipped 接口对齐：`MapState` 单参构造、`map.eventLayer` 替代已删的 `getLayerByAlias`，均为既有重构后的正确形状。

## 门禁证据

- **聚焦运行**：`pnpm exec vitest run packages-user/data-system/src/path/__test__` → **Test Files 3 passed（3）；Tests 28 passed（28）**（0 failed）。
- **eslint**：`pnpm exec eslint packages-user/data-system/src/path/__test__ packages-user/data-system/src/path/graph.ts` → **0 报错**（首轮暴露的 prettier 折叠问题已在 Task 2 修净）。
- **生产改动范围**：仅 `packages-user/data-system/src/path/graph.ts` 的两处授权点（B1、B2）；`path/**` 下其余生产文件零改动。
- **skip 计数**：未新增/未删除任何 `it`，`path` 测试内无 `.skip`/`.todo`；仓库级 skipped 仍为 1（`data-base/src/hero/equipment.test.ts` 码 147）。

## 并发保护（D-08）

未触碰、未暂存、未提交任何用户并发改动（`packages-user/client-*`、`packages/system/src/ui/*`、`packages-user/client-modules/src/ui/` 等）。每个任务仅以显式路径 `git add` 声明文件；从未使用 `git add -A`/`git add .`。

## Deviations from Plan

### 1. [用户授权 · D-10] 生产修复 B1：起始节点登记进图

- **Found during:** Task 1（graph 对齐）。
- **Issue:** 计划 must_haves 明写「零生产改动」，但「单向门方向性」用例在对齐注入面后仍失败——`graph.nodes.get(0)` 为 `undefined`。根因是重构后的 `build()` 只把起始位置写入 `adjacency` 而未写入 `mapped`，节点集遍历 `mapped` 时把起始节点漏出图；对单向门/死路起点，`finder.search` 因 `!graph.nodes.has(startIndex)` 恒返回 NoPath。
- **Fix（用户裁决 B1=(a)）:** 在 `adjacency.set(startIndex, [])` 之后补 `mapped.add(startIndex);`。
- **Files modified:** `packages-user/data-system/src/path/graph.ts`
- **Committed in:** `b62b394`（Task 1）。

### 2. [用户授权 · D-10] 生产修复 B2：恢复 174 损失守卫

- **Found during:** Task 1（graph/system 对齐）。
- **Issue:** 计划 must_haves 明写「零生产改动」，但图/系统的 NaN 与负数损失用例在注入面修好后仍失败——`resolveCost` 直接返回 `this.cost(block)`，`NaN` 无告警、负数不夹取，与用例期望（告警 174 并回退 1）不符；该守卫在早期 `finder.getNodeCost` 中存在，重构时丢失。
- **Fix（用户裁决 B2=(a)）:** `resolveCost` 以 `this.cost ? this.cost(block) : 1` 求值，`Number.isNaN(cost) || cost < 0` 时 `logger.warn(174)` 并返回 1，否则返回 cost（`Infinity` 合法保留）。
- **Files modified:** `packages-user/data-system/src/path/graph.ts`
- **Committed in:** `b62b394`（Task 1）。

### 3. [用户授权] 越界起点用例断言 183（F5）

- **Found during:** Task 1（graph 对齐收尾）。
- **Issue:** 未注入谓词时 `build()` 在 `!predicate` 处提前 `warn(173)`，越界起点用例实际测的是缺失绑定而非真实越界分支。
- **Fix（用户裁决 F5=(a)）:** 用例注入 `FixturePredicate` 后 `build({ x: 3, y: 0 })`，命中 `!layer.inMap(...)` 分支并断言 **183**；173 覆盖由「缺谓词」「缺图层」两个邻居用例保留。
- **Files modified:** `packages-user/data-system/src/path/__test__/graph.test.ts`
- **Committed in:** `b62b394`（Task 1）。

### 4. [Rule 3 - Formatting] prettier 折叠修正

- **Found during:** Task 2（提交前 eslint 门禁）。
- **Issue:** 既有对齐改动留下两处 prettier 折叠违例（`{ builder }` 版应单行、`{ map, builder }` 版应多行）。
- **Fix:** 按 prettier 期望折叠，纯格式、无语义变化。
- **Files modified:** `packages-user/data-system/src/path/__test__/graph.test.ts`
- **Committed in:** `ba92f52`（Task 2）。

---

**Total deviations:** 3 用户授权（B1/B2 两处 D-10 生产修复 + F5 断言改 183） + 1 自动格式修复（prettier）。
**Impact on plan:** 生产改动严格限于 `graph.ts` 两处授权点；测试改动限于 3 个声明文件；未弱化断言、未删用例、零新增依赖。

## Issues Encountered

- 计划对 B1/B2 两处生产漂移未在 Task 0 预见，执行期由用户二次裁决授权后落地；已在 Deviations 逐条登记提交锚点。

## Known Stubs

None。

## Threat Flags

None——未引入新的网络/鉴权/文件访问/信任边界表面；`T-08-07-01..04/SC` 缓解均满足（性能参数与阈值未动、注入真实处理器对象而非数字/`as never` 伪造、未删用例或新增 skip、未提交用户并发改动、未安装任何包）。B1/B2 为图构建正确性修复，不在信任边界上新增暴露面。

## Next Phase Readiness

- `path` 子系统对齐完成（28/28），为 data-state 集成层（08-09 的 `replayPlayback` 等）复用同一注入面与 `IPathfindingResult` 契约铺路。
- 无阻塞；后续计划可继续对齐 `data-system/src` 其余 `__test__` 子系统。

---

*Phase: 08-test-refactor-alignment*
*Completed: 2026-10-05*

## Self-Check: PASSED

- FOUND: .planning/phases/08-test-refactor-alignment/08-07-SUMMARY.md
- FOUND: b62b394 (Task 1)
- FOUND: ba92f52 (Task 2)
