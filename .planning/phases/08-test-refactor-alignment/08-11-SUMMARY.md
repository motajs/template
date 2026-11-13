---
phase: 08-test-refactor-alignment
plan: 11
subsystem: testing
tags:
    [
        phase-closure,
        test-refactor,
        __test__,
        interface-alignment,
        vitest,
        eslint,
        d10-production-ledger,
        coverage-matrix,
        skip-147
    ]
status: complete
requires:
    - phase: 08-test-refactor-alignment/08-01
      provides: 全量测试迁入 `__test__/`（迁移后 test:ci 66 文件基线）
    - phase: 08-test-refactor-alignment/08-02..08-09
      provides: 逐子系统接口对齐（data-common / data-base / data-system / data-state）
    - phase: 08-test-refactor-alignment/08-10
      provides: 21 缺口码覆盖 + loader.test.ts + 基线测试侧对齐
provides:
    - "Phase 08 收口：`pnpm test:ci` 65 文件 / 727 passed / 1 skipped / 0 failed；`pnpm test:perf` 6 文件 / 54 passed / 0 failed"
    - "唯一 skip = `data-base/src/hero/__test__/equipment.test.ts:353` 码 147（D-04 不可达）"
    - "四包 src eslint 0 errors（6 条既有 no-console 告警，非阻塞；含生产 replay/func.ts）"
    - "08-01 四源覆盖审计逐项 COVERED 复核"
    - "21 缺口码覆盖矩阵 + 7 陈旧登记码处置 + 10 文件生产改动台账（D-10 例外）+ 未决/后续清单"
affects:
    - Phase 08 验收（TEST-02）
    - 后续渲染端适配（REND-01/02）与 legacy 阶段
tech-stack:
    added: []
    patterns:
        - "收口以当日重测为准（D-04），不沿用历史数字；65 = 66 − 2 退役 + 1 新增"
        - "生产改动一律逐条登记为 D-10 用户授权例外，收口不得宣称零生产改动"
        - "不可达码处置：记录不可达 + 说明公开 API 不可触发理由，不写 it.skip"
key-files:
    created:
        - .planning/phases/08-test-refactor-alignment/08-11-SUMMARY.md
    modified:
        - packages-user/data-base/src/enemy/__test__/manager.test.ts
        - packages-user/data-base/src/enemy/__test__/saveLoad.test.ts
        - packages-user/data-base/src/hero/__test__/follower.test.ts
        - packages-user/data-base/src/hero/__test__/location.test.ts
key-decisions:
    - "Q1：验收口径更正为正确现代值——test:ci = 65 文件（数据 64 + script 1）/ 727 passed / 1 skipped / 0 failed；test:perf = 6 文件 / 54 passed / 0 failed；65 = 66 − 2 退役（data-common/common/utils.test.ts、data-state/test/tileLegacy.test.ts）+ 1 新增（data-state/src/loader/__test__/loader.test.ts）"
    - "Q2=(a)：授权对 4 个测试文件做纯格式修复（eslint --fix），不改断言、不删 it、不加 skip、不碰生产；以 style(08-11) 提交；生产 replay/func.ts 与 perf no-console 警告保留不动"
    - "Q3：SUMMARY 必须含 10 文件生产改动台账与未决/后续清单；收口的「生产改动终审」须逐条对账这 10 项，不得宣称零生产改动"
    - "10 文件 D-10 例外：replay/sandbox.ts、enemy/types.ts、hero/location.ts、hero/equipment.ts、map/{eventView,mapLayer,tile,types}.ts、path/graph.ts、replay/commands.ts"
patterns-established:
    - "Phase closure ledger：全绿证据 + 四源覆盖复核 + 逐子系统对齐 + 缺口码矩阵 + 生产改动台账 + 未决清单"
