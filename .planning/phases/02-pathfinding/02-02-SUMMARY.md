---
phase: 02-pathfinding
plan: 02
subsystem: pathfinding
tags: [pathfinding, dijkstra, directed-graph, mover, pass-predicate, zero-dependency, logger-codes]

# Dependency graph
requires:
  - phase: 02-pathfinding (plan 01)
    provides: 拍板记录（P1 修复 go、D-08 触发语义、4 向图）、mover.test.ts 4 用例 skip 脚手架、用户提交的 path/types.ts 接口事实源（7a011b2）
  - phase: 01-event-system
    provides: IMapLayer/MapState/TileStore 地图数据面、IPassPredicate/IPassCheckHandler 通行检测接口、Fixture 测试模式
provides:
  - 修复后的 mover.ts 坐标回写（`||` 语义）+ 4/4 绿色 L0 回归，多步逐步移动自此坐标正确
  - path/types.ts 用户授权的 moveTo/teleportTo 返回类型修正（`IPathfindingController | null`）
  - L2 寻路纯计算核心：PathfindingGraphBuilder（有向图构建，注入 IPassPredicate + useDirGroup，Dir4 默认，终端节点分类，warn 173 边界守卫）
  - PathfindingSystem + PathfindingFinder：自写 Dijkstra 最小损失搜索（默认每格损失 1，可注入 PathCostFunction，warn 174 损失守卫）、find/getPath 步骤序列、moveTo/teleportTo 控制器包装、PathFallbackPolicy 回退决策（null 默认逐步）、interrupt 占位
  - logger.json 新码：warn 173（寻路输入非法）、warn 174（损失值非法）
affects: [02-03, phase-04-rendering]

# Actuals (#2632)
actuals:
  tokens: 13900        # chars/4 over realized diff（本计划 10 个文件，+1569/-8 行 + 类规则补丁）
  tasks: 3
  commits: 5           # MEASURED: git rev-list --count 9efadc9(plan_head_before)..HEAD；含 1 个用户穿插提交 0e6536f（dev.md 类规则），本计划自身 4 个

# Tech tracking
tech-stack:
  added: []            # 零新依赖（Dijkstra 自写 ~60 行，T-02-SC）
  patterns:
    - "L2 禁 import L3：通行性判定经 usePassPredicate 注入，谓词语义单一事实源由 02-03 重构后提供"
    - "useDirGroup 经 IDirectionMapper.map(group) 解析邻域增量，增量→FaceDirection 单一映射函数"
    - "每次寻路动态构建有向图、不缓存（数据端状态可变）"
    - "logger 数字码集中登记（warn 173/174），非法输入告警 + 空结果守卫"

key-files:
  created:
    - packages-user/data-system/src/path/graph.ts
    - packages-user/data-system/src/path/graph.test.ts
    - packages-user/data-system/src/path/system.ts
    - packages-user/data-system/src/path/system.test.ts
    - packages-user/data-system/src/path/index.ts
  modified:
    - packages-user/data-common/src/common/mover.ts
    - packages-user/data-common/src/common/mover.test.ts
    - packages-user/data-system/src/path/types.ts
    - packages-user/data-system/src/index.ts
    - packages/common/src/logger.json

key-decisions:
  - "floorId 解析经 maps.iterateAllMaps() 引用匹配（fromRaw 楼层默认 active=false，仅迭代激活楼层会使 02-03 的真实谓词拿不到 floorId）"
  - "L2 取得移动器用结构化守卫 hasMover（'mover' in movable + IMovableWithMover 类型守卫），零 as 断言；IDynamicTile 等真实移动对象天然满足"
  - "终端节点（canPass 且 shouldHit）在搜索层执行约束：可作路径终点、永不被扩展为中间节点；D-08 情形 1 相邻格可达性由 02-03 直接 find() 判定"
  - "moveTo 恒为逐步（D-09 语义），回退策略仅作用于 teleportTo；策略 null 时默认必定逐步"
  - "interrupt() 为计划声明的占位实现（停止进行中移动），接管时序由 02-03 Task 4 落地"

patterns-established:
  - "有向边判定由注入谓词完成，graph.ts 不含任何掩码语义（谓词为单一事实源）"
  - "守卫形态：isNil/inMap → logger.warn(新码) → 返回空结果，不抛异常（照 mapDamage.ts 守卫）"

