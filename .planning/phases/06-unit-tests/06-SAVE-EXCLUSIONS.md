# 06-09 存读档排除清单（06-SAVE-EXCLUSIONS.md）

> 用途：作为 06-09 存读档单测与后续维护的**对照基准**。本清单逐类推导「**不**在断言范围内」的
> 存档无关字段/派生字段/缓存/序列化容器结构，并说明依据（为什么与存档语义无关）。测试只对
> 「关键状态字段」做显式断言（D-13），不做整体深度相等，也不比较序列化容器结构（D-13）。
>
> 判定口径：一个字段「存档相关」当且仅当它由 `saveState()` 写出、由 `loadState()` 读回，且是
> 该对象对外语义的一部分。凡不满足者一律排除。

## 通用排除项（所有可存档类）

| 排除项 | 类别 | 依据 |
| --- | --- | --- |
| 序列化容器结构本身（`Map`/数组/对象的键序、副本容量、缓冲区字节布局） | 容器/元数据 | 只关心「值被恢复」，不关心存档用什么容器承载（D-13）。 |
| 派生值（可由其它已断言字段算出，或 `loadState` 后延迟重算） | 派生 | 断言派生值会与实现的计算时机耦合；一旦实现改为惰性重算即误报。 |
| 缓存（实例缓存、`expired` 标记、读取流集合） | 缓存 | 缓存只影响性能，不代表存档状态；`loadState` 允许清空或保留。 |
| 钩子注册表、控制器、协作对象引用（`state`/`layer`/`owner`/`controller`） | 运行时引用 | 非存档内容，读档后由构造关系恢复。 |
| 脏标记与基准快照（`dirty`/`refArray`/`referenceByCode`/`compared`） | 元数据 | 用于压缩对比与变更追踪，不是游戏状态；`loadState` 会按需重建。 |
| 配置对象（扩容乘数、最大长度、槽位命名规则等） | 配置 | 由构造/装配决定，不进入存档。 |
| 副作用输出（如录像 `route` 记录、事件派发） | 副作用 | 不是被存读档对象的状态。 |

## 逐类排除清单

### 怪物（data-base/src/enemy）

| 类 | 排除字段 | 依据 |
| --- | --- | --- |
| `Enemy` | `specialMap`/`specials` 的容器结构与迭代顺序 | 只断言「按 code 取回的特殊属性值」；容器是实现细节。 |
| `Enemy` | 未在存档中的 special 的当前值变化 | 缺失 special 走警告 120，测试只断言「保留当前值 + 码 120」。 |
| `EnemyManager` | `prefabByCode`/`prefabById`/`reuseByCode`/`reuseById`/`legacyIdToCode` 映射 | 模板注册表属装配状态，`saveState` 只写出脏模板（D-14）。 |
| `EnemyManager` | `referenceByCode`、`hasReference`、`dirtySet` | 参考快照与脏集合是派生元数据；测试仅通过公开属性/公共 API 间接观察。 |
| `EnemyManager` | `comparer` | 协作对象，非存档内容。 |
| `EnemyManager` | `saveState` 返回的 `modified` 容器类型 | 只断言被序列化的脏 code 集合与其属性值。 |
| `CommonSerializableSpecial` / `NonePropertySpecial` | `config` | 构造期配置，非存档内容。 |

### 勇士（data-base/src/hero）

| 类 | 排除字段 | 依据 |
| --- | --- | --- |
| `HeroAttribute` | `finalAttribute` | 派生值；无修饰器时本就不随基础属性刷新（另见 `#06-05-1`），不作为存读档断言对象。 |
| `HeroAttribute` | `modifierName`/`modifierNosave` 的容器结构 | 只断言「修饰器值恢复」与「save=false 不入档」的语义。 |
| `BaseHeroModifier`（`ValueModifier`/`PercentageModifier`） | `owner` 反向引用 | 运行时绑定关系，非存档内容。 |
| `HeroLocation` | `state`、`mover` 的动画中间态 | 协作/运行时引用；只断言 x/y/floorId/direction。 |
| `HeroRendering` | 钩子列表 | 运行时注册，非存档内容。 |
| `HeroState` | `registry`（修饰器工厂表） | 装配配置；只断言读档后按类型重建的修饰器值。 |
| `HeroState` | 跟随者对象的身份 | 只断言 follower 存档的 num/位置/渲染值恢复。 |
| `HeroEquipment` | 录像 `route` 副作用、装备修饰器的对象身份 | 副作用与对象身份非存档内容；只断言 slots 与 equipped 映射。 |
| `EquipmentState` | `modifiers` 数组身份与复用 | 读档会重建修饰器；只断言修饰器数值。 |
| `EquipmentState` | `value`/`percentage` 的 Map 容器结构 | 只断言修饰器数值恢复（数值表读取缺陷另见 `#06-09-1`）。 |
| `HeroEquipsStore` | `sorter`、`state` | 协作/配置对象。 |
| `HeroEquipsStore` | `instanceMap` 的容器结构与实例身份 | 断言 uid 集合与自增计数续接。 |
| `HeroItems` | `raw` 引用、`constants`/`consumables` 容器结构 | 只断言 num→count 的恢复；`raw` 由 itemStore 重新解析。 |
| `HeroFollower` | `controller` 引用 | 运行时引用；只断言 num/位置/渲染。 |

