---
phase: 08-test-refactor-alignment
plan: 09
subsystem: data-state/testing
tags:
    [
        test-alignment,
        data-state,
        integration,
        CoreState,
        loadStarter,
        closed-loop,
        pathfinding-injection,
        ReplayCommandResult,
        perf,
        D-10
    ]
status: complete
requires:
    - phase: 08-test-refactor-alignment/08-01
      provides: 测试文件迁入 __test__ 目录的基线
    - phase: 08-test-refactor-alignment/08-08
      provides: "统一 CoreState 装配约定 new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })"
provides:
    - "data-state 集成层 11 test/perf + 共享夹具 + helper 对齐 shipped 接口/形状；`__test__` 7 files / 54 passed / 0 failed，`__test__`+`src` 合并 16 files / 152 passed / 0 failed"
    - "`tileLegacy.test.ts` 经用户授权退役（被测 `data-state/src/legacy/tile` 已整体删除）"
    - "共享夹具 `closed-loop.ts` 根因修复：setFloor 传真实 IGameMap、addHook 后不再调用已删的 .load()；dataClosure/nodeTracer 随之转绿"
    - "寻路注入面对齐：删除 useMapState、DefaultPassPredicateImpl(state)、finder 注入 Dir4FaceHandler、setFloor(真实地图)"
    - "录像结果契约对齐：IReplayCommand 返回 ReplayCommandResult 枚举、自定义命令声明 Active、沙箱走 shipped 自然预读"
    - "道具原始定义 equip.value/percentage 由 Map 对齐为 Record（Object.fromEntries），使装备修饰器真正参与计算"
affects:
    - packages-user/data-state/__test__
tech-stack:
    added: []
    patterns:
        - "CoreState 测试装配延续 08-08：new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })（文件内 createCoreState() helper 复用）"
        - "closed-loop 夹具 setFloor(map)：location.map 为真实 IGameMap，通行谓词可读 map.eventLayer"
        - "finder 注入三件套：useMapLayer(真实 eventLayer) + useFaceHandler(new Dir4FaceHandler()) + usePassPredicate(new DefaultPassPredicateImpl(state))（useMapState 已删）"
        - "录像命令结果使用 ReplayCommandResult.Success/Failed；自定义命令须声明 ReplayCommandType.Active；sandbox.step() 走 shipped 自然预读（getReplayed 计预读位）"
        - "addHook 直接生效，控制器只有 unload()，不再有 load()"
        - "equip.value/percentage 是 Record，用 Object.fromEntries 构造，不用 Map"
        - "装备实例与 flag 字段读档按值/uid 重建（同引用契约已在 Hero equipment 重构中移除），容器测试只校验恢复后的值"
key-files:
    created:
        - .planning/phases/08-test-refactor-alignment/deferred-items.md
    modified:
        - packages-user/data-state/__test__/fixtures/closed-loop.ts
        - packages-user/data-state/__test__/coreNode.test.ts
        - packages-user/data-state/__test__/replayPlayback.test.ts
        - packages-user/data-state/__test__/saveablesRoundTrip.test.ts
        - packages-user/data-state/__test__/dataClosure.test.ts
        - packages-user/data-state/__test__/enemyCombination.test.ts
        - packages-user/data-state/__test__/mapScenario.perf.ts
        - packages-user/data-state/__test__/saveables.perf.ts
        - packages-user/data-state/__test__/saveablesReal.perf.ts
    deleted:
        - packages-user/data-state/__test__/tileLegacy.test.ts
