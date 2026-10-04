# Phase 8: 测试重构与接口对齐 - Research

**Researched:** 2026-10-04
**Domain:** 数据端（`packages-user/data-{common,base,system,state}`）单测目录迁移 + 按「系统性收尾」后 shipped 接口重对齐
**Confidence:** HIGH（接口结论均以 live 源码为锚；不确定性集中在「该删还是该改」的裁决项）

## Summary

本阶段的本质是**测试对齐**，不是生产改造。侦察基线（`pnpm test:ci` = 66 文件 / 45 failed / 21 passed；339 failed / 367 passed / 1 skipped，HEAD `109fad3`）所反映的全部失败族，其根因均可从**当前 live 源码**逐条定位：Phase 6/7 编写测试后，用户又做了一轮「系统性收尾」（删 `createCoreState`/`DirectionMapper`/`getFaceMovement` 系列工具/`initMapState`/`setLayerAlias`/`TileLegacyBridge`，收紧 `CoreState` 构造配置、`MapState`/`MapLayer`/`HeroLocation.setFloor` 签名、把 `Hookable.addHook` 的返回从「可 `.load()`」改为 `IHookController`（仅 `.unload()`），把录像写入面从 `replay.route` 改为 `replay.array`，把寻路注入面从 `useMapState`/`useDirGroup` 改为 `useMapLayer`/`useFaceHandler`），并新增/移除了一批 logger 码。测试仍在断言已被删除或改签名的旧面，因此大面积红。

**Primary recommendation:** 按 D-06 先出**纯目录迁移计划**（只移动 + 修相对导入，验证采集文件数与迁移前一致），再按子系统出**对齐计划**（每个失败族给出「旧断言 → 新调用形状」的逐文件修改），最后出**覆盖补测计划**（21 个当前发出但 06-COVERAGE-MAP 无覆盖的码 + 7 个已不再发出却被覆盖表登记的码）。任何「删测试文件」或「改契约」的决定（`utils.test.ts`、`tileLegacy.test.ts`、`coreEventLayer.test.ts`、158/175 码、62/63/64/84/130 码）都必须走 Task 0 用户裁决，不得由执行者自行假设。

## User Constraints (from CONTEXT.md)

> 以下逐字复制自 `08-CONTEXT.md`。Planner 必须原样遵守；研究不得推荐与之冲突的方案。

### Locked Decisions

- **D-01:** 范围 = 四包 `packages-user/data-{common,base,system,state}` 全部单测；`script/` 暂不纳入。
- **D-02:** 迁移到同目录 `__test__/`；`data-state/test/` → `data-state/__test__/`（`fixtures/` 随迁）。
- **D-03:** 错误码覆盖以 `packages/common/src/logger.json` 为准。
- **D-04:** 「全绿」= 所有测试通过；既有表示**不可达错误码**的 `it.skip` 保留（当前仅 code 147 一条）。
- **D-05:** 接口设计不再变更；本阶段只做「对齐」（接口语义变化 + 接口设计变化），不新增接口。
- **D-06:** **迁移方式 (a)**：先出独立「目录迁移」计划（全量移动 + 修相对导入，测试仍红但位置正确、可独立验证），后续按子系统对齐。
- **D-07:** **覆盖侧单列计划**：先盘点数据端错误码（从 `packages-user/data-*` 的 `logger.error/warn` 调用点反推）与公共接口清单及现有覆盖缺口，再补测。
- **D-08:** 用户并发进行渲染端收尾，可能触及数据端内容，但**不改接口设计、不影响测试**；AI **不得提交用户改动的文件**；若 AI 正在进行的行动与用户改动冲突，**先暂停并向用户汇报**。
- **D-09:** 每个计划执行前按项目规则设 **Task 0 汇报关卡**（`autonomous: false`），用户确认后方可执行。
- **D-10:** 测试面零生产改动；仅当某失效确由数据端重构遗漏导致、且用户确认后，才可做最小生产修复（否则退出并汇报）。

### the agent's Discretion

- 迁移计划的具体移动方式（脚本/逐文件）、对齐计划的子系统切分与顺序、覆盖补测的范围与用例设计，由实现者在上述约束下决定；发现新的接口/设计疑问立即提问，不自行假设。

### Deferred Ideas (OUT OF SCOPE)

- `script/check-data-circular.test.ts`。
- 渲染端 / legacy 测试（后续阶段）。
- `pnpm check:type` 全仓（既有渲染端诊断不在本阶段范围）。

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-02 | 测试文件统一归入 `__test__` 目录，并按数据端当前接口对齐既有测试、修复重构遗漏导致的测试失效（`REQUIREMENTS.md:38`，Traceability `:71` 映射 Phase 8） | 迁移配置可零改动（见「迁移配置裁决」）；接口 delta 逐子系统清单（见「逐子系统接口 Delta」）；`pnpm test:ci` / `pnpm test:perf` 全绿验收 |

> 说明：Phase 8 只映射 `TEST-02`。`TEST-01`（Phase 6）保持 In Progress，不在本阶段范围（`REQUIREMENTS.md:70`）。

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 测试文件落位（`__test__/`） | 各数据包源码目录 | — | D-02 要求「同目录 `__test__/`」，迁移面仅文件系统 |
| 接口对齐（旧断言 → shipped 形状） | `packages-user/data-*` 测试 | 各包源码 `types.ts`（对照面，只读） | 以 shipped 源码为唯一事实源；D-10 禁止生产改动 |
| 错误码覆盖盘点 | `packages/common/src/logger.json`（码表） | `packages-user/data-*` 源码 `logger.*` 调用点 | D-03/D-07 明确以码表为准、从调用点反推 |
| 公共接口覆盖盘点 | 各包 barrel `index.ts` + `types.ts` | `06-COVERAGE-MAP.md`（既有映射） | 覆盖现状基线；本阶段只补测试 |
| 性能测试（`*.perf.ts`） | 隔离 lane `vitest.perf.config.ts` | 各包 `*.perf.ts` | `test:perf` 独立 include，与 `test:ci` 隔离 |
| 日志码契约（新增/退役码） | `logger.json` | 用户裁决 | 涉及契约变化，D-10 + AGENTS.md 要求用户确认 |

## 迁移配置裁决（研究任务 4）

**裁决：迁移到 `__test__/` 不需要任何配置改动。**

| 配置 | 现状（anchor） | 迁移后是否需改 | 依据 |
|------|----------------|----------------|------|
| `vite.config.ts` 测试收集 | `test: { testTimeout: 30000, hookTimeout: 30000 }`，**无 `test.include`**（`vite.config.ts:46-49`） | 否 | 使用 Vitest 默认 include glob（`**/*.{test,spec}.?(c|m)[jt]s?(x)`）。`__test__/` 不在默认 exclude 列表内，命中不受目录名影响 |
| `vite.config.ts` 别名 | `packages-user/*/src` → `@user/<name>`（`vite.config.ts:21-27`） | 否 | 别名按包名解析；`__test__/` 内的相对导入仍是源码目录内的相对路径 |
| `vitest.perf.config.ts` | `test: { include: ['**/*.perf.ts'], ... }`（`vitest.perf.config.ts:29`） | 否 | `**` 匹配任意深度，`__test__/` 下的 `*.perf.ts` 仍被收集 |
| `tsconfig.json` | `include` 含 `"packages-user/**/*.ts"`（`tsconfig.json:30`） | 否 | `**/*.ts` 覆盖 `__test__/` |
| `package.json` 脚本 | `test:ci = vitest run`、`test:perf = vitest run --config vitest.perf.config.ts`（`package.json:14-15`） | 否 | 命令不带路径过滤 |

**唯一需要做的是导入路径编辑**（不是配置）：`data-state/test/*.ts` 迁到 `data-state/__test__/` 后，`../src/core` 与 `./fixtures/...` 的相对层级多一层，相关 specifier 需同步改；`test/fixtures/` 目录随迁后其内部对 `../../src/core.ts` 的引用也需重算。这属于「迁移计划」的文件编辑范畴（D-06），不属配置项。

**验证迁移完整性的方法（供迁移计划采用）：** 迁移前记录 `pnpm test:ci` 采集文件数（基线 66 = 数据端 65 `.test.ts` + `script/check-data-circular.test.ts` 1）；迁移后重跑确认采集数仍为 66、`test:perf` 采集 6。

## 逐子系统接口 Delta（研究任务 1）

