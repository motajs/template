---
phase: 06-unit-tests
plan: 06
subsystem: testing
tags: [vitest, map, data-base, gamemap, maplayer, dynamic-tile, mover]

requires:
  - phase: 06-unit-tests
    provides: 06-01..06-05 既有测试基建（vi.hoisted 全局 stub、logger.catch、真实计时器模式）
provides:
  - MapState 注册/原始数据校验/激活/分区/参考基准覆盖
  - GameMap 图层生命周期/别名/背景/事件层/脏标记/resize 覆盖
  - MapLayer 矩阵/静态数组/动态转换/点位事件/脏/异步门覆盖
  - MapTileBase/StaticTile/DynamicTile/LayerEventView/DynamicTileMover 单元覆盖
  - 06-COVERAGE-MAP.md 的 06-06 小节（21 个 code）
affects: [06-07, 06-09]

actuals:
  tokens: 18374
  tasks: 3
  commits: 3
plan_head_before: 6a6f717b040d71aad7ddb3970f10ad870f60448e

tech-stack:
  added: []
  patterns:
    - "同目录 inline fixture + vi.hoisted 全局 stub（沿用 06-05 静态 import 形态）"
    - "抽象基类 MapTileBase 经具体子类 StaticTile/DynamicTile 覆盖"
    - "异步移动生命周期经 IObjectMover 公开钩子观测（protected 回调为 no-op）"
    - "疑似缺陷按正确预期编写并 it.skip + 中文注释锚定 #06-06-N（D-05）"

key-files:
  created:
    - packages-user/data-base/src/map/mapState.test.ts
    - packages-user/data-base/src/map/gameMap.test.ts
    - packages-user/data-base/src/map/mapLayer.test.ts
    - packages-user/data-base/src/map/tile.test.ts
    - packages-user/data-base/src/map/staticTile.test.ts
    - packages-user/data-base/src/map/dynamicTile.test.ts
    - packages-user/data-base/src/map/mover.test.ts
  modified:
    - packages-user/data-base/src/map/eventView.test.ts

key-decisions:
  - "06-06：地图全部按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，每阶段聚焦跑绿并过 D-44 门禁后提交"
  - "06-06：transferToDynamic 越图实际发码 131（setEventLayer 专属）而 transferToStatic 发 128，按 D-05 以正确预期 it.skip 登记 #06-06-1 待用户确认；131 的正常覆盖由 gameMap.setEventLayer 越权路径承担"
  - "06-06：IMapState 并无 canPass/shouldHit（实现在 data-state/src/hero/predicate.ts），mapState.test 只覆盖谓词侧依赖的「活跃楼层 → 事件层」数据供给"
  - "06-06：计划中的 createLayerState 码 121 实为 MapState.createMap 重复注册告警，测试按真实接口覆盖"
  - "06-06：不测任何 saveState/loadState，55/122/124 归 06-09（D-32）；MapTileBase 抽象类经具体子类覆盖"

patterns-established:
  - "地图测试 fixture：TileStore(1/2) + FaceManager(Dir8) + RoleFaceBinder + DirectionMapper 组装 IDataCommon，经 MapState.fromRaw 建 2x2 小地图"
  - "越界/非法参数调用经宽松签名（LooseMapDataArgs）绕过重载类型，保留单处 as 断言"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "阶段 1（构件级）：tile/staticTile/dynamicTile/eventView 单个类单元覆盖（含码 136/143）"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/tile.test.ts"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/staticTile.test.ts"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/dynamicTile.test.ts"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/eventView.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "阶段 2（组合/流水线）：MapState 注册/校验/激活/分区 + GameMap 图层 + MapLayer 矩阵/静态数组/动态转换（含码 8/9/46/60/61/62/63/64/80/81/84/121/123/127/129/130/131）"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapState.test.ts"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/gameMap.test.ts"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLayer.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "阶段 3（完整/集成）：DynamicTileMover 异步移动生命周期（含码 126）"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mover.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "疑似缺陷 #06-06-1（transferToDynamic 越图误发 131 而非 128）经正确预期 it.skip 登记，待用户确认后修复并转回归"
    requirement: TEST-01
    verification: []
    human_judgment: true
    rationale: "这是被测实现的行为/语义判定，需用户确认属于缺陷还是有意设计；D-05 要求先记录不修复，人工签字后方可取消 skip"

duration: 24min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 06: 地图系统单元测试 Summary

**地图系统（data-base/src/map）按 构件→组合/流水线→完整/集成 三阶段补齐 8 个行为测试文件，覆盖 21 个 warn/error 码，聚焦静态图块、动态图块转换与静态数组设置**

## Performance

- **Duration:** 24 min
- **Started:** 2026-09-14T16:06:00+08:00
- **Completed:** 2026-09-14T16:30:00+08:00
- **Tasks:** 3
- **Files modified:** 8（7 新建 + 1 扩展）

## Accomplishments