requirements-completed: [TEST-02]
coverage:
    - id: D1
      description: "`pnpm test:ci` 全绿：65 文件 / 727 passed / 1 skipped / 0 failed"
      requirement: TEST-02
      verification:
          - kind: integration
            ref: "pnpm test:ci — Test Files 65 passed (65); Tests 727 passed | 1 skipped (728)"
            status: pass
      human_judgment: false
    - id: D2
      description: "`pnpm test:perf` 全绿：6 文件 / 54 passed / 0 failed"
      requirement: TEST-02
      verification:
          - kind: integration
            ref: "pnpm test:perf — Test Files 6 passed (6); Tests 54 passed (54)"
            status: pass
      human_judgment: false
    - id: D3
      description: "四包 src eslint 0 errors；4 个测试文件纯格式修复（tokens 等价）"
      requirement: TEST-02
      verification:
          - kind: lint
            ref: "pnpm exec eslint packages-user/data-{common,base,system,state}/src — 6 problems (0 errors, 6 warnings)"
            status: pass
      human_judgment: false
    - id: D4
      description: "阶段 SUMMARY 齐备：四源覆盖、逐子系统对齐、21 缺口码矩阵、7 陈旧码、10 生产文件台账、未决清单"
      verification: []
      human_judgment: true
      rationale: "文档完整性与 10 项生产改动（D-10 例外）的最终裁定需人工复核"
actuals:
    tokens: 8535
    tasks: 2
    commits: 2
    plan_head_before: 41f743debc9eb38d92bbd21ab949d1c3479c022b
duration: 全绿门禁 + 纯格式修复 + 收口摘要（本次会话）
completed: 2026-10-08
---

# Phase 8 Plan 11: 测试重构与接口对齐收口 Summary

**Phase 8 收口：当日重测 `pnpm test:ci` = 65 文件 / 727 passed / 1 skipped / 0 failed、`pnpm test:perf` = 6 文件 / 54 passed / 0 failed，唯一 skip 为码 147（D-04）；对 4 个测试文件做纯格式修复后四包 eslint 0 errors；产出含四源覆盖复核、逐子系统对齐、21 缺口码矩阵、7 陈旧码处置、10 文件生产改动台账与未决清单的阶段摘要，达成 TEST-02。**

## Performance

- **Duration:** 本次会话（全绿门禁 + 纯格式修复 + 收口摘要）
- **Started:** 2026-10-08T16:23:30 +08:00（本地）
- **Completed:** 2026-10-08
- **Tasks:** 2（Task 0 收口裁决关卡由用户 RESOLVED，不计入实现任务）
- **Files modified:** 4（纯格式；+ SUMMARY/STATE/ROADMAP 元数据）

## Task 0 收口裁决（用户，已 RESOLVED）

Task 0（`checkpoint:decision`，`gate=blocking-human`）为只读汇报关卡，用户已回复「可以执行」并给出三条裁决，本计划据此执行，不再重复汇报：

- **Q1（验收口径更正）**：`test:ci` = **65 文件**（数据 64 + 脚本 `script/check-data-circular.test.ts` 1）/ **727 passed / 1 skipped / 0 failed**；`test:perf` = **6 文件 / 54 passed / 0 failed**；eslint/prettier 通过。计划原文的 66 文件口径作废，改为当日实测的现代值 65。
    - 守恒等式：**65 = 66 − 2 退役 + 1 新增**。
        - 退役 2：`data-common/src/common/__test__/utils.test.ts`（08-02，被测源码整体删除）、`data-state/__test__/tileLegacy.test.ts`（08-09，被测 `data-state/src/legacy/tile` 整体删除）。
        - 新增 1：`data-state/src/loader/__test__/loader.test.ts`（08-10，覆盖码 66/67/69 与 `MotaDataLoader` 公开面）。
- **Q2 = (a)**：授权对 **恰好 4 个** 测试文件做纯格式修复（`eslint --fix`）：`enemy/__test__/manager.test.ts`、`enemy/__test__/saveLoad.test.ts`、`hero/__test__/follower.test.ts`、`hero/__test__/location.test.ts`。仅格式，不改断言/语义、不删 `it`、不加 skip、不碰生产；以 `style(08-11)` 提交。生产 `data-common/src/replay/func.ts` 与 perf no-console 警告保留不动。
- **Q3**：SUMMARY 必须包含未决/后续清单（见文末「未决/后续清单」）与 10 文件生产改动台账。