decisions:
    - "Q1：`tileLegacy.test.ts` 退役删除——被测 `data-state/src/legacy/tile`（`TileLegacyBridge`/`LegacyTileData`）已整体删除，无 shipped 被测面；不重定向、不伪造替代测试。生产 `data-state/src/enemy/legacy.ts` 属将删的 legacy，不在本层覆盖。"
    - "Q2：延续 08-08 装配约定 new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })，各文件用文件内 createCoreState() helper 复用；Import WebLoadStarter 自 @motajs/loader。"
    - "Q3：closed-loop.ts 两处 setFloor('F1') -> setFloor(map)（真实 IGameMap，fromRaw 返回值，已在作用域）；nodeTracer.test.ts 零改动（仅经夹具）；dataClosure.test.ts 仅替换 8 处装配调用，断言/label 不动。"
    - "Q4：replayPlayback 删除 useMapState、DefaultPassPredicateImpl(state.maps)->(state)、finder.useFaceHandler(new Dir4FaceHandler())、resetHero 用 state.maps.getMap('F1')；wireFinder=false 分支同样补注入方向处理器。"
    - "D1：saveablesRoundTrip seedState 重排为先建 F1 地图再 setFloor(map)；mutateState 用 setFloor(null)。"
    - "D2：dataClosure 装配替换（8 处调用经本地 helper 复用）。"
    - "D3：nodeReplay.test.ts 零改动（不构造 CoreState，仅用 ReplaySystem + replayVerifier）。"
    - "D4：replayPlayback resetHero / wireFinder=false 修复（见 Q4）。"
    - "D5：saveables.perf.ts addLayer() -> addLayer('event')（coreNode.test.ts:21、saveablesRoundTrip.test.ts:135 同）。"
    - "追加·录像结果契约（沿用 08-08 commands.test.ts 同源对齐）：replayPlayback 6 个用例的 execute/finalize 结果由布尔 false 改为 ReplayCommandResult.Failed；dataClosure 自定义命令返回 ReplayCommandResult 枚举并声明 ReplayCommandType.Active。"
    - "追加·沙箱自然预读：dataClosure 删除手动 playing=true/pausing=false（及 IManualReplaySandbox 骨架），改由 shipped step() 惰性预读；getReplayed() 由 1 改为 2（读取器含预读位）。"
    - "追加·夹具 hook：closed-loop.ts 删除 eventHook.load()——addHook 现已直接生效，控制器仅有 unload()。"
    - "追加·equip.value 形状：dataClosure/saveablesRoundTrip/saveables.perf/saveablesReal.perf 的原始道具 equip.value/percentage 由 new Map(...) 改为 Object.fromEntries(...)/{}（IItemEquipData 为 Record），否则 EquipmentState 静默读不到修饰器。"
    - "追加·同引用契约移除：saveablesRoundTrip 容器往返用例不再断言装备实例/flag 字段的实例身份（Hero equipment 重构后 store.loadState 重建实例、FlagSystem.loadState 重建字段），改为校验 uid 与值恢复；同时删除已从 HeroState 移除的 hero.followers 段（等价覆盖见 data-base/src/hero/__test__/follower.test.ts #06-17-6）。"
requirements-completed: [TEST-02]
actuals:
    tokens: 4353
    tasks: 2
    commits: 4
    plan_head_before: 58a554e40a6f1ad92930e2baa6d1ca9f6e058fb4
coverage:
    - id: D1
      description: "data-state 集成层（8 test → 7 test + 3 perf + 夹具 + helper）对齐 shipped 接口/形状，聚焦 0 失败"
      requirement: TEST-02
      verification:
          - kind: unit
            ref: "pnpm exec vitest run packages-user/data-state/__test__ — 7 files / 54 passed / 0 failed"
            status: pass
          - kind: unit
            ref: "pnpm exec vitest run packages-user/data-state/__test__ packages-user/data-state/src — 16 files / 152 passed / 0 failed"
            status: pass
          - kind: other
            ref: "pnpm exec vitest run --config vitest.perf.config.ts packages-user/data-state/__test__ — 3 files / 45 passed / 0 failed"
            status: pass
          - kind: lint
            ref: "pnpm exec eslint packages-user/data-state/__test__ — 0 errors（4 条既有 console.table no-console 警告）"
            status: pass
      human_judgment: false
    - id: D2
      description: "共享夹具根因修复 + tileLegacy 授权退役"
      requirement: TEST-02
      verification:
          - kind: unit
            ref: "dataClosure.test.ts 9 passed / nodeTracer.test.ts 1 passed（二者仅经 closed-loop 夹具，零断言改动）"
            status: pass
      human_judgment: false
