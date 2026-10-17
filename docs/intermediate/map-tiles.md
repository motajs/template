# 地图图块

想在地图上摆一格、擦掉一格，或者整片地读写图块，该找谁？答案是**图层**——地图图块存放在图层（`IMapLayer`）上，图块的读取、写入、批量操作与迭代都由图层负责。这些接口都定义在图层的静态部分（`ILayerStatic`）。

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

```ts
layer.setBlock(21, 3, 5);
const num = layer.getBlock(3, 5);
layer.removeBlock(3, 5);
```

## 批量读写

要一次处理一片区域，用批量接口：

- `putMapData(array, x, y, width)`：把一维数组写入地图，数组第一项对应 `(x, y)`，`width` 为矩形范围的宽度；
- `getMapData()`：取整张地图的图块数组；
- `getMapData(x, y, width, height)`：取指定矩形区域的图块数组。

返回的数组是对内部存储的拷贝，修改它不会直接改动地图。

```ts
const region = layer.getMapData(0, 0, 3, 3);
```

## 迭代非空图块

`iterateBlocks()` 返回所有非空图块，每个元素包含该点的位置 `locator`、图块数字 `tile`、静态图块 `static` 与动态图块 `dynamics`。非空指图块数字不为 0，因此只挂事件、没有图块的格子不会被迭代到。

```ts
for (const block of layer.iterateBlocks()) {
    const num = block.tile;
}
```

若需要读取某一点的全部图块信息（静态、动态、事件等），图层还提供 `getLocationData(x, y)`；它面向更底层的需求，留到高级教程。

图层与事件层的结构见[地图结构](./map-structure.md)；想从 `state` 出发找到地图对象，见[数据端总览](./data-state-overview.md)。
