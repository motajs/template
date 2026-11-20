---
phase: 08-test-refactor-alignment
plan: 10
subsystem: testing
tags:
    - test-coverage
    - error-codes
    - logger-json
    - loader
    - vitest
    - baseline-alignment
requires:
    - phase: 08-test-refactor-alignment/08-02
      provides: data-common 对齐（含 sandbox 码 72/158/175 契约改写）
    - phase: 08-test-refactor-alignment/08-05
      provides: data-base/map 对齐 + 陈旧码 62/63/64/84/130/125 契约裁定
    - phase: 08-test-refactor-alignment/08-06
      provides: data-system combat/event 对齐
    - phase: 08-test-refactor-alignment/08-07
      provides: data-system path 注入面对齐 + 码 173/183 覆盖
    - phase: 08-test-refactor-alignment/08-08
      provides: data-state src 对齐 + CoreState 装配约定
    - phase: 08-test-refactor-alignment/08-09
      provides: data-state 集成层对齐 + 域外失败登记
provides:
    - "§9.1 21 个缺口错误码逐条处置：14 码新增通过断言、5 码（72/170/173/179/183）仅登记既有覆盖、2 码（70/68）记为不可达"
    - "新建 packages-user/data-state/src/loader/__test__/loader.test.ts：码 66/67/69 + MotaDataLoader 公开面（码 68 记录不可达）"
    - "基线 test:ci 两处失败（sandbox.test.ts 6 例、mapLifecycle.test.ts 1 例）按 shipped 契约测试侧对齐"
    - "E4 attribute.perf.ts 收集失败为测试侧导入漂移并修复"
    - "§9.2 陈旧码逐条登记为「契约变更」，不补测、不复活"
affects:
    - packages-user/data-common/src/replay
    - packages-user/data-common/src/store
    - packages-user/data-base/src/map
    - packages-user/data-base/src/hero
    - packages-user/data-system/src/event
    - packages-user/data-system/src/path
    - packages-user/data-state/src/event
    - packages-user/data-state/src/loader
tech-stack:
    added: []
    patterns:
        - "缺口码断言沿用 logger.catch(fn)（返回 { ret, info }）或 vi.spyOn(logger, 'warn'/'error')，只校验 code 不硬编码文案"
        - "沙箱单步对齐 shipped 自然预读：不手动置 playing=true（否则 step() 跳过预读、appendingStep 恒 null）"
        - "经由 GameMap.resizeLayer 变更图层尺寸，使共享 MapLocIndexer 宽度在 cropPointEvents 前同步"
        - "loader 测试以内联 ILoadManager/ILoadTaskStarter 桩驱动 MotaDataLoader.start()，零新依赖"
        - "每个新增 it 前一行中文注释（dev.md:86）"
key-files:
    created:
        - packages-user/data-state/src/loader/__test__/loader.test.ts
        - .planning/phases/08-test-refactor-alignment/08-10-SUMMARY.md
    modified:
        - packages-user/data-common/src/replay/__test__/sandbox.test.ts
        - packages-user/data-common/src/store/__test__/tileStore.test.ts
        - packages-user/data-base/src/map/__test__/mover.test.ts
        - packages-user/data-base/src/map/__test__/mapLifecycle.test.ts
        - packages-user/data-base/src/hero/__test__/items.test.ts
        - packages-user/data-base/src/hero/__test__/attribute.perf.ts
        - packages-user/data-system/src/event/__test__/eventDispatch.test.ts
        - packages-user/data-system/src/path/__test__/system.test.ts
        - packages-user/data-state/src/event/__test__/event.test.ts
        - .planning/phases/08-test-refactor-alignment/deferred-items.md
