# 地图图块

想在地图上摆一格、擦掉一格，或者整片地读写图块，该找谁？答案是**图层**——地图图块存放在图层（`IMapLayer`）上。

图层的接口分成两半：一半管**静态图块**（`ILayerStatic`，负责单点与批量读写、迭代），一半管**动态图块**（`ILayerDynamic`，负责创建、删除、移动）。本篇只讲静态图块那半，也就是 `ILayerStatic` 上的方法。

> 静态图块与动态图块各自的设计取向（为什么要把图块分成这两种、它们之间如何转换）会在**高级教程**中讲解（预留标记：`高级教程 · 静态与动态图块`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 静态与动态图块 -->

先明确一个词：**图块数字**（tile number）是每个图块的整数编号，以内容层 `src/content/tile.jsonc` 中每个条目的 `num` 字段为准（同一条目还有字符串名 `id`）。图层上存取的都是这个编号；想用 `id` 换编号可以用 `state.tileStore.num(id)`，反过来用 `state.tileStore.id(num)`。

## 取到图层

图块操作针对图层，所以第一步是拿到图层对象。你可以从楼层的 `layerList` 中取到图层，事件层则通过 `eventLayer` 取得：

```ts
const map = state.maps.getMap('floor-1')!;
for (const layer of map.layerList) {
    // layer 即 IMapLayer
}
```

楼层的三层结构见[地图结构](./map-structure.md)。

## 读取与写入单点

单格操作有三个接口：

- `getBlock(x, y)`：取指定点的静态图块数字（无图块返回 0，不在地图上返回 -1）；
- `setBlock(block, x, y)`：设置指定点的静态图块；
- `removeBlock(x, y)`：移除指定点的静态图块。

**目标**：在坐标 `(3, 5)` 摆一格图块数字为 21 的图块，读一下，再擦掉。

**改哪里**：拿到目标图层后即可操作——例如某个事件函数或钩子里（取图层的写法见上一节）。

**复制什么**：

```ts
layer.setBlock(21, 3, 5);
const num = layer.getBlock(3, 5);
layer.removeBlock(3, 5);
```

> 复制说明：片段已省略 `import`；`layer` 是上一步取到的图层对象（`IMapLayer`）。

**改什么**：把 `21` 换成你的图块数字；把 `(3, 5)` 换成目标坐标。

**怎么验证**：`setBlock` 后 `getBlock(3, 5)` 应返回你写入的数字；`removeBlock` 后再读应为 0。

**注意**：`setBlock` 的参数顺序是 `(图块数字, x, y)`，别把坐标写反；这里操作的是「静态图块」，动态图块走另一套接口。

## 批量读写

要一次处理一片区域，用批量接口：

- `putMapData(array, x, y, width)`：把一维数组写入地图，数组第一项对应 `(x, y)`，`width` 为矩形范围的宽度。数组按行排列（先是第一行、再是第二行……）；高度不用传，由数组长度推出：高度 = `array.length / width`（数组长度不是 `width` 的整数倍时引擎会告警）；
- `getMapData()`：取整张地图的图块数组；
- `getMapData(x, y, width, height)`：取指定矩形区域的图块数组。

返回的数组是对内部存储的拷贝，修改它不会直接改动地图。

**目标**：一次写入一片 3 列 × 2 行的区域，再把它读回来。

**改哪里**：拿到目标图层后即可操作——例如某个事件函数或钩子里。

**复制什么**：

```ts
const width = 3;
// 按行排列：先第 0 行（y = 5），再第 1 行（y = 6）
// prettier-ignore
const data = new Uint32Array([
    21, 21, 21, // 第 0 行
    22, 22, 22 // 第 1 行
]);
// 从 (5, 5) 开始写入；高度由 6 ÷ 3 = 2 自动推出
layer.putMapData(data, 5, 5, width);

// 读出刚写入的区域（区域版必须显式传宽高）
const back = layer.getMapData(5, 5, width, 2);
// back 与 data 内容一致：长度 6、按行排列
```

> 复制说明：片段已省略 `import`；`layer` 是目标图层对象。

**改什么**：把 `width` 与数组内容换成你的图块数字，把 `(5, 5)` 换成起始坐标；数组长度必须是 `width` 的整数倍。

**怎么验证**：读回的 `back` 长度应为 `width × 高度`，内容与写入的 `data` 一致。

**注意**：高度不用传，由 `array.length / width` 推出（除不尽时引擎会告警）。

`putMapData` 与 `getMapData` 用的都是「扁平」的一维数组：第 `row * width + col` 项，对应左上角偏移 `(col, row)` 的那一格。日常读写用这两个接口就够了；它们更深入的用法与性能取向会在**高级教程**中讲解（预留标记：`高级教程 · 地图批量接口`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 地图批量接口 -->

## 迭代非空图块

`iterateBlocks()` 返回所有非空图块，每个元素包含该点的位置 `locator`、图块数字 `tile`、静态图块 `static` 与动态图块 `dynamics`。非空指图块数字不为 0，因此只挂事件、没有图块的格子不会被迭代到。

```ts
for (const block of layer.iterateBlocks()) {
    const num = block.tile;
}
```

若需要读取某一点的全部图块信息（静态、动态、事件等），图层还提供 `getLocationData(x, y)`；它面向更底层的需求，会在**高级教程**中讲解（预留标记：`高级教程 · getLocationData`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): getLocationData -->

图层与事件层的结构见[地图结构](./map-structure.md)；想从 `state` 出发找到地图对象，见[数据端总览](./data-state-overview.md)。