## 全绿证据（当日重测，D-04）

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| CI 单测 | `pnpm test:ci` | **Test Files 65 passed (65)；Tests 727 passed \| 1 skipped (728)；0 failed** |
| 性能单测 | `pnpm test:perf` | **Test Files 6 passed (6)；Tests 54 passed (54)；0 failed** |
| 跳过计数 | 全仓库 `.test.ts`/`.perf.ts` 扫描 | **恰为 1**，定位 `data-base/src/hero/__test__/equipment.test.ts:353` 码 147（不可达，D-04） |
| eslint（四包 src） | `pnpm exec eslint packages-user/data-{common,base,system,state}/src` | **6 problems (0 errors, 6 warnings)** |
| 格式修复等价性 | 4 文件 HEAD vs 工作区去空白比较 | **tokens 完全一致**（纯空白/折行变化） |

> 说明：Formatting fix 提交后再次全量运行门禁，二者分别为 65/727/1/0 与 6/54/0，与修复前一致，证明纯格式改动未改变测试行为。

### 唯一跳过项（码 147）

- 文件：`packages-user/data-base/src/hero/__test__/equipment.test.ts`，行 353：`it.skip('warns code 147 when no equipment slot is available', ...)`。
- 该用例表示「无可用装备槽位」的不可达错误码，按 D-04 保留 `it.skip`；全阶段未新增任何 skip。

## 文件数守恒（66 → 65 的可解释性）

| 阶段 | test:ci 文件数 | 说明 |
| --- | --- | --- |
| 08-01 迁移后（基线） | 66 | 数据端 65 + `script/check-data-circular.test.ts` 1 |
| 08-02 | −1 | 退役 `data-common/src/common/__test__/utils.test.ts`（被测源码已删） |
| 08-09 | −1 | 退役 `data-state/__test__/tileLegacy.test.ts`（被测 `src/legacy/tile` 已删） |
| 08-10 | +1 | 新建 `data-state/src/loader/__test__/loader.test.ts` |
| **08-11 收口实测** | **65** | 66 − 2 + 1 = 65；test:perf 恒为 6 |

## Source Coverage Audit 复核（08-01 四源对照，逐项）

| 来源 | 项 | 归属计划 | 复核结果 |
| --- | --- | --- | --- |
| GOAL | 迁移全部单测到 `__test__/` | 08-01 | **COVERED** — 71 测试 + 3 随迁文件落位；`script/test-data-node.ts:67,122` 路径同步 |
| GOAL | 按 shipped 接口重对齐、修复重构遗漏失效 | 08-02..08-09 | **COVERED** — 逐子系统对齐，见下表；生产遗漏修复登记 D-10 |
| GOAL | 以 `logger.json` 补齐错误码与公共接口覆盖 | 08-10 | **COVERED** — 21 缺口码逐条处置 + `loader.test.ts` 覆盖公共面 |
| GOAL | `test:ci` + `test:perf` 全绿（保留码 147 skip） | 08-11 | **COVERED** — 65/727/1/0 与 6/54/0；唯一 skip = 147 |
| REQ | TEST-02 | 08-01..08-11 全部 | **COVERED** — 已标记 Complete |
| RESEARCH | 迁移配置零改动 | 08-01 | **COVERED** — 未改任何配置文件 |
| RESEARCH | 逐子系统接口 delta（8.1..8.11） | 08-02..08-09 | **COVERED** — 见下表 |
| RESEARCH | 21 个缺口错误码（9.1） | 08-10 | **COVERED** — 14 新增断言 / 5 既有登记 / 2 不可达 |
| RESEARCH | 7 个陈旧登记码（9.2） | 08-05 / 08-10 | **COVERED** — 62/63/64/84/130/158/175（+ 表外 125） |
| RESEARCH | 公共接口覆盖表（10.x） | 08-10 | **COVERED** — loader 公共面 + 各子系统既有公共面 |
| CONTEXT | D-01..D-10 全部锁定决策 | 各计划 Task 0 / 约束 | **COVERED** — 见各 08-*-SUMMARY 的 Task 0 裁决 |
| CONTEXT | Deferred：`script/check-data-circular.test.ts`、渲染端/legacy、全仓 `check:type` | 不纳入 | **排除（非缺口）** — 与规划一致 |

> 复核结论：四源（GOAL/REQ/RESEARCH/CONTEXT）无遗漏项，全部 COVERED 或按设计显式排除。

## 逐子系统对齐结果（08-02 .. 08-09）

