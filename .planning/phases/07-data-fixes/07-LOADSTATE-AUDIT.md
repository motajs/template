# loadState 同引用（identity/alias）审计

**日期:** 2026-09-16
**范围:** 数据端 `packages-user/data-{common,base,system,state}`（含 `packages` 中数据端依赖）
**性质:** 只读探索记录，未修改任何代码
**种子缺陷:** `#06-17-1`（`06-TEST-FINDINGS.md`）

## 背景

`HeroState.loadState` 用 `new HeroAttribute(...)` 替换属性实例（`state.ts:177/185`），而 `HeroEquipment` 在构造期捕获了**旧**属性实例（`state.ts:71` → `equipment.ts:23`，`private readonly`），其 `equip()`/`loadState` 仍向旧实例 `addModifier`（`equipment.ts:83`）。结果：读档后装备加成落到已丢弃的属性上，`getFinalAttribute('atk')` 由 5 → 0。

## 方法

枚举所有 `loadState(` 实现及 `clear`/`destroy`/`removeAll`/`setMapRef`/`setReplayArray`/`fromRaw` 等重建点；对每个被替换字段，搜索此前持有它的对象（构造期 `private readonly`、`new X(this, field)`、`bind*`/`use*`/`register*`、以身份为键的 Map/Set/WeakMap、闭包/回调、hooks/listener 列表）；判断持有者是「重读活字段」还是「持旧引用」；并检查同包 `*.test.ts` 覆盖。

## 发现

| ID | 替换点 | 被替换字段 | 陈旧持有者 | 触发 | 症状 | 置信 | 现有测试 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A**（种子） | `hero/state.ts:185` | `HeroState.attribute` | `HeroEquipment.attribute`（`equipment.ts:23`，`state.ts:71` 捕获） | `hero.loadState` / `CoreState.loadState` | 装备加成写进孤儿属性 → `getFinalAttribute` 5→0 | 高 | 无（`hero/saveLoad.test.ts:588-609` 只断言 `getEquipped`/`slots`） |
| **B** | `hero/state.ts:185` | `HeroState.attribute` | `EnemyContext.bindedHero`（`data-system/combat/context.ts:87`，`core.ts:219` 用原始属性接线，之后从不重绑）；连带 `DamageSystem.heroStatus`（`damage.ts:36`） | `hero.loadState` | 战斗读**读档前**的旧勇士属性（`context.ts:217` → `enemy/calculator.ts:22-25`、`final.ts:12-13`、`mapDamage.ts:88`） | 高 | 无 |
| **H** | `replay/array.ts:801-826` `setReplayArray` | `commandBuffer/paramBuffer/indexArray` 及视图 | 活跃 `ReplaySandbox.reader`（`sandbox.ts:43` 捕获偏移） | `ReplaySystem.loadState:106` | `setReplayArray` 漏 `expireStreams()`（其它 5 处写路径都有），活跃读流按陈旧偏移解码 | 中 | 无（跨 load 的活跃读流未见用例） |
| **D** | `hero/equipStore.ts:271/:278` | 全部 `EquipmentState` 实例 | 外部从 `get`/`getEquips`/`instancesOf` 持有的 `IEquipmentState` | `HeroState.loadState` → `items.loadState` | 保留实例与活 store 脱钩 | 中（类）/低（仓内） | 部分（只测按 uid 重取） |
| **E** | `flag/system.ts:66/:68` | 全部 `FlagCommonField` 实例 | 持有 `getField`/`getOrInsert` 结果的调用方 | `FlagSystem.loadState`（`@system/flags`） | 写入保留字段丢失、读到旧值 | 中/低 | 部分（用例均重取） |
| **F** | `hero/state.ts:190/:192` | 整个 `followers[]` 及每个 follower 的 `location`/`rendering` | 缓存的 `IHeroFollower`、其 hooks | `HeroState.loadState` | 旧 follower 引用指向被移除对象、mover 实例更换 | 中/低 | 无（只测同实例 `follower.loadState`） |
| **C** | `hero/state.ts:185` | `HeroState.attribute` | `data-fallback/src/hero.ts:8-23` 的 `core.status.hero` Proxy（闭包持有 `getModifiableAttribute()`） | `HeroState.loadState`（若 legacy load 未重发 `resetHero`） | 旧引擎写入落到孤儿属性 | 低-中 | 无 |
| **G** | `map/mapLayer.ts:371-391` `setMapRef` | `mapArray`/`IMapLayerData`/`StaticTile` 缓存（`loadDynamics` 亦不清旧动态块） | 持 `getMapRef()` 者、旧 `StaticTile`/`DynamicTile` | `MapState.loadState` → `GameMap.loadState` → `MapLayer.loadState` | `mapData.expired` 契约、实例脱钩、旧动态块累积 | 低 | 覆盖 load，不覆盖外部引用 |

## 触发序列（举例）

**A:** 构造 `HeroState`（属性 `A0`）→ `equip(uid, slot)`（atk+5，写入 `A0`）→ `saveState()` → `loadState(saved)` → `HeroState.attribute` 变 `A1`，`equip.loadState` 仍写 `A0` → `getFinalAttribute('atk')` = 基础值（5→0）。

**B:** `createCoreState()`（`core.ts:219` 用原始 `A0` 绑定 `enemyContext`）→ 修改/装备 → `hero.loadState()` → `enemyContext.getBindedHero()` 仍是 `A0`（`!== hero.attribute`）→ 伤害计算用读档前属性。

**H:** `replaySystem.createReplaySandbox(cfg)` → `replaySystem.loadState(saved)` → `sandbox.step()`：reader 未被 expire，按旧偏移解码。

## 判定为「安全」的同类边界

- `HeroLocation` / `HeroRendering` / `HeroFollower.loadState`：原地修改。
- `HeroItems.loadState`：只清填 map，`equipment` 字段不换，`HeroEquipment.store` 保持有效（其内部实例被替换 → 见 D）。
- `HeroState` 的 getter：重读 `this.attribute`。
- `GameMap` / `MapState.loadState`：原地改已有实例；`finder.useMapState(this.maps)`、`DefaultPassPredicateImpl` 持有的 `MapState` 稳定。
- `EnemyManager.loadState`：原地改 prefab；身份键注册表未重分配。
- `Enemy.loadState`：全部经 accessor 读取，未发现裸属性对象的外部持有者（但 `EnemyManager.loadState` 改的是 prefab，`EnemyContext` 持有的是 `createEnemy()` 克隆 → 独立逻辑缺口，不属本类）。
- `StaticTile` / `DynamicTile.loadState`：原地修改。
- `CombatFlow.bindHero`：同 B 的捕获模式，但 `CombatFlow` 仅测试实例化，属潜在 API 隐患而非在役。

## 未能从阅读确定（未猜测）

1. 仓外旧引擎 `core.loadData` 读档后是否重发 `resetHero`（决定 C 严重度）。
2. 渲染端/legacy 插件是否跨读档保留 D/E/F/G 的实例引用。
3. 活跃 `ReplaySandbox` 读流是否会在真实流程中跨 `loadState`（H）。
4. `EnemyContext` 的生产填充点（全仓无测试外的 `setEnemyAt`），影响 B 的爆炸半径。

## 处置

- **A / B**：由 Phase 7 新增计划 `07-09` 按「同引用原则」修复——`HeroAttribute` 自身实现 `ISaveableContent`，属性存读档在其实例上原地完成，从而 `HeroEquipment` 与 `EnemyContext.bindedHero` 的引用始终有效。
- **C–H**：本文件仅记录；是否修复由用户决定。
