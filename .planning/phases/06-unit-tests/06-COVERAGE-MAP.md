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
| 108 | hero/attribute.ts | `warns code 108 and ignores a modifier that already has an owner` | 06-05 |
| 109 | hero/attribute.ts | `warns code 109 when an object modifier returns the same reference` | 06-05 |
| 116 | hero/state.ts | `creates registered modifiers and warns code 116 for unknown types` | 06-05 |
| 142 | hero/follower.ts | `warns code 142 for an unknown string follower id` | 06-05 |
| 144 | hero/mover.ts | `warns code 144 and stops without a top implementation` | 06-05 |
| 146 | hero/equipment.ts | `warns code 146 when the equipped instance is missing`、`warns code 146 when comparing an unknown uid` | 06-05 |
| 147 | hero/equipment.ts | `warns code 147 when no equipment slot is available`（`it.skip`，当前不可达，见 `#06-05-3`） | 06-05 |
| 8 | map/mapLayer.ts | `warns code 8 for incomplete data and code 9 for an out-of-range area` | 06-06 |
| 9 | map/mapLayer.ts | `warns code 8 for incomplete data and code 9 for an out-of-range area` | 06-06 |
| 46 | map/mapLayer.ts | `closes a door on empty cells and warns 46 on occupied cells` | 06-06 |
| 60 | map/mapState.ts | `unequal layer lengths is rejected with code 60` | 06-06 |
| 61 | map/mapState.ts | `area not divisible by width is rejected with code 61` | 06-06 |
| 62 | map/mapState.ts | `non-numeric map layer key is rejected with code 62`、`non-numeric event priority is rejected with code 62` | 06-06 |
| 63 | map/mapState.ts | `missing map container is rejected with code 63`、`missing events container is rejected with code 63`、`missing alias container is rejected with code 63` | 06-06 |
| 64 | map/mapState.ts | `invalid width is rejected with code 64`、`non-integer map value is rejected with code 64`、`non-string layer alias is rejected with code 64`、`out of range event position is rejected with code 64`、`non-string event id is rejected with code 64`、`event layer without map layer is rejected with code 64` | 06-06 |
| 80 | map/mapLayer.ts | `warns code 80 for an illegal argument count` | 06-06 |
| 81 | map/mapLayer.ts | `warns code 81 for an out-of-range region` | 06-06 |
| 84 | map/gameMap.ts | `binds aliases and warns 84 on a duplicate alias` | 06-06 |
| 121 | map/mapState.ts | `registers floors and warns 121 when the floor already exists` | 06-06 |
| 123 | map/mapLayer.ts | `warns code 123 on a length mismatch and replaces the reference otherwise` | 06-06 |
| 126 | map/mover.ts | `warns code 126 for an unexpected move code and keeps the position` | 06-06 |
| 127 | map/mapLayer.ts | `warns code 127 when transferring an empty block` | 06-06 |
| 128 | map/mapLayer.ts | `warns code 128 when transferToStatic is out of bounds`（`transferToDynamic` 越图当前误发 131，另见 `#06-06-1` 的 `it.skip` 正确预期用例） | 06-06 |
| 129 | map/mapLayer.ts | `warns code 129 when transferToStatic overwrites a static block` | 06-06 |
| 130 | map/mapLayer.ts | `warns code 130 for a tile not managed by the layer` | 06-06 |
| 131 | map/gameMap.ts | `accepts own layers, warns 131 for a foreign layer and clears on null` | 06-06 |
| 136 | map/eventView.ts | `warns code 136 when the same priority is set twice` | 06-06 |
| 143 | map/dynamicTile.ts | `warns code 143 when the raw tile data is missing`、`reflects num and raw and warns 143 on an unknown set` | 06-06 |
| 43 | common/face.ts | `warns code 43 for an unknown main block` | 06-08 |
| 44 | common/face.ts | `warns code 44 when binding the main direction` | 06-08 |
| 111 | flag/field.ts | `warns code 111 when adding to a non-numeric field` | 06-08 |
| 55 | map/saveLoad.test.ts | `warns code 55 when loading a compressed MapState without a reference` | 06-09 |
| 58 | hero/saveLoad.test.ts | `warns code 58 when the max equipment uid cannot be found` | 06-09 |
| 59 | hero/saveLoad.test.ts | `warns code 59 when the item raw data is missing` | 06-09 |
| 112 | data-state/test/saveablesRoundTrip.test.ts | `warns code 112 when adding a duplicate saveable id` | 06-09 |
| 113 | data-state/test/saveablesRoundTrip.test.ts | `warns code 113 when binding an executor to an unadded saveable` | 06-09 |
| 119 | enemy/saveLoad.test.ts | `warns code 119 when the prefab is missing during loadState` | 06-09 |
| 120 | enemy/saveLoad.test.ts | `warns code 120 when a special is missing during loadState` | 06-09 |
| 122 | map/saveLoad.test.ts | `warns code 122 when a floor is missing during loadState` | 06-09 |
| 124 | map/saveLoad.test.ts | `warns code 124 when the compression reference is missing` | 06-09 |
| 177 | data-state/test/saveablesRoundTrip.test.ts | `warns code 177 when the save data misses a saveable key` | 06-09 |
| 178 | data-state/test/saveablesRoundTrip.test.ts | `warns code 178 when the save data misses a saveable key`（文案相反的正确预期见 `it.skip`，`#06-09-5`） | 06-09 |
| 176 | hero/mover.ts | `warns 176 when the hero move direction is not orthogonal` | 06-07 |
| 2001 | data-state/src/replay/commands.ts | `warns 2001 and 2002 for parameter count and type mismatches` | 06-07 |
| 2002 | data-state/src/replay/commands.ts | `warns 2001 and 2002 for parameter count and type mismatches` | 06-07 |
| 2003 | data-state/src/replay/commands.ts | `warns 2003 and 2004 for a moving hero and a missing controller` | 06-07 |
| 2004 | data-state/src/replay/commands.ts | `warns 2003 and 2004 for a moving hero and a missing controller` | 06-07 |
| 2005 | data-state/src/replay/commands.ts | `warns 2005 when teleport finds no path` | 06-07 |
| 2006 | data-state/src/replay/commands.ts | `warns 2006 when using an item fails` | 06-07 |
| 2007 | data-state/src/replay/commands.ts | `warns 2007 when equip fails to occupy the slot` | 06-07 |
| 2008 | data-state/src/replay/commands.ts | `warns 2008 when unequip leaves the slot occupied` | 06-07 |

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