| 计划 | 子系统 | 对齐要点（shipped 形状） | 聚焦门禁 | 生产改动 |
| --- | --- | --- | --- | --- |
| 08-02 | data-common（common/store/replay） | `utils.test.ts` 退役；`DirectionMapper` 注入删除；`addHook().load()` 移除；`getFaceDirection` 未知→`Unknown`；短字符串码基址 `9→32`；sandbox 失败码 `158/175→72` | 11 files / 147 passed | `replay/sandbox.ts`（首步预读，D-10） |
| 08-03 | data-base enemy + flag | 真实 `TileStore` + 注册图块；删假 legacy bridge；`getPrefabBy*`→`getPrefab`、`reusePrefab` 2 参、`addPrefab` 仅 code 去重；flag 读档「重建字段」语义 | 6 files / 60 passed | `enemy/types.ts`（`getPrefab` 签名 `number\|string`，D-10） |
| 08-04 | data-base hero | 录像桩 `route`→`array`；删 `.load()`；`ItemStore(tileStore)`；`getItem`→`addItem`；`equip.value` Map→Record；`setFloor(IGameMap\|null)`；`BaseHeroModifier` 自 `../modifier` | 11 files / 114 passed + 1 skipped | `hero/location.ts`、`hero/equipment.ts`（D-10） |
| 08-05 | data-base map | `addLayer(alias)`；`MapState(state)` 单参；删 `getLayerByAlias`/`setDynamicDirection`；陈旧码 62/63/64/84/130/125 裁定；`transferToDynamic(keepEvent=false)` 保留默认事件 | 11 files / 108 passed | `map/{eventView,mapLayer,tile,types}.ts`（D-10） |
| 08-06 | data-system combat + event | `CombatFlow`/`EnemyContext` 单参构造；删 `.load()`；`DirectionMapper` 删除；事件层改 `GameMap.eventLayer`；DEV 守卫码 98/99/101 经授权不触发 | 5 files / 96 passed（+ perf 2 files / 6 passed） | 无（0） |
| 08-07 | data-system path | 删 `useMapState`；`useDirGroup`→`useFaceHandler(真实处理器)`；`find()/getPath()`→`IPathfindingResult`（status+path）；越界起点断言 183 | 3 files / 28 passed | `path/graph.ts`（B1 起始节点建图 + B2 174 守卫，D-10） |
| 08-08 | data-state src 直属 | 统一 `CoreState({loadStarter:new WebLoadStarter(),coreURL:'placeholder'})`；`coreEventLayer.test.ts` 重定向 `MapState.fromRaw`；`commands.test.ts` 期望→`ReplayCommandResult` | 9 files / 98 passed | `replay/commands.ts`（用户已修复 + 授权注释，D-10） |
| 08-09 | data-state 集成层 `__test__` | `closed-loop` 夹具 `setFloor(真实 IGameMap)`、删 `.load()`；finder 注入面对齐；录像结果 `ReplayCommandResult`+`Active`；沙箱自然预读；`equip.value`→Record；同引用契约→值/uid；`tileLegacy.test.ts` 退役 | 7 files / 54 passed（`__test__`+`src` 合并 16 files / 152 passed；perf 3 files / 45 passed） | 无（0） |

> 对齐范围内：4 个计划（08-02/03/04/05/07/08 中除 08-06/08-09）含生产改动，全部经用户逐条确认并登记为 D-10 例外（详见「生产改动终审」）。08-06/08-09 为零生产改动。

## 21 缺口码覆盖矩阵（08-10，§9.1）

