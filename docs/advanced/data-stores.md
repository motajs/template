# data-common 的 Store

`@user/data-common` 是数据端的 Layer 0 公共层，上面挂着五个内容注册表：`tileStore`、`itemStore`、`mapStore`、`enemyStore`、`eventStore`。它们看起来像「数据表」，实际是<strong>内容层原始定义的注册表</strong>——图块、道具、地图、怪物、事件的定义登记在这里；游戏运行时从这里查出来，再按定义构造自己的对象。

中级教程的[数据端总览](../intermediate/data-state-overview.md)列过这些入口，[图块存储](../intermediate/tile-store.md)讲了 `tileStore` 的日常用法。这一篇讲每个 Store 存什么、接口怎么用，以及为什么运行期只该读。

阅读前需要会基础语法：`class`、`new`、`Map`、`import`。

## Store 是什么

先把三个区分摆清楚：

| 区分         | 一边                             | 另一边                               |
| ------------ | -------------------------------- | ------------------------------------ |
| 定义与实例   | Store 里存的是「定义」           | 游戏里跑的是按定义构造出来的「实例」 |
| 注册表与存档 | Store 是查表用的注册表，不进存档 | 勇士、地图、Flag 等游戏状态才进存档  |
| 查表与改表   | 运行时读 Store 是正常操作        | 运行时写 Store 会绕过一整套机制      |

Store 在<strong>加载 / 初始化阶段</strong>被填一次，之后整个游戏过程都靠它查表。它记录的不是「玩家做了什么」，而是「世界上有什么」。

## 五个 Store

- `tileStore`（`ITileStore`）：按<strong>图块数字</strong>存图块原始定义 `ITileRawData`。读 `getData` / `getEvent` / `getType`，以及 `num` / `id` / `identity` 换算；写 `addTile`。
- `itemStore`（`IItemStore<IHeroAttr>`）：按<strong>道具图块数字</strong>存道具原始定义 `IItemRawData`。读 `getData(token)` / `getCategory(num)`；写 `addItem`。
- `mapStore`（`IMapStore`）：按<strong>楼层 id</strong>（`floorId`）存地图原始数据 `IMapRawData`。读 `getMap(floorId)`；写 `addMap`。
- `enemyStore`（`IEnemyStore<IEnemyAttr>`）：按<strong>怪物图块数字</strong>存怪物原始数据 `IEnemyRawData`。读 `getEnemy(token)`；写 `addEnemy`。
- `eventStore`（`IGameEventStore`）：按<strong>事件 id</strong>存事件实例。读 `getEvent(id)`；写 `addEvent(id, event)`。

五个都是 `IDataCommon` 上的只读字段，通过 `state` 直接访问，例如 `state.tileStore`。它们没有各自的「管理器」，也不需要你 `new` 一个出来。

## 逐个看接口

### tileStore：图块定义

以图块数字为键，存 `ITileRawData`：

| 字段        | 含义                                                           |
| ----------- | -------------------------------------------------------------- |
| `num`       | 图块数字                                                       |
| `id`        | 图块字符串 id                                                  |
| `events`    | 默认事件，键为优先级、值为事件 id                              |
| `type`      | 图块逻辑类型（`TileType`）                                     |
| `pass`      | 通行性（`ITilePassData`：`onlyEvents` / `outPass` / `inPass`） |
| `eventPass` | 事件可通行性：`false` 撞击触发，`true` 走上去触发              |

- `getData(num)`：完整原始定义，不存在返回 `null`；
- `getEvent(num)`：默认事件，返回 `ReadonlyMap`。它每次都会新建一个 `Map`，改它不会影响 Store；
- `getType(num)`：图块类型，不存在返回 `TileType.Unknown`；
- `num` / `id` / `identity`：数字与 id 之间的换算，细节见[图块存储](../intermediate/tile-store.md)；
- `addTile(data)`：登记一条定义。`num` 或 `id` 撞上已有定义时会告警（错误码 `133` / `134`）并覆盖。

### itemStore：道具定义

以道具图块数字为键，存 `IItemRawData`：`num`、`category`（`ItemCategory`）、`name`、`text`、`hideInToolbox`、`effect`（使用 / 拾取效果）、`equip`（装备数值与事件）。`effect` 与 `equip` <strong>都是必填字段</strong>，不是二选一：非装备类也要给出一个 `equip`，装备类也要提供 `effect`（可以是空实现）。

- `getData(token)`：道具原始定义，同时接受数字与 id，查不到返回 `null`；
- `getCategory(num)`：道具分类，查不到返回 `ItemCategory.Unknown`；
- `addItem(data)`：登记一条定义；同一个 `num` 重复登记会告警（错误码 `181`），然后覆盖。

### mapStore：地图原始数据

以楼层 id 为键，存 `IMapRawData`：

| 字段         | 含义                                                       |
| ------------ | ---------------------------------------------------------- |
| `floorId`    | 楼层 id                                                    |
| `width`      | 地图宽度                                                   |
| `map`        | 地图数组，键为图层纵深、值为扁平存放的图块数字数组         |
| `layerAlias` | 每个图层的字符串别名，键为图层纵深                         |
| `events`     | 每个图层指定位置的事件：纵深 → 位置索引 → 优先级 → 事件 id |