### 地图（data-base/src/map）

| 类 | 排除字段 | 依据 |
| --- | --- | --- |
| `MapState` | `areaList`/`lastFloorId`/`autoActivitorEnabled`/`compared` | 分区与自动激活属运行时元数据，不进 `IMapStoreSave`。 |
| `MapState` | `tileStore`/`state` | 协作引用。 |
| `MapState` | 未激活楼层 | `saveState` 只写激活楼层，未激活楼层本就不入档。 |
| `GameMap` | `layerAliasMap`/`aliasLayerMap`/`indexer`/`layerHookMap`、钩子 | 图层别名与索引属装配/运行时状态，不在 `IGameMapSave`。 |
| `GameMap` | `selfDirty` | 脏标记是派生元数据。 |
| `GameMap` | 空图层存档（`isEmptyLayerSave` 跳过的层） | 无有效内容的层会被 `saveState` 主动省略。 |
| `MapLayer` | `refArray`、`layerDirty`、`mapData.expired` | 压缩基准与脏标记是派生元数据。 |
| `MapLayer` | `staticTileCache`/`tilePosMap`/`posTileMap`、点事件缓存容器结构 | 实例缓存与索引，`loadState` 会重建。 |
| `MapLayer` | 压缩档下的 `rows`/`fullMap`/`staticBlocks`/`dynamicBlocks`/`pointEvents` 容器形状 | 只断言块/点位事件值恢复（D-13）。 |
| `StaticTile` | `layer`/`locator` | 运行时引用；只断言图块事件与（经图层矩阵的）图块数字。 |
| `DynamicTile` | `mover`、`layer`、`locator` 缓存 | 运行时对象；只断言 num 与覆盖事件（num 恢复缺陷另见 `#06-09-3`）。 |

### 录像（data-common/src/replay）

| 类 | 排除字段 | 依据 |
| --- | --- | --- |
| `ReplayArray` | 缓冲区容量、扩容乘数、最大长度、`indexBuffer` 派生索引 | 配置/派生结构；只断言录像步数与 `get`/读流的关键指令与参数值。 |
| `ReplayArray` | `readStreams` 集合 | 读取流缓存。 |
| `ReplayArray` | `saveState` 返回的 `ArrayBuffer` 字节布局 | 只断言读回的命令/参数（含 boolean/int/bigint/string/数组）。 |
| `ReplaySystem` | `commands` 注册表容器、`sandbox`、`replaying`、钩子 | 运行时装配/状态；注册表经 `getCommand(code)` 语义化断言。 |

### Flag（data-base/src/flag）

| 类 | 排除字段 | 依据 |
| --- | --- | --- |
| `FlagSystem` | `fieldMap` 容器结构与字段对象身份 | 只断言字段值（`getFieldValue`）与 `occupied`；`loadState` 会重建字段对象。 |
| `FlagCommonField` | `system` 反向引用、`key` | 运行时绑定，非存档内容。 |

### 顶层（data-state/src/core）

| 类 | 排除字段 | 依据 |
| --- | --- | --- |
| `CoreState` | `saveables`/`addedSaveables`/`executors` 映射结构 | 装配状态；只断言 5 个注册 id 的快照键与逐 id 内容。 |
| `CoreState` | `saveSystem`、`loading` 接线、各 Layer 协作对象 | 运行时装配，不属 `saveState`/`loadState` 范围（D-10）。 |
| `CoreState` | 快照的 `Map` 容器结构与值对象的身份 | 只断言逐 id 关键字段与「快照与活对象分离」的可观察字段。 |
