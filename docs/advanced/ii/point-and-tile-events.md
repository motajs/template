# 点事件与图块事件

地图上的事件有两种存放方式：一种挂在**坐标**上，称为点事件（point event）；另一种挂在**图块实例**上，称为图块事件（tile event）。平时的读写差别不大，但图块一旦移动或转换，两者就会分道扬镳：点事件留在原坐标，图块事件跟着图块走。

本篇说明两者的区别、各自的读写接口、跟随移动与存档的行为，最后给出可执行的验证方法。图块的创建、转换与移动见[静态图块与动态图块](./static-vs-dynamic-tiles.md)。

## 两种事件的区别

| 项目       | 点事件                                                                | 图块事件                             |
| ---------- | --------------------------------------------------------------------- | ------------------------------------ |
| 归属       | 坐标                                                                  | 图块实例                             |
| 获取方式   | `layer.event(x, y)`、`layer.getPointEvent(x, y)`、`tile.pointEvent()` | `tile.tileEvent()`                   |
| 换图块后   | 仍留在原坐标                                                          | 由 `set(num)` 恢复为该图块的默认事件 |
| 图块移动后 | 不跟随                                                                | 跟随图块实例                         |
| 典型用途   | 「勇士踩进这一格」「进入这一区域」                                    | 「可推动的石头自带的事件」           |

点事件属于**坐标**。同一坐标换掉图块、清空图块，点事件都还在。`layer.event(x, y)` 按坐标取可写视图；坐标不在地图内时返回 `null`。`layer.getPointEvent(x, y)` 不是视图，它只是 `event(x, y)?.get()` 的简写，返回只读映射，不能用来修改事件。

图块事件属于**图块实例**。静态图块与动态图块各自持有一个事件视图，通过 `tile.tileEvent()` 读写。图块实例被销毁时，它的事件也随之消失；静态图块转动态、动态图块转静态时是否保留，由转换接口的 `keepEvent` 决定。

`tile.pointEvent()` 容易让人误会：它并不拥有事件，只是按图块**当前**的 `locator` 去取那个坐标的点事件视图。动态图块移动后，它读到的是新坐标的点事件，而不是出发地的事件。

## 跟随移动的区别

动态图块移动时，移动器只更新它的 `locator` 与图层索引，不会触碰事件：

- **点事件不跟随**：事件仍按原坐标缓存。图块离开后，原坐标的点事件还在；新坐标的点事件与它无关。`dynamic.pointEvent()` 只是按新坐标重新查一次视图，所以移动后通常读到空事件。
- **图块事件跟随**：事件保存在图块实例自己身上，`locator` 变了，事件视图不变。静态转动态时 `keepEvent` 为 `true`（默认）会把源实例的事件复制过来；动态转静态时同理。

```ts
import { FaceDirection } from '@user/data-common';
import { IMapLayer } from '@user/data-base';

/**
 * 给坐标与图块各挂一个事件，再推动图块，观察两者是否跟随。
 * 假设 (x, y) 有静态图块，右侧一格为空。
 */
async function moveTileAndObserveEvents(
    layer: IMapLayer,
    x: number,
    y: number
): Promise<void> {
    // 点事件挂在坐标上
    layer.event(x, y)?.set(1, 'point-event');

    const source = layer.getTile(x, y);
    if (!source) return;

    // 图块事件挂在图块实例上
    source.tileEvent().set(10, 'tile-event');

    // keepEvent 默认为 true，转换时把图块事件复制到动态实例
    const dynamic = source.toDynamic();
    const controller = dynamic.step(FaceDirection.Right);
    await controller?.onEnd;

    // 图块事件跟着实例走到新坐标
    console.log('移动后图块事件', dynamic.tileEvent().get(10)); // tile-event
    // 点事件留在原坐标
    console.log('原坐标点事件', layer.getPointEvent(x, y)?.get(1)); // point-event
    // dynamic.pointEvent() 按当前坐标取视图，新坐标没有点事件
    console.log('新坐标点事件', dynamic.pointEvent()?.get(1)); // undefined
}
```