- `getMap(floorId)`：原始地图数据，查不到返回 `null`；
- `addMap(map)`：登记一份原始数据，同一个 `floorId` 直接覆盖，不告警。

这份原始数据不会自己变成可玩的地图。运行时楼层由 `state.maps.fromRaw(raw)` 构造：它按 `width` 与 `map` 算出高度、建图层、铺图块、挂事件。从原始数据到运行时对象只有这一次转换。

### enemyStore：怪物原始数据

以怪物图块数字为键，存 `IEnemyRawData`：`num`、`attribute`（怪物属性）、`special`（特殊属性，键为特殊属性编号、值为参数）。

- `getEnemy(token)`：怪物原始数据，同时接受数字与 id，查不到返回 `null`；
- `addEnemy(data)`：登记一条定义；同一个 `num` 重复登记会告警（错误码 `181`，与道具共用）并覆盖。

它和另外四个 Store 一样挂在主对象上，直接 `state.enemyStore` 取用。

### eventStore：事件实例

以事件 id 为键，存事件实例（`IReadonlyGameEvent`）。

- `getEvent(id)`：返回<strong>存储的那个实例</strong>，不是副本；查不到返回 `null`；
- `addEvent(id, event)`：登记一个事件；重复 id 会告警（错误码 `170`）并覆盖。注意签名与另外几个不同，第一个参数是事件 id，第二个才是事件实例。

## 为什么运行期只读

在游戏进行中调用 `add*`，问题不止一个：

1. <strong>它不进存档</strong>。五个 Store 都不是可存档对象——`addSaveableContent` 注册的是 `hero`、`flags`、`maps`、`enemyManager`、`replaySystem`，没有 Store。读档不会恢复你的改动，也不会把它退回原样。
2. <strong>它不进录像</strong>。`add*` 没有 `@shouldReplay` 标记，录像里不会有「登记这条定义」这一步。重放时这条定义从什么时候开始生效，与原始游玩并不一致。
3. <strong>它不保证更新已经存在的对象</strong>。有的运行时对象每次都现查 Store（静态图块的 `raw()`、事件派发），有的在构造时就把定义缓存下来（动态图块、背包道具、运行时楼层）。改完之后谁变了、谁没变，取决于取用方式。
4. <strong>它绕过了检查</strong>。定义改了，存档、录像、内存里的对象三者可能各是各的；差异不会立刻报错，而是在某个不确定的时机表现出来。

所以规则很简单：<strong>登记只在加载期做一次，运行期只读</strong>。

至于登记这件事本身，绝大多数情况也不用你动手：`add*` 是给数据端自己用的接口——内容加载还没写完，写完后由数据端统一登记，不在你的代码里。日常你只需要按下面这样读：

```ts
// 先按图块 id 查数字，再取完整定义；没有登记时 num 为 undefined
const num = state.tileStore.num('my-tile');
if (num !== undefined) {
    // raw 为 null 表示这条定义不存在
    const raw = state.tileStore.getData(num);
    console.log(raw, state.tileStore.getType(num));
}

// 道具、地图、怪物同样按各自的键查
const item = state.itemStore.getData('my-item');
const map = state.mapStore.getMap('my-floor');
const enemy = state.enemyStore.getEnemy('my-enemy');
```

读 Store 随时可以：查表、算数、拼提示文本、给界面提供数据，都是正常用法。查表不会改变任何东西，也不产生录像步。唯一要注意的是<strong>不要就地修改返回的对象</strong>：`getData` / `getMap` / `getEvent` 返回的多是 Store 里存着的那个实例（`tileStore.getEvent` 例外，它每次新建一个 `Map`），就地改它等于绕过 `add*` 改了注册表。

## 边界与注意

- <strong>确实要补几条定义</strong>。把调用集中放在插件的一个时机方法里（`awake` / `initialize` / `afterLoad`，见[插件系统](./plugin-system.md)），只在启动流程里执行一次；不要放进玩家动作、事件回调、每帧逻辑或战斗结算。
- <strong>登记不会创建运行时对象</strong>。`addMap` 只是把原始数据放进注册表，要可玩还得自己调用 `state.maps.fromRaw(raw)`；`addTile` 也只影响之后构造的图层，图层已经建好就不会自动补进去。
- <strong>重复登记同一个 `num` 会覆盖</strong>。图块告警 `133` / `134`，道具与怪物告警 `181`，事件告警 `170`；不撞键才是安全的登记。
- <strong>返回值不是副本</strong>。改 `getData` / `getMap` / `getEvent` 的返回值等于改注册表；需要不同的定义就登记新的，不要改旧的。
- <strong>读档不会恢复 Store</strong>。改过的定义不会随存档保存，读档也不会把它退回去。
- <strong>`eventStore.getEvent` 给的是实例本身</strong>，不要在上面做缓存并当成快照。

## 小结

- 五个 Store 是 Layer 0 的内容层注册表，存定义，不存游戏状态，也不进存档。
- 键分别是图块数字、道具图块数字、`floorId`、怪物图块数字、事件 id。
- 读随时可以；返回的通常是注册表里的实例，不要就地修改。
- 登记由数据端负责，绝大多数情况不需要自己调用 `add*`，运行期尤其不要写。
- 运行时楼层由 `state.maps.fromRaw(raw)` 一次性构造；改 Store 不会重建它。

返回[高级 I 导览](./index.md)。