duration: 25min
completed: 2026-10-07
---

# 08-09 — data-state 集成层对齐（`__test__`）Summary

**一句话：** 将 `packages-user/data-state/__test__/` 的集成层（8 test + 3 perf + 共享夹具 `closed-loop.ts` + `replayVerifier.ts`）对齐 shipped 接口/形状——共享夹具根因修复（`setFloor(真实 IGameMap)`、`addHook` 后不再调已删的 `.load()`）、寻路注入面统一（删 `useMapState`、`DefaultPassPredicateImpl(state)`、注入 `Dir4FaceHandler`）、录像结果契约对齐 `ReplayCommandResult`、道具原始定义 `equip.value` 由 `Map` 对齐为 `Record`——并按用户授权退役 `tileLegacy.test.ts`；聚焦 **7 test 文件 54/54**、`__test__`+`src` 合并 **16 文件 152/152**、data-state perf **3 文件 45/45**、eslint **0 报错**，零生产改动。

## Task 0 裁决（Q1–Q4 + D1–D5，已 RESOLVED）

- **Q1（STRICT）**：`tileLegacy.test.ts` **退役删除**。被测 `data-state/src/legacy/tile`（`TileLegacyBridge`/`LegacyTileData`）已整体删除，全仓无 shipped 被测面；不重定向、不新增替代 legacy 测试。夹具中仅让活代码运行所需的 stub 字段（如 `fromLegacyEnemy: () => {}`）保留。生产 `data-state/src/enemy/legacy.ts` 属将删 legacy，本层不测。
- **Q2**：延续 08-08 装配 `new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })`，各文件用文件内 `createCoreState()` helper 复用（`WebLoadStarter` 自 `@motajs/loader`）。
- **Q3**：`closed-loop.ts` 两处 `setFloor('F1')` → `setFloor(map)`（真实 `IGameMap`）；`nodeTracer.test.ts` 确认为**零改动**（仅经夹具）；`dataClosure.test.ts` **非零改动但仅装配**——8 处 `createCoreState()` 调用经本地 helper 复用，**断言/label 未动**。
- **Q4**：注入 `Dir4FaceHandler`（`@user/data-common`）经 finder，与 08-07 一致；`DefaultPassPredicateImpl(state.maps)` → `(state)`；`resetHero` 用 `setFloor(state.maps.getMap('F1'))`；`wireFinder=false` 分支同样补注入方向处理器。
- **D1**：`saveablesRoundTrip` `setFloor` 对齐真实地图（重排为先建 F1 地图再 `setFloor(map)`；`mutateState` 用 `setFloor(null)`）。
- **D2**：`dataClosure` 装配替换（见 Q3）。
- **D3**：`nodeReplay.test.ts` 确认为**零改动**。
- **D4**：`replayPlayback` `resetHero` / `wireFinder=false` 修复（见 Q4）。
- **D5**：`addLayer()` → `addLayer('event')`（`saveables.perf.ts:198`、`coreNode.test.ts:21`、`saveablesRoundTrip.test.ts:135`）。

## 期望值/契约改写台账（追加对齐，均由用户「测试代码自行判断」授权）

