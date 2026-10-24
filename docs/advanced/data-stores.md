# data-common 的 Store

`@user/data-common` 是数据端的 Layer 0 公共层，上面挂着五个内容注册表：`tileStore`、`itemStore`、`mapStore`、`enemyStore`、`eventStore`。它们看起来像「数据表」，实际是<strong>内容层原始定义的注册表</strong>——图块、道具、地图、怪物的定义登记在这里，游戏运行时从这里查出来，再按定义构造自己的对象；事件则直接以实例登记。

中级教程的[数据端总览](../intermediate/data-state-overview.md)列过这些入口，[图块存储](../intermediate/tile-store.md)讲了 `tileStore` 的日常用法。这一篇逐个讲每个 Store 存的是什么、有哪些常用成员、它自己能做什么，以及为什么运行期只该读。

阅读前需要会基础语法：`class`、`new`、`Map`、`import`。

## Store 是什么

Store 里存的是「定义」，游戏里跑的是按定义构造出来的「实例」。图块定义告诉你这个数字代表什么地形、能不能走，真正的图块对象则在楼层加载时按定义创建。`eventStore` 稍有不同：它存的就是事件实例本身，不再经过一次构造。

Store 是查表用的注册表，不进存档。勇士、地图、Flag 这些游戏状态才进存档；读档不会把 Store 退回原样，也不会恢复你运行期对它的改动。

运行时读 Store 是正常操作：查表、算数、拼提示文本、给界面提供数据都可以。运行时写 Store 会绕过加载、存档与录像这一整套机制，问题会在不确定的时机表现出来。

## 怎么读 Store

五个 Store 都是 `state` 上的只读字段，没有各自的管理器，也不需要你 `new` 一个出来。它们不是需要你补全的半成品——接口已经由 `data-common` 提供，你只需要调用。

查询接口在找不到内容时不会抛错：取定义一般返回 `null`，换算 id 与数字一般返回 `undefined`，取图块类型返回 `TileType.Unknown`，取默认事件返回空 `Map`。所以读之前先判断结果是否存在，再使用。

下面每个 Store 各占一节，各配一段只针对它的示例。示例放在能拿到 `state` 的方法里即可，例如事件函数、钩子或插件方法。

## tileStore：图块定义

每条记录是一个 `ITileRawData`，以图块数字为键。常用成员有：

- `num`：图块数字，也是这张表的键；
- `id`：图块字符串 id，供数据与代码按名字引用；
- `events`：默认事件表，键是事件优先级，值是事件 id；
- `type`：图块逻辑类型，取值包括 `Unknown`、`None`、`Terrain`、`Animate`、`Item`、`Enemy`、`Npc`、`Autotile`、`Tileset`；
- `pass`：通行性对象，`onlyEvents` 表示是否仅当图块处在事件层时生效，`outPass` 与 `inPass` 是「可以离开」与「可以进入」的方向掩码，方向位由 `PassBit` 的 `Up`、`Right`、`Down`、`Left` 组合而成；
- `eventPass`：触发器的触发方式——`false` 是撞上去触发，`true` 是走上去触发。

接口方面，`getData(num)` 按数字取完整定义，`getType(num)` 取逻辑类型，`getEvent(num)` 取默认事件。`num` / `id` / `identity` 在数字与 id 之间换算，`idToNumber` / `numberToId` 则是更直白的单向版本。登记新定义用 `addTile`；数字或 id 与已有定义冲突时会告警（错误码 `133` / `134`）并覆盖。

```ts
import { ICoreState } from '@user/data-state';
import { PassBit, TileType } from '@user/data-common';

// 按图块 id 读取定义；id 未知或没有对应定义时直接返回
export function inspectTile(state: ICoreState, id: string): void {
    // num 接受图块数字或 id；id 不存在时返回 undefined
    const num = state.tileStore.num(id);
    if (num === undefined) return;

    // 完整原始定义；图块数字不存在时返回 null
    const data = state.tileStore.getData(num);
    if (data === null) return;

    // 逻辑类型：可以据此区分地形、道具、怪物等图块
    const type = state.tileStore.getType(num);

    // 默认事件：键为优先级、值为事件 id；无事件时是空 Map
    const events = state.tileStore.getEvent(num);

    // pass 的方向是位掩码，这里判断能否向上离开
    const canLeaveUp = (data.pass.outPass & PassBit.Up) !== 0;

    // id / identity 可以反向换算，identity 返回 [数字, id]
    const backId = state.tileStore.id(num);
    const [sameNum, sameId] = state.tileStore.identity(num);

    console.log(backId, sameNum, sameId, type === TileType.Terrain, canLeaveUp);
    console.log(data.eventPass, events.size);
}
```

## itemStore：道具定义

每条记录是一个 `IItemRawData<IHeroAttr>`，以道具图块数字为键。常用成员有：