> 每行给出「测试当前写法（file:line）→ shipped 形状（file:line）」与类别（对应基线失败族 A–G）。类别定义：A=引用已删/改名导出；B=`CoreState` 加载配置形状；C=录像桩 `replay.array`；D=`addHook(...).load()` 链；E=引用已移动/删除模块；F=公共接口改名/签名；G=断言语义漂移。所有 shipped 形状均以 live 源码为准，不采用 07-VERIFICATION 旧快照。

### 8.1 data-common/common

| 符号 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|------|------------------------|------------------------------|------|
| `utils.ts` 整个模块 | `import { degradeFace, fromDirectionString, getFaceMovement, nextFaceDirection } from './utils'`（`packages-user/data-common/src/common/utils.test.ts:4-9`） | **模块与 4 个函数在全仓源码中已不存在**（对 `packages-user/data-common/src` 的全量扫描仅命中测试文件本身）。`common/index.ts` 只导出 `./face`、`./faceManager`、`./indexer`、`./mover`、`./types`（`packages-user/data-common/src/common/index.ts:1-5`）。职责替代：`IFaceHandler` 的 `degrade`/`movement`/`next`/`dirOf`（`packages/common/src/utils/types.ts:152`；实现 `packages-user/data-common/src/common/faceManager.ts:94-216`），已由 `faceManager.test.ts` 覆盖 | E |
| `DirectionMapper` | `import { DirectionMapper } from '@motajs/common'` + `new DirectionMapper()`（`data-base/src/map/tile.test.ts:15,93`；`dynamicTile.test.ts:15,93`；`mapState.test.ts:14,84`；`mapLayer.test.ts:16,104`；`gameMap.test.ts:13,86`；`saveLoad.test.ts:13,91`；`mover.test.ts:14,89` 等） | **`@motajs/common` 已无 `DirectionMapper`**（`packages/common/src` 全量扫描 0 命中）；`IDataCommon` 也已无 `directionMapper` 成员（`packages-user/data-common/src/types.ts:50-65` 逐字：`tileStore`/`itemStore`/`mapStore`/`eventStore`/`roleFace`/`faceManager`/`replaySystem`）。朝向能力改由 `IFaceManager`（`faceManager.ts:13-39`）+ `IFaceHandler` 提供 | A / F |
| `RoleFaceBinder`/`FaceManager`/`Dir4FaceHandler`/`Dir8FaceHandler` | `face.test.ts:11`、`faceManager.test.ts:4` | 均存在（`face.ts:13` `export class RoleFaceBinder`；`faceManager.ts:94,176,222`） | —（兼容） |
| `ObjectMover`/`ObjectAnimDirection`/`ObjectMoveType`/`IObjectMovable`/`ObjectMoveStep` | `mover.test.ts:5-10`、`indexer.test.ts:3` | `common/mover.ts`、`common/indexer.ts` 存在（`common/index.ts:3-4`） | —（兼容，待执行期以编译为准） |

### 8.2 data-common/replay

| 符号 / 行为 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|-------------|------------------------|------------------------------|------|
| `addHook(...).load()` 链 | `sandbox.addHook({...}).load()`（`packages-user/data-common/src/replay/sandbox.test.ts:80,257,279,299,331,367,403`）；`system.addHook({...}).load()`（`system.test.ts:84,122`） | `Hookable.addHook(hook): C` 返回 `IHookController`，**只有 `unload()`**（`packages/common/src/hook.ts:23-32`；接口 `packages/common/src/types.ts:52-60` 逐字：`readonly hook: Partial<H>; unload(): void;`）。`addHook` 内部已直接 `hook.awake?.(...)` 并加入 `loadedList`（`hook.ts:29-30`），**无 `load()` 方法** | D |
| `ReplaySystem.array` | `route: system.array`（`sandbox.test.ts:36,229`；`saveLoad.test.ts:78`；`system.test.ts:126,141`） | `ReplaySystem.array` 存在（`packages-user/data-common/src/replay/system.ts:27` `readonly array: IReplayArray;`） | —（兼容） |
| `ReplaySandbox` 配置 `route` | `route: system.array`（`sandbox.test.ts:36`） | `ReplaySandbox` 构造器首参 `readonly route: IReplayArray`（`sandbox.ts:55-59`）；config 字段在 `IReplaySandboxConfig` | —（兼容，`route` 指数组本身） |
| 码 158 / 175 | `expect(warn).toHaveBeenCalledWith(158, '1', '[]')`（`sandbox.test.ts:92,118`）、`...(175, '1')`（`sandbox.test.ts:171,193`） | **当前 `sandbox.ts` 不发出 158/175**；执行/finalize 失败统一走 `logger.error(72, method)`（`sandbox.ts:136`），被动/未知步走 `logger.warn(157,...)`（`:89,119,178`）与 `logger.warn(194,...)`（`:187`）。`logger.json:242-243` 仍有 158/175 文案，但无调用点 | G（契约变化，需裁决） |

### 8.3 data-common/store

| 符号 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|------|------------------------|------------------------------|------|
| `TileStore` 全部公开面 | `tileStore.test.ts` 调 `addTile`/`getEvent`/`getData`/`idToNumber`/`numberToId`/`num`/`id` | 全部存在（`packages-user/data-common/src/store/tileStore.ts:18-88`：`getData`/`getEvent`/`getType`/`addTile`/`idToNumber`/`numberToId`/`num`/`id`/`identity`） | —（兼容） |
| `GameEventStore` | `eventStore.test.ts` 经 `@user/data-common` barrel 取 `GameEvent`/`GameEventStore` | 存在（`store/eventStore.ts:5` `export class GameEventStore`；`store/index.ts:1`） | —（兼容） |
| 码 170/133/134/181 | 无（06-COVERAGE-MAP 未登记） | 新增调用点：`logger.warn(170, id)`（`eventStore.ts:16`）、`logger.warn(133, ...)`/`(134, ...)`（`tileStore.ts:35,39`）、`logger.warn(181, ..., 'item'/'enemy')`（`itemStore.ts:13`、`enemyStore.ts:13`） | 覆盖缺口（见 §9） |

### 8.4 data-base/enemy

| 符号 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|------|------------------------|------------------------------|------|
| `EnemyManager` 构造 | `manager.test.ts` 经 `./manager` 动态导入后构造（`manager.test.ts:38,42`） | `constructor(private readonly tileStore: ITileStore) {}`（`packages-user/data-base/src/enemy/manager.ts:35`）——**首参为 tileStore，且构造器不再接收 legacy bridge** | F（需执行期核对实参个数） |
| `IEnemyLegacyBridge` 类型 | `manager.test.ts:6` `type IEnemyLegacyBridge`；`:58` 以假桥接对象作协作 | `enemy/types.ts` 是否仍导出 `IEnemyLegacyBridge` 需执行期确认（核心装配 `core.ts:150` 已 `new EnemyManager<IEnemyAttr>(this.tileStore)`，全仓 `EnemyLegacyBridge` 仅在 `data-state/src/enemy/legacy.ts:4`；`data-state/src/enemy/index.ts:5` 仍 `export * from './legacy'`） | F |
| 码 53/96/117/118/119/120 | `manager.test.ts`/`enemy.test.ts`/`saveLoad.test.ts` 断言 | 全部存在：53（`manager.ts:51`）、117（`:113`）、119（`:168`）、118（`:185`）、96（`enemy.ts:27`）、120（`enemy.ts:102`） | —（码在，断言值待核） |

### 8.5 data-base/flag

| 符号 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|------|------------------------|------------------------------|------|
| `FlagSystem` 容器面 | `flag/system.test.ts` 调 `occupied`/`setField`/`getField`/`getOrInsert`/`getOrInsertComputed`/`deleteField`/`setFieldValue`/`addFieldValue`/`getFieldValue`/`getFieldValueDefaults` | 全部存在（`packages-user/data-base/src/flag/system.ts:9-58`） | —（兼容） |
| `FlagCommonField` 码 111 | `logger.warn(111, String(this.key))`（`flag/field.ts:28`） | 存在 | —（兼容） |

### 8.6 data-base/map（失败最集中）