- 阶段 1：`tile`/`staticTile`/`dynamicTile`/`eventView` 构件级单元 26 通过；覆盖默认事件恢复、`shouldSave`、`toDynamic`、缺 raw 告警 143、重复优先级告警 136。
- 阶段 2：`mapState`/`gameMap`/`mapLayer` 组合/流水线 63 通过 / 1 跳过；覆盖 raw 校验码 60/61/62/63/64、矩阵读写、`getMapData` 80/81、`putMapData` 8/9、`setMapRef` 123、动态转换 127/128/129/130、事件层 131、别名 84、楼层重复 121、异步开关门 46。
- 阶段 3：`DynamicTileMover` 完整异步移动 6 通过；覆盖成功/连续/斜向移动、图层索引更新、非法移动码告警 126、移动生命周期钩子顺序。
- `pnpm test:ci` 全绿：53 文件 / 505 通过 / 13 跳过（本计划新增 1 条 skip）。
- `06-COVERAGE-MAP.md` 06-06 小节写入 21 个 code；`06-TEST-FINDINGS.md` 写入 `#06-06-1`。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）** - `4cffe90` (test)
2. **阶段 2（组合/流水线）** - `b971e14` (test)
3. **阶段 3（完整/集成）** - `235eb1a` (test)

**Plan metadata:** 本次 docs 提交（SUMMARY/STATE/ROADMAP/COVERAGE-MAP/TEST-FINDINGS）

## Files Created/Modified

- `packages-user/data-base/src/map/tile.test.ts` - MapTileBase 经静态/动态图块覆盖：num/raw/set、默认事件、逐实例事件视图、pointEvent、setFaceDirection
- `packages-user/data-base/src/map/staticTile.test.ts` - StaticTile：num/raw/set/shouldSave/toDynamic 与越图 raw 为空
- `packages-user/data-base/src/map/dynamicTile.test.ts` - DynamicTile：构造/设置告警 143、setPos、getCurrentFaceDirection、toStatic/toStaticIfSafe、step、delete
- `packages-user/data-base/src/map/eventView.test.ts` - 扩展：逐优先级脏跟踪、clear 恢复、未知优先级删除、重复优先级告警 136（保留既有覆盖）
- `packages-user/data-base/src/map/mapState.test.ts` - createMap/getMap、setMapList、fromRaw 校验码 60/61/62/63/64、激活迭代、分区、compareWith
- `packages-user/data-base/src/map/gameMap.test.ts` - 图层增删/别名 84、背景、事件层 131、脏、resizeLayer、compareWith
- `packages-user/data-base/src/map/mapLayer.test.ts` - 矩阵、getMapData 80/81、putMapData 8/9、setMapRef 123、动态转换、点位事件、脏、异步门 46
- `packages-user/data-base/src/map/mover.test.ts` - DynamicTileMover 异步移动生命周期与告警 126

## Decisions Made

- 三阶段严格按 D-43 执行，每阶段聚焦跑绿并过 D-44（eslint / vue-tsc 文件级 / `pnpm test:ci`）后再提交。
- `transferToDynamic` 越图实际发码 131（`setEventLayer` 专属码）而 `transferToStatic` 发 128，按 D-05 以正确预期 `it.skip` 登记 `#06-06-1`；131 的正常覆盖由 `gameMap.setEventLayer` 越权路径承担，保证 code 全覆盖。
- `IMapState` 并无 `canPass`/`shouldHit`（实现在 `data-state/src/hero/predicate.ts`），`mapState.test.ts` 只覆盖谓词侧依赖的「活跃楼层 → 事件层」数据供给。
- 计划中的 `createLayerState` 码 121 实为 `MapState.createMap` 的重复楼层注册告警（码表文案沿用旧名），测试按真实接口覆盖。
- D-32：不测任何 `saveState`/`loadState`（55/122/124 归 06-09）。
- `MapTileBase` 为抽象类，经 `StaticTile`/`DynamicTile` 具体子类覆盖；`DynamicTileMover` 的 protected 回调为 no-op，生命周期经 `IObjectMover` 公开钩子观测。

## Deviations from Plan

None - 无生产/核心源码改动，未触发 Rule 1-3 自动修复。两处**计划措辞与实现不符**已按真实接口覆盖并记录（见 Decisions 与 `06-COVERAGE-MAP.md` 06-06 小节），非代码缺陷、不登记为 bug。

## Issues Encountered

暂无阻断性问题；三阶段顺序执行均一次跑绿并通过 D-44 门禁。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 地图系统的行为覆盖已就绪，可供 06-07（顶层集成：伤害组合 + 录像播放/二次录制）使用合成地图场景。
- 存读档集中计划 06-09 仍需覆盖 55/122/124 与全部 `saveState`/`loadState` 往返。
- `#06-06-1` 待用户确认：若判定为缺陷，修复后将 `mover`/`mapLayer` 的 `it.skip` 取消并转回归用例。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*

## Self-Check: PASSED