requirements-completed: []  # PATH-01/PATH-02 为 02-02/02-03 共享声明，shared-ID 门（#2388）下 0/2 ready——待 02-03 SUMMARY 完成后标记

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: mover.ts:651 坐标回写条件按拍板修复为 ||，x 正交/y 正交/斜向/传送 4 个回归用例全部翻绿
    requirement: PATH-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/common/mover.test.ts#object mover position writeback (pnpm exec vitest run — 4 passed, 0 skipped)"
        status: pass
      - kind: other
        ref: "git diff 断言：mover.ts 仅含 651 行条件一处变更"
        status: pass
    human_judgment: false
  - id: D2
    description: path/types.ts 用户授权的 moveTo/teleportTo 返回类型修正（追加 | null），除此之外零改动
    requirement: PATH-01
    verification:
      - kind: other
        ref: "git diff packages-user/data-system/src/path/types.ts 仅含两处返回类型行"
        status: pass
    human_judgment: false
  - id: D3
    description: 有向图构建：useDirGroup 经 IDirectionMapper 解析邻域（默认 Dir4 四正交）、注入 IPassPredicate 判边、单向门方向性、shouldHit 终端节点分类、未绑定图层 warn 173 空图守卫
    requirement: PATH-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/path/graph.test.ts#pathfinding graph building (6 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: 最小损失搜索：默认每格损失 1 的最短步骤序列、自定义损失改变选路、损失守卫（非有限/负数 warn 174 按默认 1）、不可达返回空数组
    requirement: PATH-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/path/system.test.ts#pathfinding system (12 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: 仅取路径 getPath（不移动）、moveTo/teleportTo 控制器包装契约（无路径/未绑定/移动中返回 null）、PathFallbackPolicy 回退决策（null 默认逐步、策略收步骤序列并生效）
    requirement: PATH-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/path/system.test.ts#pathfinding system (12 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: L2 不引用 L3（graph/system 无 data-state 引用）且 path 相关零循环依赖；签名与用户 types.ts 逐字一致（类型门 0 诊断）
    requirement: PATH-01
    verification:
      - kind: other
        ref: "grep data-state on path/*.ts = 无命中；pnpm check:type 过滤 src[\\/]path[\\/] = 无输出；pnpm check:circular path = 0"
        status: pass
    human_judgment: false
  - id: D7
    description: 移动方式决策与逐步执行在真实 mover 链路上的端到端体感（逐步触发途经事件、瞬移跳过副作用）——L2 仅产出正确的控制器包装与决策结果，事件链路实感属 02-03 L3 接线验收范围
    verification: []
    human_judgment: true
    rationale: L2 测试用 TestMover 桩验证步骤翻译与回写；真实 HeroMover + DefaultHeroMoveTopImpl 事件派发体感需 02-03 接线后在 Node 回放/人工确认

# Metrics
duration: 29min
completed: 2026-09-09
status: complete
---

# Phase 02 Plan 02: L0 修复与 L2 寻路核心 Summary

**mover.ts:651 坐标回写缺陷按拍板修复（4/4 回归翻绿），L2 落地注入式寻路核心：有向图构建 + 自写 Dijkstra 最小损失搜索 + getPath/moveTo/teleportTo 控制器契约与回退策略，Node 下 22 测试全绿**

## Performance

- **Duration:** 29 min
- **Started:** 2026-09-09T17:07:30+08:00
- **Completed:** 2026-09-09T17:36+08:00
- **Tasks:** 3（Task 1 tracer / Task 2 / Task 3）+ 1 个中途规则合规补丁
- **Files modified:** 10（不含用户穿插提交的 dev.md）

## Accomplishments