| 符号 / 行为 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|-------------|------------------------|------------------------------|------|
| `DirectionMapper` 注入 | `directionMapper: new DirectionMapper()`（11 个 map 测试文件，见 §8.1） | 已删除（见 §8.1） | A |
| `MapState` 构造 | `new MapState(tileStore, state)`（`packages-user/data-base/src/map/tile.test.ts:96`） | `constructor(readonly state: IDataCommon) {}`（`mapState.ts:36`）——**单参 `state`** | F |
| `IGameMap.setLayerAlias` | `map.setLayerAlias(layer, 'event')`（`gameMap.test.ts:121,125,136,261-263`；`mapState.test.ts:122`；`coreEventLayer.test.ts:20,97`） | **方法已不存在**；别名改为在加层时传入：`addLayer(alias: string): IMapLayer`（`map/types.ts:654`；实现 `gameMap.ts:61-71`，逐字 `addLayer(alias: string): IMapLayer`，内部 `this.aliasLayerMap.set(alias, layer)`） | F |
| `addLayer()` 无参调用 | `map.addLayer()`（`gameMap.test.ts:106,118,119,135,175,182,200,216,242,249,258-260`；`mapState.test.ts:121`；`event.test.ts:73`；`saveablesRoundTrip.test.ts:135`；`coreNode.test.ts:21`；`saveables.perf.ts:198`） | `addLayer(alias: string)` 为必填参（`gameMap.ts:61`）。无参调用运行时 alias 为 `undefined`，随后 `setLayerAlias` 缺失才炸；**对齐时须改为 `addLayer('<alias>')`** | F |
| `addHook(...).load()` 链 | `layer.addHook({...}).load()`（`mapLayer.test.ts:149,353,574,605,660,681`）；`map.addHook({...}).load()`（`gameMap.test.ts:104,154,223`）；`mover.test.ts:180` | 同 §8.2：`addHook` 返回 `IHookController`（`packages/common/src/hook.ts:23-32`；`types.ts:52-60`） | D |
| 码 84（重复别名） | `gameMap.test.ts:116,127` `expect(...code).toContain(84)` | **`gameMap.ts` 当前只发 131**（`gameMap.ts:129` `logger.warn(131)`），无 84 调用点 | G |
| 码 130（非本层图块） | `mapLayer.test.ts:584,591` `toContain(130)` | **`mapLayer.ts` 当前无 130 调用点**（现发 8/9/80/81/123/124/127/128/129/46，见 `mapLayer.ts:180,196,237,245,265,352,357,398,402,413,472,871,902,908`） | G |
| 码 62/63/64/125（raw 校验） | `mapState.test.ts` 断言（06-COVERAGE-MAP:57-60 登记） | **`mapState.ts` 当前只发 60/61/121/55/122**（`:45,57,100,263,272`）；无 62/63/64/125 调用点 | G |
| `getMapData()` | `layer.getMapData()` / `getMapData(x,y,w,h)`（`mapLayer.test.ts:165,176-178,186,197,208`；`saveLoad.test.ts:111,266`） | 两个重载均存在（`map/types.ts:332,340-345`；实现 `mapLayer.ts:220-260`） | —（兼容） |
| `DynamicTileMover` 构造 | `map/mover.test.ts` | `constructor(public readonly tile: IDynamicTile)`（`map/mover.ts:18`），内部 `tile.state.faceManager.get(DYNAMIC_MOVER_FACE)`（`:19-20`），缺 handler 发 192（`:47`） | F（依赖 faceManager 预注册） |
| 码 126 / 192 | `mapLayer.test.ts`（126，06-COVERAGE-MAP:66） | `logger.warn(126, ...)`（`map/mover.ts:42`）；`logger.warn(192)`（`map/mover.ts:47`，192 无覆盖） | —/覆盖缺口 |

### 8.7 data-base/hero

| 符号 / 行为 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|-------------|------------------------|------------------------------|------|
| 录像桩 `route` vs `array` | 桩对象 `{ route: { add } }` 或 `route: ReplayRouteStub`（`equipment.test.ts:77,86-89`；`items.test.ts:62`；`follower.test.ts:67`；`mover.test.ts:48`） | 生产写入面为 `replay.array.add(...)`：`equipment.ts:196,214`、`items.ts:101`、`mover.ts:181-190,223`。桩必须暴露 `array: { add }`（保留 `disable`/`revert`） | C |
| `addHook(...).load()` 链 | `controller.addHook({...}).load()`（`follower.test.ts:125,187,215,241,282,311,334,355`）；`rendering.addHook(hook).load()`（`rendering.test.ts:68`）；`controller.load()`（`rendering.test.ts:81`）；`hero.addHook({...}).load()`（`state.test.ts:151,158`）；`location.addHook({...}).load()`（`location.test.ts:86,105`） | 同 §8.2（`hook.ts:23-32`；`types.ts:52-60`） | D |
| `HeroItems.getItem` | `env.items.getItem('key')` / `env.items.getItem('missing')`（`items.test.ts:137,179`） | **`HeroItems` 已无 `getItem`**；公开面为 `getItemState`/`itemCount`/`addItem`（实现 `items.ts:40,46,51`；接口 `hero/types.ts:621 addItem`, `:627 getItemState`）。用例注释自述「getItem 等价于增加一个道具」，替代面即 `addItem` | F |
| `HeroLocation.setFloor` 参数 | `location.setFloor('F2')` / `setFloor('F1')` / `setFloor(undefined)`（`location.test.ts:107,110`；`saveLoad.test.ts:284,289,511,518,543,593,599`；`event.test.ts:76`；`saveablesRoundTrip.test.ts:127,165`；`replayPlayback.test.ts:124`） | `setFloor(map: IGameMap): void`，内部 `this.floorId = map.floorId`（`location.ts:55-59`；接口 `hero/types.ts:331` 逐字 `setFloor(map: IGameMap | null): void;`——**实现与接口签名不一致，实现非空**）。字符串调用需改为传真实 `IGameMap`；`setFloor(undefined)` 在实现下不可表达 | F / G（需裁决，见 Open Q） |
| `HeroEquipment` 构造 | `new HeroEquipment<IHeroAttr>(store, attribute)`（`equipment.test.ts:154`） | `constructor(private readonly store, private readonly attribute)`（`equipment.ts:21-26`） | —（兼容） |
| `HeroFollowersController` 构造 | `new HeroFollowersController(state, location, faceHandler)`（`follower.test.ts:91`） | `constructor(state, heroLocation, faceHandler)`（`follower.ts:101-110`） | —（兼容） |
| `HeroState` 构造 | 经 `createEnv` 装配 | `constructor(state, faceHandler, attribute)`（`state.ts:37-51`） | —（兼容） |
| `alpha`/`setAlpha`/`addFollower`/`removeFollower` | `follower.rendering.alpha`、`setAlpha`、`controller.addFollower(...)`（`follower.test.ts:129,137,285` 等） | 全部存在：`rendering.ts:15,29`；`follower.ts:131 addFollower`, `:196 removeFollower`；接口 `hero/types.ts:436,459,525,562` | —（兼容；此前的 `reading 'alpha'` 系上层桩缺字段连带） |
| 码 108/109/116/142/144/146/147/176 | 各测试断言 | 全部存在：`attribute.ts:83,104,180,260`；`follower.ts:47`；`mover.ts:150,193`；`equipment.ts:165,183,208,243,265,269,280` | —（码在，断言值待核） |
| 码 58/59 | `equipStore.test.ts`/`saveLoad.test.ts` | `equipStore.ts:362,374` | —（兼容） |
| 码 193 | 无（06-COVERAGE-MAP 未登记） | `logger.warn(193, raw.num.toString())`（`items.ts:144`，loadState 缺 item id 注册） | 覆盖缺口 |

### 8.8 data-system/combat

| 符号 / 行为 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|-------------|------------------------|------------------------------|------|
| `addHook(...).load()` 链 | `combat.test.ts:442,474,499`（`.load()`） | 同 §8.2（`hook.ts:23-32`） | D |
| `CombatFlow` 构造 | `combat.test.ts` 装配 | `constructor(readonly state: IStateBase) { super(); }`（`combat.ts:38-40`）——需传 state | F（需核验测试实参） |
| `bindContext`/`bindDamage` 一致性校验 | `combat.test.ts` 断言 138/139/140/141 | `logger.warn(138, 'an enemy context object')`（`combat.ts:62`）、`(138, 'a damage context object')`（`:75`）、`(140)`（`:119`）、`(139, ...)`（`:179,211,215,233,237`）、`(141)`（`:184`） | —（码在） |
| 码 97/98/99/100/101/110 | `context.test.ts` | 全部存在且带 `import.meta.env.DEV` 守卫（`context.ts:401`=97、`456/767`=100、`465`=99、`485/506`=98、`705`=110、`776/786/796`=101）。**注意**：Vitest 默认 `mode=test`，`import.meta.env.DEV` 为 `true`，故 98/99/101 会触发；若测试改为生产模式构建则不会触发 | —（码在；断言依赖 DEV） |
| 码 102/103/104 | `mapDamage.test.ts` | `mapDamage.ts:153`=104、`:197/355`=103、`:351`=102 | —（码在） |
| 码 106/107 | `damage.test.ts` | `damage.ts:76,100,190`=107；`:80,104,126,194`=106 | —（码在） |