- `num`：道具在地图上的图块数字，也是这张表的键；
- `category`：道具分类，取值为 `Unknown`、`Constant`（永久）、`Consumable`（一次性）、`Pick`（即捡即用）、`Equipment`（装备）；
- `name` 与 `text`：显示名称与描述文本；
- `hideInToolbox`：是否在道具栏中隐藏；
- `effect`：使用或拾取时的效果，包含可选的 `useEvent`（事件 id）、`useEffect(item, state)` 与 `canUse(item, state)`；
- `equip`：装备后的数据，包含可装备的槽位 `slots`、动画 `animate`、数值加成 `value`、百分比加成 `percentage`，以及穿上 / 脱下时的事件 `loadEvent` / `unloadEvent`。

`effect` 与 `equip` 都是必填：非装备类也要给出一个 `equip`，装备类也要提供 `effect`（可以是空实现）。

接口方面，`getData(token)` 按数字或 id 取整份定义，`getCategory(num)` 只取分类。登记用 `addItem`；同一个图块数字重复登记会告警（错误码 `181`）并覆盖。

```ts
import { ICoreState } from '@user/data-state';
import { ItemCategory } from '@user/data-common';

// 判断某个道具现在能否使用；数据与状态都从 Store 和 state 取
export function canUseItem(state: ICoreState, token: number | string): boolean {
    // token 可以是道具图块数字，也可以是图块 id
    const item = state.itemStore.getData(token);
    if (item === null) return false;

    // 分类决定使用时机：永久与一次性是「使用」，Pick 是「拾取」
    const category = state.itemStore.getCategory(item.num);
    if (
        category !== ItemCategory.Constant &&
        category !== ItemCategory.Consumable
    ) {
        return false;
    }

    // canUse 可选；没有实现时视为可以使用
    return item.effect.canUse?.(item, state) ?? true;
}
```

## mapStore：地图原始数据

每条记录是一张地图的 `IMapRawData`，以楼层 id 为键。常用成员有：

- `floorId`：楼层 id，也是这张表的键；
- `width`：地图宽度，用来把一维下标换算成坐标；
- `map`：按图层纵深组织的图块矩阵，外层键是图层纵深，值是该层按行排列的图块数字数组；
- `layerAlias`：每个图层的字符串别名，键是图层纵深；
- `events`：指定位置上的事件，外层键是图层纵深，中层键是图块位置索引，内层键是事件优先级、值是事件 id。

接口只有两个：`getMap(floorId)` 按楼层 id 取整份原始数据，不存在返回 `null`；`addMap(map)` 登记地图，同一个楼层 id 直接覆盖，不告警。Store 没有「列出全部楼层」的接口，查询前需要知道楼层 id。

```ts
import { ICoreState } from '@user/data-state';

// 读取某层某格的图块与事件；下标按「行优先」排列
export function readFloorTile(
    state: ICoreState,
    floorId: string,
    x: number,
    y: number
): void {
    // 整张地图的原始数据；楼层 id 不存在时返回 null
    const map = state.mapStore.getMap(floorId);
    if (map === null) return;

    // 一维下标：同一层按行依次排列，所以是 y * width + x
    const index = y * map.width + x;

    // map 的外层键是图层纵深，0 通常是地面层
    const ground = map.map[0];
    if (ground === undefined) return;

    // layerAlias 给出该层的可读名字
    const alias = map.layerAlias[0];

    // events 按「图层 → 位置索引 → 优先级」三层查找
    const eventsAtTile = map.events[0]?.[index] ?? {};

    console.log(alias, ground[index], eventsAtTile);
}
```

## enemyStore：怪物定义

每条记录是一个 `IEnemyRawData<IHeroAttr>`，以怪物图块数字为键。常用成员有：

- `num`：怪物的图块数字，也是这张表的键；
- `attribute`：怪物属性模板，里面是名称、生命、攻击、防御、金币、经验、加点等基础数值；
- `special`：怪物拥有的特殊属性，键是特殊属性编号，值是该项特殊属性的参数。

特殊属性编号不在这条记录里定义，而是由 `src/data/enemy/special.ts` 的 `createSpecials` 统一注册；怪物数据只写编号与参数。

接口方面，`getEnemy(token)` 按图块数字或 id 取整份定义。登记用 `addEnemy`；同一个图块数字重复登记会告警（错误码 `181`，与道具共用）并覆盖。

```ts
import { ICoreState } from '@user/data-state';

// 读取怪物模板并预览成长后的基础数值
export function previewEnemy(
    state: ICoreState,
    token: number | string,
    level: number
): void {
    // token 可以是怪物图块数字，也可以是图块 id
    const enemy = state.enemyStore.getEnemy(token);
    if (enemy === null) return;

    // attribute 是怪物属性模板，不是当前战斗中的怪物实例
    const attr = enemy.attribute;

    // special 的键是特殊属性编号，值是该项的参数
    const specialIds = Object.keys(enemy.special);

    console.log(attr.name, attr.hp * level, attr.atk * level);
    console.log(attr.def, attr.money, attr.exp, specialIds);
}
```

