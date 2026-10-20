# data-common 的 Store

`@user/data-common` 是数据端的 Layer 0 公共层，它上面挂着四个 Store：`tileStore`、`itemStore`、`mapStore`、`eventStore`。它们看起来像「数据表」，实际是<strong>内容层原始定义的注册表</strong>——你写的地图、图块、道具、事件定义，在这里登记；游戏运行时从这里查出来，再构造自己的对象。

中级教程的[数据端总览](../intermediate/data-state-overview.md)列过这四个入口，[图块存储](../intermediate/tile-store.md)讲了 `tileStore` 的日常用法。这一篇往下一层：四个 Store 各存什么、键是什么、为什么运行时应当只读。

阅读前需要会基础语法：`class`、`new`、`Map`、`import`。

## Store 是什么

先把三个容易混淆的区分摆清楚：

| 区分         | 一边                             | 另一边                               |
| ------------ | -------------------------------- | ------------------------------------ |
| 定义与实例   | Store 里存的是「定义」           | 游戏里跑的是按定义构造出来的「实例」 |
| 注册表与存档 | Store 是查表用的注册表，不进存档 | 勇士、地图、Flag 等游戏状态才进存档  |
| 查表与改表   | 运行时读 Store 是正常操作        | 运行时写 Store 会绕过一整套机制      |

Store 里的东西在<strong>加载 / 初始化阶段</strong>被填一次，之后整个游戏过程都靠它查表。它不是「玩家做了什么」的记录，而是「世界上有什么」的登记。

## 四个 Store 一览

| Store        | 类型                    | 存什么       | 键           | 常用读取                                                       | 写入       |
| ------------ | ----------------------- | ------------ | ------------ | -------------------------------------------------------------- | ---------- |
| `tileStore`  | `ITileStore`            | 图块原始定义 | 图块数字     | `getData` / `getEvent` / `getType` / `num` / `id` / `identity` | `addTile`  |
| `itemStore`  | `IItemStore<IHeroAttr>` | 道具原始定义 | 道具图块数字 | `getData` / `getCategory`                                      | `addItem`  |
| `mapStore`   | `IMapStore`             | 地图原始数据 | `floorId`    | `getMap`                                                       | `addMap`   |
| `eventStore` | `IGameEventStore`       | 事件实例     | 事件 id      | `getEvent`                                                     | `addEvent` |

四个 Store 都是 `IDataCommon` 上的只读字段，通过 `state` 直接访问，例如 `state.tileStore`。它们没有各自的「管理器」，也不需要你 `new` 一个出来。

## 逐个看

### tileStore：图块定义

以<strong>图块数字</strong>为键，存 `ITileRawData`：

| 字段        | 含义                                                           |
| ----------- | -------------------------------------------------------------- |
| `num`       | 图块数字                                                       |
| `id`        | 图块字符串 id                                                  |
| `events`    | 默认事件，键为优先级、值为事件 id                              |
| `type`      | 图块逻辑类型（`TileType`）                                     |
| `pass`      | 通行性（`ITilePassData`：`onlyEvents` / `outPass` / `inPass`） |
| `eventPass` | 事件可通行性：`false` 撞击触发，`true` 走上去触发              |

除了这张表，它内部还维护两组索引：`id → 数字`、`数字 → id`，以及每个图块数字的默认事件。所以你能用任意一种写法查同一条定义。

读取接口：

- `getData(num)`：完整原始定义，不存在返回 `null`；
- `getEvent(num)`：默认事件，返回 `ReadonlyMap`，无事件返回空 `Map`。它每次都会新建一个 `Map`，改它不会影响 Store；
- `getType(num)`：图块类型，不存在返回 `TileType.Unknown`；
- `idToNumber` / `numberToId` / `num` / `id` / `identity`：数字与 id 的换算，细节见[图块存储](../intermediate/tile-store.md)。

写入接口只有一个 `addTile(data)`。`num` 或 `id` 撞上已有定义时会告警（错误码 `133` / `134`）并覆盖旧定义。