### 8.9 data-system/event

| 符号 / 行为 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|-------------|------------------------|------------------------------|------|
| `DirectionMapper` | `eventDispatch.test.ts:69,104,143` | 已删除（见 §8.1） | A |
| 码 171/172 | `eventDispatch.test.ts` 覆盖 | `event/executor.ts:39,46`=172；`:66,73`=171 | —（码在） |
| 事件注册面 | `eventDispatch.test.ts` | `event/index.ts:1-3`（`./system`、`./executor`、`./types`） | —（兼容） |

### 8.10 data-system/path（接口整体改名）

| 符号 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|------|------------------------|------------------------------|------|
| `useMapState` | `system.finder.useMapState(maps)`（`system.test.ts:339`；`performance.test.ts:361`；`replayPlayback.test.ts:109`）；`builder.useMapState(maps)`（`graph.test.ts:276`；`performance.test.ts:368`） | **方法不存在**。`IPathFinder` 现为 `useMapLayer(layer: IMapLayer | null)`（`path/types.ts:125`；实现 `finder.ts:107-115`，转发 `this.graph.useMapLayer(layer)`）。`IMapGraphBuilder.useMapLayer(layer: IMapLayer | null)`（`path/types.ts:52`；实现 `graph.ts:34-39`） | F |
| `useDirGroup` | `graph.test.ts:334`（注释/用法） | **方法不存在**。改为 `useFaceHandler(face: IFaceHandler<number> | null)`（`path/types.ts:70` builder / `:143` finder；实现 `graph.ts:49-51`、`finder.ts:125-127`） | F |
| 方向解析方式 | 测试用 `new DirectionMapper()` 作 `directionMapper` | `graph.ts:102` 遍历 `face.mapMovement()`（`IFaceHandler`），不再经 `IDirectionMapper` | F |
| `PathfindingSystem` 构造 | `system.test.ts` 装配 | `constructor(readonly state: IStateBase) { this.finder = new PathFinder(state); }`（`system.ts:25-27`） | F（需核验实参） |
| `useCostFunction`/`usePassPredicate` | 测试已覆盖 `usePassPredicate` 语义 | 存在（`path/types.ts:58,64,131,137`） | — |
| 码 173/182/183 | 无（06-COVERAGE-MAP 未登记） | `graph.ts:70,74,78`=173、`:82`=183；`finder.ts:110`=182；`system.ts:40`=173 | 覆盖缺口 |

### 8.11 data-state

| 符号 / 行为 | 测试当前写法（anchor） | shipped 形状（anchor，逐字） | 类别 |
|-------------|------------------------|------------------------------|------|
| `createCoreState` | `import { CoreState, createCoreState } from '../src/core'`（`dataClosure.test.ts:15`；`coreNode.test.ts:3`；`saveablesRoundTrip.test.ts:21`；`replayPlayback.test.ts:14`；`enemyCombination.test.ts:20`；`src/replay/commands.test.ts:15`；`test/fixtures/closed-loop.ts:23`；`saveables.perf.ts:12`；`saveablesReal.perf.ts:13`；`mapScenario.perf.ts:16`） | **`createCoreState` 已从 `core.ts` 整体删除**（`core.ts:1-330`，导出仅 `export class CoreState`（`:76`），文件以 `loadState`/`//#endregion` 收尾，无 factory）。新入口 = `new CoreState(config)`，config 形状 `ICoreStateConfig`（见下） | A |
| `CoreState` 加载配置 | `new CoreState()`（`event.test.ts:55`，唯一无参构造点）；旧夹具 `createCoreState()` 无参 | `constructor(config: Readonly<ICoreStateConfig>)`（`core.ts:111`），构造体内 `config.loadStarter`（`:205`）、`config.coreURL`（`:207`）。`ICoreStateConfig` 逐字：`readonly loadStarter: ILoadTaskStarter;` / `readonly coreURL: string;`（`data-state/src/types.ts:7-15`）。无参构造 → `Cannot read properties of undefined (reading 'loadStarter')`（失败族 B）。参考实例：`new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })`（`ins.ts:11-14`）。Node 测试需一个 `ILoadTaskStarter` 实现（`packages/loader/src/starter.ts:3` 仅 `WebLoadStarter`；`packages/loader/src/types.ts:186` 为接口） | B |
| `CoreState.initMapState` | `initializer.initMapState(floors, data)`（`src/coreEventLayer.test.ts:44,137`）；`FakeMapState`/`CoreInitializer` 骨架（`:42-45`） | **`initMapState` 已从 `core.ts` 删除**；职责现由 `MapState.fromRaw(raw)` 承担（`mapState.ts:40-95`，逐字：`fromRaw(raw: IMapRawData): IGameMap | null`，内部 `createMap`→`addLayer(alias)`→`setEventLayer`→事件点位）。**注意 `fromRaw` 参数为单个 raw 对象**，与旧 `(floors, data)` 双参形状不同 | A / F |
| 顶层 `src/legacy/` 模块 | `import { LegacyTileData, TileLegacyBridge } from '../src/legacy/tile'`（`src/tileLegacy.test.ts:3`）；`vi.mock('./legacy', ...)`（`src/coreEventLayer.test.ts:59`） | **`data-state/src/legacy/` 目录不存在**（glob `data-state/src/legacy/**` = 0 文件）；`TileLegacyBridge`/`LegacyTileData` 在全仓源码 0 命中（仅 `.planning` 与本测试）。`core.ts` 已不再装配 legacy bridge（对比 `core.ts:1-224` 无相关 import） | E（测试对象消失） |
| `event.test.ts` 装配 | `new CoreState()`（`:55`）；`map.addLayer()`（`:73`）；`state.hero.location.setFloor('F1')`（`:76`） | 见 B / F / F 各条 | B / F |
| `data-state` 夹具目录 | `test/fixtures/closed-loop.ts`（`closed-loop.ts:23,64`）随迁后路径变化 | 迁移层面（D-02） | 迁移 |
| 码 112/113/177/178 | `saveablesRoundTrip.test.ts` | `core.ts:259,281,306,325` | —（码在） |
| 码 2001–2008 | `src/replay/commands.test.ts` | `src/replay/commands.ts:43,52,96,108,136,160,193,218` | —（码在） |
| 码 137 | `src/enemy/calculator.test.ts` | `src/enemy/calculator.ts:94` | —（码在） |
| 码 66/67/68/69、1001 | 无（06-COVERAGE-MAP 未登记） | `loader/jsoncProcessor.ts:16,25`；`loader/loader.ts:122`；`loader/hook.ts:9`；`event/map.ts:26` | 覆盖缺口 |

## 数据端错误码覆盖表（研究任务 2）

**盘点口径（D-07）：** 以 `packages/common/src/logger.json`（权威码表，全 282 行已读）为准，从 `packages-user/data-{common,base,system,state}/src` 的 `logger.error(`/`logger.warn(` 调用点反推。共扫描到 **102 个唯一码**（按包去重后：data-common 26、data-base 38、data-system 20、data-state 18）。

**对照基线：** `06-COVERAGE-MAP.md` 表列 **88 个码**（combat 15 + calculator 1 + enemy 4 + replay 17 + hero 7 + map 21 + common/flag 3 + save/load 11 + mover 1 + commands 8）。

**判定结果：**
- **已发出且已覆盖：74 个**（102 − 21 未覆盖 − 7 陈旧）。
- **已发出但 06-COVERAGE-MAP 无覆盖（缺口）：21 个。**
- **06-COVERAGE-MAP 有登记但当前源码无发出点（陈旧/契约变化）：7 个。**

### 9.1 缺口清单（当前发出、覆盖表未登记 — 21 个）