## 06-05 勇士全部（packages-user/data-base/src/hero）

模块归属：108 / 109 → `hero/attribute.ts`（`HeroAttribute.addModifier` 重复归属 / 对象修饰器同引用）；
116 → `hero/state.ts`（`HeroState.createModifier` 未注册类型）；
142 → `hero/follower.ts`（`HeroFollower` 未知字符串 id）；
144 → `hero/mover.ts`（`HeroMover.onMoveStart` 缺顶层实现）；
146 / 147 → `hero/equipment.ts`（`HeroEquipment` 装备实例缺失 / 无可用槽位）。

阶段 1（构件级）完成 `HeroAttribute` 基础/最终属性、优先级排序、增删、存盘开关、克隆与
`catchCalculateProgress`，观测 108/109；完成 `ValueModifier`/`PercentageModifier` 公式与默认优先级。
阶段 2（组合/流水线）完成 `HeroLocation` 定位/楼层钩子、`HeroState` 装配与属性视图/修饰器注册
（观测 116）、`changeFloor` 钩子顺序；完成 `HeroEquipment` 槽位判定/装备替换/卸下/`compareEquip`
（观测 146）、`HeroEquipsStore` 实例排序、`HeroItems` 增删路由与 `useItem`；
完成 `HeroFollowersController` 增删/链接/同步与异步 gather（观测 142）。
阶段 3（完整/集成）完成 `HeroMover` 配置往返、`Step`/`CannotMove`/`Hit`、越界、地形忽略、
`enter`/`leave` 顺序（观测 144）与 `HeroRendering` alpha + 钩子。

D-32：不测任何 `saveState`/`loadState`；equipStore 专属码 58/59 与全部存读档往返归 06-09。
D-30：排除名称含 legacy 的接口/方法；`HeroMover` 顶层实现用内联 fake 注入。
三条疑似缺陷 `#06-05-1`（无修饰器时 final 属性不随基础属性更新）、`#06-05-2`（字符串槽位空槽
判断写反导致总是替换首个匹配槽位）、`#06-05-3`（码 147 不可达）按 D-05 以 `it.skip` 的正确预期
用例登记，详见 `06-TEST-FINDINGS.md`；其中 147 无法触发，故本表该行标注为跳过用例。
`HeroMover` 测试复用真实 `HeroLocation` 作为移动宿主（非自定义 `TestTile`），以零断言代价
覆盖真实 tile 写回路径。

## 06-06 地图全部（packages-user/data-base/src/map）

模块归属：60 / 61 / 62 / 63 / 64 / 121 → `map/mapState.ts`（`validateRaw` / `createMap`）；
84 / 131 → `map/gameMap.ts`（`setLayerAlias` / `setEventLayer`）；
8 / 9 / 46 / 80 / 81 / 123 / 127 / 128 / 129 / 130 → `map/mapLayer.ts`
（`putMapData` / `closeDoor` / `getMapData` / `setMapRef` / 动态转换）；
126 → `map/mover.ts`（`DynamicTileMover.onStepEnd` 非法移动码）；
136 → `map/eventView.ts`（重复优先级）；143 → `map/dynamicTile.ts`（缺图块原始数据）。