### itemStore：道具定义

以<strong>道具图块数字</strong>为键，存 `IItemRawData`：`num`、`category`（`ItemCategory`）、`name`、`text`、`hideInToolbox`、`effect`（非装备类道具的效果对象）、`equip`（装备类道具的数值与事件）。

它在构造时接收 `tileStore`，所以 `getData(token)` 同时接受数字与 id，内部先用 `tileStore.num(token)` 换算。

- `getData(token)`：道具原始定义，查不到返回 `null`；
- `getCategory(num)`：道具分类，查不到返回 `ItemCategory.Unknown`；
- `addItem(data)`：登记一条定义；同一个 `num` 重复登记会告警（错误码 `181`），然后覆盖。

### mapStore：地图原始数据

以<strong>楼层 id</strong>（`floorId`）为键，存 `IMapRawData`：

| 字段         | 含义                                                       |
| ------------ | ---------------------------------------------------------- |
| `floorId`    | 楼层 id                                                    |
| `width`      | 地图宽度                                                   |
| `map`        | 地图数组，键为图层纵深、值为扁平存放的图块数字数组         |
| `layerAlias` | 每个图层的字符串别名，键为图层纵深                         |
| `events`     | 每个图层指定位置的事件：纵深 → 位置索引 → 优先级 → 事件 id |

- `getMap(floorId)`：原始地图数据，查不到返回 `null`；
- `addMap(map)`：登记一份原始数据，同一个 `floorId` 直接覆盖，不告警。

这份原始数据不会自己变成可玩的地图。运行时楼层由 `state.maps.fromRaw(raw)` 构造：它按 `width` 与 `map` 算出高度、建图层、铺图块、挂事件。也就是说，从原始数据到运行时对象只有一次转换。

### eventStore：事件实例

以<strong>事件 id</strong>为键，存事件实例（`IReadonlyGameEvent`）。

- `getEvent(id)`：返回<strong>存储的那个实例</strong>，不是副本；查不到返回 `null`；
- `addEvent(id, event)`：登记一个事件；重复 id 会告警（错误码 `170`），然后覆盖。

这里要特别注意：`getEvent` 返回的是存储的实例，不要修改它。你拿到的就是注册表里的那一份，改它等于绕过 `add*` 改了注册表，风险和运行时调用 `addEvent` 一样（见下一节）。

## Store 与运行时状态的区别

这是理解「为什么只读」的关键。每一对都是「定义」与「实例」的关系：

| Store 里的                            | 运行时的                                                          | 改 Store 之后                                                      |
| ------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `tileStore.getData(num)` 的图块定义   | `mapLayer.getTile(x, y)` 的静态图块 `raw()`；动态图块 `raw()`     | 静态图块每次现查 Store，会读到新定义；动态图块创建时缓存，不会更新 |
| `itemStore.getData(num)` 的道具定义   | 背包里的道具：`state.hero.items.getItemState(item)` 的 `raw` 字段 | 进背包时已经缓存定义，之后仍指向旧定义                             |
| `mapStore.getMap(floorId)` 的原始地图 | `state.maps.getMap(floorId)` 的运行时楼层                         | 楼层由 `fromRaw` 一次性构造，改原始数据不会重建它                  |
| `eventStore.getEvent(id)` 的事件实例  | 事件层 `eventLayer` 上的 `LayerEventView`，以及事件派发           | 视图只存事件 id，下次派发会按 id 现查，因此会换成新实例            |

一句话概括：Store 只影响「之后构造」与「每次现查」这两类取用路径。有的运行时对象每次都现查（静态图块的 `raw()`、事件派发），有的在创建时就缓存下来（动态图块、背包道具、运行时楼层）。所以在运行时改定义，会让「谁会看到新值」变得难以预测——这正是要避免它的原因。

## 运行时为什么只读

在游戏进行中调用 `addTile` / `addItem` / `addMap` / `addEvent`，问题不止一个：