| code | 归属模块（emit anchor） | 说明 |
|------|--------------------------|------|
| 70 | `data-common/src/replay/array.ts:405,728` | 编码/解码未知 param type（`logger.error(70, 'encode'/'decode', ...)`） |
| 72 | `data-common/src/replay/sandbox.ts:136` | 回放步执行/finalize 失败（统一收口，取代旧 158/175） |
| 73 | `data-common/src/replay/sandbox.ts:84,93` | 非法 `getPassive` 调用 |
| 133 | `data-common/src/store/tileStore.ts:35` | `addTile` 重复 num |
| 134 | `data-common/src/store/tileStore.ts:39` | `addTile` 重复 id |
| 170 | `data-common/src/store/eventStore.ts:16` | 事件 id 重复注册 |
| 179 | `data-common/src/replay/array.ts:448,500,544` | 越界 index（`insert`/`delete`/`set`），Phase 7 新增 |
| 181 | `data-common/src/store/itemStore.ts:13`、`enemyStore.ts:13` | store 重复注册覆盖 |
| 194 | `data-common/src/replay/sandbox.ts:187` | 主动步后出现被动步 |
| 192 | `data-base/src/map/mover.ts:47` | `faceManager` 缺 Dir8 handler |
| 193 | `data-base/src/hero/items.ts:144` | `loadState` 缺 item id 注册 |
| 171 | `data-system/src/event/executor.ts:66,73` | 事件 id 不在 eventStore |
| 172 | `data-system/src/event/executor.ts:39,46` | 事件返回非布尔 |
| 173 | `data-system/src/path/graph.ts:70,74,78`、`system.ts:40` | 图构建缺绑定（旧码，仍发出） |
| 182 | `data-system/src/path/finder.ts:110` | `useMapLayer` state 不一致 |
| 183 | `data-system/src/path/graph.ts:82` | 起始点越界 |
| 66 | `data-state/src/loader/jsoncProcessor.ts:16` | prefixed jsonc 前缀缺失 |
| 67 | `data-state/src/loader/jsoncProcessor.ts:25` | prefixed jsonc 解析失败 |
| 68 | `data-state/src/loader/loader.ts:122` | extra config id 冲突 |
| 69 | `data-state/src/loader/hook.ts:9` | 上一加载阶段 core config 未加载 |
| 1001 | `data-state/src/event/map.ts:26` | `setBlock` 未知图块 |

> 注：173 在 `06-COVERAGE-MAP.md` 正文（02 相关小节）曾被提及，但**不在覆盖表内**，故计为缺口；补测计划需明确它是否属于本阶段新增覆盖（D-07），或经用户确认归入 path 子系统专项。

### 9.2 陈旧登记（覆盖表有、当前源码无发出 — 7 个）

| code | `06-COVERAGE-MAP.md` 登记 | 当前源码 | 需裁决 |
|------|---------------------------|----------|--------|
| 62 | `mapState` raw key 非数字（`06-COVERAGE-MAP.md:58`） | `mapState.ts` 无 62 调用点（现发 60/61/121/55/122） | 契约是否已取消，或测试应删除 |
| 63 | `mapState` 容器缺失（`:59`） | 无调用点 | 同上 |
| 64 | `mapState` 非法值/类型（`:60`） | 无调用点 | 同上 |
| 84 | `gameMap` 重复别名（`:63`） | `gameMap.ts` 无 84；别名改由 `addLayer(alias)` 承担 | 契约是否已取消 |
| 130 | `mapLayer` 非本层图块（`:70`） | `mapLayer.ts` 无 130 | 契约是否已取消 |
| 158 | `sandbox` 执行失败（`:39`） | 无 158；改 `logger.error(72, method)`（`sandbox.ts:136`） | 契约码迁移（158→72） |
| 175 | `sandbox` notExecuted 失败（`:45`） | 无 175；同上 | 契约码迁移 |

> 另：`06-COVERAGE-MAP.md:210` 正文提到码 125（`mapState` 排序楼层集不一致），但当前 `mapState.ts` 无 125 调用点，且 125 未进入表。补测盘点时应一并裁决。

### 9.3 码表文案可识别性（供补测断言）

- 码表权威在 `packages/common/src/logger.json`；示例逐字：`"147": "No available equipment slot to equip $1."`（`logger.json:232`）、`"179": "Replay $1 received an out-of-range index $2, ..."`（`:264`）。
- 断言机制沿用 `logger.catch(fn)` 与 `logger` spy（Phase 6 已建立，`packages/common/src/logger.ts`）。
- 不可达码 147 的 `it.skip` 保留（D-04；`data-base/src/hero/equipment.test.ts:352-353` 注释 + skip，`logger.json:232` 文案）。

## 公共接口覆盖表（研究任务 3）

> 口径：以各包 barrel `index.ts` 与 `types.ts` 的公开面为准，对照 `06-COVERAGE-MAP.md` 模块归属与当前测试文件。标 ✅ = 有测试覆盖；⚠️ = 部分/待执行期核验；❌ = 当前无测试覆盖。

### 10.1 data-common（Layer 0 公共层）

| 公开面（barrel anchor） | 主要接口/类 | 覆盖 |
|-------------------------|-------------|------|
| `common`（`data-common/src/common/index.ts:1-5`） | `RoleFaceBinder`、`FaceManager`/`Dir4FaceHandler`/`Dir8FaceHandler`、`MapLocIndexer`、`ObjectMover` 及 `ObjectMoveType`/`ObjectAnimDirection` | ✅（`face`/`faceManager`/`indexer`/`mover` 测试；**唯一断裂 = `utils.test.ts` 引已删模块**） |
| `event`（`data-common/src/event/index.ts:1-2`） | `GameEvent`、事件类型 | ✅（`eventStore.test.ts` 经 barrel） |
| `replay`（`data-common/src/replay/index.ts:1-5`） | `ReplayArray`、`ReplaySandbox`、`ReplaySystem`、安全收集装饰器 | ✅（`array`/`sandbox`/`system`/`func`/`saveLoad` 测试） |
| `save`（`data-common/src/save/index.ts:1`） | `SaveCompression` 等 | ⚠️（经各 saveLoad 测试间接） |
| `store`（`data-common/src/store/index.ts:1-5`） | `TileStore`/`ItemStore`/`MapStore`/`GameEventStore` | ✅（`tileStore`/`eventStore`；Item/Map store 经上层） |
| `types`（`data-common/src/types.ts`） | `IEnemyAttr`、`IHeroAttr`、`IDataCommon`、`IDataCommonExtended` | ⚠️（结构类型，无独立测试，合理） |

### 10.2 data-base（Layer 1 数据层）

| 公开面（barrel anchor） | 主要接口/类 | 覆盖 |
|-------------------------|-------------|------|
| `enemy`（`data-base/src/enemy/index.ts:1-4`） | `Enemy`、`EnemyManager`、special | ✅（`enemy`/`manager`/`special`/`saveLoad`） |
| `flag`（`data-base/src/flag/index.ts:1-3`） | `FlagSystem`、`FlagCommonField` | ✅（`system`/`saveLoad`） |
| `hero`（`data-base/src/hero/index.ts`） | `HeroState`/`HeroAttribute`/`HeroEquipment`/`HeroEquipsStore`/`HeroItems`/`HeroFollowersController`/`HeroLocation`/`HeroMover`/`HeroRendering`/修饰器 | ✅（11 个测试文件；`getItem` 已删、`setFloor` 签名变化导致部分红） |
| `map`（`data-base/src/map/index.ts:1-5`） | `GameMap`/`MapState`/`MapLayer`/`DynamicTileMover`/tile | ✅（11 个测试文件；`DirectionMapper`/`setLayerAlias`/`MapState` 构造/`.load()` 导致大面积红） |
| `types`（`data-base/src/types.ts`） | `IStateBase`、`IStateSaveData`、`IDataBaseExtended` | ⚠️（结构类型） |

### 10.3 data-system（Layer 2 系统层）

| 公开面（barrel anchor） | 主要接口/类 | 覆盖 |
|-------------------------|-------------|------|
| `combat`（`data-system/src/combat/index.ts`） | `CombatFlow`、`DamageSystem`、`EnemyContext`、`MapDamage`、`enemy.ts` | ✅（`combat`/`damage`/`context`/`mapDamage` + 2 perf） |
| `event`（`data-system/src/event/index.ts:1-3`） | `GameEventSystem`、executor | ✅（`eventDispatch`） |
| `path`（`data-system/src/path/index.ts:1-4`） | `PathFinder`、`MapGraphBuilder`、`PathfindingSystem` | ✅（`graph`/`system`/`performance`；注入面改名致红） |
| `types`（`data-system/src/types.ts`） | `IDataSystem` 等 | ⚠️（结构类型） |

### 10.4 data-state（Layer 3 顶层）