key-decisions:
    - "Q1：缺口清单按实际需要收敛——14 码新增覆盖；72/170/173/179/183 仅登记既有覆盖不重测；70/68 记为不可达、不写 it.skip"
    - "Q1：码 181 落 data-common store 层（itemStore/enemyStore），因未获批新文件，落位于既有 tileStore.test.ts 的独立 describe"
    - "Q1：从本计划范围移除未被拥有的 data-base/src/enemy/__test__/enemy.test.ts（未触碰）"
    - "Q2：陈旧码（62/63/64/84/130/158/175 + 表外提及的 125）全部按「契约变更」登记，不补测（62–125 已由 08-05 裁定，158/175 已由 08-02 迁移到 72）"
    - "Q3：批准新建 data-state/src/loader/__test__/loader.test.ts，覆盖 66/67/68/69 与 MotaDataLoader 公开面；实测 68 为死代码，按不可达记录"
    - "Q4：仅复用既有 createEnv/sandbox 桩风格，不引入新生产标识符（新文件仅测试内 helper 名）"
    - "E1：基线 test:ci 的测试侧失败由执行者对齐（sandbox.test.ts、mapLifecycle.test.ts），未改生产"
    - "E4：attribute.perf.ts 收集失败判定为测试侧导入漂移（BaseHeroModifier 误自 ../attribute），修复为 ../modifier"
    - "基线 test:ci 后：65 文件全绿（727 passed / 1 skipped）；test:perf 6 文件 54 passed；触达文件 eslint 0 errors"
patterns-established:
    - "缺口码覆盖矩阵：code → emit 模块 → 测试文件 → 用例/处置"
    - "不可达码处置：记录为不可达并说明 emit 点为何不可经公开 API 触发，不写 it.skip（沿用用户 Q1 对码 70 的裁定）"
requirements-completed: [TEST-02]
actuals:
    tokens: 5795
    tasks: 3
    commits: 3
    plan_head_before: 339f72d541affb0f7489edd9325600c30d17a62b
coverage:
    - id: D1
      description: "§9.1 21 个缺口错误码逐条处置（14 新增断言 / 5 既有登记 / 2 不可达）"
      requirement: TEST-02
      verification:
          - kind: unit
            ref: "pnpm exec vitest run …data-common/src/replay/__test__/sandbox.test.ts …data-common/src/store/__test__ …data-base/src/map/__test__/mover.test.ts …mapLifecycle.test.ts …hero/__test__/items.test.ts …data-system/src/event/__test__ …path/__test__ …data-state/src/event/__test__ …loader/__test__ — 各聚焦 0 失败"
            status: pass
          - kind: unit
            ref: "pnpm test:ci — 65 files passed; 727 passed / 1 skipped / 0 failed"
            status: pass
      human_judgment: false
    - id: D2
      description: "新建 loader.test.ts：码 66/67（PrefixedJSONCProcessor）、69（DefaultDataLoaderHook）、MotaDataLoader 公开面；码 68 记录不可达"
      requirement: TEST-02
      verification:
          - kind: unit
            ref: "packages-user/data-state/src/loader/__test__/loader.test.ts — 6 passed（含 66/67/69 断言与 start() 公开面加载）"
            status: pass
      human_judgment: false
    - id: D3
      description: "基线 test:ci 两处测试侧失败对齐 + E4 attribute.perf.ts 收集失败修复"
      requirement: TEST-02
      verification:
          - kind: unit
            ref: "sandbox.test.ts 16 passed / mapLifecycle.test.ts 5 passed（基线各失败 6/1）"
            status: pass
          - kind: other
            ref: "pnpm test:perf — 6 files / 54 passed / 0 failed（基线 attribute.perf.ts 收集失败）"
            status: pass
      human_judgment: false
duration: 80min
completed: 2026-10-08
status: complete
---

# Phase 8 Plan 10: 覆盖补测与接口对齐收口 Summary

**数据端 21 个已发出但未覆盖错误码逐条处置（14 码新增 `logger.catch` 断言）、新建 `loader.test.ts` 覆盖 loader 公共面、并把基线 `test:ci` 的测试侧失败全部对齐，最终 `test:ci` 65 文件全绿（727 passed / 1 skipped）、`test:perf` 6 文件 54 passed，零生产改动。**

## Performance