| code | emit 模块 | 测试文件 / 用例 | 处置 |
| --- | --- | --- | --- |
| 73 | `replay/sandbox.ts:84,93` | `sandbox.test.ts` `errors code 73…` | 新增断言 |
| 194 | `replay/sandbox.ts:187` | `sandbox.test.ts` `warns code 194…` | 新增断言 |
| 133 | `store/tileStore.ts:35` | `tileStore.test.ts` `warns code 133 and 134…` | 新增断言 |
| 134 | `store/tileStore.ts:39` | 同上 | 新增断言 |
| 181 | `store/itemStore.ts:13`、`enemyStore.ts:13` | `tileStore.test.ts`（`ItemStore and EnemyStore duplicate registration`） | 新增断言 |
| 192 | `map/mover.ts:47` | `mover.test.ts` `warns code 192…` | 新增断言 |
| 193 | `hero/items.ts:144` | `items.test.ts` `warns code 193…` | 新增断言 |
| 171 | `event/executor.ts:66,73` | `eventDispatch.test.ts` `warns code 171…` | 新增断言 |
| 172 | `event/executor.ts:39,46` | `eventDispatch.test.ts` `warns code 172…` | 新增断言 |
| 182 | `path/finder.ts:110` | `system.test.ts` `warns code 182…` | 新增断言 |
| 66 | `loader/jsoncProcessor.ts:16` | `loader.test.ts` `warns code 66…` | 新增断言 |
| 67 | `loader/jsoncProcessor.ts:25` | `loader.test.ts` `warns code 67…` | 新增断言 |
| 69 | `loader/hook.ts:9` | `loader.test.ts` `warns code 69…` | 新增断言 |
| 1001 | `event/map.ts:26` | `event/__test__/event.test.ts` `warns code 1001…` | 新增断言 |
| 72 | `replay/sandbox.ts:136` | `sandbox.test.ts` 既有 `errors code 72…` | 仅登记（既有覆盖） |
| 170 | `store/eventStore.ts:16` | `eventStore.test.ts` 既有 | 仅登记（既有覆盖） |
| 173 | `path/graph.ts:70,74,78`、`system.ts:40` | `graph.test.ts` / `system.test.ts` 既有 | 仅登记（既有覆盖） |
| 179 | `replay/array.ts:448,500,544` | `array.test.ts` 既有越界用例 | 仅登记（既有覆盖） |
| 183 | `path/graph.ts:82` | `graph.test.ts` 既有越界起点（F5，08-07） | 仅登记（既有覆盖） |
| 70 | `replay/array.ts:405,728` | 无 | **不可达**（公开 `add` 先以 148 拦截；不写 `it.skip`） |
| 68 | `loader/loader.ts:121` | 无 | **不可达**（`extraConfigs` 为 Map 键去重 + `loading/dataLoaded` 自始未赋值 → 守卫为死代码；不写 `it.skip`） |

**计数核对：** 21 = 14 新增断言 + 5 仅登记 + 2 不可达。

## §9.2 陈旧登记码处置（契约变更，不补测）

| code | 覆盖表登记 | 当前源码 | 处置 |
| --- | --- | --- | --- |
| 62 | `mapState` raw key 非数字 | `mapState.ts` 无 62 调用点（现发 60/61/121/55/122） | 契约变更（08-05 Q1=A），仅登记 |
| 63 | `mapState` 容器缺失 | 同上 | 契约变更，仅登记 |
| 64 | `mapState` 非法值/类型 | 同上 | 契约变更，仅登记 |
| 84 | `gameMap` 重复别名 | 无 84；别名改由 `addLayer(alias)` 承担 | 契约变更，仅登记 |
| 130 | `mapLayer` 非本层图块 | 无 130 | 契约变更，仅登记 |
| 158 | `sandbox` 执行失败 | 无 158；统一改发 `error(72)`（08-02） | 契约码迁移 158→72，仅登记 |
| 175 | `sandbox` notExecuted 失败 | 无 175；同上 | 契约码迁移 175→72，仅登记 |
| 125 | 表外提及（排序楼层集不一致） | `mapState.ts` 无 125 调用点 | 契约变更，仅登记（08-05 无操作） |

> §9.2 规范陈旧集为 7 项（62/63/64/84/130/158/175）；125 为表外补充提及。**不补测、不用生产改动复活任何陈旧码。**

## `it.skip` / 用例增删 / 期望值改写台账（全阶段）

### `it.skip` 账

- **新增 skip：0。** 全阶段未新增任何 `it.skip`/`it.todo`。
- **删除 skip：0。**
- **保留 skip：1** — `data-base/src/hero/__test__/equipment.test.ts:353` 码 147（D-04 不可达）。收口实测全仓库 skipped 恰为 1，与 D-04 一致。

### 测试文件增删

| 动作 | 文件 | 计划 | 依据 |
| --- | --- | --- | --- |
| 退役删除 | `data-common/src/common/__test__/utils.test.ts` | 08-02 | 被测 `getFaceMovement`/`degradeFace` 等已从源码整体删除 |
| 退役删除 | `data-state/__test__/tileLegacy.test.ts` | 08-09 | 被测 `data-state/src/legacy/tile` 已整体删除（Q1 STRICT） |
| 新建 | `data-state/src/loader/__test__/loader.test.ts` | 08-10 | 覆盖码 66/67/69 与 `MotaDataLoader` 公开面（Q3 批准） |