- **Task 1（tracer）**：mover.ts:651 回写条件按拍板 `&&`→`||`，4 个 skip 回归用例（x 正交/y 正交/斜向/传送）全部翻绿——多步逐步移动自此能以真实坐标计算后续步骤（RESEARCH P1 收口）
- **Task 2**：path/types.ts 落地用户逐字授权的 moveTo/teleportTo 返回类型修正（仅两处 `| null`，diff 断言通过）；新建 graph.ts 有向图构建器——邻域经 `useDirGroup` + `IDirectionMapper.map(group)`（默认 `InternalDirectionGroup.Dir4`）、边可行性由注入 `IPassPredicate.canPass` 判定（单向门由谓词不对称产生）、`shouldHit` 真图块分类为仅可作终点的终端节点、`inMap`+`isNil` 守卫 + warn 173；graph.test.ts 6 用例绿（单向门 A→B 可行 B→A 不可行、Dir8 组 8 邻域、终端分类、空图守卫）
- **Task 3**：system.ts 落地 `PathfindingSystem`/`PathfindingFinder`（骨架照 GameEventSystem/useXxx 注入惯例）——自写 O(V²) Dijkstra（默认每格损失 1、`PathCostFunction` 可注入、损失守卫 warn 174）、`find`/`getPath` 返回 `IPathfindingStep[]`（dir/from/to）且不移动任何对象、不可达返回空数组、moveTo/teleportTo 经结构化 `hasMover` 守卫取 `IMoverController` 构成 `IPathfindingController { controller, path }`（无路径/未绑定/移动中返回 null）、`PathFallbackPolicy` 回退决策（null 默认必定逐步、策略以步骤序列为入参）、interrupt 占位；index.ts barrel + data-system barrel 追加；system.test.ts 12 用例绿
- **logger.json**：登记本阶段新码 warn 173（寻路输入非法/绑定缺失）、warn 174（损失值非有限或负数）

## Task Commits

Each task was committed atomically:

1. **Task 1: 按拍板结果修复 L0 坐标回写缺陷并翻绿回归测试** - `e1f6101` (fix)
2. **Task 2: 授权的 types.ts 返回类型修正 + 有向图构建** - `0cd6ab6` (feat)
3. **Task 3: 最小损失搜索 + 仅取路径 + 回退策略槽位** - `53d019f` (feat)
4. **补丁: 用户新增类规则合规（IPathfindingGraphBuilder 接口声明 + implements）** - `e199d99` (refactor)

**Plan metadata:** (本提交 — docs(02-02): complete)

_注：期间用户穿插提交 `0e6536f`（docs: 更新类相关规则），非本计划产出；已按新规则补齐合规补丁。_

## Files Created/Modified

- `packages-user/data-common/src/common/mover.ts` - 651 行回写条件 `&&`→`||`（唯一改动行）
- `packages-user/data-common/src/common/mover.test.ts` - 4 个 it.skip → it 翻绿
- `packages-user/data-system/src/path/types.ts` - 用户授权的 moveTo/teleportTo 返回类型修正（唯一允许改动）
- `packages-user/data-system/src/path/graph.ts` - IPathGraph/IPathGraphNode/IPathGraphEdge + IPathfindingGraphBuilder + PathfindingGraphBuilder（方向增量→FaceDirection 映射、floorId 引用解析、终端分类、守卫）
- `packages-user/data-system/src/path/graph.test.ts` - 6 用例：无谓词无边、Dir4 四邻域、Dir8 八邻域、单向门方向性、终端节点分类、空图守卫
- `packages-user/data-system/src/path/system.ts` - PathfindingFinder（Dijkstra + 损失守卫）+ PathfindingSystem（getPath/moveTo/teleportTo/回退决策/interrupt）
- `packages-user/data-system/src/path/system.test.ts` - 12 用例覆盖默认/自定义损失、守卫、不可达、终端约束、控制器契约、回退策略、打断
- `packages-user/data-system/src/path/index.ts` - path barrel
- `packages-user/data-system/src/index.ts` - 追加 `export * from './path'`
- `packages/common/src/logger.json` - warn 173 / warn 174 登记

## Decisions Made