- **Duration:** ~80 min
- **Started:** 2026-10-08
- **Completed:** 2026-10-08
- **Tasks:** 3（Task 0 决策关卡已由用户 RESOLVED，不计入实现任务）
- **Files modified:** 10（含 1 新建测试）

## 覆盖矩阵（§9.1 的 21 个缺口码 → 处置）

| code | emit 模块 | 测试文件 / 用例 | 处置 |
| --- | --- | --- | --- |
| 73 | `replay/sandbox.ts:84,93` | `sandbox.test.ts` `errors code 73 when getPassive is called with no pending passive step` | 新增断言 |
| 194 | `replay/sandbox.ts:187` | `sandbox.test.ts` `warns code 194 when a passive step follows an active step` | 新增断言 |
| 133 | `store/tileStore.ts:35` | `tileStore.test.ts` `warns code 133 and 134 on number or id conflicts` | 新增断言 |
| 134 | `store/tileStore.ts:39` | 同上 | 新增断言 |
| 181 | `store/itemStore.ts:13`、`enemyStore.ts:13` | `tileStore.test.ts`（`ItemStore and EnemyStore duplicate registration`）2 用例 | 新增断言 |
| 192 | `map/mover.ts:47` | `mover.test.ts` `warns code 192 when the Dir8 face handler is missing` | 新增断言 |
| 193 | `hero/items.ts:144` | `items.test.ts` `warns code 193 when a saved item has no tile id registration` | 新增断言 |
| 171 | `event/executor.ts:66,73` | `eventDispatch.test.ts` `warns code 171 for an event id missing from the store` | 新增断言 |
| 172 | `event/executor.ts:39,46` | `eventDispatch.test.ts` `warns code 172 for a non-boolean event result during reduction` | 新增断言 |
| 182 | `path/finder.ts:110` | `system.test.ts` `warns code 182 when binding a layer from another CoreState` | 新增断言 |
| 66 | `loader/jsoncProcessor.ts:16` | `loader.test.ts` `warns code 66 when the prefix split string is missing` | 新增断言 |
| 67 | `loader/jsoncProcessor.ts:25` | `loader.test.ts` `warns code 67 when the split payload is not valid json` | 新增断言 |
| 69 | `loader/hook.ts:9` | `loader.test.ts` `warns code 69 when the core config is missing` | 新增断言 |
| 1001 | `event/map.ts:26` | `event/__test__/event.test.ts` `warns code 1001 when setBlock receives an unknown tile` | 新增断言 |
| 72 | `replay/sandbox.ts:136` | `sandbox.test.ts` 既有 `errors code 72 …`（execute/finalize） | 仅登记（既有覆盖） |
| 170 | `store/eventStore.ts:16` | `eventStore.test.ts` 既有 `warns and overwrites when an id is added twice` | 仅登记（既有覆盖） |
| 173 | `path/graph.ts:70,74,78`、`system.ts:40` | `graph.test.ts` / `system.test.ts` 既有缺绑定用例 | 仅登记（既有覆盖） |
| 179 | `replay/array.ts:448,500,544` | `array.test.ts` 既有越界 insert/delete/set 用例 | 仅登记（既有覆盖） |
| 183 | `path/graph.ts:82` | `graph.test.ts` 既有越界起点用例（F5，08-07） | 仅登记（既有覆盖） |
| 70 | `replay/array.ts:405,728` | 无 | **不可达**（编码/解码未知 param type 的 emit 点存在，但公开 API 会在 `add` 前以码 148 拦截；按 D-04 规则不写 `it.skip`） |
| 68 | `loader/loader.ts:121` | 无 | **不可达**（见下「不可达码」小节） |

**计数核对：** 21 = 14 新增断言 + 5 仅登记 + 2 不可达。

## 不可达码（70 / 68）

