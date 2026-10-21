# 静态图块与动态图块

图层上的图块有两种形态。静态图块是地图数组里的一格，位置固定，读写便宜；动态图块是独立实例，有自己的移动器，可以在一格一格之间移动。地图上看到的石头、箱子、可推动的障碍，通常先以静态图块存在，被推动时转成动态图块，停下后再转回静态。

本篇说明两者的分工、创建与获取方式、双向转换、事件归属与操作接口，最后给出可执行的验证方法。静态图块的批量读写见[地图图块](../../intermediate/map-tiles.md)，图层与楼层的结构见[地图结构](../../intermediate/map-structure.md)。

## 两种图块的分工

**静态图块**（`IStaticTile`）对应图层数组中的一格。它的位置由坐标决定，`num()` 直接读图层当前格子的图块数字：

```ts
num(): number {
    return this.layer.getBlock(this.locator.x, this.locator.y);
}
```

因此静态图块没有独立的「位置状态」：只要图层数组里那一格的值变了，同一个静态图块实例读到的 `num()` 就变了。`layer.getTile(x, y)` 返回的是按坐标缓存的实例，不在地图上时返回 `null`，在地图上但格子为空时仍会返回实例，只是 `num()` 为 `0`。

**动态图块**（`IDynamicTile`）是独立对象。它自己保存图块数字与位置，拥有 `mover`，可以移动、转向、删除；它不写入图层数组，而是登记在图层的动态索引里。因此同一格可以同时存在静态图块与多个动态图块，动态图块之间也不会互相覆盖。

两者共同的成员是 `num()`、`raw()`、`locator`、`layer`，并且都支持 `set(num)` 与 `setFaceDirection(direction)`。区别在于：

| 项目     | 静态图块       | 动态图块                          |
| -------- | -------------- | --------------------------------- |
| 位置     | 由所在坐标固定 | 自己的 `locator`，可被移动器更新  |
| 存储     | 图层数组的一格 | 图层的动态图块索引                |
| 移动     | 不支持         | 通过 `mover` 或 `step`            |
| 同格多个 | 每格最多一个   | 可以有多个                        |
| 转换     | `toDynamic()`  | `toStatic()` / `toStaticIfSafe()` |

`set(num)` 会把图块换成另一个数字，并把**图块事件**重置为该图块定义的默认事件。静态图块与动态图块都是如此；如果你在 `set` 之前挂过自定义图块事件，换图块后需要重新设置。

## 创建与获取

静态图块通过图层获取：

```ts
import { IMapLayer } from '@user/data-base';

function inspectLayer(layer: IMapLayer): void {
    // 取静态图块实例；不在地图上时为 null，空地上 num() 为 0
    const staticTile = layer.getTile(2, 3);
    console.log('静态图块数字', staticTile?.num());

    // 直接创建动态图块；它不会清空同格的静态图块
    const dynamic = layer.createDynamic(21, 5, 5);
    console.log('动态图块数字', dynamic.num());

    // 遍历当前图层的所有动态图块
    for (const tile of layer.iterateDynamicTiles()) {
        console.log(tile.num(), tile.locator.x, tile.locator.y);
    }

    // 只取某一格上的动态图块；同格可能有多个
    for (const tile of layer.getDynamicTilesAt(5, 5)) {
        console.log('同格动态图块', tile.num());
    }
}
```

`createDynamic(num, x, y)` 会触发图层的 `onCreateDynamic` 钩子。它不检查目标格是否已有静态图块，也不移动静态图块；如果想让「原地静态图块」变成动态图块，应该用下一节的 `transferToDynamic`，而不是先 `createDynamic` 再手动清格。

`getDynamicTilesAt(x, y)` 返回该格的动态图块集合，顺序不保证；需要稳定顺序时请自行排序。

## 双向转换

### 静态转动态

`IStaticTile.toDynamic()` 是 `layer.transferToDynamic(x, y)` 的简写。它会：

1. 读取目标格的静态图块数字；
2. 把该格静态图块清空（图块数字设为 `0`）；
3. 用这个数字创建一个动态图块；
4. 按 `keepEvent` 决定是否把原静态图块的**图块事件**复制到动态图块。

`keepEvent` 默认是 `true`。保留时，原静态图块当前的图块事件会复制到动态实例，然后原位置的事件被清空；不保留时，动态实例保留它按图块定义重建的默认事件。无论是否保留，静态图块那一格都不再持有原来的图块事件。

```ts
import { IMapLayer } from '@user/data-base';

function liftTile(layer: IMapLayer, x: number, y: number): void {
    // 先取一次，确保静态图块实例已经存在，自定义事件能被读到
    const source = layer.getTile(x, y);
    if (!source) return;

    const dynamic = layer.transferToDynamic(x, y, true);
    if (!dynamic) return;

    // 此时原坐标的图块数字为 0，动态实例带着原来的图块事件
    console.log('原位置图块', layer.getBlock(x, y));
    console.log('动态图块事件', dynamic.tileEvent().get());
}
```