## eventStore：事件实例

存的是事件实例本身，不是事件定义。每条记录是一个 `IReadonlyGameEvent`，以事件 id 为键，取回的就是当初登记的那个对象。常用成员有：

- `interpreter`：事件解释器；
- `trigger`：触发器类型，决定事件由什么触发；
- `rawEvent`：原始事件数据；
- `compiled`：已编译的事件数据，未编译时为 `null`；
- `compile()`：编译事件；
- `execute(param, env)`：执行事件，参数与环境由事件自身约定。

接口方面，`getEvent(id)` 按 id 取回存储的那个实例，不是副本；可以使用泛型标注参数、环境与返回值类型。登记用 `addEvent(id, event)`，第一个参数是事件 id，第二个才是实例；重复 id 会告警（错误码 `170`）并覆盖。

```ts
import { ICoreState } from '@user/data-state';

// 取出事件实例并执行；参数与环境按事件自身的约定填写
export async function runStoredEvent(
    state: ICoreState,
    id: string
): Promise<void> {
    // 泛型依次是参数、环境与返回值；这里假设事件接收一个计数值
    const event = state.eventStore.getEvent<
        { count: number },
        Record<string, unknown>
    >(id);
    if (event === null) return;

    // trigger 说明它原本由什么触发；手动执行不受触发器限制
    console.log(event.trigger, event.compiled !== null);

    // execute 返回 Promise，是否等待由调用方决定
    await event.execute({ count: 1 }, {});
}
```

## 为什么运行期只读

在游戏进行中调用 `add*`，问题不止一个：

1. <strong>它不进存档</strong>。五个 Store 都不是可存档对象——`addSaveableContent` 注册的是 `hero`、`flags`、`maps`、`enemyManager`、`replaySystem`，没有 Store。读档不会恢复你的改动，也不会把它退回原样。
2. <strong>它不进录像</strong>。`add*` 没有 `@shouldReplay` 标记，录像里不会有「登记这条定义」这一步。重放时这条定义从什么时候开始生效，与原始游玩并不一致。
3. <strong>它绕过了检查</strong>。定义改了，存档、录像、内存里的对象三者可能各是各的；差异不会立刻报错，而是在某个不确定的时机表现出来。

所以规则很简单：<strong>登记只在加载期做一次，运行期只读</strong>。

至于登记这件事本身，绝大多数情况也不用你动手：`add*` 是给数据端自己用的接口——内容加载还没写完，写完后由数据端统一登记，不在你的代码里。

## 边界与注意

- <strong>需要自己补充 Store 定义的情况非常少见</strong>。`add*` 是数据端自用的登记接口：内容加载还没有写完，写完后由数据端统一登记。绝大多数情况下你只需要读，不需要自己补定义。确实需要补时，属于后续高级教程的内容（`高级 II · 加载与插件生命周期`，待编写），并且要把调用集中放在插件的一个时机方法里（见[插件系统](./plugin-system.md)），只在启动流程里执行一次。
- <strong>道具定义的两个效果字段都是必填</strong>。`effect` 与 `equip` 不是二选一：非装备类也要给出一个 `equip`，装备类也要提供 `effect`（可以是空实现）。
- <strong>返回值不是副本</strong>。`getData` / `getMap` / `getEvent` 返回的多是 Store 里存着的那个实例；需要不同的定义就登记新的，不要改旧的。
- <strong>`tileStore.getEvent` 是例外</strong>。它每次新建一个 `Map`，改它不会影响 Store，但也不要在上面做缓存并当成快照。
- <strong>读档不会恢复 Store</strong>。改过的定义不会随存档保存，读档也不会把它退回去。
- <strong>`eventStore.getEvent` 给的是实例本身</strong>，不要在上面做缓存并当成快照。
- <strong>查询前先判空</strong>。定义可能返回 `null`，换算可能返回 `undefined`，类型可能是 `Unknown`，事件表可能是空 `Map`。

<!-- TODO(advanced-II): 在初始化阶段补充 Store 定义 -->

## 小结

- 五个 Store 是 Layer 0 的内容层注册表，存定义，不存游戏状态，也不进存档；`eventStore` 存的是事件实例。
- 键分别是图块数字、道具图块数字、`floorId`、怪物图块数字、事件 id。
- 每个 Store 只负责自己那类内容：读定义、做必要的换算，登记则由数据端在加载期统一完成。
- 读随时可以；返回的通常是注册表里的实例，不要就地修改。
- 登记由数据端负责，绝大多数情况不需要自己调用 `add*`，运行期尤其不要写。

返回[高级 I 导览](./index.md)。