- **70**（`array.ts` 编码/解码未知 param type）：emit 点在内部 `encode`/`decode`，但任何经公开 `IReplayArray.add` 传入的非法参数都会先被公开校验以 **148**（未知 param type）拦截，故 70 不可经公开 API 触发。按用户 Q1 对码 70 的裁定：记录为不可达，**不写 `it.skip`**。
- **68**（`loader.ts:122` extra config id 冲突）：`extraConfigs` 是 `Map<string,string>`（`addExtraConfig` 以 identifier 为键），同一 identifier 至多一条任务；而 `configMap.has(id)` 的 68 守卫仅在「同一 id 的第二条额外配置任务兑现」时触发，故该守卫为死代码。经 `git log -p -S "this.dataLoaded ="` 确认 `loading`/`dataLoaded` 自首次提交起从未被赋值，`start()` 重入也无法制造同 id 双任务。故 68 不可经公开 API 触发。按 Q1 规则记录为不可达，**不写 `it.skip`**，并在 Issues/Deviations 中向用户说明。

## §9.2 陈旧登记码处置（契约变更，不补测）

| code | 覆盖表登记 | 当前源码 | 处置 |
| --- | --- | --- | --- |
| 62 | `mapState` raw key 非数字 | `mapState.ts` 无 62 调用点（现发 60/61/121/55/122） | 契约变更（08-05 Q1=A 裁定），仅登记 |
| 63 | `mapState` 容器缺失 | 同上 | 契约变更，仅登记 |
| 64 | `mapState` 非法值/类型 | 同上 | 契约变更，仅登记 |
| 84 | `gameMap` 重复别名 | `gameMap.ts` 无 84；别名改由 `addLayer(alias)` 承担 | 契约变更，仅登记 |
| 130 | `mapLayer` 非本层图块 | `mapLayer.ts` 无 130 | 契约变更，仅登记 |
| 158 | `sandbox` 执行失败 | 无 158；统一改发 `error(72)`（08-02） | 契约码迁移 158→72，仅登记 |
| 175 | `sandbox` notExecuted 失败 | 无 175；同上 | 契约码迁移 175→72，仅登记 |
| 125 | 表外提及（排序楼层集不一致） | `mapState.ts` 无 125 调用点 | 契约变更，仅登记（08-05 无操作） |

> 说明：计划 must_haves 写「7 个陈旧码」但列举了 8 项（含 125）；此处按实际逐条列出，§9.2 规范陈旧集为 62/63/64/84/130/158/175（7 项），125 为表外补充提及。**不补测、不用生产改动复活任何陈旧码。**

## Task Commits

1. **Task 1: data-common + data-base 缺口码补测 + 基线对齐** — `b932f8c` (test)
2. **Task 2: data-system + data-state 缺口码补测（含 loader.test.ts）** — `47c6e2c` (test)
3. **Task 3a: E4 `attribute.perf.ts` 导入漂移修复** — `0b23ff5` (test)
4. **Task 3b: 覆盖矩阵登记 + 门禁收口** — 见「Metadata commit」（本 SUMMARY 与 STATE/ROADMAP）

## Files Created/Modified

- `packages-user/data-common/src/replay/__test__/sandbox.test.ts` — 删除过时 `playing=true` 预读绕过与 `IManualReplaySandbox`；过期读流出例改为自然步进后过期；新增码 73/194 用例。
- `packages-user/data-common/src/store/__test__/tileStore.test.ts` — 新增码 133/134 断言与 `ItemStore`/`EnemyStore` 码 181 describe。
- `packages-user/data-base/src/map/__test__/mover.test.ts` — `createMoverFixture(registerDir8?)` 参数化；新增码 192 用例。
- `packages-user/data-base/src/map/__test__/mapLifecycle.test.ts` — reindex 用例改经 `map.resizeLayer(3,2,true)`（共享索引器宽度同步）。
- `packages-user/data-base/src/hero/__test__/items.test.ts` — 新增码 193 用例。
- `packages-user/data-base/src/hero/__test__/attribute.perf.ts` — `BaseHeroModifier` 改自 `../modifier` 导入（E4）。
- `packages-user/data-system/src/event/__test__/eventDispatch.test.ts` — 新增码 171/172 用例。
- `packages-user/data-system/src/path/__test__/system.test.ts` — 新增码 182 用例。
- `packages-user/data-state/src/event/__test__/event.test.ts` — 新增码 1001 用例。
- `packages-user/data-state/src/loader/__test__/loader.test.ts` — **新建**：66/67/69 断言与 MotaDataLoader 公开面。
- `.planning/phases/08-test-refactor-alignment/deferred-items.md` — 结清 08-09 两项、登记域外既有 eslint 问题。