| 公开面（barrel anchor） | 主要接口/类 | 覆盖 |
|-------------------------|-------------|------|
| `enemy`（`data-state/src/enemy/index.ts:1-8`） | `CommonAura`/`GuardAura`、`MainDamageCalculator`、`MainEnemyComparer`、`MainEnemyFinalEffect`、`EnemyLegacyBridge`、mapDamage 视图/转换器、`registerSpecials` | ✅（6 个测试） |
| `event`（`data-state/src/event/index.ts:1-5`） | 8 个内建函数、`createEventRegistrations` | ✅（`event.test.ts`） |
| `hero`（`data-state/src/hero/index.ts:1-3`） | `DefaultHeroMoveTopImpl`、`DefaultPassPredicateImpl` | ⚠️（经集成测试） |
| `loader`（`data-state/src/loader/index.ts:1-4`） | `MotaDataLoader`、`DefaultDataLoaderHook`、`PrefixedJSONCProcessor` | ❌（无独立 loader 测试，且码 66/67/68/69 未覆盖） |
| `replay`（`data-state/src/replay/index.ts:1`） | `ReplayMove`/`ReplayTeleport`/`ReplayUseItem`/`ReplayEquip`/`ReplayUnequip` | ✅（`commands.test.ts`） |
| `common`（`data-state/src/common.ts`） | 顶层公共导出 | ⚠️ |
| `core`（`data-state/src/core.ts`） | `CoreState` | ✅（多集成测试；`createCoreState` 删除、构造签名变化致红） |
| `ins`（`data-state/src/ins.ts`） | 兼容 singleton `state` | ❌（无测试，属兼容层，合理） |
| `shared`（`data-state/src/shared.ts`） | `TILE_WIDTH`/`TILE_HEIGHT`/zIndex 常量/`HERO_DEFAULT_ATTRIBUTE` | ⚠️（经 CoreState 间接） |
| `types`（`data-state/src/types.ts`） | `ICoreStateConfig`、`ICoreState`、`ICoreStateExtended` | ⚠️（结构类型） |

**覆盖结论：** 公共接口面已由 Phase 6 基本铺满。本阶段**不需要新增接口**（D-05）；覆盖工作集中在 §9.1 的 21 个错误码 + `loader` 子系统的独立覆盖缺口。

## Standard Stack

> 本阶段**不安装任何外部包**（纯测试重构 + 对齐），故无 Package Legitimacy Audit。以下为既有测试栈（只读）。

### Core
| Library | Version | Purpose | 依据 |
|---------|---------|---------|------|
| vitest | `^4.0.18` | 测试运行器（`test:ci`/`test:perf`） | `package.json:105`；配置 `vite.config.ts`、`vitest.perf.config.ts` |
| vue-tsc / typescript | `^2.2.12` / `6.0.3` | 类型面（本阶段不设 `check:type` 门禁） | `package.json:99,106` |
| tsx | `^4.21.0` | 脚本执行（`test:data-node`） | `package.json:17,98` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@motajs/common` `logger`/`Hookable`/`IFaceHandler` | workspace | 断言日志码、钩子/朝向驱动 | 全部测试 |
| `@user/data-*` barrels | workspace | 被测面 + 类型 | 全部测试 |

**Installation:** 无需新增依赖。若 Node 环境需要非 Web 的 `ILoadTaskStarter` 以替代 `WebLoadStarter`，优先复用 `packages/loader` 既有实现或测试内 inline stub，**不得新增依赖**（除非用户批准）。

**Version verification:** 版本取自 `package.json`（本会话已读），未联网核验；本阶段不引入新包，风险为零。

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │  迁移计划（D-06）                          │
                    │  src/**/*.test.ts ──move──▶ src/**/__test__/ │
                    │  data-state/test/ ─move──▶ data-state/__test__/ + fixtures/ │
                    │  修相对导入；不改生产、不改配置              │
                    └───────────────┬─────────────────────────┘
                                    │（文件数守恒校验）
                                    ▼
        ┌───────────────────────────────────────────────────────────┐
        │  对齐计划（按子系统，D-05 只对齐不改接口）                    │
        │                                                           │
        │  shipped 源码（唯一事实源）  ◀──对照──  测试断言             │
        │   core.ts / types.ts / *.ts            *.test.ts           │
        │        │                                     ▲             │
        │        │  失败族 A..G 分类                    │             │
        │        └──────────── 逐文件「旧写法→新形状」──┘             │
        └───────────────┬───────────────────────────────────────────┘
                        │（接口面收敛后）
                        ▼
        ┌───────────────────────────────────────────────────────────┐
        │  覆盖计划（D-07）                                          │
        │  logger.json 码表 ─┐                                       │
        │  源码 logger.* 调用点 ─┴─▶ 码→模块→用例 覆盖矩阵            │
        │  21 缺口 + 7 陈旧 ─▶ 补测 / 裁决删除                        │
        └───────────────┬───────────────────────────────────────────┘
                        ▼
        验收：pnpm test:ci（66 文件全绿，1 skip 保留） + pnpm test:perf（6 文件可跑）
```

### Recommended Project Structure（迁移目标，D-02）

```
packages-user/data-common/src/
├── common/__test__/        # face/faceManager/indexer/mover 测试
├── event/__test__/
├── replay/__test__/
├── save/__test__/
└── store/__test__/
packages-user/data-base/src/
├── enemy/__test__/
├── flag/__test__/
├── hero/__test__/
└── map/__test__/
packages-user/data-system/src/
├── combat/__test__/
├── event/__test__/
└── path/__test__/
packages-user/data-state/
├── __test__/               # 原 test/ 迁入；fixtures/ 随迁
└── src/
    ├── enemy/__test__/
    ├── event/__test__/
    ├── replay/__test__/
    └── ...（coreEventLayer.test.ts → src/__test__/）
```

### Pattern 1: `addHook` 后的控制器（对齐 D 族）
**What:** `Hookable.addHook(hook)` 注册即生效，返回 `IHookController`（仅 `unload()`）。
**When to use:** 所有 `*.addHook({...})` 调用点。
**Example:**
```ts
// Source: packages/common/src/hook.ts:23-32, packages/common/src/types.ts:52-60
const controller = layer.addHook({ onUpdateBlock: (block, x, y) => { ... } });
// 旧写法（错误）：layer.addHook({...}).load();
// 结束时若需卸载：controller.unload();
```

### Pattern 2: 录像桩形状（对齐 C 族）
**What:** 生产写入经 `replay.array.add(code, params)`，且 `shouldReplay` 包裹的读取会 `disable()`/`revert()`。
**Example:**
```ts
// Source: packages-user/data-base/src/hero/equipment.ts:196,214; packages-user/data-common/src/replay/system.ts:27
const commands: [ReplayCode, unknown[]][] = [];
let disabled = 0;
const replaySystem = {
    array: { add(code, params) { if (disabled > 0) return; commands.push([code, params]); } },
    disable: () => { disabled++; },
    revert: () => { if (disabled > 0) disabled--; }
};
// 旧写法（错误）：{ route: { add } }
```

### Anti-Patterns to Avoid
- **用 `as never` / `Object.create` 把已删除成员「假装」出来**：`07-16-PLAN.md:484/599` 已明令禁止；本阶段延续。
- **改生产文件让测试转绿**：D-10 禁止；仅经用户确认的「重构遗漏」才可最小修复。
- **删测试用例以图全绿**：D-04 要求「全绿 = 所有测试通过」，仅不可达码 147 的既有 `it.skip` 可保留；删除文件/用例须用户裁决。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Node 环境的 `ILoadTaskStarter` | 自写一套加载器 | 复用 `WebLoadStarter`（`packages/loader/src/starter.ts:3`）或测试内 inline stub；先问用户 | 避免引入非授权设计 |
| 朝向位移/降级/旋转 | 在新测试里重写 `getFaceMovement` 等 | `IFaceHandler` 的 `degrade`/`movement`/`next`/`dirOf`（`faceManager.ts:94-216`） | 旧工具已删，接口是 shipped 面 |
| 图块/地图 fixture 装配 | 自造地图数据结构 | `MapState.fromRaw(raw)`（`mapState.ts:40-95`）+ `addLayer(alias)` | 与生产装载路径一致 |
| 日志断言 | 直接 `console` | `logger.catch(fn)` / `logger` spy（`packages/common/src/logger.ts`） | Phase 6 既有机制 |

**Key insight:** 本阶段的复杂度不在「写新代码」，而在「判定旧断言对应的新形状」；任何凭直觉猜测的形状都会在 vitest 的 `parse()`/运行期第一次调用处爆炸，因此每个不明确点都应落到 Open Questions 让用户裁决，而不是自行假设。

## Common Pitfalls

