# Phase 6: 单元测试 - 阶段级 code → 模块 → 用例 覆盖表

> 本文件为**共享 create-or-append**文件（幂等、顺序无关）：各计划只追加/更新自己的小节，
> 绝不重写他节。表头固定为 `| code | 模块 | 用例 | 计划 |`，因此任何 wave 1 计划的执行顺序
> 都不影响最终结果。码表权威来源为 `packages/common/src/logger.json`。

| code | 模块 | 用例 | 计划 |
| --- | --- | --- | --- |
| 97 | combat/context.ts | `warns 97 when multiple converters match the same special` | 06-01 |
| 98 | combat/context.ts | `warns 98 when deleting an aura of the current priority`、`warns 98 when modifying an aura of the current priority` | 06-01 |
| 99 | combat/context.ts | `warns 99 and skips a higher-priority nested aura` | 06-01 |
| 100 | combat/context.ts | `warns 100 when both add and delete are non-empty` | 06-01 |
| 101 | combat/context.ts | `warns 101 when a local refresh removes a converted special`、`warns 101 when a local refresh adds a converted special` | 06-01 |
| 110 | combat/context.ts | `warns 110 and skips buildup without a bound hero` | 06-01 |
| 106 | combat/damage.ts | `warns 106 when the calculator is missing` | 06-01 |
| 107 | combat/damage.ts | `warns 107 when hero status is missing` | 06-01 |
| 102 | combat/mapDamage.ts | `warns 102 when the converter is missing during a full refresh` | 06-01 |
| 103 | combat/mapDamage.ts | `warns 103 when the reducer is missing` | 06-01 |
| 104 | combat/mapDamage.ts | `warns 104 when marking an unregistered enemy dirty` | 06-01 |
| 138 | combat/combat.ts | `warns 138 for collaborators bound to a foreign state` | 06-01 |
| 139 | combat/combat.ts | `warns 139 when a required collaborator is missing` | 06-01 |
| 140 | combat/combat.ts | `sorts scripts by descending priority and rejects duplicates` | 06-01 |
| 141 | combat/combat.ts | `warns 141 when the damage context cannot produce damage info` | 06-01 |
| 137 | enemy/calculator.ts | `warns 137 when a guard locator has no enemy` | 06-02 |
| 53 | enemy/manager.ts | `logs error 53 for non-serializable default attribute values` | 06-03 |
| 96 | enemy/enemy.ts | `warns 96 and keeps the existing special on a duplicate code` | 06-03 |
| 117 | enemy/manager.ts | `warns 117 on a repeat compareWith and refreshes the dirty set` | 06-03 |
| 118 | enemy/manager.ts | `warns 118 and marks dirty when no comparer is attached` | 06-03 |
| 148 | replay/array.ts | `warns code 148 for an unknown param type` | 06-04 |
| 149 | replay/array.ts | `warns code 149 for an illegal expand multiplier` | 06-04 |
| 150 | replay/array.ts | `warns code 150 when the command array is full` | 06-04 |
| 151 | replay/array.ts | `warns code 151 for an out-of-range boolean byte` | 06-04 |
| 152 | replay/array.ts | `warns code 152 for an out-of-range bigint` | 06-04 |
| 153 | replay/array.ts | `warns code 153 when a command exceeds 255 params` | 06-04 |
| 154 | replay/array.ts | `warns code 154 when narrowing a command above 255` | 06-04 |
| 155 | replay/array.ts | `warns code 155 when reading an expired stream` | 06-04 |
| 156 | replay/sandbox.ts | `warns code 156 when the read stream expired`、`warns code 156 when playing with an expired stream` | 06-04 |
| 157 | replay/sandbox.ts | `warns code 157 for an unknown command` | 06-04 |
| 158 | replay/sandbox.ts | `warns code 158 and stops when a command returns false` | 06-04 |
| 159 | replay/func.ts | `warns code 159 when beginning during another collection` | 06-04 |
| 160 | replay/func.ts | `warns code 160 when ending outside a collection` | 06-04 |
| 161 | replay/func.ts | `collects nested decorated calls and warns code 161` | 06-04 |
| 162 | replay/func.ts | `warns code 162 when the detail code is unknown` | 06-04 |
| 163 | replay/system.ts | `warns code 163 on a duplicate registration and keeps the original` | 06-04 |
| 175 | replay/sandbox.ts | `warns code 175 when notExecuted fails` | 06-04 |

## 06-01 战斗系统（packages-user/data-system/src/combat）