## Decisions Made

见 frontmatter `key-decisions`（Q1–Q4、E1、E4）。

## Baseline Alignment（test:ci 测试侧失败）

| 文件 | 基线失败 | 根因 | 对齐 |
| --- | --- | --- | --- |
| `sandbox.test.ts` | 6 例 | 测试用 `playing=true` 预读绕过；shipped `step()` 仅在 `!playing && !ended` 时惰性预读，绕过致 `appendingStep=null` | 删除绕过与 `start()` helper、`IManualReplaySandbox`；改用 shipped 自然 `step()`；过期用例先自然步进再过期 |
| `mapLifecycle.test.ts` | 1 例 | 用例直接调 `layer.resize` 绕过 `GameMap.resizeLayer`，共享 `MapLocIndexer.width` 未同步，点事件按旧宽索引（key 3 而非 4） | 改经 `map.resizeLayer(3,2,true)`，令 `indexer.setWidth` 先于 `cropPointEvents` |

以上均为测试侧对齐，**未改生产**（`GameMap.resizeLayer` 与 `sandbox.ts` 的 shipped 行为即权威）。

## Deviations from Plan

### 1. [E1 · 用户授权] 基线测试侧失败对齐（sandbox.test.ts / mapLifecycle.test.ts）

- **Found during:** Task 1 基线 `pnpm test:ci`。
- **Issue:** 基线 2 文件 7 例失败，与覆盖补测无关但阻断全绿门禁。
- **Fix:** 测试侧对齐（见上表）；未改任何生产文件。E1 明确授权测试侧对齐。
- **Committed in:** `b932f8c`（Task 1）。

### 2. [E4 · 用户授权] `attribute.perf.ts` 收集失败修复

- **Found during:** Task 3 `pnpm test:perf` 复核。
- **Issue:** `PerfModifier extends BaseHeroModifier` 报 `Class extends value undefined`；`attribute.perf.ts:3` 自 `../attribute` 导入（未导出），与 08-04 已修的 `attribute.test.ts` 同源漂移。
- **Fix:** 改自 `../modifier` 导入；`test:perf` 6 文件 54 passed。
- **Committed in:** `0b23ff5`（Task 3a）。

### 3. [Q1/code 68] 码 68 记为不可达而非补测

- **Found during:** Task 2 loader 覆盖设计。
- **Issue:** 计划/Q3 期望覆盖 68，但 68 的触发条件（同一 extra config identifier 出现两条任务）因 `extraConfigs` 为 `Map` 而不可能发生；`loading`/`dataLoaded` 自始未赋值，重入也不产生同 id 双任务。逐字对照 `loader.ts:111-127` 与 `.prettierrc` 无关。
- **Fix:** 按用户 Q1 对码 70 的裁定（emit 点存在但不可经公开 API 触发 → 记录不可达、**不写 `it.skip`**），将 68 记为不可达并在本 SUMMARY 与 Issues 中说明。**未伪造断言、未新增 skip。**
- **Impact:** `loader.test.ts` 覆盖 66/67/69 + MotaDataLoader 公开面；68 无测试但已记录理由。

### 4. [Scope · 提交边界] 181 落位既有 `tileStore.test.ts`

- **Found during:** Task 1（Q1 要求 181 落 data-common store 层，但仅 loader.test.ts 获批新建）。
- **Fix:** 在既有 `tileStore.test.ts` 追加独立 describe「ItemStore and EnemyStore duplicate registration」，不新建文件、不违反新文件批准约束。