注意 `keepEvent` 为 `false` 时，静态图块的事件不会被复制，但源静态图块实例本身也不会被清空。这个不对称行为在[静态图块与动态图块](./static-vs-dynamic-tiles.md)的「双向转换」里有详细说明。

## 事件视图接口

点事件与图块事件共用同一套视图。只读接口是 `IReadonlyEventView`：

| 成员      | 作用                                                           |
| --------- | -------------------------------------------------------------- |
| `get()`   | 取当前事件映射，键是优先级，值是 `IGameEventStore` 中的事件 id |
| `ref()`   | 取参考基准映射                                                 |
| `dirty()` | 当前事件是否与参考基准不同                                     |

可写接口 `ILayerEventView` 在此基础上增加：

| 成员                   | 作用                                               |
| ---------------------- | -------------------------------------------------- |
| `set(priority, event)` | 设置指定优先级的事件；同优先级已有事件时覆盖并告警 |
| `delete(priority)`     | 删除指定优先级的事件                               |
| `reset()`              | 把当前事件恢复为参考基准                           |
| `clear()`              | 清空当前事件                                       |
| `markPure()`           | 把当前事件标记为新的参考基准                       |

`set` 的 `event` 参数是**事件 id**，不是事件对象。这个 id 必须已经在 `state.eventStore` 中注册过（`state.eventStore.addEvent(id, event)`）；否则执行到这里时找不到对应事件。同一个优先级只能挂一个事件，重复设置会覆盖并告警 code 136。

`ref()` 与 `markPure()` 是样板内部的优化接口：前者暴露参考基准，后者把当前状态设为新的基准，存档压缩与脏标记靠它们工作。一般不要调用，除非你清楚自己在做什么。日常读写只需要 `get`、`set`、`delete`、`clear`。

## 设置与复制事件

给坐标设置点事件：

```ts
import { IMapLayer } from '@user/data-base';

/**
 * 给坐标挂点事件；换图块不会影响它。
 * eventId 必须已经在 state.eventStore 中注册。
 */
function setPointEvent(
    layer: IMapLayer,
    x: number,
    y: number,
    eventId: string
): void {
    const view = layer.event(x, y);
    if (!view) return;

    // 优先级 5；同一优先级已有事件时覆盖并告警
    view.set(5, eventId);

    // 换掉这一格的图块，点事件仍属于坐标 (x, y)
    layer.setBlock(21, x, y);
    console.log(layer.getPointEvent(x, y)?.get(5)); // eventId
}
```

给图块设置图块事件：

```ts
import { IMapLayer } from '@user/data-base';

/**
 * 给静态图块挂图块事件。
 * 图块事件属于实例；转换时是否复制由 keepEvent 决定。
 */
function setTileEvent(
    layer: IMapLayer,
    x: number,
    y: number,
    eventId: string
): void {
    const tile = layer.getTile(x, y);
    if (!tile) return;

    // 优先级 10；set(num) 会把它重置为该图块的默认事件
    tile.tileEvent().set(10, eventId);
    console.log(tile.tileEvent().get(10)); // eventId
}
```

把一个图块的事件整体复制到另一个图块：

```ts
import { IMapLayer } from '@user/data-base';

/**
 * 复制图块事件；目标原有的图块事件会被全部清空。
 * 这里只复制图块事件，点事件不会跟着复制。
 */
function copyTileEvents(
    layer: IMapLayer,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
): void {
    const from = layer.getTile(fromX, fromY);
    const to = layer.getTile(toX, toY);
    if (!from || !to) return;

    // 先清空目标，再逐条写入来源的优先级
    to.syncTileEvent(from);
}
```

只想追加一条事件时，直接 `tileEvent().set(priority, eventId)`，不要用 `syncTileEvent`，后者会覆盖目标上其它优先级的事件。

## 存档与读档

两类事件都由图层自动保存，作者不需要额外注册存档对象：