### 期望值/契约改写（代表性条目）

| 计划 | 文件 | 旧 → 新 |
| --- | --- | --- |
| 08-02 | `face.test.ts` | 未知图块 `toBeUndefined()` → `toBe(FaceDirection.Unknown)` |
| 08-02 | `replay/array.test.ts` | 短字符串基址 `9→32`：`'hi'` `11→34`、空串 `9→32` |
| 08-02 | `replay/system.test.ts` | `onRecordCommand` 索引 `1→0` |
| 08-02 | `replay/sandbox.test.ts` | 失败码 `158/175→72`；`getReplayed()` `1→2` |
| 08-03 | `enemy/manager.test.ts` | `addPrefab` →「仅 code 去重」；`reusePrefab` 3→2 参；`getPrefab`/`createEnemy` 取代 `*ById` |
| 08-03/04 | `flag/*`、`equipStore`/`equipment` | 读档「同引用保留」→「重建实例 + 值恢复」 |
| 08-04 | `hero/items.test.ts` 等 | `getItem`→`addItem`；`equip.value/percentage` `new Map`→`Object.fromEntries`（Record） |
| 08-04 | `location/state/saveLoad.test.ts` | `setFloor('<string>')`→真实 `IGameMap`；`setFloor(undefined)`→`setFloor(null)` |
| 08-05 | `mapLayer.test.ts` 等 | `transferToDynamic(keepEvent=false)` 保留默认事件 `Map{10:'base-event'}`；`setMapList` 不去重；陈旧码按 shipped 改写 |
| 08-07 | `path/graph.test.ts`、`system.test.ts` | `find()/getPath()` 直接返回 `IPathfindingStep[]` → `IPathfindingResult`（status+path）；越界起点断言 183 |
| 08-08 | `replay/commands.test.ts` | 命令结果 `true/false` → `ReplayCommandResult.Success/Failed`；沙箱删除 `playing=true` 手动置位 |
| 08-09 | `replayPlayback.test.ts`、`dataClosure.test.ts` | `execute/finalize` `false` → `ReplayCommandResult.Failed`；自定义命令声明 `Active`；`getReplayed()` `1→2` |
| 08-09 | `saveablesRoundTrip.test.ts` | 装备/flag 容器往返：同引用 → uid + 值恢复；删 `hero.followers` 段 |
| 08-10 | `sandbox.test.ts`、`mapLifecycle.test.ts` | 删 `playing=true` 预读绕过；reindex 改经 `GameMap.resizeLayer(3,2,true)` |
| 08-10 | `attribute.perf.ts` | `BaseHeroModifier` 改自 `../modifier`（E4 导入漂移修复） |

> 所有改写均对齐 shipped 契约/语义，未弱化任何既有断言、未删除任何有效用例。

## 生产改动终审 —— 10 文件台账（D-10 用户授权例外）

> **重要：本阶段并非零生产改动。** 收口终审逐条对账以下 **10 个数据端生产文件**；每个文件均在其所属计划的 SUMMARY 中登记为**用户逐条确认/授权的 D-10 例外**，生产改动范围严格限于下表（`git diff 36d8b4f^..HEAD -- packages-user/data-*/src` 过滤 `__test__` 后恰为这 10 个文件）。