### 5. [Scope · 域外] 既有 eslint prettier 报错不修复

- **Found during:** Task 3 全量 eslint 门禁。
- **Issue:** `pnpm exec eslint packages-user/data-{common,base,system,state}/src` 报 46 errors / 6 warnings，全部为 `prettier/prettier` 格式（line wrapping），分布于 7 个本计划未触达的文件（含生产 `data-common/src/replay/func.ts`）。
- **Evidence:** `git diff --stat HEAD` 对 7 文件为空——它们在 08-10 任何编辑前即存在于 HEAD `339f72d`。
- **Fix:** 按 scope boundary 不修复；登记于 `deferred-items.md` 并在本 SUMMARY 说明。**本计划触达的全部文件 eslint 0 errors。**

---

**Total deviations:** 1 基线测试侧对齐（授权）+ 1 E4 测试侧修复（授权）+ 1 不可达码记录（沿用 Q1 裁定）+ 1 落位替代 + 1 域外 lint 登记。
**Impact on plan:** 零生产改动、零新增依赖、零新增 `it.skip`；覆盖矩阵 14/14 新增码全部有通过断言；未弱化/未删除任何既有用例。

## Issues Encountered

- **环境：node_modules 全量 junction 为「untrusted mount point」。** 本执行 shell 为高完整性（elevated），无法遍历由非提升进程 pnpm 创建的全量 3899 个 junction，`pnpm test:ci`/`vitest`/`eslint` 均 `Cannot find module`。经确认根因为 Windows「untrusted mount point」校验，以提升权限重建同名 junction（仅重建 reparse point，未增删任何包、未改 lockfile）后恢复；此为环境修复，非仓库改动，`git status` 无相关变更。（供知悉：如用户在普通（非提升）终端运行，原本即可正常遍历。）

## Known Stubs

None。新增断言全部驱动真实 emit 路径（`logger.catch` 捕获到目标 code）；不可达码 70/68 明确不伪造覆盖。

## Threat Flags

None——未引入新的网络/鉴权/文件访问/信任边界表面。`T-08-10-01..04/SC` 缓解均满足：每个新码以真实 `logger.catch`/spy 捕获 code（非空断言）；陈旧码明确不补测、未用生产改动复活；新文件与测试内命名经 Task 0 批准（loader.test.ts）；仅以显式路径 `git add` 提交、未提交用户并发改动；未安装任何包。

## Next Phase Readiness

- Phase 08 覆盖侧收口完成：`test:ci` 65 文件全绿（727 passed / 1 skipped）、`test:perf` 6 文件 54 passed、触达文件 eslint 0。
- 待用户裁决/知悉：码 68 与 70 为不可达死代码（本计划已记录，未改生产）；7 个域外文件的既有 prettier eslint 报错（含生产 `func.ts`）未修，见 `deferred-items.md`。
- Phase 08 剩余 `08-11-PLAN.md` 待执行；本计划完成不阻断 08-11。

---

*Phase: 08-test-refactor-alignment*
*Completed: 2026-10-08*

## Self-Check: PASSED

- FOUND: packages-user/data-state/src/loader/__test__/loader.test.ts
- FOUND: packages-user/data-common/src/replay/__test__/sandbox.test.ts
- FOUND: packages-user/data-common/src/store/__test__/tileStore.test.ts
- FOUND: packages-user/data-base/src/map/__test__/mover.test.ts
- FOUND: packages-user/data-base/src/map/__test__/mapLifecycle.test.ts
- FOUND: packages-user/data-base/src/hero/__test__/items.test.ts
- FOUND: packages-user/data-base/src/hero/__test__/attribute.perf.ts
- FOUND: packages-user/data-system/src/event/__test__/eventDispatch.test.ts
- FOUND: packages-user/data-system/src/path/__test__/system.test.ts
- FOUND: packages-user/data-state/src/event/__test__/event.test.ts
- FOUND: b932f8c (Task 1)
- FOUND: 47c6e2c (Task 2)
- FOUND: 0b23ff5 (Task 3a)