- **点事件**：图层只保存 `dirty()` 为 `true` 的坐标。地图数据自带的点事件在加载地图时已经写进参考基准（并调用 `markPure()`），所以存档里只记录运行时新增或修改的差量。读档时先把已有点事件视图 `reset()` 回基准，再按存档 `clear()` 并逐条 `set()`。
- **图块事件**：静态图块只在 `shouldSave()` 为真（即事件偏离默认基准）时写入存档；动态图块总会保存图块数字，事件偏离基准时一并写入。读档时静态/动态图块先 `restoreDefaultEvents()`，再应用存档里的事件。如果存档带自定义事件，读回后 `dirty()` 仍为 `true`，因为应用事件后没有重新 `markPure()`；只有事件与默认基准一致的图块才是干净的。

事件 id 本身不在存档里展开，存档只记录 id 字符串。因此读档时这些 id 必须仍然能在 `state.eventStore` 中找到；注册名称发生变化，旧存档就会指向不存在的事件。

## 怎么验证

下面的函数给同一格设置点事件与图块事件，存档、清空、读档，确认两者都能恢复。它假设 `(x, y)` 有静态图块，且两个事件 id 都已注册。

```ts
import { SaveCompression } from '@user/data-common';
import { IMapLayer } from '@user/data-base';

/**
 * 验证点事件与图块事件都能随图层存档恢复。
 * 假设 (x, y) 有静态图块，两个事件 id 都已注册。
 */
function verifyEventPersistence(layer: IMapLayer, x: number, y: number): void {
    // 点事件挂在坐标上，图块事件挂在实例上
    layer.event(x, y)?.set(1, 'point-event');
    const tile = layer.getTile(x, y);
    if (!tile) return;
    tile.tileEvent().set(10, 'tile-event');

    const snapshot = layer.saveState(SaveCompression.NoCompression);

    // 先清空，确认读档确实把事件写回来
    layer.event(x, y)?.clear();
    tile.tileEvent().clear();

    layer.loadState(snapshot, SaveCompression.NoCompression);
    console.log('读档后点事件', layer.getPointEvent(x, y)?.get(1)); // point-event
    console.log(
        '读档后图块事件',
        layer.getTile(x, y)?.tileEvent().get(10) // tile-event
    );
}
```

预期现象：

- 读档后原坐标的点事件恢复为 `point-event`；
- 同一格静态图块的图块事件恢复为 `tile-event`；
- 如果只设置图块事件、没有设置点事件，那么读档后 `getPointEvent(x, y)?.get(1)` 应为 `undefined`，这是正常的——两者互不替代。

要观察移动造成的差异，用前面 `moveTileAndObserveEvents` 的例子：图块事件会跟到新坐标，点事件留在原坐标。

## 边界与注意

- **点事件与图块事件不是同一张表**：同一格可以同时有优先级 `5` 的点事件与优先级 `5` 的图块事件，两者互不冲突；冲突只发生在同一个事件视图内部。
- **`getPointEvent` 返回只读映射**：它不能修改事件；要写入请用 `layer.event(x, y)` 或 `tile.pointEvent()`。
- **`set(num)` 会重置图块事件**：静态图块与动态图块的 `set(num)` 都会调用 `restoreDefaultEvents()`。想保留自定义事件，应在 `set` 之后再挂，或用 `syncTileEvent` 从别的实例复制。
- **`layer.setBlock` 不会重置图块事件**：它只改图块数字；同一坐标缓存着的静态图块实例会继续持有旧事件。要重置事件，用 `tile.set(num)` 或 `tile.restoreDefaultEvents()`。
- **`syncTileEvent` 会覆盖目标**：它先清空目标再复制，目标原有的图块事件不会保留。
- **动态图块移动后 `pointEvent()` 读的是新坐标**：想确认出发地的事件，直接用 `layer.getPointEvent(oldX, oldY)`，不要用移动后的图块去反查。
- **事件 id 必须已注册**：`set` 不会替你检查 `eventStore`，缺注册时会在执行阶段找不到事件；读档也依赖同一个 id 仍然存在。
- **`markPure()` 与 `ref()` 是内部接口**：日常读写不要调用；只有实现存档压缩、脏标记一类的底层逻辑时才需要关心它们。

返回[高级 II 导览](./index.md)。