阶段 1（构件级）完成 `tile` / `staticTile` / `dynamicTile` / `eventView` 单元，观测 136/143；
阶段 2（组合/流水线）完成 `MapState` 注册/校验/激活/分区与 `GameMap` 图层、`MapLayer` 矩阵/
静态数组/动态转换/点位/脏/异步门，观测 8/9/46/60/61/62/63/64/80/81/84/121/123/127/129/130/131；
阶段 3（完整/集成）完成 `DynamicTileMover` 异步移动生命周期，观测 126。

D-32：不测任何 `saveState`/`loadState`，其专属码 55/122/124 与存读档往返归 06-09。
D-30：排除名称含 legacy 的接口/方法；`MapTileBase` 为抽象类，经 `StaticTile`/`DynamicTile` 具体子类覆盖。
D-18/D-39 计划措辞与实现的两处偏差（非代码缺陷，不登记为 bug）：
其一，`IMapState` 并无 `canPass`/`shouldHit`，通行谓词实现在 `data-state/src/hero/predicate.ts`，
故 `mapState.test.ts` 只覆盖谓词侧依赖的「活跃楼层 → 事件层」数据供给；
其二，计划中的 `createLayerState` 码 121 实为 `MapState.createMap` 的重复注册告警（码表文案沿用旧名）。
一条疑似缺陷 `#06-06-1`（`transferToDynamic` 越图误发 131 而非 128）按 D-05 以 `it.skip` 的
正确预期用例登记，详见 `06-TEST-FINDINGS.md`；码 131 的触发则由 `gameMap.test.ts` 的
`setEventLayer` 越权路径正常覆盖。

## 06-08 flag + common（packages-user/data-base/src/flag、packages-user/data-common/src/common）

模块归属：43 / 44 → `common/face.ts`（`RoleFaceBinder.bind` 未知主图块 / 主朝向覆盖）；
111 → `flag/field.ts`（`FlagCommonField.add` 对非数值字段告警，经 `FlagSystem.addFieldValue` 触发）。

阶段 1（构件级）完成朝向工具纯函数（`getFaceMovement`/`degradeFace`/`nextFaceDirection`/
`fromDirectionString`）与 `MapLocIndexer` 的索引互转及宽度切换。
阶段 2（组合/流水线）完成 `FlagSystem` 容器全公开表面（`occupied`/`insertField`/`getField`/
`getOrInsert`/`getOrInsertComputed`/`deleteField`/`setFieldValue`/`addFieldValue`/`getFieldValue`/
`getFieldValueDefaults`，观测 111）、`FaceManager` 注册表与 `Dir4FaceHandler`/`Dir8FaceHandler`
全方法、`RoleFaceBinder`（`malloc`/`bind`/`getFaceOf`/`getFaceDirection`/`getMainFace`，观测 43/44）。
阶段 3（完整/集成）完成 `ObjectMover` 全部公开移动方法（`setPos`/`setFaceDir`/`setMoveDir`/
`tp`/`jump`/`step`/`stepFace`/`forward`/`backward`/`speed`/`face`/`animDir`/`push`/`clear`/`start`）
与控制器 `stop` 契约；异步路径用真实计时器 + `await controller.onEnd`。

D-32：不测任何 `saveState`/`loadState`，flag 存读档往返归 06-09。
D-30：排除名称含 legacy 的接口/方法。
一条疑似缺陷 `#06-08-1`（`backward(count>1)` 因 `Special` 步翻转 `moveDirection` 而方向摆动、
净位移为零）按 D-05 以 `it.skip` 的正确预期用例登记，详见 `06-TEST-FINDINGS.md`。

## 06-09 存档（独立系统）

模块归属：119 / 120 → `data-base/src/enemy/saveLoad.test.ts`（`EnemyManager.loadState` 缺 prefab /
`Enemy.loadState` 缺 special）；
58 / 59 → `data-base/src/hero/saveLoad.test.ts`（`HeroEquipsStore.loadState` 缺 maxUid / 缺 item raw data）；
55 / 122 / 124 → `data-base/src/map/saveLoad.test.ts`（`MapState.loadState` 缺 reference / 缺楼层 /
`MapLayer.loadState` 引用缺失）；
112 / 113 / 177 / 178 → `data-state/test/saveablesRoundTrip.test.ts`（`CoreState.addSaveableContent` 重复 id /
`bindSaveableExecuter` 未添加目标 / 公开 `CoreState.loadState` 存档缺 saveable key / 存档含未加载的 key）。
其余码（warn 114/115 等）不属本计划可达范围，排除。