| 文件 | 旧 → 新 | 依据 |
| --- | --- | --- |
| `replayPlayback.test.ts` | `execute/finalize` 结果 `resolves.toBe(false)` → `resolves.toBe(ReplayCommandResult.Failed)`（7 处） | shipped `IReplayCommand.execute(): Promise<ReplayCommandResult>`（`Success=0`/`Failed=1`）；与 08-08 `commands.test.ts` 同源契约 |
| `dataClosure.test.ts` | 自定义命令 `execute: async () => false/true` → 返回 `ReplayCommandResult.Failed/Success` 且声明 `type: ReplayCommandType.Active` | 同一 shipped 契约；未声明 Active 会被沙箱当被动命令（告警 194） |
| `dataClosure.test.ts` | 删除手动 `sandbox.playing=true`/`pausing=false` 与 `IManualReplaySandbox` 骨架；`getReplayed()` `1` → `2` | shipped `step()` 仅在 `!playing && !ended` 时惰性预读（`sandbox.ts:297-304`）；`getReplayed()` 返回读取器 index，含预读位 |
| `dataClosure.test.ts` / `saveablesRoundTrip.test.ts` / `saveables.perf.ts` / `saveablesReal.perf.ts` | 原始道具 `equip.value`/`percentage` `new Map(...)` → `Object.fromEntries(...)` / `{}` | `IItemEquipData.value: Record<...>`（`data-common/src/store/types.ts:167`）；`EquipmentState` 以 `Object.entries(equip.value)` 读取，Map 会静默丢失修饰器 |
| `saveablesRoundTrip.test.ts` | 容器往返断言由装备实例/flag 字段**同引用** → 装备按 **uid + 数值**恢复、flag **值**恢复；删除 `hero.followers` 段 | `HeroEquipsStore.loadState` 与 `FlagSystem.loadState` 现均重建实例/字段；`hero.followers` 已从 `HeroState` 移除。等价覆盖：`data-base/src/hero/__test__/follower.test.ts` #06-17-6、`data-base/src/hero/__test__/equipStore.test.ts` |

## 门禁证据

- **`__test__` 聚焦**：`pnpm exec vitest run packages-user/data-state/__test__` → **Test Files 7 passed（7）；Tests 54 passed（54）**（0 failed；较基线 8 文件少 1，即退役的 `tileLegacy`）。
- **`__test__` + `src` 合并**：`pnpm exec vitest run packages-user/data-state/__test__ packages-user/data-state/src` → **16 files / 152 passed / 0 failed**（含 08-08 的 src 9 文件 98 例，未回归）。
- **data-state perf**：`pnpm exec vitest run --config vitest.perf.config.ts packages-user/data-state/__test__` → **3 files / 45 passed / 0 failed**（`pnpm test:perf` 全仓采集 6 文件）。
- **eslint**：`pnpm exec eslint packages-user/data-state/__test__` → **0 errors**（4 条既有 `console.table` `no-console` 警告，非本计划引入）。
- **生产改动范围**：**零生产改动**——`git diff` 仅命中 `packages-user/data-state/__test__/**`（含 1 处删除）。
- **skip 计数**：未新增/未删除任何 `it.skip`/`.todo`；`data-state/__test__` 内 `.skip`/`.todo` 计数为 0；仓库级 skipped 仍为 1（`data-base/src/hero/equipment.test.ts` 码 147）。

## 并发保护（D-08）

未触碰、未暂存、未提交任何用户并发改动（`packages-user/client-*`、`packages/system/src/ui/*` 等）。每个任务仅以显式路径 `git add` 声明文件；从未使用 `git add -A` / `git add .`。`.planning/milestone.lock`、`.planning/state.json` 为工具写入，未纳入提交。

## Task Commits

1. **Task 1: 共享夹具 + 寻路/楼层核心（closed-loop/coreNode/replayPlayback/saveablesRoundTrip）** — `98118fa` (test)
2. **Task 2a: 退役 `tileLegacy.test.ts`** — `827e11c` (test)
3. **Task 2b: 其余集成测试 + perf 对齐（dataClosure/enemyCombination/3 perf）** — `ff9fd77` (test)
4. **Task 2c: 夹具删除已失效 `.load()` 调用** — `551e63d` (test)

> 说明：`git add` 因对已删除路径报 `pathspec did not match`，使 Task 2 的首个提交仅含删除；随后两个提交补齐 5 个改动文件与夹具 `.load()` 修复。三次提交同属 Task 2 的对齐工作，逐条列此以示原子性边界。

**Plan metadata:** 见下方「Metadata commit」。