1. <strong>它不进存档</strong>。四个 Store 都不是可存档对象——`addSaveableContent` 注册的是 `hero`、`flags`、`maps`、`enemyManager`、`replaySystem`，没有 Store。所以读档不会恢复你的改动，也不会把它退回原样。
2. <strong>它不进录像</strong>。`add*` 没有 `@shouldReplay` 标记，录像里不会有「登记这条定义」这一步。重放时这条定义从什么时候开始生效，与原始游玩并不一致，结果就可能对不上。录像标记的规则见[录像一致性](./replay-consistency.md)。
3. <strong>它不保证更新已经存在的对象</strong>。上一节的四对关系说明：有的对象缓存了定义（动态图块、背包道具），有的每次现查（静态图块、事件派发），改完之后谁变了、谁没变取决于取用方式，不可依赖。
4. <strong>它绕过了检查</strong>。定义改了，存档、录像、内存里的对象三者可能各是各的；差异不会立刻报错，而是在某个不确定的时机表现出来。

所以规则很简单：<strong>登记只在加载期做一次，运行期只读</strong>。这不是风格建议，而是因为它们本来就是「内容」，不是「状态」。

## 正确注册位置

登记要发生在「游戏开始跑之前」，具体放哪取决于你的数据什么时候可用：

| 位置                     | 时机                 | 适合登记什么                             |
| ------------------------ | -------------------- | ---------------------------------------- |
| 插件 `awake(state)`      | 主对象构造期，同步   | 定义直接写死在代码里，不依赖加载结果     |
| 插件 `initialize(state)` | 加载开始前，会被等待 | 登记前要先完成异步准备                   |
| 插件 `afterLoad(state)`  | 加载完毕后，会被等待 | 要读到加载出来的内容才知道该登记什么     |
| 专门的初始化函数         | 由上面任一处调用     | 把同一来源的一批登记集中成一段，避免散落 |

三个时机的完整含义见[插件系统](./plugin-system.md)。要点是：它们都只在启动流程里各跑一次，不会随玩家操作反复触发。

不要在这些地方调用 `add*`：玩家动作的处理函数、事件回调、每帧逻辑、战斗结算。它们都会在游戏过程中被反复执行，正好踩中上一节的四个问题。

仓库当前的情况是：这些 `add*` 主要由测试直接调用（`packages-user/data-common/src/store/__test__/` 与 `packages-user/data-base/src/**/__test__/`）。你要登记自己的内容时，就按上表的位置集中调用一次。

## 什么时候可以读

读取随时可以：查表、算数、拼提示文本、给界面提供数据，都是正常用法。查表不会改变任何东西，也不产生录像步。

唯一要注意的是<strong>不要就地修改返回的对象</strong>。`getData` / `getMap` / `getEvent` 返回的多是 Store 里存着的那个实例（`tileStore.getEvent` 除外，它每次新建一个 `Map`）。就地改它等于绕过 `add*` 改了注册表：

```ts
// 不要这样做：把 Store 里的定义当成可变对象
const raw = state.tileStore.getData(num);
// raw 就是注册表里的那一条，改它等于绕过 addTile 改了注册表
```

需要不同的定义，就在加载期登记一条新的，而不是运行时改旧的。

## 还有一个 EnemyStore

`data-common` 里还有一个 `EnemyStore`（`IEnemyStore`，`addEnemy` / `getEnemy`），存怪物原始数据：`num`、`attribute`、`special`。

但它<strong>不在 `IDataCommon` 上</strong>：主对象没有把 `enemyStore` 暴露成字段。所以不要按前面四个 Store 的习惯去取，也不要假设它一定存在。本篇只讲 `IDataCommon` 上的四个 Store；需要怪物原始数据时，先确认当前版本把它接在了哪里，再决定从哪读。

## 模板：登记一条原始定义

