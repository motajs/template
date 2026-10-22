# 静态图块与动态图块

图层上的图块有两种形态。静态图块是地图数组里的一格，位置固定，读写便宜；动态图块是独立实例，有自己的移动器，可以在一格一格之间移动。地图上看到的石头、箱子、可推动的障碍，通常先以静态图块存在，被推动时转成动态图块，停下后再转回静态。

本篇说明两者的分工、创建与获取方式、双向转换，以及事件在转换中的归属，最后给出可执行的验证方法。静态图块的批量读写见[地图图块](../../intermediate/map-tiles.md)，图层与楼层的结构见[地图结构](../../intermediate/map-structure.md)，两类事件的专门说明见[点事件与图块事件](./point-and-tile-events.md)。

## 两种图块的分工

**静态图块**（`IStaticTile`）对应图层数组中的一格。它的位置由坐标决定，`num()` 直接读图层当前格子的图块数字：

```ts
import { IMapLayer } from '@user/data-base';

// 这里只保留与本节相关的实现，其余成员从略
class StaticTile {
    constructor(
        readonly locator: { x: number; y: number },
        readonly layer: IMapLayer
    ) {}

    // 静态图块没有独立的位置：位置就是它所在的坐标
    num(): number {
        return this.layer.getBlock(this.locator.x, this.locator.y);
    }
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

`tile.set(num)` 会把图块换成另一个数字，并把**图块事件**重置为该图块定义的默认事件。静态图块与动态图块都是如此；如果你在 `set` 之前挂过自定义图块事件，换图块后需要重新设置。

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

`keepEvent` 默认是 `true`，它只决定是否把原静态图块的**图块事件**复制到动态实例；**不论取值如何，源静态图块的图块事件都会被清空**：

- `true`：先把源静态图块的图块事件复制到动态实例，再调用 `staticTile.tileEvent().clear()` 清空源实例的事件；
- `false`：动态实例按图块定义重建默认事件，源实例的事件同样被清空。

因此转换完成后，原坐标缓存的静态图块实例不再持有原来的自定义事件；之后再往这一格写静态图块，也不会带出旧事件。

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

### 移动器 mover

`transferToDynamic` 得到的动态图块已经带有自己的 `mover`，之后的位置变更都由它发起；`step` 只是 mover 上的单步便捷入口。`mover` 的接口、速度与路径配置、`onEnd` 等待等细节属于高级 I 的内容，见 `高级 I · 移动 Mover`，本篇不重复。

<!-- TODO(advanced-I): 移动 Mover -->

### moveBlock 简写

`layer.moveBlock(x, y, direction, count?, time?, keepEvent?)` 是「转动态 → 移动 → 转回静态」的完整简写。它按顺序调用 `transferToDynamic`、`mover.speed(time).step(direction, count)`，再用 `mover.start()` 启动并等待 `onEnd`，最后调用 `transferToStatic`。

它适合「把一块石头往某个方向推几格」这类简单场景，但无法配置移动过程中的钩子、分段路径或中途转向。需要这些能力时，直接操作 `mover`（见上一节「移动器 mover」），不要用 `moveBlock`。

### 转换的失败条件

- `transferToDynamic` 在坐标不在地图上时返回 `null`，并告警 code 128；目标格为空时仍会创建一个数字为 `0` 的动态图块，并告警 code 127。
- `toStatic()` 在目标坐标不在地图内时返回 `null`；目标格被占用时会告警 code 129 并覆盖。接口注释还约定「坐标不是整数或正在移动」时应失败，但当前实现没有在 `transferToStatic` 里检查 `mover.moving`，所以不要依赖它替你拦截移动中的转换。需要转换时先 `await controller.onEnd`，或至少判断 `dynamic.mover.moving` 为 `false`。
- `toStaticIfSafe()` 在 `toStatic()` 的基础上额外要求目标格为空；目标格被占用时返回 `null`。它同样不会检查移动状态。
- 动态图块被转回静态，或被 `delete()` 删除时，会触发图层的 `onDeleteDynamic` 钩子。`delete()` 返回 `Promise<void>`，会等待钩子完成；`toStatic` 只触发钩子，不等待。
- `createDynamic` 与 `transferToDynamic` 都会触发 `onCreateDynamic`；`updateDynamicTile` 会触发 `onUpdateDynamicPosition`，移动器在每步落点更新位置时会调用它。

## 图块事件与点事件

图块相关的事件有两种归属：点事件属于**坐标**，图块事件属于**图块实例**。图块移动时，图块事件跟着实例走，点事件留在原坐标；静态图块转动态、动态图块转静态时，`keepEvent` 决定图块事件是否复制到新实例。两者都可以由作者设置，也都会随存档保存和恢复。

事件视图的 `markPure()` 与 `ref()` 是样板内部的优化接口，用于维护参考基准与脏标记，一般不要调用，除非你清楚自己在做什么。

两类事件的区别、读写接口与存档行为，见[点事件与图块事件](./point-and-tile-events.md)。

## 怎么验证

下面的函数检查「静态 → 动态 → 移动 → 静态」的完整往返。它假设目标格右侧为空。

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
    // 记录转换前的图块数字，最后与落点对比
    const num = source.num();

    const dynamic = source.toDynamic();
    const controller = dynamic.step(FaceDirection.Right);
    await controller?.onEnd;

    const restored = dynamic.toStaticIfSafe();
    console.log('原位置图块数字', layer.getBlock(x, y)); // 0
    console.log('落点图块数字', restored?.num()); // 与 num 相同
}
```

预期现象：

- 原位置的静态图块数字变成 `0`；
- 落点出现同数字的静态图块；
- 如果落点已有静态图块，`toStaticIfSafe` 会返回 `null`，落点不会变化，动态图块仍停在落点。想看到完整结果，先把落点清空，或换一个空格测试。

图块事件在转换中的复制结果由 `keepEvent` 决定，具体验证见[点事件与图块事件的「怎么验证」](./point-and-tile-events.md#怎么验证)。

## 边界与注意

- **动态图块不写回图层数组**：图层数组只保存静态图块数字。判断某一格有没有动态图块要用 `getDynamicTilesAt` / `iterateDynamicTiles`，不要只读 `getBlock`。
- **`keepEvent` 为 `false` 时目标图块回到默认事件**：这是设计行为，不是转换失败。需要保留自定义事件就显式传 `true`，并在转换前确认源实例的事件已经设置好。
- **同一格多个动态图块的顺序不保证**：`getDynamicTilesAt` 返回的是集合语义的迭代器；依赖先后顺序时，请先取出数组并自行排序。

返回[高级 II 导览](./index.md)。