阶段 1（构件级）完成 `Enemy`/special/`EnemyManager` 与 hero 各子系统同实例往返，观测 119/120/58/59；
阶段 2（组合/流水线）完成 `MapState`/`GameMap`/`MapLayer`/tile、`ReplayArray`、`FlagSystem` 同实例往返，
观测 55/122/124；
阶段 3（完整/集成）经**公开入口** `CoreState.saveState(compression)` / `loadState(state, compression)`（D-45）
对 5 个 saveable（`@system/hero`/`flags`/`maps`/`enemy`/`replay`）× 3 档压缩做整体往返，
并以 `getSaveableContent(id)` 辅助逐 id 校验，观测 112/113/177/178。

D-32：全部 `saveState`/`loadState` 测试集中本计划，其它计划不测（06-07 播放所需状态重置除外）。
D-45：`@system/replay` 须已注册（执行前 Task 1 门禁确认）；未注册即阻断。录像新码 176 归 06-07。
排除清单（存档无关/元数据字段）见 `06-SAVE-EXCLUSIONS.md`。

执行结果：6 个测试文件 41 通过 / 6 跳过（skip 均为 `#06-09-1..5` 的正确预期疑似缺陷，经临时取消
skip 验证确为真实失败）；本计划可达码 55/58/59/112/113/119/120/122/124/177/178 全部有触发断言。
`pnpm test:ci` 存在**先于本计划**的既有失败（`#06-09` 阻断项），本计划未新增失败。

## 06-07 顶层集成（伤害组合 + 录像完整播放 + 二次录制比对）

模块归属：176 → `data-base/src/hero/mover.ts`（`HeroMover.onStepStart` 方向步记录时非
上/右/下/左 的 `default` 分支）；2001–2008 → `data-state/src/replay/commands.ts`
（`BaseReplayCommand.assertParameter` 参数数量/类型校验、`ReplayMoveCommand`、`ReplayTeleportCommand`、
`ReplayUseItemCommand`、`ReplayEquipCommand`、`ReplayUnequipCommand` 的失败分支）。

阶段 1（构件级）完成真实 API 下的单特殊属性伤害基线与单光环（`CommonAura`/`GuardAura`）基线；
阶段 2（组合/流水线）完成顶层多特殊属性伤害组合、系统层光环基础/特殊效果与常规/特殊查询组合、
final-effect 阶段顺序、同/跨优先级顺序（D-25），以及属性流水线结果经缓存伤害系统的
`markDirty`/`deleteEnemy`/`with(hero)` 联动（D-26）；
阶段 3（完整/集成）完成真实小地图场景的录像录制与完整播放、重置录像后的**二次录制逐条比对**
（步数 + 每步 code + 各 param 的 type/value），并观测 176 与 2001–2008。

D-32：仅用 `ReplaySystem.saveState()`/`loadState()`（`IReplaySystemSave`）做录像重置的最小使用，
不测存读档本身；`ReplayArray` 不可存档（无 `saveState`/`loadState`），已由用例断言。
D-40：真实英雄操作经 `replay.route.add(...)`（mover 方向步）录制；播放期间经
`replaySystem.disable()`/`revert()` 抑制录制；准备步骤同样以 disable/revert 包裹。
一条疑似缺陷 `#06-07-1`（`CoreState` 未向寻路 `finder` 注入地图状态/事件层/通行谓词，
顶层录像瞬移恒返回 2005）按 D-05 以 `it.skip` 的正确预期用例登记，详见 `06-TEST-FINDINGS.md`。

## 06-10 战斗系统 / 顶层组合缺口补测（D-46）

本计划为**覆盖缺口补测**（G-06-01-A/B/C、G-06-07-A），**不引入任何新码**，复用既有可达码；
阶段结构为 构件（地图伤害叠加）→ 组合/流水线（四类效果 + 跨怪嵌套光环）→ 完整/集成（最大流水线单怪）。

| 缺口 | 用例 | 文件 | 计划 |
| --- | --- | --- | --- |
| G-06-01-A | `applies all four effect kinds together and asserts the final attributes` | `data-system/src/combat/context.test.ts` | 06-10 |
| G-06-01-B | `propagates a cross-enemy nested aura with observable range boundaries` | `data-system/src/combat/context.test.ts` | 06-10 |
| G-06-01-C | `stacks two sourced damages at the same point`、`stacks two sourceless damages at the same point`、`merges mixed sourced and sourceless damages into one reduced result` | `data-system/src/combat/mapDamage.test.ts` | 06-10 |
| G-06-07-A | `computes one exact damage and turn for the maximum pipeline monster`、`produces a different result once the support pipeline is removed` | `data-state/test/enemyCombination.test.ts` | 06-10 |

本计划无 `it.skip`/`it.todo`（预期无需新增），`06-TEST-FINDINGS.md` 无 `#06-10-N` 条目。