### 动态转静态

动态图块停下后，可以用 `toStatic()` 或 `toStaticIfSafe()` 写回静态图层。两者的区别是目标格被占用时的处理：

- `toStatic()`：目标格已有静态图块时会告警（code 129），但仍然写入并覆盖；
- `toStaticIfSafe()`：目标格已有静态图块时直接返回 `null`，不写入。

图层级还提供 `transferToStatic(tile, keepEvent?)` 与 `transferToStaticIfSafe(tile, keepEvent?)`，行为与实例方法一致，只是把「要转换的动态图块」作为参数传入。

`keepEvent` 同样默认是 `true`。保留时，动态图块的图块事件会复制到新生成的静态图块；不保留时，静态图块按该图块定义的默认事件重建，动态图块上的自定义事件不会带过去。

```ts
import { FaceDirection } from '@user/data-common';
import { IMapLayer } from '@user/data-base';

async function shiftRight(
    layer: IMapLayer,
    x: number,
    y: number
): Promise<void> {
    const dynamic = layer.transferToDynamic(x, y, true);
    if (!dynamic) return;

    // step 是单步便捷接口；复杂路径请直接使用 dynamic.mover
    const controller = dynamic.step(FaceDirection.Right);
    await controller?.onEnd;

    const restored = dynamic.toStaticIfSafe();
    if (restored) {
        console.log('落点', restored.locator.x, restored.locator.y);
    } else {
        console.log('落点已有静态图块，未转换');
    }
}
```

### moveBlock 简写

`layer.moveBlock(x, y, direction, count?, time?, keepEvent?)` 是「转动态 → 移动 → 转回静态」的完整简写。它按顺序调用 `transferToDynamic`、`mover.speed(time).step(direction, count)`、等待移动结束、`transferToStatic`。

它适合「把一块石头往某个方向推几格」这类简单场景，但无法配置移动过程中的钩子、分段路径或中途转向。需要这些能力时，按上一节手动操作 `mover`，不要用 `moveBlock`。

### 转换的失败条件

- `transferToDynamic` 在坐标不在地图上时返回 `null`，并告警 code 128；目标格为空时仍会创建一个数字为 `0` 的动态图块，并告警 code 127。
- `toStatic()` 按接口约定，在动态图块坐标不是整数或正在移动时返回 `null`；目标格被占用时会告警 code 129 并覆盖。
- `toStaticIfSafe()` 在 `toStatic()` 的基础上额外要求目标格为空；目标格被占用时返回 `null`。
- 动态图块被转回静态，或被 `delete()` 删除时，会触发图层的 `onDeleteDynamic` 钩子。`delete()` 返回 `Promise<void>`，会等待钩子完成；`toStatic` 只触发钩子，不等待。
- `createDynamic` 与 `transferToDynamic` 都会触发 `onCreateDynamic`；`updateDynamicTile` 会触发 `onUpdateDynamicPosition`，移动器在每步落点更新位置时会调用它。

## 事件的两类归属

图块相关的事件分两类，归属完全不同。混淆这两类，是「图块移走了，事件却没跟着走」或「事件跟着图块跑到了不该去的地方」的常见原因。

| 项目       | 点事件（point event）                                                 | 图块事件（tile event）                     |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------ |
| 归属       | 坐标                                                                  | 图块实例                                   |
| 获取方式   | `layer.event(x, y)`、`layer.getPointEvent(x, y)`、`tile.pointEvent()` | `tile.tileEvent()`                         |
| 换图块后   | 仍留在原坐标                                                          | 随实例转换，是否复制由 `keepEvent` 决定    |
| 图块移动后 | 不跟随                                                                | 跟随图块实例                               |
| 典型用途   | 「勇士踩进这一格」「进入这一区域」                                    | 「这块可推动的石头被推开后，事件仍跟着它」 |

点事件属于**坐标**。同一坐标换掉图块、清空图块，点事件都还在；动态图块移动到新坐标后，它原来的点事件留在旧坐标。`tile.pointEvent()` 只是按图块**当前**的 `locator` 去取那个坐标的点事件视图，所以动态图块移动后，它读到的是新坐标的点事件，不是出发地的事件。

图块事件属于**图块实例**。静态图块转动态、动态图块转静态时，`keepEvent` 为 `true` 就把源实例的图块事件复制到目标实例；为 `false` 则目标实例按图块定义重建默认事件。复制是「清空目标后逐条写入」，不会与目标原有事件合并。

## 事件视图接口

点事件与图块事件都用同一套事件视图。只读接口是 `IReadonlyEventView`：

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

`markPure()` 建立「干净基准」：此后 `dirty()` 只反映相对这一刻的变化。静态图块与动态图块在构造、读档、重置默认事件后都会调用它，所以刚读出来的图块默认是干净的。存档时只需要保存 `dirty()` 为 `true` 的图块事件；如果事件与基准一致，就没有必要写入存档。