## Files Created/Modified

- `packages-user/data-state/__test__/fixtures/closed-loop.ts` — CoreState 装配对齐、两处 `setFloor(map)`、删除已失效 `eventHook.load()`；`IClosedLoopFixture` 成员逐字保留。
- `packages-user/data-state/__test__/coreNode.test.ts` — 本地 `createCoreState()` helper、`addLayer('event')`。
- `packages-user/data-state/__test__/replayPlayback.test.ts` — 删 `useMapState`、`DefaultPassPredicateImpl(state)`、注入 `Dir4FaceHandler`、`resetHero` 传真实地图、`ReplayCommandResult` 断言。
- `packages-user/data-state/__test__/saveablesRoundTrip.test.ts` — 本地 helper、`equip.value` Record、`setFloor` 重排/`null`、`addLayer('event')`、容器恢复按 uid/值。
- `packages-user/data-state/__test__/dataClosure.test.ts` — 本地 helper、`equip.value` Record、`ReplayCommandResult`+Active 命令、沙箱自然预读。
- `packages-user/data-state/__test__/enemyCombination.test.ts` — 本地 helper。
- `packages-user/data-state/__test__/mapScenario.perf.ts`、`saveables.perf.ts`、`saveablesReal.perf.ts` — CoreState 装配、Record 道具定义、`addLayer('event')`；性能参数与计时逻辑逐字不变。
- `packages-user/data-state/__test__/tileLegacy.test.ts` — **删除**（Q1 授权退役）。
- `packages-user/data-state/__test__/nodeReplay.test.ts`、`nodeTracer.test.ts`、`replayVerifier.ts` — **零改动**。
- `.planning/phases/08-test-refactor-alignment/deferred-items.md` — 新建（登记两处域外既有失败）。

## Decisions Made

见 frontmatter `decisions`（Q1–Q4 + D1–D5 + 追加对齐 5 条）。

## Deviations from Plan

### 1. [用户授权 · Q1] 退役 `tileLegacy.test.ts`

- **Found during:** Task 2。
- **Issue:** 计划为 Task 0 裁决项；用户明确 legacy **完全不得测试**，直接删除该文件、不新增替代。
- **Fix:** `git rm`；等价覆盖无需（被测模块已整体删除）。
- **Committed in:** `827e11c`（Task 2）。

### 2. [追加对齐 · 用户授权「测试代码自行判断」] 录像结果契约由布尔改 `ReplayCommandResult`

- **Found during:** Task 1（replayPlayback 6 用例）/ Task 2（dataClosure）。
- **Issue:** 测试期望 `execute/finalize` 返回布尔 `false`，shipped 契约返回 `ReplayCommandResult`（`Success=0`/`Failed=1`）；布尔落 `checkReplayStatus` 的 else 分支被当 `Ignored`（返回 true），掩盖失败。
- **Fix:** 期望对齐 `ReplayCommandResult.Failed`；dataClosure 自定义命令返回枚举并声明 `ReplayCommandType.Active`。未弱化断言、未删用例。
- **Committed in:** `98118fa`（Task 1）、`ff9fd77`（Task 2）。

### 3. [Rule 1 - Bug/契约漂移 · 追加] 道具原始定义 `equip.value` 形状 Map → Record

- **Found during:** Task 1（saveablesRoundTrip 容器用例）/ Task 2（dataClosure #06-17-2）。
- **Issue:** 原始道具定义传 `new Map(...)`，而 `IItemEquipData.value` 为 `Record`；`EquipmentState` 以 `Object.entries` 读取 Map 得空，装备修饰器静默失效。
- **Fix:** 改为 `Object.fromEntries(...)` / `{}`（对齐 data-base 既有 `createEquipItem` 惯例）。
- **Committed in:** `98118fa`（Task 1）、`ff9fd77`（Task 2）。

### 4. [追加对齐] 同引用契约移除后改为值/uid 恢复