| # | 文件 | 计划 | 授权性质 | 改动摘要 |
| --- | --- | --- | --- | --- |
| 1 | `data-common/src/replay/sandbox.ts` | 08-02 | D-10（用户确认「忘记写首步读取」） | `play()`/`step()` 补惰性首步预读（`!appendingStep && !reader.expired && !ended` → `appendingStep = reader.read()`） |
| 2 | `data-base/src/enemy/types.ts` | 08-03 | D-10（Q4 批准，纯类型修正） | `IEnemyManager.getPrefab(token: number)` → `token: number \| string` |
| 3 | `data-base/src/hero/location.ts` | 08-04 | D-10（Q1=B） | `setFloor(map: IGameMap \| null)`；`null` 时清空楼层并通知 `onSetFloor(null)` |
| 4 | `data-base/src/hero/equipment.ts` | 08-04 | D-10（P2，WR-06 回归） | `loadState` 重新装备循环用 `replay.disable()`/`replay.revert()` 包裹，避免读档写录像 |
| 5 | `data-base/src/map/eventView.ts` | 08-05 | D-10（用户确认） | `reset()` 回填参考基准后置 `dirtyEntries = 0`，`dirty()` 恢复 `false` |
| 6 | `data-base/src/map/mapLayer.ts` | 08-05 | D-10（用户确认） | `getMapData` 子区域取值/越界补零；`toStatic(keepEvent=false)` 恢复默认事件；`cropPointEvents` 按新宽重建；`resize`/`resize2` 同步 `indexer.setWidth` 与清点事件 |
| 7 | `data-base/src/map/tile.ts` | 08-05 | D-10（用户确认） | `restoreDefaultEvents()` 由 `protected` 改 `public`（供 `toStatic` 调用） |
| 8 | `data-base/src/map/types.ts` | 08-05 | D-10（用户确认） | `ITileBase` 新增 `restoreDefaultEvents(): void` 声明（含 jsDoc） |
| 9 | `data-system/src/path/graph.ts` | 08-07 | D-10（B1/B2 用户授权） | `build()` 补 `mapped.add(startIndex)`（起始节点建图）；`resolveCost` 恢复 174 守卫（NaN/负数告警并回退 1，`Infinity` 合法） |
| 10 | `data-state/src/replay/commands.ts` | 08-08 | 用户已自行修复 + 授权提交 | `assertParameter` 返回布尔 `true/false`；`ReplayEquip.paramTypes[2]='boolean'`；4 处 `// Parameter:` 注释改为 JS `typeof` 语义 |

**对账结论：** 10/10 项均可追溯至对应计划 SUMMARY 的 D-10/用户授权登记；除这 10 项外，`packages-user/data-*/src/**` 的其余非测试文件零改动（`git diff` 佐证）。收口**不宣称零生产改动**。

## 未决 / 后续清单（Q3）

1. **不可达死代码 68 / 70（已记录，不测，不写 `it.skip`）** — 70（`replay/array.ts` 编解码未知 param type）：公开 `add` 会先以 148 拦截，无法经公开 API 触发；68（`loader/loader.ts:121` extra config id 冲突）：`extraConfigs` 为 Map 键去重且 `loading`/`dataLoaded` 自始未赋值，守卫为死代码。两者均按用户 Q1 规则记录不可达，未伪造覆盖。
2. **`transferToDynamic` 未物化默认事件覆盖（行为记录，生产未改，测试侧对齐）** — 直接调用且该格静态图块尚未物化时，实现先 `setBlock(0)` 再 `getTile`，动态图块会以空事件同步、覆盖默认事件；08-05/08-10 以测试侧前置物化 `layer.getTile(...)` 对齐，**未改生产**。如需「无论是否物化均保留默认事件」，须另行授权最小生产修复。
3. **10 文件生产改动台账（D-10 例外）** — 见上节；收口的「生产改动终审」必须逐条对账这 10 项，不得声称零生产改动。后续 `/gsd-verify-work 8` 或发布前评审应逐项复核。
4. **既有 no-console 警告（非阻塞）** — 四包 src eslint 现存 6 条 `no-console` 警告：生产 `data-common/src/replay/func.ts`（3 条）与 3 个 perf 文件 `data-base/src/hero/__test__/attribute.perf.ts`、`data-system/src/combat/__test__/context.perf.ts`、`data-system/src/combat/__test__/damage.perf.ts`（各 1 条）。均为既有问题，非本次引入，非 error，未修复。
5. **已闭合项：`setFloor(null)` 实现/接口不一致已解决** — 08-04 Q1=B 将生产 `HeroLocation.setFloor` 改为收 `IGameMap | null`、`null` 清空楼层，08-09 夹具/用例随之对齐（`setFloor(null)` / `setFloor(真实 IGameMap)`），实现与接口一致性问题闭合。

## Task Commits

1. **Task 1: 4 个测试文件纯格式修复** — `d4cbc51` (style)
2. **Task 2: 阶段 SUMMARY + STATE/ROADMAP 元数据** — 元数据提交（`docs(08-11)`；本文件与 STATE/ROADMAP/REQUIREMENTS）