`set` 的 `event` 参数是**事件 id**，不是事件对象。这个 id 必须已经在 `state.eventStore` 中注册过（`state.eventStore.addEvent(id, event)`）；否则执行到这里时找不到对应事件。同一个优先级只能挂一个事件，重复设置会覆盖并告警 code 136。

## 在代码里操作事件

### 给静态图块添加并复制图块事件

```ts
import { IMapLayer } from '@user/data-base';

function giveTileEvent(
    layer: IMapLayer,
    x: number,
    y: number,
    eventId: string
): void {
    const tile = layer.getTile(x, y);
    if (!tile) return;

    // 优先级 10 上挂一个事件；同一个优先级已有事件时会被覆盖
    tile.tileEvent().set(10, eventId);
}

function copyTileEvent(
    layer: IMapLayer,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
): void {
    const from = layer.getTile(fromX, fromY);
    const to = layer.getTile(toX, toY);
    if (!from || !to) return;

    // syncTileEvent 会先清空目标，再逐条复制来源的全部图块事件
    to.syncTileEvent(from);
}
```

`syncTileEvent` 复制的是**图块事件**，不是点事件。它会把目标实例现有的图块事件全部清掉，再按来源的优先级逐条写入；如果目标上原本有来源没有的优先级，那些事件会消失。

### 给坐标设置点事件并验证它不随图块移动

```ts
import { IMapLayer } from '@user/data-base';

function keepPointEvent(
    layer: IMapLayer,
    x: number,
    y: number,
    eventId: string
): void {
    const view = layer.event(x, y);
    if (!view) return;

    // 优先级 5 上挂一个点事件
    view.set(5, eventId);

    // 换掉这一格的图块，点事件仍然属于坐标 (x, y)
    layer.setBlock(21, x, y);

    // 读到的仍是刚才设置的事件
    console.log(layer.getPointEvent(x, y)?.get(5));
}
```

如果要把图块本身移走，用 `transferToDynamic` 加 `mover`；图块事件会跟着动态实例走，点事件则留在原坐标。两类事件可以同时存在于同一格，互不覆盖，因为它们存储在不同的视图里。

## 怎么验证

下面的函数把「静态 → 动态 → 移动 → 静态」与两类事件放在一次检查里。它假设目标格右侧为空，并且事件 id 已经注册。

```ts
import { FaceDirection } from '@user/data-common';
import { IMapLayer } from '@user/data-base';

async function verifyTileConversion(
    layer: IMapLayer,
    x: number,
    y: number
): Promise<void> {
    const source = layer.getTile(x, y);
    if (!source) return;

    // 先挂自定义图块事件与点事件，便于观察转换后的归属
    source.tileEvent().set(10, 'demo-event');
    layer.event(x, y)?.set(1, 'demo-point-event');

    const dynamic = source.toDynamic();
    const controller = dynamic.step(FaceDirection.Right);
    await controller?.onEnd;

    const restored = dynamic.toStaticIfSafe();
    console.log('原位置图块数字', layer.getBlock(x, y)); // 0
    console.log('落点图块数字', restored?.num()); // 与 source 相同
    console.log('落点图块事件', restored?.tileEvent().get(10)); // demo-event
    console.log('原点事件', layer.getPointEvent(x, y)?.get(1)); // demo-point-event
}
```

预期现象：

- 原位置的静态图块数字变成 `0`；
- 落点出现同数字的静态图块；
- 落点图块的图块事件里仍有 `demo-event`，因为 `keepEvent` 默认为 `true`；
- 原坐标的点事件里仍有 `demo-point-event`，点事件没有跟着图块移动。

如果落点已有静态图块，`toStaticIfSafe` 会返回 `null`，落点不会变化，动态图块仍停在落点。想看到完整结果，先把落点清空，或换一个空格测试。

## 边界与注意

- **静态图块的 `set()` 会重置默认事件**：`set(num)` 把图块事件恢复为该图块定义的默认事件。想保留自定义事件，应在 `set` 之后再挂，或使用 `syncTileEvent` 从别的实例复制。
- **动态图块不写回图层数组**：图层数组只保存静态图块数字。判断某一格有没有动态图块要用 `getDynamicTilesAt` / `iterateDynamicTiles`，不要只读 `getBlock`。
- **`keepEvent` 为 `false` 时事件不是「丢了」**：目标图块会回到该图块定义的默认事件，这是设计行为，不是转换失败。需要保留自定义事件就显式传 `true`，并在转换前确认源实例的事件已经设置好。
- **同一格多个动态图块的顺序不保证**：`getDynamicTilesAt` 返回的是集合语义的迭代器；依赖先后顺序时，请先取出数组并自行排序。
- **`syncTileEvent` 会覆盖目标**：它先清空目标再复制，目标原有的图块事件不会保留。只想追加一条事件时，用 `tileEvent().set(priority, eventId)`，不要用 `syncTileEvent`。
- **点事件与图块事件共用优先级概念但不是同一张表**：同一格可以同时有优先级 `5` 的点事件与优先级 `5` 的图块事件，两者互不冲突；冲突只发生在同一个事件视图内部。