### Pitfall 1: 把 `createCoreState` 当成改名（其实是被删）
**What goes wrong:** 试图找 `createCoreState` 的新名字，或保留旧 import 让它静默为 `undefined`。
**Why:** `core.ts` 已无 factory；`new CoreState()` 无参又会因 `config.loadStarter` 抛 B 族错误。
**How to avoid:** 统一改为 `new CoreState({ loadStarter, coreURL })`；测试夹具需先解决 `loadStarter` 来源（Open Q）。
**Warning signs:** `Cannot read properties of undefined (reading 'loadStarter')` 或 `not a function`。

### Pitfall 2: `addHook(...).load()` 看似只是删 `.load()`
**What goes wrong:** 删掉 `.load()` 后忘记 `addHook` 已自动加载；或误以为返回对象是 sandbox 本体而继续链式调用。
**Why:** `IHookController` 只有 `unload()`；`hook.awake` 在 `addHook` 内即时调用。
**How to avoid:** 逐处把 `x.addHook({...}).load()` 改为 `x.addHook({...})`；如需卸载用返回的 controller。
**Warning signs:** `addHook(...).load is not a function`。

### Pitfall 3: `setFloor` 传字符串
**What goes wrong:** 保留 `setFloor('F1')`。
**Why:** 实现 `setFloor(map: IGameMap)` 读 `map.floorId`（`location.ts:55-59`），字符串无 `floorId`。
**How to avoid:** 先建真实 `IGameMap`（`maps.createMap`/`fromRaw`），再 `setFloor(map)`；`setFloor(undefined)` 分支（`location.test.ts:110`）在实现下不可表达。
**Warning signs:** `Cannot read properties of undefined (reading 'floorId')` 或 `expected undefined to be 'F2'`。

### Pitfall 4: 覆盖表的「陈旧码」被当成待补测
**What goes wrong:** 为 62/63/64/84/130/158/175 补测，却发现源码根本不发。
**Why:** 用户收尾重构移除了这些调用点/迁移了码（158/175→72）。
**How to avoid:** 先按 §9.2 与用户确认这些码是「取消」还是「迁移」，再决定补测或退役对应用例。
**Warning signs:** `logger.catch` 得到的 `info` 为空。

### Pitfall 5: DEV-only 码在非 DEV 模式不触发
**What goes wrong:** 98/99/101（`context.ts`）带 `import.meta.env.DEV` 守卫；若测试用生产构建跑则断言失败。
**How to avoid:** 保持 Vitest 默认 `mode=test`（DEV=true）；不要为这些码切换构建模式。

## Code Examples

### 正确构造 CoreState（对齐 B 族）
```ts
// Source: packages-user/data-state/src/core.ts:111,205-207; src/types.ts:7-15; src/ins.ts:11-14
import { CoreState } from './core';
import { WebLoadStarter } from '@motajs/loader';

const state = new CoreState({
    loadStarter: new WebLoadStarter(),
    coreURL: 'placeholder'
});
```

### 正确建图并设事件层（对齐 map F 族）
```ts
// Source: packages-user/data-base/src/map/mapState.ts:40-95; gameMap.ts:61; map/types.ts:654
const map = state.maps.createMap('F1', 4, 1);
const layer = map.addLayer('event');          // 别名在此传入（不再 setLayerAlias）
layer.setMapRef(new Uint32Array([1, 1, 1, 1]));
map.setEventLayer(layer);                     // 别名必须为 'event' 才由 fromRaw 自动选为事件层
```

### 正确注入寻路面（对齐 path F 族）
```ts
// Source: packages-user/data-system/src/path/finder.ts:107,121,125; graph.ts:34,45,49
system.finder.useMapLayer(state.maps.get('F1')!.eventLayer);
system.finder.usePassPredicate(predicate);
system.finder.useFaceHandler(faceHandler);    // 取代 useDirGroup
// 旧：system.finder.useMapState(state.maps) / builder.useMapState(...)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `createCoreState()` 无参工厂 | `new CoreState({ loadStarter, coreURL })` | 数据端收尾重构（HEAD `109fad3`） | 测试夹具全部需构造 config |
| `CoreState.initMapState(floors, data)` | `MapState.fromRaw(raw)` | 同上 | 初始化职责移出 core；coreEventLayer.test 需重定向或退役 |
| `IDataCommon.directionMapper` + `DirectionMapper` | `IFaceManager` + `IFaceHandler`（`degrade`/`movement`/`next`/`dirOf`） | `4aaea68` 后 | map/path 测试大面积改注入面 |
| `getFaceMovement`/`degradeFace`/`nextFaceDirection`/`fromDirectionString` | `IFaceHandler` 方法 | 同上 | `utils.ts` 与 `utils.test.ts` 一并消失 |
| `IGameMap.setLayerAlias(layer, alias)` | `addLayer(alias)` | 收尾重构 | map 测试需改加层方式 |
| `Hookable.addHook(...).load()` | `addHook` 即时加载，返回 `IHookController(unload)` | 收尾重构 | 全数据端 ~30 处 `.load()` 需删 |
| 录像写入 `replay.route.add` | `replay.array.add` | `a2a8e6e` | data-base hero 4 个桩需改名 |
| 寻路 `useMapState`/`useDirGroup` | `useMapLayer`/`useFaceHandler` | 寻路重构 | path 测试注入面改写 |
| `HeroItems.getItem` | `getItemState` / `addItem` | 收尾重构 | items.test 2 处调用 |
| `HeroLocation.setFloor(string)` | `setFloor(IGameMap)` | 收尾重构 | 位置/存档测试需真实地图 |
| 码 158/175 回放失败 | 统一 `error(72)`；另有 `warn(194)` | 收尾重构 | sandbox.test 断言需改 |

**Deprecated/outdated:**
- `data-state/src/legacy/`（`TileLegacyBridge`/`LegacyTileData`）——已删除，`tileLegacy.test.ts` 失去被测对象。
- `DirectionMapper` 与旧朝向工具——已从仓库删除，勿在补测中重建。
- 06-COVERAGE-MAP 的 62/63/64/84/130/158/175 登记——当前无发出点（见 §9.2）。

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 迁移到 `__test__/` 不需改 `vite.config.ts`/`vitest.perf.config.ts`/`tsconfig.json` | 迁移配置裁决 | 若某配置隐式排除 `__test__`，迁移后文件不被采集 → 需补配置 |
| A2 | data-common `mover.test.ts`/`indexer.test.ts` 仅因 `DirectionMapper`/`utils` 连带失败，其余面兼容 | §8.1 | 若 `ObjectMover` 面也变，需追加 delta |
| A3 | data-base/enemy、flag 失败主要为连带（fixture 桩）而非独立接口改名 | §8.4/§8.5 | 若 manager 构造/legacy 类型真变，需补 delta |
| A4 | data-system/combat 失败主要来自 `.load()` 与 `CombatFlow` 构造实参，而非战斗语义 | §8.8 | 若语义/断言值漂移，需逐用例核 |
| A5 | 测试不得删，删除类处置（utils.test/tileLegacy.test/coreEventLayer.test）需用户裁决 | Summary/Open Q | 若用户允许删，迁移计划范围扩大 |
| A6 | 陈旧码（62/63/64/84/130/158/175）是重构后的契约变化而非遗漏缺陷 | §9.2 | 若实为遗漏，应走 D-10 生产修复流程 |
| A7 | Node 测试可用 `WebLoadStarter` 或 inline stub 满足 `loadStarter` | §8.11/Don't Hand-Roll | 若必须真实加载器，测试装配复杂度上升 |

## Open Questions（需用户决策）

1. **【高】`createCoreState` 的替代夹具形态**：`createCoreState()` 已删除。测试应统一改为 `new CoreState({ loadStarter, coreURL })`，但 `loadStarter` 用什么？（a）直接 `new WebLoadStarter()`；（b）测试内 inline stub；（c）其他。**这决定 10 个 data-state 测试文件与 3 个 perf 文件 + `fixtures/closed-loop.ts` 的迁移改法**。
   - What we know：`ins.ts:11-14` 用 `WebLoadStarter`；`@motajs/loader` 只导出 `WebLoadStarter` 一个实现。
   - Recommendation：Task 0 让用户拍板；在无新依赖前提下，倾向 (a) 或 (b)。

2. **【高】`utils.test.ts` 去留**：其被测的 4 个纯函数已从源码整体删除，覆盖职责已由 `faceManager.test.ts` 承接。删除该文件，还是改写为对 `Dir4FaceHandler`/`Dir8FaceHandler` 的等价测试（可能重复）？需用户裁决。

3. **【高】`tileLegacy.test.ts` 去留**：`data-state/src/legacy/tile` 与 `TileLegacyBridge`/`LegacyTileData` 已不存在。删除该文件（并在 SUMMARY 明写等价覆盖位置），还是重定向到新 legacy/loader 适配路径？

4. **【高】`coreEventLayer.test.ts` 的 A1/A2 裁决**：`CoreState.initMapState` 已删除，`MapState.fromRaw` 承担同名职责（`mapState.ts:40-95`）。(A1) 重定向到 `MapState.fromRaw` 并保留层序/zIndex/事件层/矩阵判据（会清理已无意义的 `vi.mock('./enemy')`/`vi.mock('./legacy')` 与 `Object.create` 骨架）；(A2) 退役该文件（等价覆盖已在 `mapState.test.ts`/`mapLifecycle.test.ts`）。07-16-PLAN 已把该点列为待裁决，本阶段必须落实。

5. **【中】回放失败码契约（158/175 → 72）**：`sandbox.test.ts` 断言 158/175，但源码现统一发 `error(72)` + `warn(194)`。是（a）改测试断言到 72/194，还是（b）视 158/175 为应保留的契约（需生产修复）？D-05/D-10 下倾向于 (a)，须用户确认。

6. **【中】map 校验码 62/63/64/84/130/125 的处置**：这些码在 06-COVERAGE-MAP 有登记，但当前 `mapState.ts`/`gameMap.ts`/`mapLayer.ts` 无发出点（`fromRaw` 仅校验 60/61，`setLayerAlias`/重复别名告警 84 已随方法删除）。是契约取消（改测试）还是重构遗漏（生产修复）？

7. **【中】`setFloor(undefined)` 分支**：`location.test.ts:110` 的「清空楼层」用例在 shipped 非空实现（`location.ts:55`）下不可表达。删除该半覆盖，还是允许实现接受 `null`（`hero/types.ts:331` 接口本就声明 `IGameMap | null`，实现与接口不一致）？这可能需要用户在生产侧确认接口/实现对齐。

8. **【低】`loadStarter` 之外的 loader 码覆盖**：码 66/67/68/69 + 1001 无覆盖；是否纳入本阶段补测计划（D-07），还是归渲染端/后续阶段？

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 全部测试 | 未在本会话探测（AGENTS.md 要求命令先获批） | 要求 `>=24.0.0`（`package.json:8`） | — |
| pnpm | 安装/脚本 | 未探测 | 要求 `>=12.0.0`（`package.json:9`） | — |
| Vitest | `test:ci`/`test:perf` | 声明 `^4.0.18`（`package.json:105`） | 12.5.1（`packageManager`） | — |

**说明：** 本阶段无外部服务/DB/DOM 依赖（数据端 DOM-free、Node 可跑）。上表版本来自 `package.json` 只读值，未执行 `node --version` 等探测命令（遵循 AGENTS.md「运行任何命令须先获批」）。执行计划可在 Task 0 获批后统一探测。

## Validation Architecture

> `workflow.nyquist_validation` 未在 `.planning/config.json` 中显式置 false（`config.json:26` `"nyquist_validation": true`），故本节保留。

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^4.0.18`（`package.json:105`） |
| Config file | `vite.config.ts`（默认通道）；`vitest.perf.config.ts`（perf 隔离通道） |
| Quick run command | `pnpm test:ci`（单条 <30s 可用 `pnpm exec vitest run <path> -x`） |
| Full suite command | `pnpm test:ci`（66 文件）+ `pnpm test:perf`（6 文件） |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| TEST-02 | 数据端测试落位 `__test__/` 且被采集 | 结构 | `pnpm test:ci`（文件数 = 66） | 迁移后 ✅ |
| TEST-02 | `pnpm test:ci` 全绿（1 skip 保留） | 集成 | `pnpm test:ci` | ❌ 当前 45 failed（本阶段目标） |
| TEST-02 | `pnpm test:perf` 全绿 | 集成 | `pnpm test:perf` | ❌ 当前受连带失败影响 |
| TEST-02 | 21 个缺口码有触发断言 | 单元 | 各子系统 `*.test.ts` | ❌ Wave 0 补测 |