**Plan metadata:** `docs(08-11): complete phase 8 closure plan`（记录 SUMMARY/STATE/ROADMAP/REQUIREMENTS）。

## Files Created/Modified

- `packages-user/data-base/src/enemy/__test__/manager.test.ts` — 纯格式（import 折叠 + 数组折行）。
- `packages-user/data-base/src/enemy/__test__/saveLoad.test.ts` — 纯格式（import 折叠）。
- `packages-user/data-base/src/hero/__test__/follower.test.ts` — 纯格式（折行/缩进）。
- `packages-user/data-base/src/hero/__test__/location.test.ts` — 纯格式（折行/缩进）。
- `.planning/phases/08-test-refactor-alignment/08-11-SUMMARY.md` — 本阶段收口摘要（新建）。
- `.planning/STATE.md`、`.planning/ROADMAP.md` — 计划进度与状态更新。

## Decisions Made

见 frontmatter `key-decisions`（Q1/Q2/Q3 + 10 文件 D-10 例外清单）。核心：验收口径更正为 65 文件；4 文件纯格式修复经授权；生产改动以 10 文件台账登记、不做零改动声明。

## Deviations from Plan

### 1. [用户授权 · Q1] 验收口径由 66 文件更正为 65 文件

- **Found during:** Task 0 收口裁决。
- **Issue:** 计划 must_haves 写 `test:ci` 采集总数 66；实际经历 08-02/08-09 两次退役（−2）与 08-10 一次新增（+1），当日实测为 65。
- **Fix（用户 Q1）:** 口径更正为 65 = 66 − 2 + 1；`test:ci` 65/727/1/0、`test:perf` 6/54/0 作为验收值。
- **Impact:** 属用户明确授权的口径更正，非缺陷；无代码影响。

### 2. [用户授权 · Q2] 对 4 个测试文件执行纯格式修复

- **Found during:** Task 1 全量 eslint 门禁（四包 src 报 46 errors，全部落在这 4 个文件）。
- **Fix（用户 Q2=(a)）:** `eslint --fix` 仅在 4 个文件上运行；去空白后 tokens 与 HEAD 完全一致，证明纯格式、无语义/断言变化；以 `style(08-11)` 提交。
- **Files modified:** 上述 4 个 `__test__` 文件。
- **Committed in:** `d4cbc51`（Task 1）。

### 3. [用户授权 · Q3] 生产改动终审改为 10 文件台账对账（不宣称零生产改动）

- **Found during:** Task 2 摘要撰写。
- **Issue:** 计划 must_haves 的「零生产改动终审」与本阶段实际存在的 10 个 D-10 授权生产改动冲突。
- **Fix（用户 Q3）:** 以「生产改动终审 —— 10 文件台账」逐条对账，明确不宣称零生产改动。
- **Impact:** 文档口径修正，无代码影响。

---

**Total deviations:** 3 用户授权（Q1 口径更正、Q2 纯格式修复、Q3 生产台账口径）。无 Rule 1-4 自动修复。
**Impact on plan:** 测试改动限于 4 个文件且为纯格式；生产零新增改动（仅对账既有 D-10 例外）；未弱化断言、未删用例、未新增 skip、零新增依赖、未安装任何包。

## Issues Encountered

- 4 个测试文件在 HEAD 即存在 prettier 格式报错（46 errors），与本次收口无关但阻断 eslint 0 errors 门禁；经用户 Q2 授权后纯格式修复。
- 生产 `replay/func.ts` 与 3 个 perf 文件存在 6 条既有 `no-console` 警告；非本次引入、非 error，按要求保留未改。

## Self-Check: PASSED

- FOUND: `.planning/phases/08-test-refactor-alignment/08-11-SUMMARY.md`
- FOUND: `d4cbc51`（Task 1 `style(08-11)`）
- GREEN: `pnpm test:ci` 65/727/1/0；`pnpm test:perf` 6/54/0
- GREEN: 四包 src eslint 0 errors（6 既有 no-console 警告）
- VERIFIED: 4 文件去空白 tokens 与 HEAD 一致（纯格式）
- VERIFIED: 唯一 skip = `equipment.test.ts:353` 码 147
- VERIFIED: 阶段生产改动恰为 10 文件（D-10 台账）

---

*Phase: 08-test-refactor-alignment*
*Completed: 2026-10-08*