模块归属：97 / 98 / 99 / 100 / 101 / 110 → `combat/context.ts`（`EnemyContext` 光环流水线）；
106 / 107 → `combat/damage.ts`（`DamageContext` / `DamageSystem`）；
102 / 103 / 104 → `combat/mapDamage.ts`（`MapDamage`）；
138 / 139 / 140 / 141 → `combat/combat.ts`（`CombatFlow`）。105 在当前实现不可达，排除。

阶段 1（构件级）不产生 warn/error 码断言。阶段 2（组合/流水线）已完成 97/98/99/100/101/110；
阶段 3（完整/集成）已完成 106/107/102/103/104/138/139/140/141。105 在当前实现不可达，排除。
`#06-01-1..4` 为疑似缺陷的 `it.skip` 正确预期用例，详见 `06-TEST-FINDINGS.md`。

## 06-02 顶层战斗实现（packages-user/data-state/src/enemy）

模块归属：137 → `enemy/calculator.ts`（`MainDamageCalculator.calculate` 的支援怪缺失守卫路径）。

阶段 1（构件级）完成 `calculator` / `final` / `comparer` 单分支单元；
阶段 2（组合/流水线）完成 `CommonAura`/`GuardAura` 转换器 → 施加流水线与 `registerSpecials` 注册；
阶段 3（完整/集成）完成 mapDamage 五视图 + `MainMapDamageConverter` + `MainMapDamageReducer`。
本计划只覆盖顶层实现**基本功能**（D-35），跨特殊属性/光环的组合语义见 06-07；
无 `it.skip`/`it.todo`，`06-TEST-FINDINGS.md` 无 `#06-02-N` 条目。

## 06-03 enemy 数据模型（packages-user/data-base/src/enemy）

模块归属：96 → `enemy/enemy.ts`（`Enemy.addSpecial` 重复 special）；
53 / 117 / 118 → `enemy/manager.ts`（`setAttributeDefaults` 非法默认值 / `compareWith` 多次调用 /
无 comparer 的 `updateDirty`）。

阶段 1（构件级）完成 `Enemy` 属性单元与 special 单方法单元；
阶段 2（组合/流水线）完成 special CRUD 组合与 `clone`/`copyFrom`/`deepEqualsTo` 独立性；
阶段 3（完整/集成）完成 `EnemyManager` 注册表 / prefab / reuse / modify / comparer 脏跟踪，并观测 53/117/118。

D-32：本计划不测 `saveState`/`loadState`，其专属码 119/120 与存读档往返归 06-09。
D-30：排除一切名称含 legacy 的接口/方法（`fromLegacyEnemy`/`addPrefabFromLegacy`/`IEnemyLegacyBridge`）；
假桥接仅作必需协作对象。`registerSpecial` 的覆盖语义只能经被排除的 legacy 转换路径观测，
故仅覆盖「注册/重复注册不报错」的最小正常用例。
一条疑似缺陷 `#06-03-1`（`createEnemy`/`createEnemyById` 未走复用映射）按 D-05 以 `it.skip`
的正确预期用例登记，详见 `06-TEST-FINDINGS.md`。

## 06-04 录像系统（packages-user/data-common/src/replay）

模块归属：148 / 149 / 150 / 151 / 152 / 153 / 154 / 155 → `replay/array.ts`（编码、数组扩容与读流）；
156 / 157 / 158 / 175 → `replay/sandbox.ts`（播放器步进、收尾与读取流校验）；
159 / 160 / 161 / 162 → `replay/func.ts`（播放安全收集装饰器）；
163 → `replay/system.ts`（重复注册）。

阶段 1（构件级）完成 `ReplayArray` 单类型编解码与 `add`/`insert`/`delete`/`set`/`get` 单次读回，
并观测 148/151/152/153；
阶段 2（组合/流水线）完成读流/缓冲区组合、位宽切换与扩容，观测 149/150/154/155，并覆盖 `func.ts`
安全收集生命周期（159/160/161/162）；
阶段 3（完整/集成）完成 `ReplaySystem` 注册/录制/沙箱生命周期（163）与 `ReplaySandbox` 播放控制
（156/157/158/175），含 play/pause/resume/stop 与失败即停。

D-32：不测 `ReplayArray.saveState`/`loadState`，存读档往返归 06-09。
D-40：不做完整录像播放与二次录制比对，`error 2001–2008` 归 06-07，本计划未触及。
四条编解码/编辑缺陷 `#06-04-1`（int64 解码乘数）、`#06-04-2`（多字节 bigint 编码）、
`#06-04-3`（delete 索引回退）、`#06-04-4`（insert 参数位移方向）按 D-05 以 `it.skip`
的正确预期用例登记，详见 `06-TEST-FINDINGS.md`。