- **Found during:** Task 1（saveablesRoundTrip 容器用例）。
- **Issue:** #06-17-4（装备实例同引用）与 #06-17-5（flag 字段同引用）契约在重构后移除：`HeroEquipsStore.loadState` 重建实例、`FlagSystem.loadState` 重建字段（见 `data-base/saveLoad.test.ts` 既有 uid 级断言）；`hero.followers` 已从 `HeroState` 移除。
- **Fix:** 断言改为装备 uid + 数值恢复、flag 值恢复；删除 `hero.followers` 段；describe/it 文案同步更新。等价覆盖：`follower.test.ts` #06-17-6、`equipStore.test.ts`。未削弱其它用例。
- **Committed in:** `98118fa`（Task 1）。

### 5. [Rule 1 · 追加] 夹具 `eventHook.load()` 已不存在

- **Found during:** Task 2（dataClosure/nodeTracer 红灯）。
- **Issue:** `addHook(...)` 现直接加载并返回仅有 `unload()` 的控制器；`.load()` 抛 `eventHook.load is not a function`。
- **Fix:** 删除 `.load()` 调用（钩子已在 `addHook` 内生效）。
- **Committed in:** `551e63d`（Task 2）。

### 6. [Rule 3 · 提交边界] Task 2 拆为三个提交

- **Found during:** Task 2 提交。
- **Issue:** 对已删除路径执行 `git add` 报 `pathspec did not match`，导致首个提交仅含删除。
- **Fix:** 追加两个提交补齐 5 个改动文件与夹具 `.load()` 修复；未使用 `--amend`、未 `reset`。
- **Committed in:** `827e11c` + `ff9fd77` + `551e63d`（Task 2）。

---

**Total deviations:** 1 用户授权退役（Q1）+ 4 追加对齐（录像契约、equip.value 形状、同引用契约、夹具 hook）+ 1 提交边界处理。
**Impact on plan:** 生产改动为零；测试改动限于 `data-state/__test__/**`；未弱化其它断言、未删其它用例、零新增依赖、零新增 skip。

## Issues Encountered

- 计划未在 Task 0 预见的三处 shipped 漂移（`ReplayCommandResult` 契约、`equip.value` 为 Record、装备/flag 同引用契约移除、`addHook` 无 `.load()`）在执行期由用户「测试代码自行判断」授权后按 shipped 形状对齐，逐条登记。
- `pnpm test:perf` 全仓采集 6 文件中 `data-base/.../attribute.perf.ts` 收集失败，属域外既有问题（非本计划文件），记入 `deferred-items.md`。

## Known Stubs

None。

## Threat Flags

None——未引入新的网络/鉴权/文件访问/信任边界表面。`T-08-09-01..05/SC` 缓解均满足：dataClosure/nodeTracer 未被为「参与」而改断言（仅经夹具转绿）；tileLegacy 仅退役不伪造；未删其它用例/未新增 skip；perf 只改装配形状、性能参数与计时逻辑逐字不变；仅以显式路径提交、未提交用户并发改动；未安装任何包。

## Metadata commit

`docs(08-09): complete data-state integration test alignment plan`（记录 SUMMARY/STATE/ROADMAP/REQUIREMENTS）。

## Next Phase Readiness

- `data-state/__test__` 集成层对齐完成（7 files / 54 passed），`__test__`+`src` 合并 152/152 全绿；data-state 全部测试与 perf 均已对齐，为 Phase 08 收口与后续验证铺路。
- 无阻塞。域外既有失败（`attribute.perf.ts`、`data-common/sandbox.test.ts`）记入 `deferred-items.md`，由对应数据包对齐计划承担。

---

*Phase: 08-test-refactor-alignment*
*Completed: 2026-10-07*

## Self-Check: PASSED

- FOUND: .planning/phases/08-test-refactor-alignment/08-09-SUMMARY.md
- FOUND: 98118fa (Task 1)
- FOUND: 827e11c (Task 2)
- FOUND: ff9fd77 (Task 2)
- FOUND: 551e63d (Task 2)