Store 的注册没有「一个空类 + 需改点」那种逐对象模板，原因和别的机制不同：插件、可存档对象、光环这些机制都要你实现一个接口，所以能给出骨架；`addTile` / `addItem` / `addMap` / `addEvent` 不是这样——它们是<strong>逐条登记一条原始定义</strong>，你不需要实现任何方法，只需要把一条条定义交给它。

所以这里的骨架是「一条定义长什么样」。下面以图块为例，复制后按 `[需改]` 修改：

```ts
// [模板] 登记一条图块定义：复制后按 [需改] 修改
state.tileStore.addTile({
    // [需改] 图块数字与 id 必须各自唯一
    num: 10001,
    id: 'my-custom-tile',
    // [需改] 默认事件：优先级 → 事件 id
    events: {},
    // [需改] 图块逻辑类型
    type: TileType.Terrain,
    pass: {
        // [需改] 是否只在事件层生效
        onlyEvents: false,
        // [需改] 可离开 / 可进入的方向掩码
        outPass: 0b1111,
        inPass: 0b1111
    },
    // [需改] 走上去触发还是撞击触发
    eventPass: false
});
```

<strong>改什么</strong>：

1. <strong>数据来源</strong>：把写死的 `num` / `id` 换成你内容文件里的条目；内容多时用循环读一遍，而不是手写几十条 `addTile`。
2. <strong>键</strong>：`num` 与 `id` 必须唯一。撞了会告警并覆盖，等于悄悄丢掉了另一条定义。
3. <strong>通行掩码</strong>：`outPass` / `inPass` 是方向位掩码（上 1、右 2、下 4、左 8），`0b1111` 表示四向都通。
4. <strong>其它三个 Store</strong>：形状相同，把 `addTile` 换成对应调用即可——`addItem(data)` 收 `IItemRawData`，`addMap(map)` 收 `IMapRawData`，`addEvent(id, event)` 收事件实例。所以这条骨架不需要为每个 Store 重写一遍。

<strong>注意</strong>：`addEvent` 的签名与另外三个不同，它的第一个参数是事件 id，第二个参数才是事件实例。

顶部通常已有 `TileType` 这类名字的 `import`；若报缺少某个名字，再在顶部补对应的 `import`。

## 把一批自定义内容注册进 Store

这一节按六步给出可直接照做的改法。

<strong>目标</strong>：让新增的图块 / 道具 / 地图 / 事件在加载完成后能被查到，并确定它只被登记一次。

<strong>改哪里</strong>：你的插件类里接受 `state` 的那个时机方法。定义写死在代码里就用 `awake`；要等加载结果就用 `afterLoad`。下面是 `awake` 的写法：

```ts
awake(state: ICoreState): void {
    // 在这里调用 addTile / addItem / addMap / addEvent
}
```

<strong>复制什么</strong>：只复制上面的 `add*` 调用，粘进这个时机方法里。<strong>不含 `import`</strong>——插件的文件顶部通常已经有 `IDataCommon` / `ICoreState`，内容类型通常在 `@user/data-common` 里，已经引入过就不要重复粘；若编辑器报缺少某个名字，再在顶部补 `import ...`。

<strong>改什么</strong>：把 `num`、`id` 与各字段换成你自己的数据。图块数字要与你的内容对得上，道具的 `num` 要与对应图块数字一致，地图的 `floorId` 要与切楼层用的 id 一致。

<strong>怎么验证</strong>：启动后读回刚登记的内容，见下面的「怎么验证」第一项。`getData` / `getMap` / `getEvent` 能查到，说明登记成功；查不到就检查是否真的执行到了这个时机方法、以及键是否拼错。

<strong>注意</strong>：不要在玩家动作、事件回调或每帧里登记；同一个 `num` 重复登记会告警并覆盖，等于把登记做成了「碰运气」。

## 改内置还是自己写

- 只是补几条内容定义——在已有的加载 / 注册位置加条目，不要为一批原始数据新造 Store，也不要扩展 `IDataCommon`；
- 确实需要一张全新的原始数据表（现有四个 Store 都装不下）——那属于系统级扩展，先按[插件系统](./plugin-system.md)组织自己的数据，再考虑是否真的需要挂到主对象上。