### Sampling Rate
- **Per task commit:** `pnpm exec vitest run <changed spec paths>`（<30s）
- **Per wave merge:** `pnpm test:ci`
- **Phase gate:** `pnpm test:ci` 与 `pnpm test:perf` 双绿后 `/gsd-verify-work`

### Wave 0 Gaps
- [ ] 迁移后目录内的测试文件（65 `.test.ts` + 6 `.perf.ts`）——保留与迁移前一致的用例
- [ ] `__test__/` 共享夹具（`data-state/__test__/fixtures/closed-loop.ts` 随迁）；`loadStarter` 夹具（Open Q1）
- [ ] 缺口码补测用例（21 个，见 §9.1）
- [ ] 陈旧码处置记录（7 个，见 §9.2）——测试变更或删除均须在 SUMMARY 逐条登记
- [ ] Framework install：无（Vitest 已在 devDependencies）

## Security Domain

> `security_enforcement` 未显式置 false（`config.json:49` `"security_enforcement": true`，ASVS level 1）。本阶段为**测试重构与对齐**，无新增生产攻击面。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 数据端无认证 |
| V3 Session Management | no | 无会话 |
| V4 Access Control | no | 无权限面 |
| V5 Input Validation | no（仅测试夹具构造合法数据） | `fromRaw`/`addTile`/`logger` 校验为被测对象，不在本阶段修改 |
| V6 Cryptography | no | 无手写加密；压缩走既有 `SaveCompression` |

### Known Threat Patterns for test-refactor

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 用 `as never`/`Object.create` 伪造已删接口使测试假绿 | Tampering | `07-16-PLAN.md:484/599` 明令禁止；本阶段延续，planner 在 `<fails_when>` 点名 |
| 删测试/放宽断言以求全绿 | Repudiation | D-04 只允许保留不可达码 147 的既有 skip；删除/改写须 SUMMARY 逐条登记并经用户裁决 |
| 提交用户并发改动文件 | Tampering | D-08 禁止；提交前 `git status --short` 白名单核对 |

## Sources

### Primary (HIGH confidence，本会话 Read 的 repo 源)
- `packages/common/src/logger.json`（全 282 行，码表权威）
- `packages/common/src/{hook.ts,types.ts}`（`Hookable`/`IHookController`）
- `packages-user/data-common/src/{index.ts,types.ts,common/{index,face,faceManager,tileStore}.ts,replay/{index,system,sandbox,array}.ts,store/{index,tileStore,eventStore,itemStore,enemyStore}.ts}`
- `packages-user/data-base/src/{index.ts,types.ts,map/{index,types,gameMap,mapState,mapLayer,mover}.ts,hero/{location,state,follower,items,equipment,equipStore}.ts,enemy/{index,manager}.ts,flag/system.ts}`
- `packages-user/data-system/src/{index.ts,path/{index,types,finder,graph,system}.ts,combat/combat.ts}`
- `packages-user/data-state/src/{index.ts,types.ts,core.ts,ins.ts,enemy/index.ts}`
- 配置：`vite.config.ts`、`vitest.perf.config.ts`、`tsconfig.json`、`package.json`、`.planning/config.json`
- 规划物：`08-CONTEXT.md`、`06-COVERAGE-MAP.md`、`REQUIREMENTS.md`、`ROADMAP.md`、`07-VERIFICATION.md`、`dev.md`、`AGENTS.md`

### Secondary (MEDIUM confidence，本轮 Grep 命中但未逐字 Read 的测试断言)
- 各 `*.test.ts` 的调用点（file:line 已在正文标注）；执行期以编译/运行结果为准

### Tertiary (LOW confidence，需执行期验证)
- data-base/enemy、flag、combat 的「连带失败」判定（A3/A4）；未逐用例跑测（受 AGENTS.md 命令审批约束）

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 直接读 `package.json`，无新依赖
- Architecture / 接口 delta: HIGH — 全部结论锚定 live 源码 `file:line`；不确定性仅在「删/改」裁决项
- Pitfalls: HIGH — 可由已读源码与失败族直接推断
- 覆盖表: HIGH — 由 `logger.json` + 全量 grep 调用点反推；「陈旧码」解释为 MEDIUM（需用户确认契约意图）

**Research date:** 2026-10-04
**Valid until:** 7 天（仓库处于用户并发收尾期，接口可能继续变化；执行前必须重测，不得沿用本快照当判据——沿用 `07-VERIFICATION.md:365-367` 的「快照会过期」纪律）

---

*Phase: 8-测试重构与接口对齐*
*Research complete: 2026-10-04*