- **floorId 解析**：`maps.iterateAllMaps()` 引用匹配而非 iterateActiveMaps——`fromRaw` 楼层默认 `active=false`，否则 02-03 注入的真实谓词（moverImpl 语义要求非空 floorId）拿不到楼层 id
- **移动器获取**：`IObjectMovable` 接口不含 mover 成员，L2 用结构化类型守卫 `'mover' in movable`（`IMovableWithMover`）零 `as` 取得 `IObjectMover`；`mover.start()` 返回 null 即「已有移动进行中」契约的自然检测点
- **终端节点约束落点**：图记录全部 canPass 边 + terminal 标记，约束在搜索层执行（终端可作终点、永不被扩展）；D-08 情形 1（no-pass 目标的相邻格）由 02-03 直接 `find(heroPos, 相邻格)` 判定，L2 无专用查询 API（per 计划）
- **moveTo 恒逐步、策略仅作用于 teleportTo**：与用户 types.ts jsdoc 逐字对齐（moveTo「逐步寻路，触发途经事件」；teleportTo「瞬移前经回退策略判定」）
- **每次寻路动态建图不缓存**（CONTEXT 酌情项默认建议，数据端状态可变）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 用户新增类规则（dev.md）中途生效，补齐接口声明合规**
- **Found during:** Task 3 提交后收口阶段（用户穿插提交 `0e6536f`）
- **Issue:** dev.md 新增「所有的类必须先进行 `interface` 声明，之后由类 `implements` 之实现」；`PathfindingGraphBuilder` 与测试 `TestMover` 此前无 implements
- **Fix:** 新增导出接口 `IPathfindingGraphBuilder`（持有原类 API jsdoc），类改为 `implements IPathfindingGraphBuilder`；TestMover 补 `implements IObjectMover<TestTile>`；全测试重跑 18/18 绿
- **Files modified:** packages-user/data-system/src/path/graph.ts, packages-user/data-system/src/path/system.test.ts
- **Verification:** `pnpm exec vitest run "packages-user/data-system/src/path"` 18 passed；check:type path 过滤 0 诊断
- **Committed in:** e199d99 (refactor(02-02))

---

**Total deviations:** 1 auto-fixed（1 blocking rule compliance）。
**Impact on plan:** 合规补丁为纯接口声明抽取，零行为变更；不影响验收面。

## Issues Encountered

- 计划 `<verification>` 的 `check:type` 过滤式类型门写为 `src[\\/]path[\\/]|mover\.ts`，其中 `mover\.ts` 会命中**既有**诊断：`packages-user/data-base/src/hero/mover.ts:183/185`（TS2339，`IHeroMoveTopImpl` 被用户 7a011b2 重构为 `predicate()` 形态后消费方未同步）——属 02-03 Task 1 谓词重构的收口范围，按范围边界规则不修，已记录于 `deferred-items.md`。本计划实际改动文件的类型诊断为 0（`src[\\/]path[\\/]` 过滤无输出；data-common mover.ts 无诊断）。
- PowerShell `Set-Content` 曾损坏 mover.test.ts 的 UTF-8 中文注释（Task 1 中途发现），立即 `git checkout` 恢复并改用 Edit 工具重做；最终 diff 干净。

## Known Stubs

| 文件 | 位置 | 原因 |
| ---- | ---- | ---- |
| `packages-user/data-system/src/path/system.ts` | `interrupt()` | 计划声明的占位实现（停止进行中移动）；接管时序（stop 后 await 兑现，选项 1）由 02-03 Task 4 落地，已登记 broken-windows 台账 #5 |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 02-03（L3 hero 接线）可开工：谓词注入槽位（`usePassPredicate`）、回退策略槽位（`useFallbackPolicy`）、绑定槽位（`useMapState`/`useMapLayer`/`useMovable`）与 `useDirGroup` 全部就绪；02-03 Task 1 将 moverImpl 重构为 `predicate()` 后经 `usePassPredicate` 注入即实现图边判定与逐步移动判定单一事实源
- 02-03 需顺带收口 `data-base/src/hero/mover.ts` 对旧 `canPass/shouldHit` 直调的既有类型诊断（见 deferred-items.md），并落地 D-08 情形 1（相邻格 + 面朝目标 + OnTouch 直派）与 interrupt 接管时序
- PATH-01/PATH-02 按 shared-ID 门延迟标记，待 02-03 SUMMARY 完成后由其触发 `requirements.mark-complete`

---
*Phase: 02-pathfinding*
*Completed: 2026-09-09*

## Self-Check: PASSED

- SUMMARY.md 与全部 10 个计划内文件均在盘；Task 1/2/3 与合规补丁提交（`e1f6101`、`0cd6ab6`、`53d019f`、`e199d99`）均在 git log 中确认
- 验证命令复跑：mover.test.ts 4/4 + path 目录 18/18 全绿；`check:type` 过滤 `src[\\/]path[\\/]` 无输出；`check:circular` 无 path 相关路径（既有基线循环不变）
- requirements.ready-ids：0/2 ready（PATH-01/PATH-02 与 02-03 共享，shared-ID 门生效），frontmatter `requirements-completed: []`
- broken-windows 台账：02-01 的 skipped-test #4 标记 fixed；新增 #5（interrupt 占位 stub, open）