扩展 `IDataCommon` 意味着改动内置包，版本升级时要跟着改；而补条目只动你自己的内容，升级时几乎不用管。

## 常见错误

- <strong>在玩家动作里登记</strong>。运行时改定义不会传播到已创建的对象，还会绕过存档与录像。
- <strong>以为读档会恢复 Store</strong>。四个 Store 都不在存档里，读档既不恢复、也不回退你的改动。
- <strong>就地修改 `getData` 返回的对象</strong>。那就是在改注册表，效果与运行时 `add*` 相同。
- <strong>修改 `eventStore.getEvent` 返回的实例</strong>。它返回的是存储的实例，改它等于改注册表。
- <strong>把 `add*` 当成「新增一条游戏状态」</strong>。它们登记的是内容定义，不会自动生成运行时对象；楼层要 `fromRaw`，图块要放进图层。
- <strong>重复登记同一个 `num`</strong>。会告警并覆盖，你以为是新增，实际把旧定义挤掉了。
- <strong>假设主对象上有 `enemyStore`</strong>。`EnemyStore` 存在，但 `IDataCommon` 没有把它暴露成字段。
- <strong>在 `getEvent` 上做缓存却以为拿到了快照</strong>。它给的是实例本身，不是替你复制一份。

## 怎么验证

<strong>第一项：读回定义</strong>。

```ts
const num = state.tileStore.num('my-custom-tile');
const raw = state.tileStore.getData(num);
console.log(raw, state.tileStore.getType(num));
```

`raw` 应为对象而不是 `null`，`getType(num)` 应等于你登记的类型。道具、地图、事件同理：`itemStore.getData(token)`、`mapStore.getMap(floorId)`、`eventStore.getEvent(id)` 都应查得到。

<strong>第二项：在游戏进行中改一次，观察三个现象</strong>。

用同一个 `num` 再调用一次 `addTile` 改掉类型，然后：

1. 看已经存在的对象——静态图块 `mapLayer.getTile(x, y)!.raw()` 会读到新定义，而已进背包的道具 `raw` 仍是旧定义；同一个改动在不同对象上表现并不一致；
2. 存档再读档，看改动是否保留——不会，Store 不在存档里；
3. 录一段包含相关操作的录像并回放，看结果是否与原始游玩一致——定义生效的时点变了，结果就可能对不上。

这三个观察合起来，就是「运行时不该改 Store」的理由。

<strong>第三项：把登记挪到加载期后重跑</strong>。

把 `add*` 从玩家动作或回调里移到插件 `awake` / `afterLoad`，重启游戏再验证一遍：登记只发生一次，行为不再随操作次数变化。

<strong>第四项：确认没有被重复登记</strong>。

重复登记会告警（`181` / `170` / `133` / `134`）。启动时留意控制台，没有这类告警，说明每个键只登记了一次。

## 小结

- 四个 Store 是 Layer 0 的内容层注册表，存定义，不存游戏状态，也不进存档。
- `tileStore` 按图块数字存图块定义，`itemStore` 按道具图块数字存道具定义，`mapStore` 按 `floorId` 存地图原始数据，`eventStore` 按事件 id 存事件实例。
- 运行时楼层由 `state.maps.fromRaw(raw)` 一次性构造；改 Store 不会重建已有对象。
- 运行时调用 `add*` 会绕过存档、录像与一致性检查，所以只在加载期登记一次。
- 读 Store 随时可以，但不要就地修改返回的对象；`eventStore.getEvent` 返回的是存储的实例。
- `EnemyStore` 不在 `IDataCommon` 上，不要假设主对象能直接取到。
- Store 注册没有逐对象模板，只有「一条定义长什么样」的骨架。
- 需要新的原始数据表时优先按插件组织；不要急着扩展主对象。

返回[高级 I 导览](./index.md)。
