# data-common 的 Store

`@user/data-common` 是数据端的 Layer 0 公共层，上面挂着五个内容注册表：`tileStore`、`itemStore`、`mapStore`、`enemyStore`、`eventStore`。它们看起来像「数据表」，实际是<strong>内容层原始定义的注册表</strong>——图块、道具、地图、怪物、事件的定义登记在这里；游戏运行时从这里查出来，再按定义构造自己的对象。

中级教程的[数据端总览](../intermediate/data-state-overview.md)列过这些入口，[图块存储](../intermediate/tile-store.md)讲了 `tileStore` 的日常用法。这一篇讲每个 Store 里存的是什么、它自己能做什么，以及为什么运行期只该读。

阅读前需要会基础语法：`class`、`new`、`Map`、`import`。

## 先看读模板

五个 Store 都是 `state` 上的只读字段，没有各自的管理器，也不需要你 `new` 一个出来。日常使用基本就是下面这些读法：

```ts
import { ICoreState } from '@user/data-state';

// 一次读出五个 Store 的常见内容；放进能拿到 state 的方法里
export function readStores(state: ICoreState): void {
    // 图块：先按 id 查数字，再取完整定义与类型
    const tileNum = state.tileStore.num('my-tile');
    if (tileNum !== undefined) {
        console.log(state.tileStore.getData(tileNum));
        console.log(state.tileStore.getType(tileNum));
    }

    // 道具与怪物：数字或 id 都接受
    const item = state.itemStore.getData('my-item');
    const enemy = state.enemyStore.getEnemy('my-enemy');

    // 地图按楼层 id 查；事件按事件 id 取实例
    const map = state.mapStore.getMap('my-floor');
    const event = state.eventStore.getEvent('my-event');

    console.log(item, map, enemy, event);
}
```

下面先说明 Store 与实例、存档的区别，再逐个讲每个 Store 存什么、能做什么。

## Store 是什么

Store 里存的是「定义」，游戏里跑的是按定义构造出来的「实例」。图块定义告诉你这个数字代表什么地形、能不能走，真正的图块对象则在楼层加载时按定义创建。

Store 是查表用的注册表，不进存档。勇士、地图、Flag 这些游戏状态才进存档；读档不会把 Store 退回原样，也不会恢复你运行期对它的改动。

运行时读 Store 是正常操作：查表、算数、拼提示文本、给界面提供数据都可以。运行时写 Store 会绕过加载、存档与录像这一整套机制，问题会在不确定的时机表现出来。

## tileStore：图块定义

存的是图块的原始定义：图块数字、字符串 id、默认事件、逻辑类型、四方向通行性，以及事件是撞上去触发还是走上去触发。以图块数字为键。

它能按数字取完整定义、默认事件和类型，也能在图块数字与字符串 id 之间换算。登记新定义用 `addTile`；数字或 id 与已有定义冲突时会告警（错误码 `133` / `134`）并覆盖。

## itemStore：道具定义

存的是道具的原始定义：图块数字、分类、名称、描述、是否在道具栏隐藏、使用 / 拾取效果，以及装备数据。以道具图块数字为键。

它能按数字或 id 取整份定义，也能只取分类。登记用 `addItem`；同一个图块数字重复登记会告警（错误码 `181`）并覆盖。

## mapStore：地图原始数据

存的是地图的原始数据：楼层 id、地图宽度、每一层的图块矩阵、每个图层的字符串别名，以及每个图层指定位置上的事件。以楼层 id 为键。

它能按楼层 id 取整份原始数据。登记用 `addMap`；同一个楼层 id 直接覆盖，不告警。

## enemyStore：怪物定义

存的是怪物的原始定义：图块数字、怪物属性，以及特殊属性的编号与参数。以怪物图块数字为键。

它能按数字或 id 取整份定义。登记用 `addEnemy`；同一个图块数字重复登记会告警（错误码 `181`，与道具共用）并覆盖。

## eventStore：事件实例

存的是事件实例本身，不是事件定义。以事件 id 为键。

它能按 id 取回存储的那个实例，不是副本。登记用 `addEvent(id, event)`，第一个参数是事件 id，第二个才是实例；重复 id 会告警（错误码 `170`）并覆盖。

## 为什么运行期只读

在游戏进行中调用 `add*`，问题不止一个：

1. <strong>它不进存档</strong>。五个 Store 都不是可存档对象——`addSaveableContent` 注册的是 `hero`、`flags`、`maps`、`enemyManager`、`replaySystem`，没有 Store。读档不会恢复你的改动，也不会把它退回原样。
2. <strong>它不进录像</strong>。`add*` 没有 `@shouldReplay` 标记，录像里不会有「登记这条定义」这一步。重放时这条定义从什么时候开始生效，与原始游玩并不一致。
3. <strong>它绕过了检查</strong>。定义改了，存档、录像、内存里的对象三者可能各是各的；差异不会立刻报错，而是在某个不确定的时机表现出来。

所以规则很简单：<strong>登记只在加载期做一次，运行期只读</strong>。

至于登记这件事本身，绝大多数情况也不用你动手：`add*` 是给数据端自己用的接口——内容加载还没写完，写完后由数据端统一登记，不在你的代码里。

读 Store 时唯一要注意的是<strong>不要就地修改返回的对象</strong>：`getData` / `getMap` / `getEvent` 返回的多是 Store 里存着的那个实例（`tileStore.getEvent` 例外，它每次新建一个 `Map`），就地改它等于绕过 `add*` 改了注册表。

## 边界与注意

- <strong>需要自己补充 Store 定义的情况非常少见</strong>。`add*` 是数据端自用的登记接口：内容加载还没有写完，写完后由数据端统一登记。绝大多数情况下你只需要读，不需要自己补定义。确实需要补时，属于后续高级教程的内容（`高级 II · 加载与插件生命周期`，待编写），并且要把调用集中放在插件的一个时机方法里（见[插件系统](./plugin-system.md)），只在启动流程里执行一次。
- <strong>道具定义的两个效果字段都是必填</strong>。`effect` 与 `equip` 不是二选一：非装备类也要给出一个 `equip`，装备类也要提供 `effect`（可以是空实现）。
- <strong>返回值不是副本</strong>。改 `getData` / `getMap` / `getEvent` 的返回值等于改注册表；需要不同的定义就登记新的，不要改旧的。
- <strong>读档不会恢复 Store</strong>。改过的定义不会随存档保存，读档也不会把它退回去。
- <strong>`eventStore.getEvent` 给的是实例本身</strong>，不要在上面做缓存并当成快照。

<!-- TODO(advanced-II): 在初始化阶段补充 Store 定义 -->

## 小结

- 五个 Store 是 Layer 0 的内容层注册表，存定义，不存游戏状态，也不进存档。
- 键分别是图块数字、道具图块数字、`floorId`、怪物图块数字、事件 id。
- 每个 Store 只负责自己那类内容：读定义、做必要的换算，登记则由数据端在加载期统一完成。
- 读随时可以；返回的通常是注册表里的实例，不要就地修改。
- 登记由数据端负责，绝大多数情况不需要自己调用 `add*`，运行期尤其不要写。

返回[高级 I 导览](./index.md)。
